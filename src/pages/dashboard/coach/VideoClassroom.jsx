import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { io } from 'socket.io-client';
import { PhoneOff, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from "../../../contexts/AuthContext";
import { useBoardDrawing } from '../../../hooks/useBoardDrawing'; 

// --- IMPORTS FOR FEATURES ---
import AnalysisTools from './Classroom_features/AnalysisTools';
import ClassroomSidebar from './Classroom_features/ClassroomSidebar';
import CoordinateOverlay from './Classroom_features/CoordinateOverlay';
import SetupPosition from './Classroom_features/SetupPosition';
import Syllabus from './Classroom_features/Syllabus';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://pawnrace-game-socket-backend.vercel.app/';

const VideoClassroom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const socketRef = useRef(null); 
    const { user } = useAuth();

    // --- Game State ---
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [game, setGame] = useState(new Chess());
    
    // NEW: Store the CLEAN PGN text (Moves Only)
    const [currentPgn, setCurrentPgn] = useState(""); 

    // NEW: Handle positions that chess.js calls "Illegal" (like empty boards)
    const [customFen, setCustomFen] = useState(null); 
    const [illegalMode, setIllegalMode] = useState(true); // Default to Free Mode

    const [startFen, setStartFen] = useState('start');
    const [orientation, setOrientation] = useState('white');
    const [history, setHistory] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [viewIndex, setViewIndex] = useState(-1);
    const [boardWidth, setBoardWidth] = useState(600);
    
    // --- Playlist / Navigation State ---
    const [playlist, setPlaylist] = useState([]); 
    const [currentChapterIndex, setCurrentChapterIndex] = useState(-1); 

    // --- UI State ---
    const [boardKey, setBoardKey] = useState(0); 
    const [showTools, setShowTools] = useState(true);
    const [showCoordinates, setShowCoordinates] = useState(true);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showSyllabusModal, setShowSyllabusModal] = useState(false); 
    
    const [activeTab, setActiveTab] = useState('moves');
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [chatMessages, setChatMessages] = useState([]);

    // --- [NEW] CONTROL STATE ---
    // Stores which userId controls which color. { white: "userId1", black: "userId2" }
    const [controls, setControls] = useState({ white: null, black: null });

    const drawing = useBoardDrawing(orientation);

    // --- 1. RESIZE ---
    useEffect(() => {
        function handleResize() { setBoardWidth(Math.min(window.innerHeight * 0.70, 600)); }
        window.addEventListener('resize', handleResize);
        handleResize(); 
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- 2. SOCKETS ---
    useEffect(() => {
        socketRef.current = io(SOCKET_URL);
        
        socketRef.current.on('connect', () => { 
            setIsConnected(true); 
            const userInfo = {
                name: user?.fullname || user?.username || "Coach", 
                role: user?.role === 'coach' ? "Coach" : "Student", // Ensure role is sent correctly
                _id: user?._id
            };
            socketRef.current.emit('join_room', { roomId, user: userInfo }); 
        });
        
        socketRef.current.on('update_user_list', (users) => setConnectedUsers(users));
        
        // [NEW] Listen for control updates
        socketRef.current.on('controls_updated', (newControls) => {
            setControls(newControls);
        });

        socketRef.current.on('receive_move', (moveData) => {
            // Received a move or position from socket
            if (moveData.fen && !moveData.from) {
                // Forced FEN update
                setCustomFen(null); // Reset custom fallback
                // Force re-render to prevent animation glitches
                setBoardKey(prev => prev + 1);

                try {
                    const fenGame = new Chess(moveData.fen);
                    setGame(fenGame);
                    setStartFen(moveData.fen);
                    setHistory([]);
                } catch (e) {
                    // If socket sends an "illegal" fen (empty board), use customFen
                    setCustomFen(moveData.fen);
                    setGame(new Chess()); // Reset engine to avoid errors
                    setStartFen(moveData.fen);
                }
                return;
            }

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
    }, [roomId]);

    // --- Helpers ---
    const handleMouseUpWrapper = (e) => {
        const result = drawing.handleMouseUp(e);
        if (result.hasChanged && socketRef.current) {
            socketRef.current.emit('sync_annotations', { roomId, arrows: result.newArrows, squares: result.newSquares });
        }
    };

    const handleClearWrapper = () => {
        drawing.clearAnnotations();
        if (socketRef.current) {
            socketRef.current.emit('sync_annotations', { roomId, arrows: [], squares: {} });
        }
    };

    const handleSendMessage = (text) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const senderName = user?.fullname || user?.username || 'Coach'; 
        const messageData = { text, time, sender: senderName };
        setChatMessages(prev => [...prev, { ...messageData, isMe: true }]);
        if (socketRef.current) socketRef.current.emit('send_message', { roomId, ...messageData });
    };

    // [NEW] Handler for Coach assigning controls
    const handleAssignControl = (color, userId) => {
        const newControls = { ...controls, [color]: userId };
        setControls(newControls);
        // Emit to server so all students update their permission state
        if (socketRef.current) {
            socketRef.current.emit('update_controls', { roomId, controls: newControls });
        }
    };

    // --- MAIN MOVE HANDLER ---
    function onDrop(source, target, piece) {
        if (viewIndex !== -1) { toast.error("Resume live game to play."); return false; }
        
        // [NEW] PERMISSION CHECK
        // 'piece' string is like 'wP', 'bK'. First char is color 'w' or 'b'.
        const pieceColor = piece[0]; 
        
        // IMPORTANT: We need to know who "I" am. 
        // If I am not the assigned player for this color, block.
        // NOTE: Coach should probably always be able to move. 
        // Let's assume the user object has a role or ID we can check.
        // For now, I will use a simple check against the controls state.
        
        // Check if the user is a coach to bypass restrictions
        const isCoach = user?.role === 'coach'; 

        if (!isCoach) {
            // If controls are set, enforce them.
            // Check White Move
            if (pieceColor === 'w') {
                if (controls.white !== user?._id) {
                    toast.error("You are not assigned to play White.");
                    return false;
                }
            }
            // Check Black Move
            if (pieceColor === 'b') {
                if (controls.black !== user?._id) {
                    toast.error("You are not assigned to play Black.");
                    return false;
                }
            }
        }
        
        // 1. IS THIS A CUSTOM / INVALID BOARD?
        if (customFen) {
            if (!illegalMode) {
                toast.error("Strict Mode: Cannot move on invalid board.");
                return false; 
            }

            try {
                const newFen = movePieceInFen(customFen, source, target);
                setCustomFen(newFen);
                setStartFen(newFen); 
                
                if (socketRef.current) {
                    socketRef.current.emit('make_move', { roomId, fen: newFen });
                }
                return true;
            } catch (e) {
                console.error("Free Move Error:", e);
                return false;
            }
        }

        // 2. STANDARD CHESS BOARD
        try {
            const tempGame = new Chess(); 
            tempGame.loadPgn(game.pgn());
            const move = tempGame.move({ from: source, to: target, promotion: 'q' });
            if (!move) return false; 
            
            setGame(tempGame); 
            setHistory(tempGame.history()); 
            setViewIndex(-1);
            handleClearWrapper(); 
            
            if (socketRef.current) socketRef.current.emit('make_move', { roomId, from: source, to: target, promotion: 'q', fen: tempGame.fen() });
            return true;
        } catch (error) { return false; }
    }

    const undoMove = () => {
        if (customFen) return; 
        const tempGame = new Chess(); 
        tempGame.loadPgn(game.pgn());
        if (tempGame.undo()) {
            setGame(tempGame); 
            setHistory(tempGame.history()); 
            setViewIndex(-1);
            if (socketRef.current) socketRef.current.emit('make_move', { roomId, fen: tempGame.fen() });
        }
    };

    // --- ROBUST LOADER FUNCTION ---
    const loadGameFromPgn = (data, title = "Lesson") => {
        if (!data || typeof data !== 'string' || !data.trim()) {
            toast.error("Cannot load: Data is empty.");
            return;
        }

        setBoardKey(prev => prev + 1);

        const cleanedData = data.trim();
        const movesOnly = cleanedData.replace(/\[.*?\]/g, "").trim();
        setCurrentPgn(movesOnly); 
        setCustomFen(null); 

        // 1. Try Loading as Standard PGN
        try {
            const pgnGame = new Chess();
            pgnGame.loadPgn(cleanedData);
            
            if (pgnGame.history().length > 0) {
                const startClone = new Chess();
                startClone.loadPgn(cleanedData);
                while (startClone.undo()) {} 
                const trueStartFen = startClone.fen();

                setStartFen(trueStartFen); 
                setHistory([]); 
                setGame(new Chess(trueStartFen)); 
                setViewIndex(-1);
                
                if (socketRef.current) socketRef.current.emit('make_move', { roomId, fen: trueStartFen });
                toast.success(`Loaded: ${title}`);
                return;
            }
        } catch (e) {}

        // 2. EXTRACT FEN FROM PGN TAGS
        let targetFen = cleanedData;
        const fenMatch = cleanedData.match(/\[FEN "([^"]+)"\]/);
        if (fenMatch && fenMatch[1]) {
            targetFen = fenMatch[1];
        }

        // 3. Try Loading FEN
        try {
            if (!targetFen.includes('/')) throw new Error("Not a FEN");

            try {
                const fenGame = new Chess(targetFen);
                setGame(fenGame);
                setStartFen(targetFen);
                setHistory([]);
                setViewIndex(-1);
                if (socketRef.current) socketRef.current.emit('make_move', { roomId, fen: targetFen });
                toast.success(`Loaded Position: ${title}`);
            } catch (chessError) {
                console.warn("Loaded invalid position:", chessError.message);
                
                setCustomFen(targetFen); 
                setGame(new Chess()); 
                setStartFen(targetFen);
                setHistory([]);
                setViewIndex(-1);
                
                if (socketRef.current) socketRef.current.emit('make_move', { roomId, fen: targetFen });
                
                if (illegalMode) {
                    toast.success(`Loaded (Free Mode): ${title}`);
                } else {
                    toast.warning(`Loaded Invalid Board (Strict Mode Active)`);
                }
            }
        } catch (finalError) {
            console.error(finalError);
            toast.error("Failed to recognize game data.");
        }
    };

    const handlePlayPlaylist = (chapterList, index) => {
        setPlaylist(chapterList);
        setCurrentChapterIndex(index);
        
        const chapter = chapterList[index];
        if (chapter && chapter.pgn) {
            loadGameFromPgn(chapter.pgn, chapter.name);
            setShowSyllabusModal(false); 
        } else {
            toast.error("Selected chapter has no data.");
        }
    };

    const handleNavigateChapter = (direction) => {
        const newIndex = currentChapterIndex + direction;
        if (newIndex >= 0 && newIndex < playlist.length) {
            const nextChapter = playlist[newIndex];
            setCurrentChapterIndex(newIndex);
            loadGameFromPgn(nextChapter.pgn, nextChapter.name);
        }
    };

    const handleLoadPGN = (pgn, name = "Uploaded PGN") => {
        loadGameFromPgn(pgn, name);
        setPlaylist([]); 
        setCurrentChapterIndex(-1);
    };

    const handleSetupLoad = (fen) => {
        loadGameFromPgn(fen, "Setup Position");
    };

    const handleDownloadPGN = () => {
        const blob = new Blob([game.pgn()], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `game_${roomId}.pgn`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const getBoardPosition = () => { 
        if (customFen) return customFen; 
        if (viewIndex === -1) return game.fen();
        try {
            const t = new Chess(startFen); 
            for(let i=0; i<=viewIndex; i++) t.move(history[i]); 
            return t.fen();
        } catch (e) { return game.fen(); }
    };

    // Determine user role for passing to Sidebar
    const currentUserRole = user?.role === 'coach' ? "Coach" : "Student";

    return (
        <div className="h-screen bg-[#111] text-white flex flex-col overflow-hidden font-sans">
            <header className="h-14 bg-[#161616] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-200 text-sm tracking-wide">Classroom</span>
                        <span className="text-[10px] text-gray-500 font-mono uppercase">ID: {roomId.slice(0,8)}...</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${isConnected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {isConnected ? 'Live' : 'Offline'}
                    </span>
                </div>
                
                {playlist.length > 0 && (
                    <div className="hidden md:flex items-center bg-[#222] rounded-lg border border-white/10 p-1 gap-2 absolute left-1/2 transform -translate-x-1/2">
                        <button 
                            onClick={() => handleNavigateChapter(-1)} 
                            disabled={currentChapterIndex <= 0}
                            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-300"
                            title="Previous Chapter"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex flex-col items-center px-2 min-w-[120px]">
                            <span className="text-xs font-bold text-white truncate max-w-[150px]">
                                {playlist[currentChapterIndex]?.name}
                            </span>
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                                {currentChapterIndex + 1} / {playlist.length}
                            </span>
                        </div>

                        <button 
                            onClick={() => handleNavigateChapter(1)} 
                            disabled={currentChapterIndex >= playlist.length - 1}
                            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-300"
                            title="Next Chapter"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    
                    <div className="flex items-center bg-[#202020] border border-white/10 rounded-md px-3 py-1 mr-2">
                        <div className="flex flex-col mr-3 items-end">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Current Lesson</span>
                            <span className="text-xs font-bold text-gray-200 truncate max-w-[150px]">
                                {playlist.length > 0 && currentChapterIndex !== -1 
                                 ? playlist[currentChapterIndex]?.name 
                                 : "No Technique Loaded"}
                            </span>
                        </div>
                        {playlist.length > 0 && (
                             <button 
                                onClick={() => handleNavigateChapter(1)}
                                disabled={currentChapterIndex >= playlist.length - 1}
                                className="p-1.5 hover:bg-white/10 rounded-full text-violet-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Next Chapter"
                             >
                                <ChevronRight className="w-4 h-4" />
                             </button>
                        )}
                    </div>

                    <button 
                        onClick={() => setShowSyllabusModal(true)} 
                        className="bg-violet-600/10 hover:bg-violet-600 border border-violet-500/50 text-violet-300 hover:text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all"
                    >
                        <BookOpen className="w-4 h-4" /> Syllabus
                    </button>

                    <button onClick={() => navigate(-1)} className="bg-red-600/90 hover:bg-red-600 text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all">
                        <PhoneOff className="w-3 h-3" /> Exit
                    </button>
                </div>
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
                            id="ClassroomBoard" key={boardKey} position={getBoardPosition()} onPieceDrop={onDrop} boardOrientation={orientation}
                            customDarkSquareStyle={{ backgroundColor: '#779954' }} customLightSquareStyle={{ backgroundColor: '#e9edcc' }}
                            animationDuration={200} showBoardNotation={false}
                            areArrowsAllowed={false} customArrows={drawing.arrows} customSquareStyles={drawing.squares}
                        />
                        <CoordinateOverlay orientation={orientation} showCoordinates={showCoordinates} boardWidth={boardWidth} />
                    </div>
                    
                    <AnalysisTools 
                        onUndo={undoMove}
                        onReset={() => { 
                            const ng = new Chess(); 
                            setGame(ng); 
                            setCustomFen(null);
                            setStartFen('start'); 
                            setHistory([]); 
                            setViewIndex(-1); 
                            handleClearWrapper(); 
                            
                            if (socketRef.current) {
                                socketRef.current.emit('make_move', { roomId, fen: ng.fen() });
                            }
                        }}
                        onFlip={() => setOrientation(o => o === 'white' ? 'black' : 'white')}
                        onClear={handleClearWrapper} 
                        onSetup={() => setShowSetupModal(true)}
                        showTools={showTools} setShowTools={setShowTools} 
                        showCoordinates={showCoordinates} setShowCoordinates={setShowCoordinates}
                        illegalMode={illegalMode} setIllegalMode={setIllegalMode}
                        currentPgn={currentPgn} 
                    />
                </div>
                <ClassroomSidebar 
                    activeTab={activeTab} setActiveTab={setActiveTab} 
                    history={viewIndex === -1 ? history : history.slice(0, viewIndex + 1)}
                    viewIndex={viewIndex} goToMove={setViewIndex} 
                    onLoadPGN={handleLoadPGN} 
                    onDownloadPGN={handleDownloadPGN} 
                    micOn={micOn} setMicOn={setMicOn} 
                    cameraOn={cameraOn} setCameraOn={setCameraOn} 
                    chatMessages={chatMessages} onSendMessage={handleSendMessage} 
                    connectedUsers={connectedUsers} roomId={roomId}
                    currentPgn={currentPgn}
                    
                    // [NEW] Pass Control Props
                    userRole={currentUserRole} // Dynamic role from auth context
                    controls={controls}
                    onAssignControl={handleAssignControl}
                />
            </div>
            
            <SetupPosition isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} currentFen={game.fen()} onLoadPosition={handleSetupLoad} />
            
            <Syllabus 
                isOpen={showSyllabusModal} 
                onClose={() => setShowSyllabusModal(false)} 
                onPlayPlaylist={handlePlayPlaylist}
                roomId={roomId} 
                onLoadPGN={handleLoadPGN} 
            />
        </div>
    );
};

// --- HELPER TO MOVE PIECES WITHOUT RULES (PURE STRING MANIPULATION) ---
function movePieceInFen(fen, from, to) {
    const files = 'abcdefgh';
    
    // Parse coordinates (e.g., 'e2' -> col 4, row 6)
    const fromCol = files.indexOf(from[0]);
    const fromRow = 8 - parseInt(from[1]); 
    const toCol = files.indexOf(to[0]);
    const toRow = 8 - parseInt(to[1]);

    const parts = fen.split(' ');
    const rows = parts[0].split('/');
    
    // 1. Expand rows to individual characters array (handling numbers like "8" or "3")
    const board = rows.map(row => {
        let expanded = '';
        for (let char of row) {
            if (!isNaN(char)) expanded += '1'.repeat(parseInt(char)); // Treat '1' as placeholder for empty
            else expanded += char;
        }
        return expanded.split('');
    });

    // 2. Perform Move
    const piece = board[fromRow][fromCol];
    board[fromRow][fromCol] = '1'; // Leave empty space
    board[toRow][toCol] = piece;   // Place piece (overwrites capture)

    // 3. Compress rows back to FEN format
    const newRows = board.map(row => {
        let compressed = '';
        let count = 0;
        for (let char of row) {
            if (char === '1') {
                count++;
            } else {
                if (count > 0) { compressed += count; count = 0; }
                compressed += char;
            }
        }
        if (count > 0) compressed += count;
        return compressed;
    });

    // Reconstruct FEN string (keep active color etc same for now)
    parts[0] = newRows.join('/');
    return parts.join(' ');
}

export default VideoClassroom;