import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import Coaches from "@/components/Coaches";
import Contacts from "@/components/Contacts";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import StudentGlory from "../components/StudentGlory";
import AutoPopup from "@/components/AutoPopup"; 



export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAutoPopupOpen, setIsAutoPopupOpen] = useState(false); // Add state for the auto popup

  // Show the popup after a 5-second delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAutoPopupOpen(true);
    }, 5000); 

    return () => clearTimeout(timer);
  }, []);

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleCloseAutoPopup = () => {
    setIsAutoPopupOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar onLoginClick={handleLoginClick} />

      <main className="flex-grow">
        <Hero onLoginClick={handleLoginClick} />
        <Coaches />
        <Features />
        
      </main>
      <StudentGlory/>
      <Footer />

      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseModal} />
      
      {/* Render the AutoPopup component */}
      <AutoPopup isOpen={isAutoPopupOpen} onClose={handleCloseAutoPopup} />
    </div>
  );
}