import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Rocket, ChevronRight } from 'lucide-react';
import contentData from '@/content.json';

const { whoIsItFor } = contentData;

/**
 * Senior Frontend Architect Implementation:
 * Fixed Grid, Stable Layout, Top-Down Expansion
 */

const ICON_MAP = [
    <Sparkles className="text-retro-yellow w-6 h-6 md:w-8 md:h-8" />,
    <Brain className="text-retro-cyan w-6 h-6 md:w-8 md:h-8" />,
    <Rocket className="text-retro-salmon w-6 h-6 md:w-8 md:h-8" />,
];

const STYLE_MAP = [
    {
        accent: 'border-retro-yellow/30',
        glow: 'shadow-[0_0_30px_rgba(230,175,46,0.15)]',
        bgColor: 'bg-white',
    },
    {
        accent: 'border-retro-cyan/30',
        glow: 'shadow-[0_0_30px_rgba(36,72,85,0.15)]',
        bgColor: 'bg-white',
    },
    {
        accent: 'border-retro-salmon/30',
        glow: 'shadow-[0_0_30px_rgba(230,72,51,0.15)]',
        bgColor: 'bg-white',
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
    const [activeCard, setActiveCard] = useState<number | null>(null);

    return (
        <section id="audience" className="relative py-16 md:py-24 bg-retro-bg/30 overflow-hidden">
            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                {/* Header Section */}
                <div className="text-center mb-12 md:mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1.5 bg-white rounded-full border border-retro-sage/20 mb-4 shadow-sm"
                    >
                        <span className="text-[10px] md:text-xs font-bold text-retro-teal uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-retro-salmon opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-retro-salmon"></span>
                            </span>
                            {badge}
                        </span>
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl font-bold text-retro-teal mb-4 tracking-tight break-words">{heading}</h2>
                    <p className="text-base md:text-xl text-retro-teal/60 max-w-2xl mx-auto leading-relaxed break-words">{subheading}</p>
                </div>

                {/* Grid Container: Structural Fix Step 1 & 8 */}
                {/* 1 col on mobile, 2 on tablet (md), 3 on desktop (lg) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start w-full mb-12">
                    {cards.map((card, idx) => {
                        const style = STYLE_MAP[idx] ?? STYLE_MAP[0];
                        const icon = ICON_MAP[idx] ?? ICON_MAP[0];
                        const isActive = activeCard === idx;

                        return (
                            <motion.div
                                key={card.id}
                                layout
                                onMouseEnter={() => setActiveCard(idx)}
                                onMouseLeave={() => setActiveCard(null)}
                                onClick={() => setActiveCard(isActive ? null : idx)}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    layout: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } // Custom cubic-bezier for smoother feel
                                }}
                                className={`
                                    relative cursor-pointer flex flex-col p-6 lg:p-8 rounded-[2rem] border overflow-hidden
                                    transition-all duration-500 group
                                    ${isActive ? `bg-white ${style.glow} ${style.accent}` : 'bg-white/60 border-retro-sage/10 hover:border-retro-sage/30 hover:bg-white'}
                                    w-full h-auto min-h-[220px]
                                `}
                            >
                                {/* Header Section: Structural Fix Step 2 */}
                                <div className="flex flex-col gap-4 md:gap-6 shrink-0 relative z-10 text-left">
                                    <div className={`
                                        w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0
                                        bg-retro-bg border border-retro-sage/10 transition-all duration-500
                                        ${isActive ? 'scale-110 shadow-lg' : 'scale-100 group-hover:scale-105 shadow-sm'}
                                    `}>
                                        {icon}
                                    </div>
                                    <h3 className={`text-xl md:text-2xl font-bold text-retro-teal leading-tight tracking-tight break-words transition-colors ${isActive ? 'text-retro-salmon' : ''}`}>
                                        {card.title}
                                    </h3>
                                </div>

                                {/* Body Section: Structural Fix Step 3 & 4 */}
                                <div className="mt-4 flex flex-col gap-4 text-left">
                                    <p className="text-sm md:text-base text-retro-teal/70 leading-relaxed break-words font-medium">
                                        {card.short}
                                    </p>

                                    <AnimatePresence mode="wait">
                                        {isActive && (
                                            <motion.div
                                                key="content"
                                                initial={{ opacity: 0, height: 0, y: 10 }}
                                                animate={{ 
                                                    opacity: 1, 
                                                    height: 'auto', 
                                                    y: 0,
                                                    transition: { 
                                                        height: { duration: 0.5, ease: "easeInOut" },
                                                        opacity: { duration: 0.4, delay: 0.2 },
                                                        y: { duration: 0.4, delay: 0.2 }
                                                    } 
                                                }}
                                                exit={{ opacity: 0, height: 0, y: 10, transition: { duration: 0.3 } }}
                                                className="overflow-hidden"
                                            >
                                                {/* Divider Step 3 */}
                                                <div className="border-t border-retro-sage/10 pt-4 mt-2 space-y-4">
                                                    <div className="max-w-prose space-y-3">
                                                       {card.desc.split('. ').map((sentence, sIdx) => {
                                                            if (!sentence.trim()) return null;
                                                            return (
                                                                <p key={sIdx} className="text-sm md:text-base text-retro-teal/80 leading-relaxed break-words">
                                                                    {sentence}{sentence.endsWith('.') ? '' : '.'}
                                                                </p>
                                                            );
                                                       })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Mobile Interaction Hint */}
                                {!isActive && (
                                    <div className="mt-6 md:hidden flex items-center gap-2 text-retro-teal/30 font-bold text-[10px] uppercase tracking-widest pt-2">
                                        Click to expand <ChevronRight size={14} />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer Insight Area: Structural Fix Step 9 */}
                <AnimatePresence mode="wait">
                    {activeCard !== null && (
                        <motion.div
                            key={activeCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-3xl mx-auto"
                        >
                            <div className="bg-white border border-retro-sage/20 rounded-2xl p-4 md:p-6 shadow-xl flex items-start gap-4">
                                <div className={`shrink-0 w-2 h-2 md:w-3 md:h-3 rounded-full mt-1.5 md:mt-2 ${
                                    activeCard === 0 ? 'bg-retro-yellow' : activeCard === 1 ? 'bg-retro-cyan' : 'bg-retro-salmon'
                                } shadow-[0_0_12px_rgba(36,72,85,0.4)] animate-pulse`} />
                                <p className="text-xs md:text-sm font-bold text-retro-teal leading-relaxed break-words italic opacity-80">
                                    "{cards[activeCard]?.message ?? ''}"
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};
