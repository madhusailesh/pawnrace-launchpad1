import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../../../components/Dashbordnavbar";
import {
  GraduationCap,
  Trophy,
  ClipboardList,
  Award,
  FileBarChart,
  Phone,
  Gamepad,
  Settings,
  Database,
  MessageSquare,
  LucideIcon,
  Brain,
  Calendar,
  Gamepad2, 
} from "lucide-react";

// --- BACKGROUND ANIMATION COMPONENTS ---
const KingIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M5 16L3 20h18l-2-4m-2-4H7l-1 4m12-4a4 4 0 00-8 0m4-5V3m-2 2h4" />
  </svg>
);
const QueenIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M5 16L3 20h18l-2-4m-2-4H7l-1 4m12-4a4 4 0 10-8 0m4-5a2 2 0 110-4 2 2 0 010 4z" />
  </svg>
);
const RookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M5 16L3 20h18l-2-4H7l-2 4m14-4V5H5v7m0-7h14v3H5V5z" />
  </svg>
);

const chessPieces = [
  { Icon: KingIcon, size: "w-20 h-20" },
  { Icon: QueenIcon, size: "w-24 h-24" },
  { Icon: RookIcon, size: "w-16 h-16" },
  { Icon: KingIcon, size: "w-12 h-12" },
  { Icon: QueenIcon, size: "w-20 h-20" },
  { Icon: RookIcon, size: "w-28 h-28" },
];

const BackgroundAnimation = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      {Array.from({ length: 15 }).map((_, i) => {
        const Piece = chessPieces[i % chessPieces.length];
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, y: 50, scale: Math.random() * 0.5 + 0.5 }}
            animate={{ opacity: [0, 0.05, 0], y: -100 }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "linear",
            }}
          >
            <Piece.Icon className={`text-indigo-400/20 ${Piece.size}`} />
          </motion.div>
        );
      })}
    </div>
  );
};

// --- DASHBOARD COMPONENTS ---

// Menu Items
const menuItems = [
  {
    name: "Classes",
    icon: GraduationCap,
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    name: "Tournaments",
    icon: Trophy,
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    name: "Assignments",
    icon: ClipboardList,
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    name: "Achievements",
    icon: Award,
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    name: "Test Results",
    icon: FileBarChart,
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    name: "Contact Coach",
    icon: Phone,
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    name: "Settings",
    icon: Settings,
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    name: "Chats",
    icon: MessageSquare,
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    name: "iqpuzzles",
    icon: Brain,
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    name: "Play Game",
    icon: Gamepad, 
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  // ✅ NEW CLASSES BUTTON ADDED HERE
  {
    name: "Training Sessions",
    icon: Gamepad2,
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
].map((item) => ({ ...item, path: item.name.toLowerCase().replace(" ", "-") }));

interface MenuCardProps {
  name: string;
  icon: LucideIcon;
  color: string;
  index: number;
  onClick: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({
  name,
  icon: Icon,
  color,
  index,
  onClick,
}) => {
  return (
    <motion.div
      role="button"
      aria-label={`Maps to ${name}`}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="cursor-pointer flex flex-col items-center group"
    >
      <div
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg group-hover:shadow-xl transition-all duration-300 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28`}
      >
        <Icon className="stroke-white stroke-[2px] w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10" />
      </div>
      <p className="text-gray-200 mt-3 sm:mt-4 font-semibold text-center transition-all duration-300 group-hover:text-white text-sm sm:text-base lg:text-lg">
        {name}
      </p>
    </motion.div>
  );
};

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleMenuClick = (path: string) => {
    if (path === "play-game") {
      navigate(`/play`);
    } else {
      // Handles 'new-classes(coming-soon)' automatically too
      navigate(`/student-dashboard/${path}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#1a173d] to-black"></div>
      <BackgroundAnimation />

      <div className="relative z-10">
        <DashboardNavbar />
        <main className="pt-24 md:pt-28 px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back!
              </h1>
              <p className="text-gray-400 mt-2">
                Choose an option below to get started.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 lg:gap-10"
            >
              {menuItems.map((item, index) => (
                <MenuCard
                  key={item.path}
                  name={item.name}
                  icon={item.icon}
                  color={item.color}
                  index={index}
                  onClick={() => handleMenuClick(item.path)}
                />
              ))}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};
//
export default StudentDashboard;