import React from "react";
import { ArrowRight, Play } from "lucide-react";
// Yaha apni nayi image ka naam daalein
import starCoachImg from "../assets/nilsu-pattnaik.jpg"; 

// --- Re-styled Hero Section Component ---
export default function App() {
  const handleLoginClick = () => {
    console.log("Button clicked!");
  };

  return <Hero onLoginClick={handleLoginClick} />;
}

function bookDemo() {
  window.open("https://docs.google.com/forms/d/e/1FAIpQLSd368-GnfJjgbQdIeAiU6ro68983N8OPo6upy5n0kDI9YClkA/viewform?usp=dialog", "_blank");
}

function Hero({ onLoginClick }) {
  // Yaha hum star coach ki image use kar rahe hai
  const heroImage = starCoachImg;

  return (
    <>
      <style>{`
        @keyframes float-animation {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .float-animation {
          animation: float-animation 6s ease-in-out infinite;
        }
        .fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <section
        id="home"
        className="relative min-h-screen flex items-center bg-gradient-to-br from-gray-900 via-blue-950 to-black text-white overflow-hidden py-12"
      >
        {/* Animated Chess Pieces Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-amber-200 opacity-10 float-animation">
            <div className="text-6xl">♛</div>
          </div>
          <div
            className="absolute top-40 right-20 text-amber-200 opacity-10 float-animation"
            style={{ animationDelay: "1s" }}
          >
            <div className="text-4xl">♞</div>
          </div>
          <div
            className="absolute bottom-40 left-20 text-amber-200 opacity-10 float-animation"
            style={{ animationDelay: "2s" }}
          >
            <div className="text-5xl">♜</div>
          </div>
          <div
            className="absolute bottom-20 right-10 text-amber-200 opacity-10 float-animation"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="text-3xl">♟</div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Hero Content - Left Side */}
            <div className="text-center lg:text-left">
              <div className="fade-in-up">
                <h4 className="text-xl sm:text-5xl lg:text-6xl xl:text-4xl font-bold leading-tight mb-6">
                  Train with FIDE-rated Masters & World-Class Mentors –  {" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">
                    AI-analyzed, GM-structured
                  </span>{" "}
                  syllabus to take you from beginner to chess mastery!
                </h4>

                <div className="space-y-4 mb-8">
                  <p className="text-xl lg:text-2xl text-amber-100/80 max-w-2xl mx-auto lg:mx-0">
                    Join the elite. Train with FIDE-rated masters and unlock
                    your true potential.
                  </p>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-amber-300 font-medium">
                    <span className="flex items-center gap-2">✓ 1-on-1 Live Training</span>
                    <span className="flex items-center gap-2">✓ Personalized Learning Path</span>
                    <span className="flex items-center gap-2">✓ Real-time Game Analysis</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={bookDemo}
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold group bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/20 transform hover:scale-105"
                  >
                    Book A Free Demo
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Success Statistics */}
                <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-amber-400/20">
                  <div className="text-center lg:text-left">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">50+</div>
                    <div className="text-sm text-amber-200/70">FIDE Coaches</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">100+</div>
                    <div className="text-sm text-amber-200/70">Students Trained</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">98%</div>
                    <div className="text-sm text-amber-200/70">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Profile Section - Right Side */}
            <div className="relative lg:order-2 flex flex-col items-center">
              <div className="relative w-full max-w-md">
                {/* Main Coach Image */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/20 transition-transform duration-300 hover:scale-105 border-4 border-amber-400/30">
                  <img
                    src={heroImage}
                    alt="Nilsu Pattnaik - Chess Coach"
                    className="w-full h-auto object-cover aspect-[4/5]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/800x800/020617/FFFFFF?text=Image+Error";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                </div>

                {/* Floating Achievement Badge */}
                <div className="absolute top-4 -right-4 bg-amber-500 text-gray-900 rounded-lg shadow-lg p-3 transition-transform duration-300 hover:scale-110 font-bold z-20">
                  <div className="text-xl">🏅</div>
                </div>

                {/* Coach Bio Card - Placed under the image */}
                <div className="mt-6 bg-blue-950/80 backdrop-blur-md border border-amber-400/30 rounded-xl p-6 shadow-xl text-center transform transition-all duration-300 hover:-translate-y-1">
                  <h3 className="text-amber-400 font-bold tracking-wider text-xs sm:text-sm mb-1 uppercase">
                    ♟️ Learn Chess With
                  </h3>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                    NILSU PATTNAIK
                  </h2>

                  <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-sm font-medium text-amber-100 mb-4 bg-black/30 py-2 px-4 rounded-lg">
                    <span>🏅 Commonwealth Medalist</span>
                    <span className="hidden sm:block text-amber-500">•</span>
                    <span>♟️ FIDE Rated 2200+</span>
                  </div>

                  <p className="text-amber-300 font-semibold mb-3">
                    🔥 Join the Session: Unlock Your Chess Journey!
                  </p>

                  <p className="text-sm text-gray-300 leading-relaxed max-w-sm mx-auto">
                    Train with an elite international-level player and coach. Learn winning strategies, calculation skills, endgames & tournament mindset.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}