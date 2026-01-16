import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Users, MessageSquare, Sparkles, CheckCircle, Bot, LifeBuoy } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useLocation } from 'wouter';

// --- Types & Data ---

interface Step {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}

const steps: Step[] = [
    {
        icon: <Users size={28} className="text-white" />,
        title: "Flexible Learning Formats",
        description: "Our platform offers multiple learning formats designed to match different goals, schedules, and learning preferences.",
        color: "bg-retro-teal"
    },
    {
        icon: <MessageSquare size={28} className="text-white" />,
        title: "Collaborative Peer Learning",
        description: "Engage with fellow learners through structured collaboration and knowledge sharing.",
        color: "bg-retro-salmon"
    },
    {
        icon: <Sparkles size={28} className="text-white" />,
        title: "Persona-Driven Personalization",
        description: "Switch between narration styles without losing progress so explanations always match how you process information.",
        color: "bg-retro-brown"
    },
    {
        icon: <CheckCircle size={28} className="text-white" />,
        title: "Assessment-Driven Progression",
        description: "Modules unlock only after you prove mastery through verified assessments, ensuring real comprehension before moving on.",
        color: "bg-retro-sage"
    },
    {
        icon: <Bot size={28} className="text-white" />,
        title: "AI Learning Assistant",
        description: "A course-trained AI companion delivers context-aware guidance inside every module without breaking the lesson flow.",
        color: "bg-retro-teal"
    },
    {
        icon: <LifeBuoy size={28} className="text-white" />,
        title: "Human-in-the-Loop Mentorship",
        description: "Senior mentors monitor telemetry, intervene when needed, and give the human feedback AI alone can’t provide.",
        color: "bg-retro-salmon"
    }
];

// --- Sub-components ---

const TimelineItem: React.FC<{ step: Step; index: number }> = ({ step, index }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isEven = index % 2 === 0;

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 70%", "center 50%"]
    });

    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div ref={ref} className={`relative flex items-center md:justify-between ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} pl-12 md:pl-0`}>
            {/* Content Card */}
            <div className={`w-full md:w-[35%] bg-white p-8 rounded-3xl shadow-lg border border-retro-sage/20 relative group hover:shadow-2xl transition-all duration-300`}>
                {/* Connector Line Container - Static Gray Line (Background) */}
                <div className={`hidden md:block absolute top-1/2 -mt-0.5 h-1 bg-retro-sage/30 ${isEven ? '-right-[50%] w-[50%]' : '-left-[50%] w-[50%]'}`}></div>
                {/* Animated Connector Line */}
                <motion.div
                    className={`hidden md:block absolute top-1/2 -mt-0.5 h-1 bg-retro-salmon ${isEven ? '-right-[50%] w-[50%] origin-left' : '-left-[50%] w-[50%] origin-right'}`}
                    style={{ scaleX }}
                ></motion.div>
                <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-md`}>
                    {step.icon}
                </div>
                <h3 className="text-2xl font-bold text-retro-teal mb-3">{step.title}</h3>
                <p className="text-retro-teal/70 leading-relaxed text-lg">{step.description}</p>
            </div>
            {/* Center Node */}
            <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-8 h-8 bg-retro-bg border-4 border-retro-sage/30 rounded-full z-20 flex items-center justify-center">
                <div className="w-3 h-3 bg-retro-salmon rounded-full" />
            </div>
            <div className="hidden md:block w-[35%]"></div>
        </div>
    );
};

// --- Page Component ---

const MethodologyPage: React.FC = () => {
    const [location, setLocation] = useLocation();
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start center", "end center"]
    });

    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Since Navbar is in App.tsx now, we just structure the page content
    // But wait, the user instructions implied standard page layout.
    // We need spacing for fixed Navbar.

    return (
        <div className="min-h-screen bg-retro-bg animate-fadeIn">
            <Navbar onApplyTutor={() => setLocation('/become-a-tutor')} />
            <div className="pt-[72px]" /> {/* Spacer for fixed Navbar */}

            <section ref={ref} className="py-20 relative overflow-hidden">
                {/* Section Header */}
                <div className="container mx-auto px-6 max-w-5xl mb-24 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-bold text-retro-teal mb-6">The Ottolearn Method</h1>
                        <p className="text-xl md:text-2xl text-retro-teal/70 max-w-3xl mx-auto mb-8 leading-relaxed">
                            We don't just sell courses. We guarantee mastery through a scientifically backed, AI-enhanced learning journey designed to make knowledge stick.
                        </p>
                        <div className="inline-block px-6 py-2 rounded-full bg-white border border-retro-sage/30 shadow-sm">
                            <p className="text-sm font-bold text-retro-teal uppercase tracking-wider">
                                Inspired by the Harvard Method of Teaching
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Tree Container */}
                <div className="container mx-auto max-w-7xl px-6 relative">
                    {/* Central Line */}
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 md:-ml-0.5 h-full z-0 bg-gray-200">
                        <motion.div
                            className="w-full bg-retro-salmon origin-top"
                            style={{ scaleY, height: "100%" }}
                        />
                    </div>

                    {/* Steps */}
                    <div className="space-y-24 relative z-10">
                        {steps.map((step, index) => (
                            <TimelineItem key={index} step={step} index={index} />
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="container mx-auto px-6 text-center mt-32">
                    <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-retro-sage/20 max-w-4xl mx-auto">
                        <h3 className="text-3xl font-bold text-retro-teal mb-6">Ready to experience this yourself?</h3>
                        <p className="text-lg text-retro-teal/70 mb-8 max-w-2xl mx-auto">
                            Join thousands of learners who have transformed their careers with our methodology.
                        </p>


                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default MethodologyPage;
