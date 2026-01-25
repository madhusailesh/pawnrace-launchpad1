import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { io } from 'socket.io-client';
import { PhoneOff, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from "../../../contexts/AuthContext";
import { useBoardDrawing } from '../../../hooks/useBoardDrawing'; 

import ClassroomSidebar from '../coach/Classroom_features/ClassroomSidebar';
import CoordinateOverlay from '../coach/Classroom_features/CoordinateOverlay';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ;

const StudentVideoClassroom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const socketRef = useRef(null); 
    const { user } = useAuth();

    // --- State ---
    const [connectedUsers, setConnectedUsers] = useState([]); 
    const [game, setGame] = useState(new Chess());
    
    // [FIX] Add customFen to handle "Invalid" boards (Puzzles/Setup)
    const [customFen, setCustomFen] = useState(null);
    const [startFen, setStartFen] = useState('start');

    // [FIX] Add boardKey to prevent animation crashes on board reset
    const [boardKey, setBoardKey] = useState(0);

    const [orientation, setOrientation] = useState('black'); 
    const [history, setHistory] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [viewIndex, setViewIndex] = useState(-1);
    const [boardWidth, setBoardWidth] = useState(600);
    
    const drawing = useBoardDrawing(orientation);

    // --- UI State ---
    const [activeTab, setActiveTab] = useState('chat');
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [chatMessages, setChatMessages] = useState([]);

    // --- 1. RESIZE HANDLER ---
    useEffect(() => {
        function handleResize() { setBoardWidth(Math.min(window.innerHeight * 0.70, 600)); }
        window.addEventListener('resize', handleResize);
        handleResize(); 
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- 2. SOCKET CONNECTION ---
    useEffect(() => {
        socketRef.current = io(SOCKET_URL);
        
        socketRef.current.on('connect', () => { 
            setIsConnected(true); 
            const userInfo = {
                name: user?.fullname || user?.username || "Student", 
                role: "Student",
                _id: user?._id
            };
            socketRef.current.emit('join_room', { roomId, user: userInfo }); 
        });
        
        socketRef.current.on('update_user_list', (users) => {
            setConnectedUsers(users); 
        });
        
        // [FIX] Robust Move Handler (Prevents Invalid FEN Crash)
        socketRef.current.on('receive_move', (moveData) => {
            // 1. If Coach sent a Full Board Reset (PGN Load or Setup)
            if (moveData.fen && !moveData.from) {
                setCustomFen(null); // Assume standard first
                setBoardKey(k => k + 1); // Force re-render to prevent white screen

                try {
                    const fenGame = new Chess(moveData.fen);
                    setGame(fenGame);
                    setStartFen(moveData.fen);
                    setHistory([]);
                    setViewIndex(-1);
                } catch (e) {
                    // CRASH PREVENTION: If FEN is "Invalid" (e.g. puzzle with no king), load as Custom
                    console.warn("Received custom/setup position:", e.message);
                    setCustomFen(moveData.fen);
                    setGame(new Chess()); // Reset engine to safe state
                    setStartFen(moveData.fen);
                    setHistory([]);
                    setViewIndex(-1);
                }
                return;
            }

            // 2. Normal Move
            setGame((prevGame) => {
                const gameCopy = new Chess();
                try {
                    gameCopy.loadPgn(prevGame.pgn());
                    if (moveData.from) gameCopy.move(moveData);
                    
                    setHistory(gameCopy.history()); 
                    setViewIndex(-1); 
                    setCustomFen(null);
                    return gameCopy;
                } catch (e) { 
                    // Fallback if move logic fails
                    return new Chess(); 
                }
            });
        });

        socketRef.current.on('receive_annotations', (data) => {
            drawing.setArrows(data.arrows || []);
            drawing.setSquares(data.squares || {});
        });

        socketRef.current.on('receive_message', (data) => {
            setChatMessages(prev => [...prev, { ...data, isMe: false }]);
        });

        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [roomId, user]);

    // --- Helper to Emit Drawing Changes ---
    const handleMouseUpWrapper = (e) => {
        const result = drawing.handleMouseUp(e);
        if (result.hasChanged && socketRef.current) {
            socketRef.current.emit('sync_annotations', {
                roomId,
                arrows: result.newArrows,
                squares: result.newSquares
            });
        }
    };

    // --- 3. GAME ACTIONS ---
    function onDrop(sourceSquare, targetSquare) {
        if (viewIndex !== -1) { toast.error("Resume live game to play."); return false; }
        
        // Block moves on Custom/Invalid boards for students (unless you add Free Mode later)
        if (customFen) {
            return false;
        }

        try {
            const tempGame = new Chess(); tempGame.loadPgn(game.pgn());
            const move = tempGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
            if (!move) return false;
            setGame(tempGame); setHistory(tempGame.history());
            
            drawing.clearAnnotations();
            if (socketRef.current) socketRef.current.emit('sync_annotations', { roomId, arrows: [], squares: {} });

            if (socketRef.current) socketRef.current.emit('make_move', { roomId, from: sourceSquare, to: targetSquare, promotion: 'q', fen: tempGame.fen() });
            return true;
        } catch (error) { return false; }
    }

    const handleSendMessage = (text) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const senderName = user?.fullname || user?.username || 'Student';
        const messageData = { text, time, sender: senderName };
        setChatMessages(prev => [...prev, { ...messageData, isMe: true }]);
        if (socketRef.current) socketRef.current.emit('send_message', { roomId, ...messageData });
    };

    const handleDownloadPGN = () => {
        const blob = new Blob([game.pgn()], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `class_game.pgn`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const getBoardPosition = () => { 
        if (customFen) return customFen; // Display the custom/broken board if set
        if (viewIndex === -1) return game.fen();
        
        try {
            const t = new Chess(startFen); 
            for(let i=0; i<=viewIndex; i++) {
                t.move(history[i]); 
            }
            return t.fen();
        } catch (e) {
            return game.fen();
        }
    };

    return (
        <div className="h-screen bg-[#111] text-white flex flex-col overflow-hidden font-sans">
            <header className="h-14 bg-[#161616] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-200 text-sm tracking-wide">Student View</span>
                        <span className="text-[10px] text-gray-500 font-mono uppercase">ID: {roomId.slice(0,8)}...</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${isConnected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {isConnected ? 'Live' : 'Connecting...'}
                    </span>
                </div>
                <button onClick={() => navigate(-1)} className="bg-red-600/90 hover:bg-red-600 text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all">
                    <PhoneOff className="w-3 h-3" /> Leave
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 bg-[#0a0a0a] relative flex flex-col justify-center items-center">
                    
                    <div 
                        ref={drawing.boardWrapperRef}
                        onMouseDown={drawing.handleMouseDown}
                        onMouseUp={handleMouseUpWrapper} 
                        onContextMenu={(e) => e.preventDefault()}
                        className="relative shadow-2xl shadow-black/50" 
                        style={{ width: boardWidth, height: boardWidth }}
                    >
                        <Chessboard 
                            id="StudentBoard" 
                            key={boardKey} // [FIX] Force re-render on new game
                            position={getBoardPosition()} 
                            onPieceDrop={onDrop} 
                            boardOrientation={orientation}
                            customDarkSquareStyle={{ backgroundColor: '#779954' }} 
                            customLightSquareStyle={{ backgroundColor: '#e9edcc' }}
                            animationDuration={200} 
                            showBoardNotation={false}
                            areArrowsAllowed={false} 
                            customArrows={drawing.arrows}
                            customSquareStyles={drawing.squares}
                        />
                        <CoordinateOverlay orientation={orientation} showCoordinates={true} boardWidth={boardWidth} />
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                        <button onClick={() => setOrientation(o => o === 'white' ? 'black' : 'white')} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 rounded-full text-xs font-bold uppercase tracking-wider transition-all">
                            <Repeat className="w-4 h-4 text-gray-400"/> Flip Board
                        </button>
                    </div>
                </div>

                <ClassroomSidebar 
                    activeTab={activeTab} setActiveTab={setActiveTab}
                    
                    // [FIX] Correct History Logic
                    history={viewIndex === -1 ? history : history.slice(0, viewIndex + 1)}
                    
                    viewIndex={viewIndex} goToMove={setViewIndex}
                    onLoadPGN={() => toast.error("Only Coach can load PGNs")} 
                    onDownloadPGN={handleDownloadPGN}
                    micOn={micOn} setMicOn={setMicOn}
                    cameraOn={cameraOn} setCameraOn={setCameraOn}
                    chatMessages={chatMessages}
                    onSendMessage={handleSendMessage}
                    connectedUsers={connectedUsers} 
                    roomId={roomId}
                />
            </div>
        </div>
    );
};

export default StudentVideoClassroom;