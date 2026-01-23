import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import apiClient from "../../../lib/api.js";
import { ENDPOINTS } from "../../../lib/endpoints.js";
import { toast } from "sonner";
import { 
  Trash2, Plus, CheckCircle, 
  XCircle, Loader2, User, Filter 
} from "lucide-react";
import { Button } from "../../../components/ui/button.tsx";

// [NEW] Constant matching CoachDatabase.jsx
const LEVELS = [
  'Beginner 1', 'Beginner 2', 'Beginner 3', 
  'Intermediate 1', 'Intermediate 2', 'Intermediate 3', 
  'Advanced 1', 'Advanced 2', 'Advanced 3', 'Master'
];

const CoachAssignment = () => {
  const { user } = useAuth();
  
  // --- Data State ---
  const [courses, setCourses] = useState([]);
  const [assignmentsByCourse, setAssignmentsByCourse] = useState({});
  const [loading, setLoading] = useState(true);

  // --- Creation Form State ---
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  
  // Syllabus & Task Selection State
  const [syllabus, setSyllabus] = useState([]); 
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]); 
  
  // [UPDATED] Filter State defaults to first level to match Database behavior
  const [filterLevel, setFilterLevel] = useState("Beginner 1");

  // --- Review Modal State ---
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // --- Feedback Inputs (Map by submissionId) ---
  const [feedbackMap, setFeedbackMap] = useState({}); 

  // ==================== 1. INITIAL DATA FETCHING ====================
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Get Coach's Courses
      const coursesRes = await apiClient.get(ENDPOINTS.COURSES.GET_MY_COURSES_AS_COACH);
      const myCourses = coursesRes.data.data || [];
      setCourses(myCourses);

      // 2. Get Assignments for each course
      const assignMap = {};
      if (myCourses.length > 0) {
        await Promise.all(myCourses.map(async (course) => {
          try {
            const res = await apiClient.get(ENDPOINTS.ASSIGNMENTS.GET_BY_COURSE(course._id));
            assignMap[course._id] = res.data.data || [];
          } catch (e) {
            console.error(`Failed to load assignments for ${course.title}`, e);
            assignMap[course._id] = [];
          }
        }));
      }
      setAssignmentsByCourse(assignMap);

    } catch (err) {
      console.error("Error loading dashboard:", err);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  // ==================== 2. SYLLABUS & TASK SELECTION ====================

  // [UPDATED] Fetch syllabus depends on Course AND Level (Server-side filter)
  useEffect(() => {
    if (!selectedCourseId) {
      setSyllabus([]);
      setSelectedTasks([]); // Optional: Clear selection on course change
      return;
    }

    const fetchSyllabus = async () => {
      try {
        setLoadingSyllabus(true);
        
        // [UPDATED] API Call uses query param like CoachDatabase
        // Assuming ENDPOINTS.SYLLABUS.GET_BY_COURSE returns string like "/syllabus/course/:id"
        // We append the level query param
        const baseUrl = ENDPOINTS.SYLLABUS.GET_BY_COURSE(selectedCourseId);
        const res = await apiClient.get(`${baseUrl}?level=${encodeURIComponent(filterLevel)}`);
        
        const data = res.data.data; 
        
        // Ensure we handle both structure types (array of levels OR object with techniques)
        const syllabusList = Array.isArray(data) ? data : (data.techniques || []);
        setSyllabus(syllabusList);
        
      } catch (error) {
        toast.error("Could not load course syllabus.");
        setSyllabus([]);
      } finally {
        setLoadingSyllabus(false);
      }
    };

    fetchSyllabus();
  }, [selectedCourseId, filterLevel]); // [UPDATED] Dependency array includes filterLevel

  const toggleTaskSelection = (chapter) => {
    setSelectedTasks(prev => {
      const exists = prev.find(t => t.chapterId === chapter._id);
      if (exists) {
        return prev.filter(t => t.chapterId !== chapter._id);
      } else {
        return [...prev, { 
          chapterId: chapter._id, 
          title: chapter.name, 
          pgn: chapter.pgn, 
          fen: chapter.fen 
        }];
      }
    });
  };

  // [REMOVED] Client-side filteredSyllabus logic. 
  // We now use `syllabus` directly because the API returns exactly what we asked for.

  // ==================== 3. ACTIONS (CREATE, DELETE, REVIEW) ====================

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !formTitle.trim()) {
      toast.error("Title and Course are required.");
      return;
    }
    if (selectedTasks.length === 0) {
      toast.error("Please select at least one task/puzzle from the syllabus.");
      return;
    }

    try {
      await apiClient.post(ENDPOINTS.ASSIGNMENTS.CREATE(selectedCourseId), {
        title: formTitle,
        description: formDesc,
        tasks: selectedTasks
      });
      
      toast.success("Assignment created!");
      
      // Reset Form
      setFormTitle("");
      setFormDesc("");
      setSelectedTasks([]);
      setSelectedCourseId(""); 
      fetchDashboardData(); 

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create assignment.");
    }
  };

  const handleDeleteAssignment = async (id) => {
    if(!window.confirm("Delete this assignment? Student progress will be lost.")) return;
    try {
      await apiClient.delete(ENDPOINTS.ASSIGNMENTS.DELETE(id));
      toast.success("Deleted.");
      fetchDashboardData();
    } catch (err) {
      toast.error("Failed to delete.");
    }
  };

  // --- REVIEW LOGIC ---

  const openReviewModal = async (assignment) => {
    setCurrentAssignment(assignment);
    setReviewModalOpen(true);
    setLoadingSubmissions(true);
    try {
      const res = await apiClient.get(ENDPOINTS.SUBMISSIONS.GET_ALL_FOR_ASSIGNMENT(assignment._id));
      setSubmissions(res.data.data || []);
      
      const initialFeedback = {};
      (res.data.data || []).forEach(sub => {
        initialFeedback[sub._id] = sub.feedback || "";
      });
      setFeedbackMap(initialFeedback);
    } catch (error) {
      toast.error("Could not load submissions.");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const submitReview = async (submissionId, status) => {
    try {
      const feedbackText = feedbackMap[submissionId] || "";
      await apiClient.patch(ENDPOINTS.SUBMISSIONS.REVIEW(submissionId), {
        status,
        feedback: feedbackText
      });
      
      toast.success(`Marked as ${status}`);
      
      setSubmissions(prev => prev.map(sub => 
        sub._id === submissionId ? { ...sub, status, feedback: feedbackText } : sub
      ));

    } catch (error) {
      toast.error("Failed to submit review.");
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1429] via-[#0a1020] to-black p-6 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <span className="text-4xl">🎓</span> Coach Assignments
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: CREATE FORM */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl sticky top-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-500"/> New Assignment
              </h2>

              <form onSubmit={handleCreateAssignment} className="space-y-4">
                {/* 1. Select Course */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Course</label>
                  <select 
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      // Reset to first level on new course selection if needed, or keep current filter
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-violet-500 outline-none"
                  >
                    <option value="">Select a Course...</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>

                {/* 2. Basic Info */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Title</label>
                  <input 
                    type="text" 
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g. Week 1: Pawn Structures"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-violet-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Instructions</label>
                  <textarea 
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Brief instructions for the student..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-violet-500 outline-none h-20 resize-none"
                  />
                </div>

                {/* 3. Task Selection (Syllabus Tree) */}
                <div className="border-t border-white/10 pt-4">
                  {/* HEADER: Label + Filter Dropdown */}
                  <div className="flex flex-col gap-2 mb-2">
                    <label className="text-xs font-bold text-violet-400 uppercase flex justify-between items-center">
                      <span>Select Tasks</span>
                      <span className="text-white bg-violet-600 px-2 py-0.5 rounded-full text-[10px]">{selectedTasks.length} Selected</span>
                    </label>

                    {/* Filter Dropdown (UPDATED TO MATCH DATABASE) */}
                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/10">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select 
                          value={filterLevel}
                          onChange={(e) => setFilterLevel(e.target.value)}
                          className="bg-transparent text-sm outline-none w-full text-white cursor-pointer"
                        >
                          {LEVELS.map(lvl => (
                            <option key={lvl} value={lvl} className="bg-gray-900">{lvl}</option>
                          ))}
                        </select>
                    </div>
                  </div>
                  
                  {/* EXPANDED LIST CONTAINER */}
                  <div className="h-[600px] overflow-y-auto bg-black/30 rounded-lg border border-white/5 p-2 custom-scrollbar relative">
                    {!selectedCourseId ? (
                      <p className="text-xs text-gray-400 text-center py-10">Select a course to view syllabus.</p>
                    ) : loadingSyllabus ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin text-violet-500"/></div>
                    ) : syllabus.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-xs text-red-400">
                           No techniques found in {filterLevel}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* We map directly over syllabus now, as API filtered it */}
                        {syllabus.map((item) => (
                          <div key={item._id} className="mb-2">
                            {/* Level / Group Header */}
                            <h4 className="text-xs font-bold text-gray-300 bg-[#1a2333] px-3 py-2 rounded-t border border-white/10 border-b-0 sticky top-0 z-10 flex justify-between items-center shadow-md">
                                {item.name || item.level} 
                            </h4>
                            
                            {/* Items Container */}
                            <div className="border border-white/10 rounded-b bg-black/20 p-2 space-y-1">
                                
                                {/* Structure Type 1: Techniques -> Chapters (Standard) */}
                                {item.techniques?.map((tech) => (
                                    <div key={tech._id} className="mb-2">
                                        <div className="text-[11px] font-bold text-violet-400 px-2 py-1 uppercase">{tech.name}</div>
                                        {tech.chapters?.map(ch => {
                                            const isSelected = selectedTasks.some(t => t.chapterId === ch._id);
                                            return (
                                                <div 
                                                  key={ch._id}
                                                  onClick={() => toggleTaskSelection(ch)}
                                                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ml-2 ${isSelected ? 'bg-violet-600/20 border border-violet-500/50' : 'hover:bg-white/5 border border-transparent'}`}
                                                >
                                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-violet-500 border-violet-500' : 'border-gray-600'}`}>
                                                    {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                                  </div>
                                                  <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-gray-400'}`}>
                                                    {ch.name}
                                                  </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}

                                {/* Structure Type 2: Direct Chapters (Coach Database style if flat) */}
                                {item.chapters?.map((ch) => {
                                  const isSelected = selectedTasks.some(t => t.chapterId === ch._id);
                                  return (
                                    <div 
                                      key={ch._id}
                                      onClick={() => toggleTaskSelection(ch)}
                                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${isSelected ? 'bg-violet-600/20 border border-violet-500/50' : 'hover:bg-white/5 border border-transparent'}`}
                                    >
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-violet-500 border-violet-500' : 'border-gray-600'}`}>
                                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                      </div>
                                      <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-gray-400'}`}>
                                        {ch.name}
                                      </span>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-6">
                  Create Assignment
                </Button>
              </form>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: ASSIGNMENT LIST */}
          <div className="lg:col-span-2 space-y-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-2"/>
                <p className="text-gray-500 text-sm">Loading dashboard...</p>
              </div>
            ) : Object.keys(assignmentsByCourse).length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                <p className="text-gray-500">No assignments active.</p>
              </div>
            ) : (
              courses.map(course => {
                const assignments = assignmentsByCourse[course._id];
                if (!assignments || assignments.length === 0) return null;

                return (
                  <motion.div 
                    key={course._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-lg"
                  >
                    <div className="bg-black/20 p-4 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-gray-200">{course.title}</h3>
                      <span className="text-xs font-mono text-gray-400 bg-black/40 px-2 py-1 rounded">
                        {assignments.length} Assignments
                      </span>
                    </div>

                    <div className="divide-y divide-white/5">
                      {assignments.map(assign => (
                        <div key={assign._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-bold text-white text-base">{assign.title}</h4>
                              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                                {assign.tasks.length} Tasks
                              </span>
                            </div>
                            {assign.description && (
                              <p className="text-sm text-gray-400 line-clamp-1">{assign.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2 font-mono">
                              Created: {new Date(assign.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <Button 
                              variant="outline" 
                              className="border-violet-500/50 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200"
                              onClick={() => openReviewModal(assign)}
                            >
                              View Submissions
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteAssignment(assign._id)}
                            >
                              <Trash2 className="w-4 h-4"/>
                            </Button>
                          </div>

                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* =================REVIEW MODAL================= */}
      <AnimatePresence>
        {reviewModalOpen && currentAssignment && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#121212] border border-white/10 w-full max-w-4xl h-[80vh] rounded-2xl flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#181818] rounded-t-2xl">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Submissions: <span className="text-violet-400">{currentAssignment.title}</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Total Tasks: {currentAssignment.tasks.length}</p>
                </div>
                <button onClick={() => setReviewModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a]">
                {loadingSubmissions ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-2"/>
                    Loading...
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full border border-dashed border-white/10 rounded-xl">
                    <p className="text-gray-500">No students have started this assignment yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {submissions.map(sub => {
                      // Calculate Progress
                      const progressStr = sub.progress || "0 / 0"; // Backend sends "3 / 5" string
                      const [solved, total] = progressStr.split(' / ').map(Number);
                      const percent = total > 0 ? (solved / total) * 100 : 0;
                      
                      return (
                        <div key={sub._id} className="bg-[#161616] border border-white/5 rounded-xl p-5 flex flex-col gap-4">
                          
                          {/* Student Info & Progress */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center">
                                <User className="w-5 h-5"/>
                              </div>
                              <div>
                                <h4 className="font-bold text-white">{sub.student?.fullname || "Unknown"}</h4>
                                <p className="text-xs text-gray-500">@{sub.student?.username}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-bold ${percent === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                                {progressStr} Solved
                              </span>
                              <div className="w-20 h-1.5 bg-gray-800 rounded-full mt-1 ml-auto">
                                <div className="h-full bg-current rounded-full" style={{ width: `${percent}%` }}></div>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2 text-xs">
                            Status: 
                            <span className={`px-2 py-0.5 rounded uppercase font-bold ${
                              sub.status === 'pass' ? 'bg-green-500/20 text-green-400' :
                              sub.status === 'fail' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {sub.status}
                            </span>
                          </div>

                          {/* Feedback Section */}
                          <div className="mt-auto pt-4 border-t border-white/5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Feedback Review</label>
                            <textarea
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-gray-300 focus:border-violet-500 outline-none resize-none mb-3"
                              rows="2"
                              placeholder="Write feedback..."
                              value={feedbackMap[sub._id] || ""}
                              onChange={(e) => setFeedbackMap(prev => ({ ...prev, [sub._id]: e.target.value }))}
                            />
                            
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className={`flex-1 ${sub.status === 'pass' ? 'bg-green-600 hover:bg-green-500' : 'bg-white/5 hover:bg-green-500/20 text-green-400'}`}
                                onClick={() => submitReview(sub._id, 'pass')}
                              >
                                Pass
                              </Button>
                              <Button 
                                size="sm" 
                                className={`flex-1 ${sub.status === 'fail' ? 'bg-red-600 hover:bg-red-500' : 'bg-white/5 hover:bg-red-500/20 text-red-400'}`}
                                onClick={() => submitReview(sub._id, 'fail')}
                              >
                                Fail
                              </Button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CoachAssignment;