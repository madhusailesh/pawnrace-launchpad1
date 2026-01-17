import React from "react";
import { motion } from "framer-motion";
const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut", delay },
  viewport: { once: true, amount: 0.2 },
});

const glass =
  "bg-white/5 border border-yellow-400/30 backdrop-blur-lg shadow-[0_8px_40px_rgb(2,6,23,0.6)] rounded-3xl";

const teamMembers = [
  {
    name: "Satyajit Swain",
    role: "Chief Technology Officer (CTO)",
    img: "https://i.ibb.co/20ZcTrzb/Whats-App-Image-2025-09-07-at-02-16-14-beb289e7.jpg",
    desc: "Architect behind our tech infrastructure, ensuring seamless learning experiences powered by smart systems and scalable platforms.",
  },
  {
    name: "Madhu Sailesh Sasamal",
    role: "Software Developer",
    img: "https://i.ibb.co/jPs8Wscs/IMG-20250907-223807893-AE-2.png",
    desc: "Strategic thinker driving product development and backend excellence with precision and vision.",
  },
  
  {
    name: "Dibyajyoti Biswal",
    role: "Chief Product Officer (CPO)",
    img: "https://i.ibb.co/bgjm2bRZ/Whats-App-Image-2025-09-07-at-02-37-54-047b6678.jpg",
    desc: "Leads product design blending chess mastery with academic engagement for a seamless user experience.",
  },
 
  {
    name: "Priti Prasana Sethi",
    role: "Video & Media Specialist",
    img: "https://i.ibb.co/PvcHjCyz/Whats-App-Image-2025-09-07-at-02-15-12-a2fc56ec.jpg",
    desc: "The creative lens behind our visual storytelling, bringing our academy to life through engaging video content.",
  },
  {
    name: "Dinesh",
    role: "Chief Marketing Officer (CMO)",
    img: null,
    desc: "The voice of PawnRace, crafting compelling outreach strategies connecting our mission with families globally.",
  },
];

const AboutUs = () => {
  return (
    <>
      <div className="min-h-screen w-full relative bg-[#0E1A3C] text-white overflow-hidden">
        {/* Background Glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full blur-3xl opacity-30 bg-yellow-400/30" />
          <div className="absolute -bottom-44 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-20 bg-yellow-300/25" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl opacity-15 bg-yellow-200/20" />
        </div>

        {/* Hero Section */}
        <section className="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 pt-28">
          <motion.h1
            {...fadeInUp(0)}
            className="text-4xl md:text-6xl font-extrabold text-center bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent"
          >
            👥 Meet the Minds Behind PawnRace Academy
          </motion.h1>

          <motion.p
            {...fadeInUp(0.2)}
            className="mt-6 text-lg md:text-xl text-gray-300 text-center max-w-3xl mx-auto leading-relaxed"
          >
            At PawnRace, innovation meets dedication. Our team is a powerhouse
            of technical brilliance, creative strategy, and educational
            passion—united by one mission: to nurture young minds through chess,
            study, and cognitive growth.
          </motion.p>
        </section>

        {/* Team Section */}
        <section className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 mt-20 mb-16">
          <motion.h2
            {...fadeInUp(0)}
            className="text-3xl md:text-4xl font-bold mb-10 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent text-center"
          >
            🧠 Leadership & Technical Team
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                {...fadeInUp(index * 0.1)}
                className={`p-6 ${glass} flex flex-col items-center text-center`}
              >
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-36 h-36 rounded-full border-4 border-yellow-400 shadow-xl object-cover transition-transform duration-300 hover:scale-110"
                />
                <h3 className="mt-4 text-xl font-semibold text-yellow-300">
                  {member.name}
                </h3>
                <p className="text-yellow-500 text-sm font-medium">
                  {member.role}
                </p>
                <p className="mt-3 text-gray-300 text-sm">{member.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* FIDE-Rated Trainers */}
          <motion.div
            {...fadeInUp(0.4)}
            className={`mt-16 p-8 ${glass} text-center`}
          >
            <h2 className="text-2xl font-semibold text-yellow-300">
              ♟ FIDE-Rated Trainers & Mentors
            </h2>
            <p className="mt-4 text-gray-300">
              Our team is strengthened by internationally recognized chess
              masters who guide students from foundation to finesse. With a
              strong helping mindset, they mentor each learner to think
              critically, act strategically, and grow confidently.
            </p>
          </motion.div>

          {/* Final Section */}
          <motion.div
            {...fadeInUp(0.6)}
            className={`mt-10 p-8 ${glass} text-center`}
          >
            <h2 className="text-2xl font-semibold text-yellow-300">
              🌟 Together, We Build Minds
            </h2>
            <p className="mt-4 text-gray-300 max-w-3xl mx-auto">
              At PawnRace, we don’t just teach—we transform. From tech to
              training, marketing to mentorship, we are building India’s most
              innovative academy— one move at a time.
            </p>
          </motion.div>
        </section>
      </div>
    </>
  );
};

export default AboutUs;
