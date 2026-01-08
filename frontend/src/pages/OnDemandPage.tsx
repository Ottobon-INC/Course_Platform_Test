import React from 'react';
import OfferingsNavbar from '@/components/layout/OfferingsNavbar';
import Footer from '@/components/layout/Footer';



const HighlightItem: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative overflow-hidden flex items-start gap-4 p-6 bg-white border border-[#EAEAEA] rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-[1.02]">
        {/* Shine Effect */}
        <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-slate-100 to-transparent transform -skew-x-12 transition-all duration-1000 ease-in-out group-hover:left-[100%] z-0" />

        <div className="mt-1 relative z-10">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <span className="text-[#244855] font-medium text-base relative z-10">{text}</span>
    </div>
);

const CourseCard: React.FC<{ title: string; description: string; duration: string }> = ({ title, description, duration }) => (
    <div className="p-8 border border-[#EAEAEA] rounded-xl flex flex-col h-full bg-white">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{duration}</div>
        <h3 className="text-xl font-bold text-[#1A1C2E] mb-3">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">{description}</p>
        <button className="text-[#1A1C2E] text-sm font-bold border-b border-[#1A1C2E] w-fit hover:text-slate-600 hover:border-slate-600 transition-colors">
            View Details
        </button>
    </div>
);

const OnDemandPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = React.useState("");

    const highlights = [
        "Short-duration courses (approximately 2 weeks)",
        "Personalized learning paths based on learner profiles",
        "Simulation-based practice and exercises",
        "AI tutor support for doubt clarification",
        "Certificate issued upon completion"
    ];

    const courses = [
        {
            title: "Python for Data Analysis",
            duration: "2 Weeks",
            description: "Master essential data manipulation and visualization techniques using Pandas, NumPy, and Matplotlib.",
            image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80"
        },
        {
            title: "AI Product Management",
            duration: "10 Days",
            description: "Learn the frameworks for defining, building, and launching AI-powered products in a competitive market.",
            image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80"
        },
        {
            title: "UI/UX for Developers",
            duration: "2 Weeks",
            description: "A practical guide to modern interface design principles and user experience research for software engineers.",
            image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80"
        },
        {
            title: "Advanced Prompt Engineering",
            duration: "1 Week",
            description: "Hone your ability to interact with LLMs through complex chains, agents, and multi-step reasoning patterns.",
            image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80"
        }
    ];

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-fadeIn min-h-screen bg-[#FBE9D0]/30">
            <OfferingsNavbar />
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="max-w-3xl">
                    <div className="text-sm font-bold text-[#E64833] uppercase tracking-widest mb-4">
                        Flexible · Personalized · AI-Driven
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[#244855] mb-8 leading-tight">
                        On-Demand Learning
                    </h1>
                    <div className="space-y-6">
                        <p className="text-[#244855]/80 text-lg md:text-xl leading-relaxed">
                            On-Demand Learning is designed for learners who need flexibility without losing direction. Courses are short, focused, and self-paced, allowing learners to study independently while still receiving structured guidance.
                        </p>
                        <p className="text-[#244855]/80 text-lg md:text-xl leading-relaxed">
                            Each course adapts to individual learning needs through AI-assisted explanations, practice simulations, and personalized learning paths. This format is ideal for building, revising, or strengthening specific skills without long-term commitments.
                        </p>
                    </div>
                </div>

                {/* Key Highlights Grid */}
                <div className="mt-20">
                    <h2 className="text-2xl font-bold text-[#244855] mb-10">Key Highlights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {highlights.map((item, i) => (
                            <HighlightItem key={i} text={item} />
                        ))}
                    </div>
                </div>

                {/* Available Courses */}
                <div className="mt-24 pt-12 border-t border-[#244855]/10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                        <h2 className="text-2xl font-bold text-[#244855]">Available Courses</h2>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-80">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-[#244855]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#90AEAD]/30 bg-white focus:border-[#E64833] focus:ring-2 focus:ring-[#E64833]/10 transition-all text-sm font-medium text-[#244855] placeholder-[#244855]/40"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map((course, i) => (
                                <div key={i} className="group bg-white rounded-[1.5rem] border border-[#90AEAD]/20 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-[transform,shadow] duration-300 flex flex-col h-full ring-1 ring-[#90AEAD]/10 overflow-hidden transform-gpu">

                                    {/* Top Half: Image Background with Title & Description */}
                                    <div className="relative h-[220px] flex-shrink-0 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent z-10" />
                                        <img
                                            src={course.image}
                                            alt={course.title}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        />

                                        {/* Content Overlay */}
                                        <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                                            <div className="mb-3">
                                                <span className="px-2.5 py-0.5 bg-[#244855]/5 backdrop-blur-md text-[9px] font-bold text-[#244855] uppercase tracking-wider rounded-md border border-[#244855]/10">
                                                    {course.duration}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold text-[#244855] mb-2 leading-tight">
                                                {course.title}
                                            </h3>

                                            <p className="text-[#244855]/70 text-xs leading-relaxed line-clamp-2">
                                                {course.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bottom Half: Action */}
                                    <div className="p-6 flex flex-col flex-grow bg-white">
                                        <div className="mt-auto flex items-center gap-4">
                                            <button className="w-fit px-6 py-2.5 bg-[#E64833] hover:bg-[#D53F2B] text-white text-xs font-bold rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                                                Start Learning
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </button>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                Coming Soon
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-[#244855]/60">
                                No courses found.
                            </div>
                        )}
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default OnDemandPage;
