import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../../lib/api.js";
import { ENDPOINTS } from "../../../lib/endpoints.js";
import { toast } from "sonner";
import { 
  ChevronLeft, CheckCircle2, Circle, HelpCircle, 
  RotateCcw, ArrowRight, Trophy, Loader2 
} from "lucide-react";

// Helper to sanitize chess instance
const safeGame = (fen) => {
    try {
        return new Chess(fen || undefined);
    } catch (e) {
        return new Chess();
    }
};

const StudentAssignmentSolver = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  // --- Data State ---
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- Game State ---
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [game, setGame] = useState(new Chess());
  const [solutionMoves, setSolutionMoves] = useState([]); 
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [solvedTaskIds, setSolvedTaskIds] = useState([]);
  
  // Prevent double-firing interactions
  const isMovingRef = useRef(false);

  // --- Fetch Assignment Data ---
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        // Using the generic endpoint logic. If you have a specific one, replace this.
        // We fetch the "Course" view usually, but let's try getting specific assignment if API supports
        // Fallback: Fetch by course logic or specific ID
        const res = await apiClient.get(ENDPOINTS.ASSIGNMENTS.GET_BY_COURSE('placeholder')).catch(() => null); 
        
        // SINCE we don't have a direct "Get Assignment By ID" in your endpoints yet,
        // we might need to rely on the previously loaded data or add the endpoint.
        // FOR NOW: Let's assume you added the endpoint I suggested previously:
        const directRes = await apiClient.get(`/assignments/${assignmentId}`); // Ensure this route exists in backend!
        
        const data = directRes.data.data;
        setAssignment(data);
        
        if(data.mySubmission && data.mySubmission.solvedTaskIds) {
            setSolvedTaskIds(data.mySubmission.solvedTaskIds);
        }

      } catch (err) {
        console.error("Load Error:", err);
        // Fallback mock for testing if API fails (Remove in production)
        if (!assignment) toast.error("Failed to load assignment. Check network.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  // --- Load Task into Board (SMART LOADING FIX) ---
  useEffect(() => {
    if (!assignment || !assignment.tasks || assignment.tasks.length === 0) return;

    const task = assignment.tasks[currentTaskIndex];
    
    // Debugging to help you see what data is actually coming in
    console.log("Loading Task Data:", { fen: task.fen, pgn: task.pgn }); 

    try {
        // 1. Create a temporary engine to parse the PGN headers
        const pgnLoader = new Chess();
        
        try {
            pgnLoader.loadPgn(task.pgn);
        } catch (e) {
            console.warn("PGN Parsing Warning:", e);
        }

        // 2. Determine the VISUAL Start Position (FEN)
        // Priority: 
        // A. Explicit 'fen' from DB task
        // B. 'fen' extracted from PGN headers (often found in Lichess PGNs)
        // C. Default Start Position
        let startFen = task.fen;
        
        // If DB fen is missing/default, check if PGN has a custom setup header
        if ((!startFen || startFen === 'start') && pgnLoader.header()['FEN']) {
             startFen = pgnLoader.header()['FEN'];
        }

        // 3. Set the Game Board
        const gameInstance = safeGame(startFen);
        setGame(gameInstance);

        // 4. Extract Solution Moves
        // CRITICAL: If we found a FEN in step 2, we must ensure the solution engine knows it.
        // Otherwise, the moves might be illegal relative to the start position.
        if (startFen && startFen !== 'start' && !pgnLoader.header()['FEN']) {
             // Case: We have a FEN from DB, but PGN didn't specify it in headers.
             // We reload the engine with explicit FEN, then apply moves.
             const manualLoader = new Chess(startFen);
             try { manualLoader.loadPgn(task.pgn); } catch(e){}
             setSolutionMoves(manualLoader.history({ verbose: true }));
        } else {
             // Standard case: PGN contained everything, or it's a standard game
             setSolutionMoves(pgnLoader.history({ verbose: true }));
        }

        // 5. Reset Completion State
        const alreadySolved = solvedTaskIds.includes(task._id) || solvedTaskIds.includes(task.chapterId);
        setIsTaskCompleted(alreadySolved);
        isMovingRef.current = false;

    } catch (e) {
        console.error("Task Setup Error", e);
        toast.error("Error loading puzzle data.");
    }

  }, [assignment, currentTaskIndex, solvedTaskIds]);


  // --- Handle User Move ---
  const onDrop = (sourceSquare, targetSquare) => {
    if (isTaskCompleted || isMovingRef.current) return false;

    try {
        const gameCopy = new Chess(game.fen());
        
        // 1. User attempts move
        const move = gameCopy.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q' 
        });

        if (!move) return false; // Illegal chess move

        // 2. Validate against Solution
        // We look for solutionMoves[expectedMoveIndex]
        const expectedMoveIndex = game.history().length; 
        const expectedMove = solutionMoves[expectedMoveIndex];

        if (!expectedMove) {
            toast.error("Puzzle ended unexpectedly!");
            return false;
        }

        if (move.san !== expectedMove.san) {
            toast.error("Incorrect move. Try again!");
            return false; 
        }

        // 3. Move is Correct!
        setGame(gameCopy);
        
        // 4. Check if Puzzle Completed (User finished last move)
        if (expectedMoveIndex + 1 >= solutionMoves.length) {
            completeTask();
            return true;
        }

        // 5. AUTO-PLAY OPPONENT RESPONSE
        // If the puzzle isn't over, the computer must play the next move immediately
        isMovingRef.current = true;
        setTimeout(() => {
            const nextGameCopy = new Chess(gameCopy.fen());
            const computerMoveIndex = expectedMoveIndex + 1;
            const computerMove = solutionMoves[computerMoveIndex];

            if (computerMove) {
                nextGameCopy.move(computerMove);
                setGame(nextGameCopy);
                
                // Check if puzzle ended after computer move
                if (computerMoveIndex + 1 >= solutionMoves.length) {
                    completeTask();
                }
            }
            isMovingRef.current = false;
        }, 500); // 0.5s delay for realism

        return true;
    } catch (e) {
        console.error("Move Error:", e);
        return false;
    }
  };

  const completeTask = async () => {
    if (isTaskCompleted) return;
    setIsTaskCompleted(true);
    const task = assignment.tasks[currentTaskIndex];
    
    // Save to backend
    if (!solvedTaskIds.includes(task._id)) {
        const newSolved = [...solvedTaskIds, task._id];
        setSolvedTaskIds(newSolved); // Optimistic update
        
        try {
            await apiClient.post(ENDPOINTS.ASSIGNMENTS.SOLVE_TASK(assignmentId), {
                chapterId: task.chapterId 
            });
            toast.success("Task Solved!");
        } catch (e) {
            console.error("Save failed", e);
        }
    }
  };

  // --- Navigation ---
  const handleNext = () => {
    if (currentTaskIndex < (assignment?.tasks?.length || 0) - 1) {
        setCurrentTaskIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentTaskIndex > 0) {
        setCurrentTaskIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    const task = assignment.tasks[currentTaskIndex];
    // Re-run the smart FEN logic for reset
    const pgnLoader = new Chess();
    try { pgnLoader.loadPgn(task.pgn); } catch(e){}
    let startFen = task.fen;
    if ((!startFen || startFen === 'start') && pgnLoader.header()['FEN']) {
         startFen = pgnLoader.header()['FEN'];
    }
    setGame(safeGame(startFen));
    setIsTaskCompleted(false);
    isMovingRef.current = false;
  };

  // --- Render ---

  if (loading) return (
    <div className="min-h-screen bg-[#0a1429] flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4"/>
            <p className="text-gray-400">Loading Assignment...</p>
        </div>
    </div>
  );

  if (!assignment) return (
    <div className="min-h-screen bg-[#0a1429] flex items-center justify-center text-white">
        <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Assignment Not Found</h2>
            <button onClick={() => navigate(-1)} className="text-blue-400 hover:underline">Go Back</button>
        </div>
    </div>
  );

  const currentTask = assignment.tasks[currentTaskIndex];
  const progressPercent = assignment.tasks.length > 0 ? (solvedTaskIds.length / assignment.tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1429] via-[#0a1020] to-black text-white font-sans flex flex-col">
      
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase"
            >
                <ChevronLeft className="w-5 h-5"/> Back
            </button>
            <div>
                <h1 className="text-lg font-bold text-gray-200">{assignment.title}</h1>
            </div>
        </div>
        
        {/* Progress Bar (Desktop) */}
        <div className="hidden md:block w-64">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Sidebar: Task List */}
        <div className="w-full md:w-64 bg-[#111] border-r border-white/5 overflow-y-auto hidden md:block z-10">
            <div className="p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Tasks</h3>
                <div className="space-y-2">
                    {assignment.tasks.map((task, idx) => {
                        // Check if solved by either Task ID or Chapter ID
                        const isSolved = solvedTaskIds.includes(task._id) || solvedTaskIds.includes(task.chapterId);
                        const isActive = idx === currentTaskIndex;
                        return (
                            <div 
                                key={idx}
                                onClick={() => setCurrentTaskIndex(idx)}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                    isActive ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                {isSolved ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-400"/>
                                ) : (
                                    <Circle className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-600'}`}/>
                                )}
                                <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                    {task.title}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* Center: Board Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-0">
            
            {/* Task Title Overlay */}
            <div className="mb-4 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{currentTask.title}</h2>
                <p className="text-gray-500 text-xs md:text-sm">
                    {isTaskCompleted ? "Task Completed!" : "Find the best move."}
                </p>
            </div>

            {/* Chessboard Container */}
            <div className="relative shadow-2xl shadow-blue-900/10 rounded-sm bg-black/40 p-1" style={{ width: 'min(85vw, 550px)', height: 'min(85vw, 550px)' }}>
                <Chessboard 
                    position={game.fen()} 
                    onPieceDrop={onDrop}
                    animationDuration={200}
                    customDarkSquareStyle={{ backgroundColor: '#3b82f6' }} 
                    customLightSquareStyle={{ backgroundColor: '#e2e8f0' }}
                    arePiecesDraggable={!isTaskCompleted}
                />
                
                {/* Success Animation Overlay */}
                <AnimatePresence>
                    {isTaskCompleted && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 rounded-sm"
                        >
                            <Trophy className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-glow animate-bounce"/>
                            <h3 className="text-2xl font-bold text-white mb-2">Solved!</h3>
                            <button 
                                onClick={handleNext} 
                                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-all mt-4"
                            >
                                Next Task <ArrowRight className="w-4 h-4"/>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Navigation Controls */}
            <div className="flex md:hidden w-full max-w-[550px] justify-between mt-6 px-2">
                <button 
                    disabled={currentTaskIndex === 0} 
                    onClick={handlePrev}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded text-sm text-gray-300 disabled:opacity-30"
                >
                    Prev
                </button>
                <span className="text-sm py-2 text-gray-400">{currentTaskIndex + 1} / {assignment.tasks.length}</span>
                <button 
                    disabled={currentTaskIndex >= assignment.tasks.length - 1} 
                    onClick={handleNext}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded text-sm text-gray-300 disabled:opacity-30"
                >
                    Next
                </button>
            </div>

        </div>

        {/* Right Sidebar: Hint/Reset (Desktop) */}
        <div className="w-full md:w-64 bg-[#111] border-l border-white/5 p-6 hidden md:flex flex-col gap-4 z-10">
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4"/> Hint
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Make the moves demonstrated in the syllabus chapter. Incorrect moves will snap back.
                </p>
            </div>

            <button 
                onClick={handleReset} 
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg border border-white/10 transition-all text-sm font-bold"
            >
                <RotateCcw className="w-4 h-4"/> Reset Board
            </button>

            <div className="mt-auto space-y-2">
                <button 
                    disabled={currentTaskIndex === 0} 
                    onClick={handlePrev} 
                    className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white py-2 text-sm disabled:opacity-30"
                >
                    <ChevronLeft className="w-4 h-4"/> Previous
                </button>
                <button 
                    disabled={currentTaskIndex >= assignment.tasks.length - 1} 
                    onClick={handleNext} 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next Task <ArrowRight className="w-4 h-4"/>
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StudentAssignmentSolver;