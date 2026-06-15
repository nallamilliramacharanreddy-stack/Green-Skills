import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Footer from '../components/layout/Footer';

const About = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [0, 1]; // Two slides requested by user

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.6 }}
      className="flex-1 w-full flex flex-col min-h-screen bg-slate-900 overflow-x-hidden font-sans pt-16"
    >
      {/* Full-Screen Carousel Section */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden min-h-[85vh]">
        
        {/* Static Background - Remains exactly the same across slides */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/70 to-slate-900/90 z-10 pointer-events-none"></div>
          <img
            src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=2000"
            alt="Solar Panels"
            className="w-full h-full object-cover opacity-60 scale-105 pointer-events-none"
          />
        </div>

        {/* Carousel Content */}
        <div className="relative z-20 w-full px-12 md:px-24 py-12">
          <AnimatePresence mode="wait">
            {currentSlide === 0 && (
              <motion.div
                key="slide-0"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic">
                  Our <span className="text-primary not-italic">Mission</span>
                </h1>
                <p className="text-slate-300 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed mt-6">
                  Empowering Rural Communities Through Digital Green Skill Development and Job Matching.
                </p>
                <div className="flex justify-center gap-4 pt-10">
                  <div className="h-1 w-20 bg-primary rounded-full"></div>
                  <div className="h-1 w-4 bg-primary/30 rounded-full"></div>
                  <div className="h-1 w-4 bg-primary/30 rounded-full"></div>
                </div>
              </motion.div>
            )}

            {currentSlide === 1 && (
              <motion.div
                key="slide-1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-6xl mx-auto"
              >
                <div className="bg-slate-900/50 backdrop-blur-xl p-8 md:p-12 rounded-[40px] border border-white/10 shadow-2xl">
                  <div className="space-y-6 text-slate-200 text-lg md:text-xl leading-relaxed text-justify font-medium">
                    <p>
                      <strong className="text-white font-black text-2xl tracking-tight block mb-4">Empowering Rural Communities Through Digital Green Skill Development and Job Matching</strong>
                      is an innovative platform designed to enhance employment opportunities and sustainable livelihood development in rural areas. The project focuses on equipping rural youth, students, and job seekers with essential digital and green skills through personalized learning, career guidance, and training resources.
                    </p>
                    <p>
                      Using Artificial Intelligence, the system analyzes users' educational background, skills, interests, and career goals to recommend suitable career pathways, skill development programs, and employment opportunities. The platform also provides job and internship matching, resume-building support, progress tracking, and multilingual accessibility to ensure inclusivity for diverse rural communities.
                    </p>
                    <p>
                      By bridging the gap between rural talent and industry requirements, the project promotes digital empowerment, environmental sustainability, and economic growth while helping individuals build successful careers and contribute to the development of their communities.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Left Arrow */}
        <button 
          onClick={prevSlide}
          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/40 hover:bg-primary text-white rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-110 shadow-xl"
        >
          <ChevronLeft size={36} />
        </button>

        {/* Right Arrow */}
        <button 
          onClick={nextSlide}
          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/40 hover:bg-primary text-white rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-110 shadow-xl"
        >
          <ChevronRight size={36} />
        </button>

        {/* Bottom Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {slides.map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-10 bg-primary' : 'w-3 bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>

      </section>

      <Footer />
    </motion.div>
  );
};

export default About;
