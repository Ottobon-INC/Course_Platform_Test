import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Zap, Target } from 'lucide-react';
import { useLocation } from 'wouter';

export const SlideInPromo: React.FC<{ relatedTags?: string[] }> = ({ relatedTags = [] }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [, setLocation] = useLocation();

  // Dynamically determine where to send the user based on the article's tags
  const lowercaseTags = relatedTags.map(t => t.toLowerCase());
  let targetLink = '/our-courses/on-demand'; // Default route
  if (lowercaseTags.some(tag => tag.includes('cohort'))) {
    targetLink = '/our-courses/cohort';
  } else if (lowercaseTags.some(tag => tag.includes('workshop'))) {
    targetLink = '/our-courses/workshops';
  }

  useEffect(() => {
    if (hasDismissed) return;

    const handleScroll = () => {
      // Show after user scrolls down a bit (engagement signal)
      if (window.scrollY > 400) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasDismissed(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 w-[calc(100%-3rem)] md:w-96 bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-retro-sage/20 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-retro-teal text-white p-4 flex items-center justify-between relative overflow-hidden">
             <div className="absolute -right-4 -top-4 w-24 h-24 bg-retro-salmon rounded-full blur-[20px] opacity-70" />
             <div className="flex items-center gap-2 relative z-10">
               <div className="bg-white/10 p-1.5 rounded-full backdrop-blur-sm border border-white/20">
                 <Zap size={14} className="text-[#ffdfd9]" fill="currentColor" />
               </div>
               <h4 className="font-bold text-xs uppercase tracking-widest text-[#f8f9fa]">Level Up Now</h4>
             </div>
             <button 
               onClick={handleDismiss}
               className="relative z-10 text-white/50 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-all"
             >
               <X size={16} />
             </button>
          </div>
          
          {/* Body */}
          <div className="p-7 relative overflow-hidden bg-[#FDFCFB]">
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-retro-sage/5 rounded-full blur-[20px]" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <Target size={20} className="text-retro-salmon" />
                <h3 className="text-2xl font-black text-retro-teal tracking-tight hover:text-retro-salmon transition-colors">Dive Deeper!</h3>
              </div>
              <p className="text-retro-teal/60 text-[15px] mb-6 leading-relaxed font-medium">
                Enjoying this article? Turn theory into practice with our immersive courses. Build real-world skills today.
              </p>
              
              <button 
                onClick={() => setLocation(targetLink)}
                className="w-full bg-retro-salmon text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#ff8f80] hover:-translate-y-1 hover:shadow-xl hover:shadow-retro-salmon/20 transition-all active:scale-95 group"
              >
                Browse Course Catalog <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
              
              <div className="flex items-center justify-center gap-2 mt-4 opacity-70">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-5 h-5 rounded-full bg-retro-teal/10 border border-white" />
                  ))}
                </div>
                <p className="text-[10px] text-retro-teal font-bold uppercase tracking-widest">
                  Join 10,000+ Students
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
