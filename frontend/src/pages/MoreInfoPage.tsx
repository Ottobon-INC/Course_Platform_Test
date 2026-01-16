import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
    GraduationCap,
    Award,
    Map as MapIcon,
    MessageCircleQuestion,
    Headphones,
    CreditCard,
    FileText,
    ArrowLeft,
    CheckCircle,
    X,
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import certificateHero from '@/Certificate.png';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Define the content structure for each topic
const TOPICS: Record<string, {
    title: string;
    icon: React.ElementType;
    description: string;
    details: React.ReactNode;
}> = {
    'learning-experience': {
        title: 'Learning Experience',
        icon: GraduationCap,
        description: 'Our programs are designed to bring the elite engineering classroom to you.',
        details: (
            <div className="space-y-6">
                <p className="text-lg text-gray-700">
                    At Ottolearn, we believe in active, hands-on learning. Our platform isn't just about watching videos; it's about doing.
                    You will engage with real-world codebases, solve complex engineering problems, and receive instant feedback from our AI tutor.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-retro-teal mb-2">Interactive Labs</h4>
                        <p className="text-sm text-gray-600">Write and test code directly in your browser with pre-configured environments.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-retro-teal mb-2">AI-Driven Feedback</h4>
                        <p className="text-sm text-gray-600">Get personalized hits and explanations instantly when you get stuck.</p>
                    </div>
                </div>
            </div>
        )
    },
    'programs-certification': {
        title: 'Programs & Certification',
        icon: Award,
        description: 'Validate your skills with industry-recognized certificates.',
        details: (
            null // Replaced by custom component render logic
        )
    },
    'learning-pathways': {
        title: 'Learning Pathways',
        icon: MapIcon,
        description: 'Curated paths tailored to specific engineering roles.',
        details: (
            <div className="space-y-6">
                <p className="text-lg text-gray-700">
                    Not sure where to start? Our Learning Pathways guide you from beginner to expert in specific domains like Full Stack Development, AI Engineering, and DevOps.
                </p>
                <div className="bg-retro-sage/10 p-6 rounded-xl mt-6">
                    <h4 className="font-bold text-retro-teal mb-2">Customizable Tracks</h4>
                    <p className="text-gray-700">We assess your current skill level and tailor the curriculum so you don't waste time learning what you already know.</p>
                </div>
            </div>
        )
    },
    'faq': {
        title: 'Frequently Asked Questions',
        icon: MessageCircleQuestion,
        description: 'Answers to common questions about admissions and grading.',
        details: (
            <div className="space-y-4">
                {[
                    { q: "How do I apply?", a: "Simply create an account and select your desired cohort. Applications are reviewed on a rolling basis." },
                    { q: "What is the time commitment?", a: "Expect to spend 10-15 hours per week for our intensive cohorts." },
                    { q: "Is financial aid available?", a: "Yes, we offer scholarships for eligible students." }
                ].map((item, i) => (
                    <div key={i} className="border-b border-gray-100 pb-4">
                        <h5 className="font-bold text-retro-teal mb-1">{item.q}</h5>
                        <p className="text-gray-600 text-sm">{item.a}</p>
                    </div>
                ))}
            </div>
        )
    },
    'learner-support': {
        title: 'Learner Support',
        icon: Headphones,
        description: 'Technical and academic assistance whenever you need it.',
        details: (
            <div>
                <p className="text-lg text-gray-700 mb-6">
                    We ensure you never learn alone. Our multi-tiered support system creates a safety net for your education.
                </p>
                <div className="grid gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white shadow-sm rounded-lg">
                        <div className="w-10 h-10 bg-retro-teal/10 rounded-full flex items-center justify-center text-retro-teal font-bold">1</div>
                        <div>
                            <h4 className="font-bold">AI Co-Pilot</h4>
                            <p className="text-xs text-gray-500">24/7 Instant code debugging and logic help.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white shadow-sm rounded-lg">
                        <div className="w-10 h-10 bg-retro-salmon/10 rounded-full flex items-center justify-center text-retro-salmon font-bold">2</div>
                        <div>
                            <h4 className="font-bold">Human Mentors</h4>
                            <p className="text-xs text-gray-500">Weekly office hours and code reviews.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    'payments': {
        title: 'Payments & Enrollment',
        icon: CreditCard,
        description: 'Financial aid, payment plans, and deadlines.',
        details: (
            <div className="space-y-6">
                <p className="text-gray-700">We strive to make elite education accessible. We offer flexible payment plans (pay-in-3) and merit-based scholarships.</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <p className="font-bold text-yellow-800">Next Application Deadline</p>
                    <p className="text-sm text-yellow-700">Applications for the Summer Cohort close on August 15th.</p>
                </div>
            </div>
        )
    },
    'policies': {
        title: 'Policies & Guidelines',
        icon: FileText,
        description: 'Academic integrity and code of conduct.',
        details: (
            <div className="space-y-4">
                <p className="text-gray-700">Our community is built on trust and respect. All students are expected to adhere to our Code of Conduct.</p>
                <a href="#" className="flex items-center gap-2 text-retro-teal font-bold hover:underline">
                    <FileText size={16} /> Download Student Handbook (PDF)
                </a>
            </div>
        )
    }
};

const CertificationSection = () => {
    const ref = React.useRef<HTMLDivElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div ref={ref} className="space-y-8 relative">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                onClick={() => setIsModalOpen(true)}
                className="cursor-pointer group relative rounded-xl overflow-hidden shadow-2xl border border-retro-sage/20"
            >
                <div className="transform group-hover:scale-[1.02] transition-transform duration-500">
                    <img src={certificateHero} alt="Certificate of Completion" className="w-full h-auto" />

                </div>
            </motion.div>

            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-retro-teal mb-4">Your Success, <span className="text-retro-yellow">Certified.</span></h2>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        Upon successful course completion and assessment, learners receive a verified certificate from Ottobon.
                        These credentials are designed to showcase your mastery of specific engineering skills to potential employers.
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors">
                            <X size={28} />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={certificateHero}
                            alt="Certificate Full View"
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border-4 border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MoreInfoPage: React.FC = () => {
    const [topic, setTopic] = useState<string | null>(null);
    const [, setLocation] = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const topicParam = searchParams.get('topic');
        setTopic(topicParam);
        if (topicParam) window.scrollTo(0, 0);
    }, [window.location.search]);

    const handleTopicClick = (key: string) => {
        const newUrl = `/more-info?topic=${key}`;
        window.history.pushState(null, '', newUrl);
        setTopic(key);
        window.scrollTo(0, 0);
    };

    const clearTopic = () => {
        window.history.pushState(null, '', '/more-info');
        setTopic(null);
        window.scrollTo(0, 0);
    };

    const CurrentTopicData = topic ? TOPICS[topic] : null;

    return (
        <div className="min-h-screen bg-retro-bg flex flex-col font-sans">
            <Navbar onApplyTutor={() => setLocation('/become-a-tutor')} />

            <main className="flex-grow pt-[80px]">
                {/* Dynamic Content Rendering */}
                {topic && CurrentTopicData ? (
                    <section className="py-12 md:py-16 bg-white min-h-[500px] animate-in slide-in-from-bottom-8 duration-500">
                        <div className="container mx-auto px-6 max-w-4xl">
                            {/* Navigation & Header for Topic */}
                            <div className="mb-8">
                                <button
                                    onClick={clearTopic}
                                    className="mb-6 flex items-center gap-2 text-sm font-bold text-retro-teal/60 hover:text-retro-salmon transition-colors"
                                >
                                    <ArrowLeft size={16} /> Back to Overview
                                </button>
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-retro-teal/5 rounded-full flex items-center justify-center shrink-0">
                                        {React.createElement(CurrentTopicData.icon, { size: 32, className: "text-retro-teal" })}
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-retro-teal">
                                        {CurrentTopicData.title}
                                    </h1>
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="prose prose-lg max-w-none text-center md:text-left mt-8">
                                {topic === 'programs-certification' ? <CertificationSection /> : CurrentTopicData.details}
                            </div>

                            {/* Footer for content */}

                        </div>
                    </section>
                ) : (
                    /* Default Dashboard View */
                    <>
                        {/* Section 1: How the Platform Works */}
                        <section className="py-16 md:py-20 bg-white">
                            <div className="container mx-auto px-6 max-w-7xl">
                                {/* Section Header */}
                                <div className="flex items-center justify-center gap-4 mb-16">
                                    <div className="h-px bg-[#E6AF2E] w-12 md:w-20"></div>
                                    <h2 className="text-xl md:text-2xl font-bold text-[#244855] tracking-wider uppercase">
                                        HOW THE PLATFORM WORKS
                                    </h2>
                                    <div className="h-px bg-[#E6AF2E] w-12 md:w-20"></div>
                                </div>

                                {/* Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                                    {[
                                        { id: 'learning-experience', icon: GraduationCap, title: 'Learning Experience', text: 'Active learning with AI-driven feedback.' },
                                        { id: 'programs-certification', icon: Award, title: 'Programs & Certification', text: 'Industry-recognized certificates.' },
                                        { id: 'learning-pathways', icon: MapIcon, title: 'Learning Pathways', text: 'Curated paths tailored to roles.' }
                                    ].map((card) => (
                                        <div
                                            key={card.id}
                                            onClick={() => handleTopicClick(card.id)}
                                            className="flex flex-col items-center group cursor-pointer"
                                        >
                                            <div className="mb-6 p-4 rounded-2xl bg-gray-50 group-hover:bg-[#A2D2C9]/20 transition-colors duration-300">
                                                <card.icon size={40} strokeWidth={1.5} className="text-[#244855]" />
                                            </div>
                                            <h3 className="text-lg font-bold text-[#E64833] mb-3 group-hover:text-[#244855] transition-colors">
                                                {card.title}
                                            </h3>
                                            <p className="text-[#244855]/70 text-sm leading-relaxed max-w-sm">
                                                {card.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Need Assistance? */}
                        <section className="py-16 md:py-20 bg-gray-50/50">
                            <div className="container mx-auto px-6 max-w-4xl">
                                {/* Section Header */}
                                <div className="flex items-center justify-center gap-4 mb-16">
                                    <div className="h-px bg-[#E6AF2E] w-12 md:w-20"></div>
                                    <h2 className="text-xl md:text-2xl font-bold text-[#244855] tracking-wider uppercase">
                                        NEED ASSISTANCE?
                                    </h2>
                                    <div className="h-px bg-[#E6AF2E] w-12 md:w-20"></div>
                                </div>

                                {/* Cards Grid (2x2) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 text-center">
                                    {[
                                        { id: 'faq', icon: MessageCircleQuestion, title: 'Frequently Asked Questions', text: 'Get answers quickly.' },
                                        { id: 'learner-support', icon: Headphones, title: 'Learner Support', text: 'Technical and academic help.' },
                                        { id: 'payments', icon: CreditCard, title: 'Enrollment', text: 'Financial aid and plans.' },
                                        { id: 'policies', icon: FileText, title: 'Policies & Guidelines', text: 'Academic details.' }
                                    ].map((card) => (
                                        <div
                                            key={card.id}
                                            onClick={() => handleTopicClick(card.id)}
                                            className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform duration-300"
                                        >
                                            <div className="mb-4">
                                                <card.icon size={32} strokeWidth={1.5} className="text-[#244855]" />
                                            </div>
                                            <h3 className="text-base font-bold text-[#E64833] mb-2 uppercase tracking-wide">
                                                {card.title}
                                            </h3>
                                            <p className="text-[#244855]/70 text-xs md:text-sm leading-relaxed max-w-xs">
                                                {card.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default MoreInfoPage;
