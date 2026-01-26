import React from "react";
import { ArrowRight } from "lucide-react";
import starCoachImg from "../assets/nilsu-pattnaik.jpg";
import achievementsPDF from "../assets/nilsu-pattnaik-achievements.pdf";

// --- App Wrapper ---
export default function App() {
  return <Hero />;
}

// Open demo form
function bookDemo() {
  window.open(
    "https://docs.google.com/forms/d/e/1FAIpQLSd368-GnfJjgbQdIeAiU6ro68983N8OPo6upy5n0kDI9YClkA/viewform?usp=dialog",
    "_blank"
  );
}

// --- Hero Section ---
function Hero() {
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
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section
        id="home"
        className="relative min-h-screen flex items-center bg-gradient-to-br from-gray-900 via-blue-950 to-black text-white overflow-hidden py-12"
      >
        {/* Background Chess Pieces */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-amber-200 opacity-10 float-animation text-6xl">♛</div>
          <div className="absolute top-40 right-20 text-amber-200 opacity-10 float-animation text-4xl" style={{ animationDelay: "1s" }}>♞</div>
          <div className="absolute bottom-40 left-20 text-amber-200 opacity-10 float-animation text-5xl" style={{ animationDelay: "2s" }}>♜</div>
          <div className="absolute bottom-20 right-10 text-amber-200 opacity-10 float-animation text-3xl" style={{ animationDelay: "0.5s" }}>♟</div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* LEFT CONTENT */}
            <div className="text-center lg:text-left fade-in-up">
              <h4 className="text-xl sm:text-5xl lg:text-6xl xl:text-4xl font-bold leading-tight mb-6">
                Train with FIDE-rated Masters & World-Class Mentors –{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">
                  AI-analyzed, GM-structured
                </span>{" "}
                syllabus to take you from beginner to chess mastery!
              </h4>

              <p className="text-xl lg:text-2xl text-amber-100/80 max-w-2xl mb-6">
                Join the elite. Train with FIDE-rated masters and unlock your true potential.
              </p>

              <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-amber-300 font-medium mb-8">
                <span>✓ 1-on-1 Live Training</span>
                <span>✓ Personalized Learning Path</span>
                <span>✓ Real-time Game Analysis</span>
              </div>

              <button
                onClick={bookDemo}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 transition-all shadow-lg transform hover:scale-105"
              >
                Book A Free Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-amber-400/20">
                <div>
                  <div className="text-3xl font-bold text-amber-400">50+</div>
                  <div className="text-sm text-amber-200/70">FIDE Coaches</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-400">100+</div>
                  <div className="text-sm text-amber-200/70">Students</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-400">98%</div>
                  <div className="text-sm text-amber-200/70">Success Rate</div>
                </div>
              </div>
            </div>

            {/* RIGHT IMAGE SECTION */}
            <div className="relative flex justify-center">
              <div className="w-full max-w-md">

                {/* Image */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-400/30">
                  <img
                    src={heroImage}
                    alt="Nilsu Pattnaik - Chess Coach"
                    className="w-full object-cover aspect-[4/5]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>

                {/* Coach Card */}
                <div className="mt-6 bg-blue-950/80 backdrop-blur-md border border-amber-400/30 rounded-xl p-6 shadow-xl text-center">
                  <h3 className="text-amber-400 font-bold text-xs uppercase mb-1">
                    ♟️ Learn Chess With
                  </h3>
                  <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
                    NILSU PATTNAIK
                  </h2>

                  <div className="flex justify-center items-center gap-3 text-sm text-amber-100 mb-4 bg-black/30 py-2 px-4 rounded-lg">
                    <span>🏅 Commonwealth Medalist</span>
                    <span className="text-amber-500">•</span>
                    <span>♟️ FIDE Rated 2200+</span>
                  </div>

                  <p className="text-amber-300 font-semibold mb-3">
                    🔥 Join the Session: Unlock Your Chess Journey!
                  </p>

                  <p className="text-sm text-gray-300 leading-relaxed mb-5">
                    Train with an elite international-level player and coach. Learn winning strategies, calculation skills, endgames & tournament mindset.
                  </p>

                  {/* PDF BUTTON */}
                  <a
                    href={achievementsPDF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/30"
                  >
                    📄 View Full Achievements
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
