import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

export const CoursePromoCard: React.FC<{ index?: number, relatedTags?: string[] }> = ({ index = 0, relatedTags = [] }) => {
  const [, setLocation] = useLocation();

  // Dynamically determine where to send the user based on the article's tags
  const lowercaseTags = relatedTags.map(t => t.toLowerCase());
  let targetLink = '/our-courses/on-demand'; // Default route
  if (lowercaseTags.some(tag => tag.includes('cohort'))) {
    targetLink = '/our-courses/cohort';
  } else if (lowercaseTags.some(tag => tag.includes('workshop'))) {
    targetLink = '/our-courses/workshops';
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 3) * 0.1 }}
      whileHover={{ y: -8 }}
      className="bg-retro-salmon rounded-[2rem] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-4 border-retro-salmon/20 group flex flex-col h-full relative"
    >
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#ffb7aa] rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none" />
      
      <div className="p-8 flex flex-col flex-1 relative z-10 text-white">
        <div className="flex items-center gap-2 mb-6">
          <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm flex items-center gap-1.5 shadow-sm border border-white/10">
            <Sparkles size={12} className="text-[#ffe0d1]" />
            Featured Courses
          </span>
        </div>
        
        <h3 className="text-3xl font-extrabold mb-4 leading-[1.15] tracking-tight">
          Master the Skills Behind the Stories
        </h3>
        
        <p className="text-white/90 mb-8 line-clamp-4 text-base leading-relaxed flex-1 font-medium">
          Ready to turn these insights into action? Enroll in our top-rated courses and learn directly from industry experts. Unlock your potential today.
        </p>
        
        <div className="pt-6 border-t border-white/10 mt-auto">
           <button 
             onClick={(e) => {
               e.stopPropagation();
               setLocation(targetLink); // Direct to dynamically determined route
             }}
             className="bg-white text-retro-salmon w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:gap-3 transition-all shadow-md active:scale-95 group/btn border border-white/50"
           >
             Explore Courses <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
           </button>
           <p className="text-center text-[10px] text-white/60 mt-4 font-bold uppercase tracking-widest">
             Level Up Your Career
           </p>
        </div>
      </div>
    </motion.div>
  );
};
