import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import apiClient from "../../../lib/api.js";
import { ENDPOINTS } from "../../../lib/endpoints.js";
import { toast } from "sonner";
import { Video, Calendar, Clock, CheckCircle, BookOpen } from "lucide-react";
import { Button } from "../../../components/ui/button.tsx";

// Helper: Format Date
const formatClassTime = (isoString) => {
  if (!isoString) return { date: 'N/A', time: 'N/A' };
  const date = new Date(isoString);
  const formattedDate = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return { date: formattedDate, time: formattedTime };
};

const Classes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- State ---
  const [courses, setCourses] = useState([]); 
  const [selectedCourseId, setSelectedCourseId] = useState("");
  
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [completedClasses, setCompletedClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Enrolled Courses
  useEffect(() => {
    const fetchCourses = async () => {
        try {
            const response = await apiClient.get(ENDPOINTS.COURSES.GET_MY_COURSES_AS_STUDENT); 
            setCourses(response.data.data || []); 
        } catch (err) {
            console.error("Error fetching courses:", err);
            toast.error("Could not load your courses.");
        }
    };
    if (user) fetchCourses();
  }, [user]);

  // 2. Fetch Training Sessions when Course Selected
  useEffect(() => {
    const fetchClasses = async () => {
        if (!selectedCourseId) {
            setUpcomingClasses([]);
            setCompletedClasses([]);
            return;
        }

        try {
            setLoading(true);
            // Uses the TRAINING endpoint (Old Classes)
            const response = await apiClient.get(ENDPOINTS.CLASSES.GET_BY_COURSE(selectedCourseId));
            const allClasses = response.data.data || [];

            setUpcomingClasses(allClasses.filter(c => c.status === 'scheduled'));
            setCompletedClasses(allClasses.filter(c => c.status === 'completed'));
        } catch (err) {
            console.error("Error fetching sessions:", err);
            toast.error("Failed to load session schedule.");
        } finally {
            setLoading(false);
        }
    };

    fetchClasses();
  }, [selectedCourseId]);

  // 3. Join Session
  const handleJoinClass = (classData) => {
      // 1. Prefer Room ID (New Standard)
      if (classData.roomId) {
          navigate(`/student/classroom/${classData.roomId}`);
          return;
      }
      
      // 2. Fallback for Legacy Zoom Links (if any exist)
      if (classData.zoomLink) {
          if (classData.zoomLink.includes('/classroom/')) {
             const id = classData.zoomLink.split('/').pop();
             navigate(`/student/classroom/${id}`);
          } else {
             window.open(classData.zoomLink, '_blank');
          }
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1429] via-[#0a1020] to-black p-6 text-white">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-extrabold flex items-center gap-2">
                    <Video className="w-8 h-8 text-violet-500"/> Training Sessions
                </h1>
                <p className="text-gray-400 text-sm mt-1">Select a course to view your live sessions</p>
            </div>

            {/* Course Selector */}
            <div className="w-full md:w-64">
                <select 
                    value={selectedCourseId} 
                    onChange={(e) => setSelectedCourseId(e.target.value)} 
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white p-2.5 rounded-lg focus:ring-2 focus:ring-violet-600 outline-none"
                >
                    <option value="" disabled>-- Select Course --</option>
                    {courses.map((c) => (
                        <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 gap-8">
            
            {/* Upcoming Sessions */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-blue-400">
                    <Calendar className="w-5 h-5"/> Upcoming Sessions
                </h2>

                {!selectedCourseId ? (
                    <div className="p-12 text-center bg-white/5 rounded-2xl border border-dashed border-gray-700 text-gray-400 flex flex-col items-center">
                        <BookOpen className="w-12 h-12 mb-3 opacity-20"/>
                        Please select a course to view sessions.
                    </div>
                ) : loading ? (
                    <div className="p-8 text-center text-gray-500 animate-pulse">Loading schedule...</div>
                ) : upcomingClasses.length === 0 ? (
                    <div className="p-8 text-center bg-white/5 rounded-xl border border-white/5 text-gray-400">
                        No upcoming sessions scheduled for this course.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {upcomingClasses.map((cls) => (
                            <div key={cls._id} className="bg-[#161616] border border-white/10 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-[#1f1f1f] transition-all group shadow-lg">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">{cls.title}</h3>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> {formatClassTime(cls.classTime).date}</span>
                                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {formatClassTime(cls.classTime).time}</span>
                                    </div>
                                </div>

                                <Button 
                                    onClick={() => handleJoinClass(cls)} 
                                    className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20"
                                >
                                    <Video className="w-4 h-4" /> Join Now
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Completed History */}
            {selectedCourseId && completedClasses.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-8 border-t border-gray-800">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-green-500">
                        <CheckCircle className="w-5 h-5"/> Past Sessions
                    </h2>
                    <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                        {completedClasses.map((cls, idx) => (
                            <div key={cls._id} className={`p-4 flex justify-between items-center ${idx !== completedClasses.length - 1 ? 'border-b border-white/5' : ''}`}>
                                <div>
                                    <h3 className="text-md font-medium text-gray-400 line-through">{cls.title}</h3>
                                    <p className="text-xs text-gray-500">{formatClassTime(cls.classTime).date}</p>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-500 text-xs font-bold uppercase">Completed</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

        </div>
      </motion.div>
    </div>
  );
};

export default Classes;