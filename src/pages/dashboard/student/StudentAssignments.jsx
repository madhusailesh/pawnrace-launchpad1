import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import apiClient from "../../../lib/api.js";
import { ENDPOINTS } from "../../../lib/endpoints.js";
import { toast } from "sonner";
import { 
  CheckCircle2, Play, Clock, AlertCircle, 
  Trophy, ChevronRight, Loader2 
} from "lucide-react";
import { Button } from "../../../components/ui/button.tsx";

const StudentAssignment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch enrolled courses
      const coursesRes = await apiClient.get(ENDPOINTS.COURSES.GET_MY_COURSES_AS_STUDENT);
      const enrolledCourses = coursesRes.data.data || [];

      if (enrolledCourses.length > 0) {
        // 2. Fetch assignments
        const assignmentPromises = enrolledCourses.map(course =>
          apiClient.get(ENDPOINTS.ASSIGNMENTS.GET_BY_COURSE(course._id))
        );
        const assignmentResults = await Promise.all(assignmentPromises);

        // 3. Flatten list
        const allAssignments = assignmentResults.flatMap(res => res.data.data || []);
        
        // 4. Sort into Pending vs Completed based on 'mySubmission' status
        const pending = [];
        const completed = [];

        allAssignments.forEach(assign => {
          const sub = assign.mySubmission;
          if (!sub || ['pending', 'in_progress', 'submitted', 'fail'].includes(sub.status)) {
            pending.push(assign);
          } else if (sub.status === 'pass') {
            completed.push(assign);
          }
        });

        setPendingAssignments(pending);
        setCompletedAssignments(completed);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError("Could not load your assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // --- Helper to calculate progress ---
  const getProgress = (assign) => {
    const total = assign.tasks?.length || 0;
    const solved = assign.mySubmission?.solvedTaskIds?.length || 0;
    const percent = total > 0 ? (solved / total) * 100 : 0;
    return { solved, total, percent };
  };

  // --- Helper for Status Badge ---
  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted': return <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded flex items-center gap-1"><Clock className="w-3 h-3"/> In Review</span>;
      case 'fail': return <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Redo</span>;
      case 'pass': return <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded flex items-center gap-1"><Trophy className="w-3 h-3"/> Passed</span>;
      default: return <span className="text-xs font-bold bg-gray-700 text-gray-400 px-2 py-0.5 rounded">To Do</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1429] via-[#0a1020] to-black p-6 text-white font-sans">
      <h1 className="text-3xl font-extrabold text-center mb-8 flex justify-center items-center gap-3">
        <span>📘</span> My Assignments
      </h1>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
           <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2"/>
           <p className="text-gray-400">Loading your tasks...</p>
        </div>
      ) : error ? (
        <div className="text-center text-lg text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20">{error}</div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* === ACTIVE ASSIGNMENTS === */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
              <Clock className="w-5 h-5"/> Active Tasks
            </h2>
            
            <div className="space-y-4">
              {pendingAssignments.length > 0 ? (
                pendingAssignments.map((assign) => {
                  const { solved, total, percent } = getProgress(assign);
                  const sub = assign.mySubmission;

                  return (
                    <motion.div 
                      key={assign._id} 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-yellow-500/30 transition-all shadow-lg"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Info Section */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-white">{assign.title}</h3>
                            {getStatusBadge(sub?.status)}
                          </div>
                          <p className="text-sm text-gray-400 mb-3">
                            Course: <span className="text-gray-300">{assign.course?.title}</span>
                          </p>
                          
                          {/* Progress Bar */}
                          <div className="w-full max-w-sm">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{solved} / {total} Tasks</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${sub?.status === 'fail' ? 'bg-red-500' : 'bg-yellow-500'}`} 
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Coach Feedback (If Failed/Redo) */}
                          {sub?.status === 'fail' && sub?.feedback && (
                            <div className="mt-4 bg-red-900/20 border-l-2 border-red-500 p-3 rounded-r text-sm text-red-200">
                              <span className="font-bold text-red-400 block text-xs uppercase mb-1">Coach Feedback:</span>
                              "{sub.feedback}"
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <div>
                          <Button 
                            /* --- FIXED: Matches your /student-dashboard route --- */
                            onClick={() => navigate(`/student-dashboard/assignment/${assign._id}`)}
                            className="w-full md:w-auto bg-violet-600 hover:bg-violet-500 text-white font-bold"
                          >
                            <Play className="w-4 h-4 mr-2"/> 
                            {solved > 0 ? "Continue" : "Start"}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <p className="text-gray-500">No active assignments. Relax! 🌴</p>
                </div>
              )}
            </div>
          </section>

          {/* === COMPLETED HISTORY === */}
          {completedAssignments.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5"/> Completed
              </h2>
              
              <div className="space-y-3">
                {completedAssignments.map((assign) => (
                  <motion.div 
                    key={assign._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-green-900/10 border border-green-500/20 p-4 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-gray-300 line-through decoration-green-500/50">{assign.title}</h3>
                      <p className="text-xs text-gray-500">{assign.course?.title}</p>
                    </div>
                    
                    <div className="text-right">
                      {assign.mySubmission?.feedback && (
                        <div className="text-xs text-green-300 italic mb-1">
                          "{assign.mySubmission.feedback}"
                        </div>
                      )}
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase">Passed</span>
                        <Button 
                           variant="ghost" 
                           size="sm"
                           className="text-gray-500 hover:text-white"
                           /* --- FIXED: Matches your /student-dashboard route --- */
                           onClick={() => navigate(`/student-dashboard/assignment/${assign._id}`)}
                        >
                          Review <ChevronRight className="w-3 h-3 ml-1"/>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
};

export default StudentAssignment;