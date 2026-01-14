export const ENDPOINTS = {
  USERS: {
    REGISTER: '/users/register',
    LOGIN: '/users/login',
    LOGOUT: '/users/logout',
    REFRESH_TOKEN: '/users/refresh-token',
    CHANGE_PASSWORD: '/users/change-password',
    FORGOT_PASSWORD: '/users/forgot-password',
    RESET_PASSWORD: (token) => `/users/reset-password/${token}`,
    UPDATE_PROFILE: '/users/update-profile',
  },
  COURSES: {
    CREATE: '/courses',
    GET_ALL: '/courses/all',
    GET_SYLLABI: '/courses/syllabi',
    GET_MY_COURSES_AS_COACH: '/courses/coach/my-courses',
    GET_MY_COURSES_AS_STUDENT: '/courses/student/my-courses',
    GET_BY_ID: (courseId) => `/courses/${courseId}`,
    UPDATE: (courseId) => `/courses/${courseId}`,
    DELETE: (courseId) => `/courses/${courseId}`,
    ADD_STUDENT: (courseId) => `/courses/${courseId}/students`,
    REMOVE_STUDENT: (courseId, studentId) => `/courses/${courseId}/students/${studentId}`,
  },
  
  
  ASSIGNMENTS: {
    CREATE: (courseId) => `/assignments/course/${courseId}`,
    GET_BY_COURSE: (courseId) => `/assignments/course/${courseId}`,
    DELETE: (assignmentId) => `/assignments/${assignmentId}`,
    
    SOLVE_TASK: (assignmentId) => `/submissions/${assignmentId}/solve`, 
  },
  
  SUBMISSIONS: {
    GET_ALL_FOR_ASSIGNMENT: (assignmentId) => `/submissions/${assignmentId}/all`,
    
    REVIEW: (submissionId) => `/submissions/${submissionId}/review`,
    
    SOLVE: (assignmentId) => `/submissions/${assignmentId}/solve`,
  },
  
  CLASSES: {
    SCHEDULE: (courseId) => `/training/course/${courseId}`,
    GET_BY_COURSE: (courseId) => `/training/course/${courseId}`,
    UPDATE: (classId) => `/training/${classId}`,
    DELETE: (classId) => `/training/${classId}`,
  },
  NEW_CLASSES:{
    SCHEDULE: (courseId) => `/newclasses/course/${courseId}`,
    GET_BY_COURSE: (courseId) => `/newclasses/course/${courseId}`,
    UPDATE: (classId) => `/newclasses/${classId}`,
    DELETE: (classId) => `/newclasses/${classId}`,
  },
  CHATS: {
    GET_STUDENTS_FOR_COACH: '/chats/coach/students',
    GET_CHAT_HISTORY: (receiverId) => `/chats/conversation/${receiverId}`,
  },
  TESTS: {
    CREATE: (courseId) => `/tests/course/${courseId}`,
    GET_BY_COURSE: (courseId) => `/tests/course/${courseId}`,
    DELETE: (testId) => `/tests/${testId}`,
  },
  SYLLABUS: {
    // Global Access (Database View & Modal)
    ADD: '/syllabus/add',
    GET_ALL: '/syllabus/all',
    GET_BY_LEVEL: (level) => `/syllabus/level/${level}`, 
    
    // Course Context (Classroom View)
    GET_BY_COURSE: (courseId) => `/syllabus/course/${courseId}`,
    TOGGLE_COMPLETE: '/syllabus/course/toggle',
    
    // Unused/Future
    UPDATE: '/syllabus/update',
    DELETE: '/syllabus/delete',
  },
  TOURNAMENTS: {
    GET_ALL: '/tournaments',
    CREATE: '/tournaments',
    DELETE: (id) => `/tournaments/${id}`,
    COMPLETE: (id) => `/tournaments/${id}/complete`,
  },
};