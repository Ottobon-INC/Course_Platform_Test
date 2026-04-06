import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Rocket, ChevronRight } from 'lucide-react';
import contentData from '@/content.json';

const { whoIsItFor } = contentData;

// Icon map — icons stay in code, not JSON (they are React elements)
const ICON_MAP = [
  <Sparkles className="text-retro-yellow w-8 h-8" />,
  <Brain className="text-retro-cyan w-8 h-8" />,
  <Rocket className="text-retro-salmon w-8 h-8" />,
];

const STYLE_MAP = [
  {
    accent: 'border-retro-yellow/50',
    glow: 'shadow-[0_0_30px_rgba(230,175,46,0.3)]',
    pulseColor: 'text-retro-yellow',
    bgColor: 'bg-retro-bg',
  },
  {
    accent: 'border-retro-cyan/50',
    glow: 'shadow-[0_0_30px_rgba(36,72,85,0.3)]',
    pulseColor: 'text-retro-cyan',
    bgColor: 'bg-retro-bg',
  },
  {
    accent: 'border-retro-salmon/50',
    glow: 'shadow-[0_0_30px_rgba(230,72,51,0.3)]',
    pulseColor: 'text-retro-salmon',
    bgColor: 'bg-retro-bg',
  },
];

interface WhoIsItForProps {
  badge?: string;
  heading?: string;
  subheading?: string;
  cards?: Array<{
    id: number;
    title: string;
    short: string;
    desc: string;
    message: string;
  }>;
}

export const WhoIsItForSection: React.FC<WhoIsItForProps> = ({
  badge = whoIsItFor.badge,
  heading = whoIsItFor.heading,
  subheading = whoIsItFor.subheading,
  cards = whoIsItFor.cards,
}) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <section id="audience" className="relative py-20 bg-white overflow-hidden">
      {/* Background Motion Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] md:w-[40%] aspect-square rounded-full bg-retro-yellow/5 blur-[100px] opacity-60"
        />
        <motion.div
          animate={{
            rotate: [360, 270, 180, 90, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] md:w-[50%] aspect-square rounded-full bg-retro-salmon/5 blur-[100px] opacity-60"
        />
      </div>

      {/* Dim Overlay when active */}
      <AnimatePresence>
        {activeCard !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[5] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center mb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-5 py-2 bg-retro-bg rounded-full border border-retro-sage/20 mb-6 shadow-sm"
          >
            <span className="text-sm font-bold text-retro-teal uppercase tracking-widest flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-retro-salmon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-retro-salmon"></span>
              </span>
              {badge}
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-retro-teal mb-6 break-words">{heading}</h2>
          <p className="text-xl text-retro-teal/70 max-w-2xl mx-auto break-words">{subheading}</p>
        </div>

        {/* Cards Container */}
        <div
          className="flex flex-col md:flex-row gap-6 md:gap-4 items-stretch justify-center w-full mb-8 pb-8 md:pb-0"
        >
          {cards.map((card, idx) => {
            const style = STYLE_MAP[idx] ?? STYLE_MAP[0];
            const icon = ICON_MAP[idx] ?? ICON_MAP[0];
            const isHovered = hoveredCard === idx;
            const isActive = activeCard === idx;
            const isOtherHovered = hoveredCard !== null && hoveredCard !== idx;
            const isOtherActive = activeCard !== null && activeCard !== idx;

            const isFocused = isActive || (isHovered && activeCard === null);
            const isDiminished = (isOtherHovered && activeCard === null) || isOtherActive;

            return (
              <motion.div
                key={card.id}
                layout
                onClick={() => setActiveCard(isActive ? null : idx)}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  layout: { type: "spring", stiffness: 300, damping: 25 },
                  opacity: { duration: 0.3 }
                }}
                className={`
                  relative cursor-pointer flex flex-col justify-between overflow-hidden rounded-3xl border
                  transition-all duration-300 ease-out z-10
                  ${isActive ? style.glow : 'shadow-md md:shadow-lg hover:shadow-xl'}
                  ${style.bgColor}
                  ${isActive ? style.accent : 'border-retro-sage/20 hover:border-retro-sage/50'}
                  w-full md:w-auto
                `}
                animate={{
                  flex: isFocused ? "2 1 0%" : "1 1 0%",
                  scale: isDiminished ? 0.98 : isActive ? 1.02 : 1,
                  opacity: isDiminished ? 0.7 : 1,
                  y: isFocused ? -8 : 0,
                  zIndex: isFocused ? 20 : 10
                }}
              >
                <div className="p-6 md:p-8 flex flex-col h-full relative w-full">
                  <div className="flex items-start justify-between mb-4 md:mb-6 gap-4">
                    <motion.div
                      layout
                      className={`
                        w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0
                        bg-white shadow-md border border-retro-sage/10 transition-transform duration-300
                        ${isFocused ? 'scale-110' : 'scale-100'}
                      `}
                    >
                      <motion.div
                        animate={
                          isFocused && card.id === 1 ? { rotate: [0, 45, -15, 15, 0], scale: [1, 1.2, 1] } :
                          isFocused && card.id === 2 ? { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] } :
                          isFocused && card.id === 3 ? { y: [0, -6, 0], x: [0, 4, 0] } :
                          {}
                        }
                        transition={{ duration: 1.5, repeat: isFocused ? Infinity : 0, repeatDelay: 1 }}
                      >
                        {icon}
                      </motion.div>
                    </motion.div>

                    <AnimatePresence>
                      {(!isFocused) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-retro-sage/50 mt-4 md:hidden"
                        >
                          <ChevronRight size={20} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.div layout className="flex flex-col flex-1 justify-start md:justify-end">
                    <motion.h3
                      layout="position"
                      className="text-xl md:text-2xl font-bold text-retro-teal mb-2 md:mb-3 break-words"
                    >
                      {card.title}
                    </motion.h3>

                    <AnimatePresence mode="wait">
                      {(!isFocused) && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-retro-teal/60 font-medium text-sm md:text-base line-clamp-2 md:line-clamp-none overflow-hidden break-words"
                        >
                          {card.short}
                        </motion.p>
                      )}

                      {isFocused && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-retro-teal/80 leading-relaxed overflow-hidden text-sm md:text-base mt-2 md:mt-0 break-words"
                        >
                          <div className="space-y-1">
                            {card.desc.split('. ').map((sentence, sIdx, arr) => (
                               <motion.span
                                  key={sIdx}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 + (sIdx * 0.1), duration: 0.4 }}
                                  className="block"
                               >
                                  {sentence}{sIdx !== arr.length - 1 ? '.' : ''}
                               </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic Message for Selected Card */}
        <div className="min-h-[4rem] flex items-center justify-center relative z-20 px-4">
          <AnimatePresence mode="wait">
            {activeCard !== null && (
              <motion.div
                key={activeCard}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="bg-white border rounded-full px-6 md:px-8 py-3 md:py-4 shadow-xl border-retro-sage/20 mx-auto inline-flex items-center gap-3 md:gap-4 max-w-[90vw]"
              >
                <span className="flex h-3 w-3 md:h-4 md:w-4 relative shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    activeCard === 0 ? 'bg-retro-yellow' : activeCard === 1 ? 'bg-retro-cyan' : 'bg-retro-salmon'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 ${
                    activeCard === 0 ? 'bg-retro-yellow' : activeCard === 1 ? 'bg-retro-cyan' : 'bg-retro-salmon'
                  }`}></span>
                </span>
                <span className="font-bold text-retro-teal text-xs md:text-base text-center md:text-left break-words">
                  {cards[activeCard]?.message ?? ''}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
