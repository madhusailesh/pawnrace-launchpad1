import React, { useEffect, useState } from "react";
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
import { Button } from "../../../components/ui/button.tsx";

const StudentAssignmentSolver = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  // --- Data State ---
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- Game State ---
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [game, setGame] = useState(new Chess());
  const [solutionMoves, setSolutionMoves] = useState([]); // The correct move sequence
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [solvedTaskIds, setSolvedTaskIds] = useState([]); // IDs from DB

  // --- Fetch Assignment Data ---
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        // We use the "Submit/Solve" endpoint context or just get by ID logic
        // Assuming GET_BY_ID or similar logic exists, or reuse GET_BY_COURSE logic filtered
        // For now, let's assume we fetch the assignment details directly
        // If you don't have a direct GET /assignment/:id, we might need to update backend
        // But usually, the "Start" button implies we have the data. 
        // Let's assume you added a route: GET /api/v1/assignments/:id
        // If not, add strictly: router.route('/:assignmentId').get(...) in backend.
        
        // TEMPORARY FIX: using the specific endpoint if available, otherwise fetch course and find it
        // Ideally: apiClient.get(`/assignments/${assignmentId}`)
        // Let's assume you add this simple GET endpoint to your backend assignment.controller
        const res = await apiClient.get(`/assignments/${assignmentId}`); 
        
        const data = res.data.data;
        setAssignment(data);
        
        // Load user progress
        // Depending on your backend, you might need to fetch submission separately
        const subRes = await apiClient.get(ENDPOINTS.SUBMISSIONS.GET_ALL_FOR_ASSIGNMENT(assignmentId));
        // The backend returns an array of submissions. Find MINE.
        // Or better: update backend to return "my submission" in the assignment fetch.
        // For now, let's assume the previous page passed data or we fetch purely assignment data
        
        // Initialize logic
        if(data.mySubmission && data.mySubmission.solvedTaskIds) {
            setSolvedTaskIds(data.mySubmission.solvedTaskIds);
        }

      } catch (err) {
        console.error(err);
        toast.error("Failed to load assignment details.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  // --- Load Task into Board ---
  useEffect(() => {
    if (!assignment || !assignment.tasks || assignment.tasks.length === 0) return;

    const task = assignment.tasks[currentTaskIndex];
    const newGame = new Chess();
    
    // Load PGN to extract moves, then reset board to start position
    try {
        // 1. Load PGN to get history
        newGame.loadPgn(task.pgn);
        const history = newGame.history({ verbose: true });
        setSolutionMoves(history);

        // 2. Reset to start (or custom FEN if provided)
        const startGame = new Chess();
        if(task.fen && task.fen !== 'start') {
            startGame.load(task.fen);
        }
        setGame(startGame);
        setIsTaskCompleted(solvedTaskIds.includes(task._id));

    } catch (e) {
        console.error("PGN Error", e);
        toast.error("Error loading puzzle.");
    }

  }, [assignment, currentTaskIndex]);


  // --- Handle Move Logic ---
  const onDrop = (sourceSquare, targetSquare) => {
    if (isTaskCompleted) return false;

    try {
        const gameCopy = new Chess(game.fen());
        
        // 1. Attempt Move
        const move = gameCopy.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q' 
        });

        if (!move) return false; // Illegal move

        // 2. Validate against Solution
        // Get index of current move in the solution array
        const currentMoveIndex = game.history().length;
        const correctMove = solutionMoves[currentMoveIndex];

        if (!correctMove || move.san !== correctMove.san) {
            toast.error("Incorrect move. Try again!");
            return false; // Snap back
        }

        // 3. Move is Correct -> Update State
        setGame(gameCopy);

        // 4. Check if Puzzle is Finished
        if (currentMoveIndex + 1 >= solutionMoves.length) {
            handleTaskCompletion();
        } else {
            // 5. OPTIONAL: Auto-play opponent move if it's a puzzle? 
            // For syllabus tasks, usually the student plays BOTH sides or just one side. 
            // Let's assume student plays ALL moves recorded in Syllabus for now.
        }

        return true;
    } catch (e) {
        return false;
    }
  };

  const handleTaskCompletion = async () => {
    setIsTaskCompleted(true);
    const task = assignment.tasks[currentTaskIndex];
    
    // Optimistic Update
    if (!solvedTaskIds.includes(task._id)) {
        const newSolved = [...solvedTaskIds, task._id];
        setSolvedTaskIds(newSolved);
        
        try {
            await apiClient.post(ENDPOINTS.ASSIGNMENTS.SOLVE_TASK(assignmentId), {
                chapterId: task.chapterId // Note: Your backend expects chapterId or task _id? Check controller.
            });
            toast.success("Task Solved!");
        } catch (e) {
            console.error("Save failed", e);
        }
    }
  };

  // --- Navigation Handlers ---
  const nextTask = () => {
    if (currentTaskIndex < (assignment?.tasks?.length || 0) - 1) {
        setCurrentTaskIndex(prev => prev + 1);
    }
  };

  const prevTask = () => {
    if (currentTaskIndex > 0) {
        setCurrentTaskIndex(prev => prev - 1);
    }
  };

  const resetBoard = () => {
    const task = assignment.tasks[currentTaskIndex];
    const g = new Chess();
    if(task.fen) g.load(task.fen);
    setGame(g);
    setIsTaskCompleted(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a1429] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500"/>
    </div>
  );

  if (!assignment) return (
    <div className="min-h-screen bg-[#0a1429] flex items-center justify-center text-white">
        <p>Assignment not found.</p>
    </div>
  );

  const currentTask = assignment.tasks[currentTaskIndex];
  const isLastTask = currentTaskIndex === assignment.tasks.length - 1;
  const progressPercent = (solvedTaskIds.length / assignment.tasks.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1429] via-[#0a1020] to-black text-white font-sans flex flex-col">
      
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5"/> Back
            </Button>
            <div>
                <h1 className="text-lg font-bold text-gray-200">{assignment.title}</h1>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="text-blue-400">{currentTaskIndex + 1}</span> / {assignment.tasks.length} Tasks
                </div>
            </div>
        </div>
        
        {/* Progress Bar Top */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar: Task List */}
        <div className="w-full md:w-64 bg-[#111] border-r border-white/5 overflow-y-auto hidden md:block">
            <div className="p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Task List</h3>
                <div className="space-y-2">
                    {assignment.tasks.map((task, idx) => {
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
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            
            {/* Task Title */}
            <div className="mb-4 text-center">
                <h2 className="text-2xl font-bold text-white mb-1">{currentTask.title}</h2>
                <p className="text-gray-500 text-sm">Play the moves exactly as taught in the lesson.</p>
            </div>

            {/* Board */}
            <div className="relative shadow-2xl shadow-blue-900/20 rounded-sm" style={{ width: 'min(70vh, 600px)', height: 'min(70vh, 600px)' }}>
                <Chessboard 
                    position={game.fen()} 
                    onPieceDrop={onDrop}
                    animationDuration={200}
                    customDarkSquareStyle={{ backgroundColor: '#3b82f6' }} // Blue theme
                    customLightSquareStyle={{ backgroundColor: '#e2e8f0' }}
                />
                
                {/* Success Overlay */}
                <AnimatePresence>
                    {isTaskCompleted && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10"
                        >
                            <Trophy className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-glow"/>
                            <h3 className="text-2xl font-bold text-white mb-2">Task Solved!</h3>
                            <Button onClick={nextTask} className="bg-green-600 hover:bg-green-500 text-white mt-4">
                                Next Puzzle <ArrowRight className="w-4 h-4 ml-2"/>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Controls */}
            <div className="flex md:hidden w-full justify-between mt-6 px-4">
                <Button variant="outline" disabled={currentTaskIndex === 0} onClick={prevTask}>Prev</Button>
                <span className="text-sm py-2">{currentTaskIndex + 1} / {assignment.tasks.length}</span>
                <Button variant="outline" disabled={isLastTask} onClick={nextTask}>Next</Button>
            </div>

        </div>

        {/* Right Sidebar: Hint/Reset (Optional) */}
        <div className="w-full md:w-64 bg-[#111] border-l border-white/5 p-6 flex flex-col gap-4">
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4"/> Instructions
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Reproduce the moves stored in this lesson. If you make a mistake, the piece will snap back.
                </p>
            </div>

            <Button variant="secondary" onClick={resetBoard} className="w-full justify-start">
                <RotateCcw className="w-4 h-4 mr-2"/> Reset Board
            </Button>

            <div className="mt-auto">
                <Button 
                    disabled={currentTaskIndex === 0} 
                    onClick={prevTask} 
                    className="w-full mb-2" variant="ghost"
                >
                    <ChevronLeft className="w-4 h-4 mr-2"/> Previous Task
                </Button>
                <Button 
                    disabled={isLastTask} 
                    onClick={nextTask} 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                >
                    Next Task <ArrowRight className="w-4 h-4 ml-2"/>
                </Button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StudentAssignmentSolver;