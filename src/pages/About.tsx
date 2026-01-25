import React from "react";
import Navbar from "@/components/Navbar";
import OurVission from "@/components/OurVission";
import Footer from "@/components/Footer";
import { useState } from "react";
import AuthModal from "@/components/AuthModal";
//comment
const About: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar onLoginClick={handleLoginClick} />
      <div className="pt-20">
        <OurVission />
      </div>
      <Footer />
      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} />
    </div>
  );
};

export default About;
