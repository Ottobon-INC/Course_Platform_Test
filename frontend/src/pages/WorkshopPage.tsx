import React from 'react';
import OfferingsNavbar from '@/components/layout/OfferingsNavbar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WorkshopGroupImage from '@/assets/workshop-group.jpg';

const CharacteristicCard: React.FC<{ title: string; text: string }> = ({ title, text }) => (
    <div className="p-8 bg-white border border-[#90AEAD]/20 rounded-xl hover:border-[#E64833]/30 transition-colors shadow-sm">
        <h3 className="text-lg font-bold text-[#244855] mb-3">{title}</h3>
        <p className="text-[#244855]/70 text-sm leading-relaxed">{text}</p>
    </div>
);

const FormatItem: React.FC<{ type: string; title: string; description: string }> = ({ type, title, description }) => (
    <div className="flex flex-col md:flex-row md:items-center gap-4 p-5 bg-white border border-[#90AEAD]/20 rounded-2xl shadow-sm hover:shadow-md transition-all group">
        <div className="w-12 h-12 shrink-0 bg-[#FBE9D0]/50 border border-[#90AEAD]/20 rounded-xl flex items-center justify-center text-lg font-black text-[#E64833] group-hover:scale-110 transition-transform">
            {type}
        </div>
        <div>
            <h4 className="text-base font-bold text-[#244855] mb-1">{title}</h4>
            <p className="text-[#244855]/70 text-xs">{description}</p>
        </div>
    </div>
);


const EnterpriseInquiryModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the data to your backend
        // For now, we'll just close the modal and show an alert/toast
        const formData = new FormData(e.target as HTMLFormElement);
        console.log({
            name: formData.get('fullName'),
            mobile: formData.get('mobile'),
            email: formData.get('email'),
            reason: formData.get('reason')
        });
        alert("Thank you for your inquiry! We'll get back to you shortly.");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-fadeIn">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 className="text-2xl font-bold text-[#244855] mb-2">Enterprise Inquiry</h3>
                <p className="text-slate-500 text-sm mb-6">Tell us about your team's learning needs.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[#244855] uppercase tracking-wider mb-1">Full Name</label>
                        <input
                            name="fullName"
                            required
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#E64833] focus:ring-4 focus:ring-[#E64833]/10 outline-none transition-all placeholder:text-slate-400"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#244855] uppercase tracking-wider mb-1">Email Address</label>
                        <input
                            name="email"
                            required
                            type="email"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#E64833] focus:ring-4 focus:ring-[#E64833]/10 outline-none transition-all placeholder:text-slate-400"
                            placeholder="john@company.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#244855] uppercase tracking-wider mb-1">Mobile Number</label>
                        <input
                            name="mobile"
                            required
                            type="tel"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#E64833] focus:ring-4 focus:ring-[#E64833]/10 outline-none transition-all placeholder:text-slate-400"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#244855] uppercase tracking-wider mb-1">Reason for Inquiry</label>
                        <textarea
                            name="reason"
                            required
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#E64833] focus:ring-4 focus:ring-[#E64833]/10 outline-none transition-all placeholder:text-slate-400 resize-none"
                            placeholder="We are looking to upskill our frontend team..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#E64833] text-white py-4 rounded-xl font-bold hover:bg-[#d63d29] transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] mt-2"
                    >
                        Submit Inquiry
                    </button>
                </form>
            </div>
        </div>
    );
};

const WorkshopPage: React.FC = () => {
    // Auth state handled in App.tsx now

    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedDuration, setSelectedDuration] = React.useState("All");
    const [isInquiryOpen, setIsInquiryOpen] = React.useState(false);

    const characteristics = [
        { title: "Highly Focused", text: "Skill-specific sessions targeting professional bottlenecks." },
        { title: "Application-First", text: "Prioritizing hands-on execution over passive theoretical learning." },
        { title: "Real-World Scenarios", text: "Solving actual industry problems in a collaborative setting." },
        { title: "Tutor-Guided", text: "Direct supervision and execution support from experienced mentors." }
    ];

    const formats = [
        { type: "2H", title: "2-Hour Workshops", description: "Designed for concept clarity and guided practice to master specific workflows quickly." },
        { type: "8H", title: "8-Hour Workshops", description: "Intensive deep dives with extended hands-on execution and end-to-end project completion." }
    ];

    const upcomingWorkshops = [
        {
            title: "Rapid API Design & Testing",
            duration: "2H Workshop",
            image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80",
            description: "Learn to design, mock, and document RESTful APIs using Swagger and Postman in a live coding session."
        },
        {
            title: "Git Internals & Advanced Workflows",
            duration: "2H Workshop",
            image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
            description: "Master interactive rebase, cherry-picking, and fixing broken history. Stop fearing the command line."
        },
        {
            title: "Building Microservices with Docker",
            duration: "8H Workshop",
            image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
            description: "A full-day immersive workshop on containerizing applications, orchestration, and service communication."
        },
        {
            title: "System Design for Scale",
            duration: "8H Workshop",
            image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
            description: "Deep dive into load balancers, caching strategies, partitioning, and designing for high availability."
        }
    ];

    const filteredUpcomingWorkshops = upcomingWorkshops.filter(item =>
        (selectedDuration === "All" || item.duration === selectedDuration) &&
        (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="animate-fadeIn min-h-screen bg-[#FBE9D0]/30 pt-[72px]">

            <OfferingsNavbar
                sections={[
                    { id: 'overview', label: 'Overview' },
                    { id: 'workshop-experience', label: 'Experience' },
                    { id: 'upcoming-sessions', label: 'Upcoming Sessions' }
                ]}
            />
            {/* Hero Section */}
            <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    <div className="flex-1 max-w-3xl">
                        <div className="text-sm font-bold text-[#E64833] uppercase tracking-widest mb-4">
                            Short · Focused · Hands-On
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-[#244855] mb-8 leading-tight">
                            Workshops
                        </h1>
                        <div className="space-y-6 mb-12">
                            <p className="text-[#244855]/80 text-lg md:text-xl leading-relaxed">
                                Workshops are intensive, hands-on sessions focused on a specific skill, tool, or real-world problem. These sessions are designed for rapid learning and immediate application.
                            </p>
                            <p className="text-[#244855]/80 text-lg md:text-xl leading-relaxed">
                                The emphasis is on active participation rather than theory, helping learners gain clarity, confidence, and practical exposure in a short time.
                            </p>
                        </div>

                        {/* CTA Button */}
                        <div className="mt-8">
                            <button
                                onClick={() => document.getElementById('upcoming-sessions')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-6 py-3 bg-transparent border-2 border-[#244855] text-[#244855] font-bold rounded-full hover:bg-[#244855] hover:text-white transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm"
                            >
                                Explore Workshops
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="flex-1 hidden lg:block relative">
                        <img
                            src={WorkshopGroupImage}
                            alt="Workshop Session"
                            className="w-full h-auto max-w-md mx-auto object-cover rounded-3xl shadow-xl mix-blend-multiply opacity-95 hover:mix-blend-normal hover:opacity-100 transition-all duration-700"
                        />
                    </div>
                </div>

                <div id="workshop-experience" className="mt-20">
                    {/* Workshop Characteristics */}
                    <div className="mt-20">
                        <h2 className="text-2xl font-bold text-[#244855] mb-10">What You’ll Experience</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {characteristics.map((item, i) => (
                                <CharacteristicCard key={i} title={item.title} text={item.text} />
                            ))}
                        </div>
                    </div>

                    {/* Workshop Formats */}
                    <div className="mt-12 pt-8 border-t border-[#244855]/10">
                        <h2 className="text-xl font-bold text-[#244855] mb-6">Formats</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {formats.map((item, i) => (
                                <FormatItem
                                    key={i}
                                    type={item.type}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </div>
                    </div>

                </div>
            </section>

            <section id="upcoming-sessions" className="bg-slate-50 py-32 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                        <h2 className="text-2xl font-bold text-[#244855]">Upcoming Sessions</h2>

                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            {/* Duration Dropdown */}
                            <div className="relative min-w-[180px]">
                                <select
                                    value={selectedDuration}
                                    onChange={(e) => setSelectedDuration(e.target.value)}
                                    className="appearance-none w-full pl-4 pr-10 py-3 rounded-xl border border-[#90AEAD]/30 bg-white focus:border-[#E64833] focus:ring-4 focus:ring-[#E64833]/10 transition-all font-medium text-[#244855] shadow-sm cursor-pointer"
                                >
                                    <option value="All">All Durations</option>
                                    <option value="2H Workshop">2-Hour Workshops</option>
                                    <option value="8H Workshop">8-Hour Workshops</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#244855]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative w-full md:w-80">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-[#244855]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search sessions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#90AEAD]/30 bg-white focus:border-[#E64833] focus:ring-4 focus:ring-[#E64833]/10 transition-all font-medium text-[#244855] placeholder-[#244855]/40 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {filteredUpcomingWorkshops.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {filteredUpcomingWorkshops.map((workshop, i) => (
                                <div key={i} className="group bg-white rounded-[1.5rem] border border-[#90AEAD]/20 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-[transform,shadow] duration-300 flex flex-col h-full ring-1 ring-[#90AEAD]/10 overflow-hidden transform-gpu">
                                    {/* Image & Content */}
                                    <div className="relative h-[220px] flex-shrink-0 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent z-10" />
                                        <img
                                            src={workshop.image}
                                            alt={workshop.title}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                                            <div className="mb-3">
                                                <span className={`px-2.5 py-0.5 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider rounded-md border ${workshop.duration.includes('2H')
                                                    ? 'bg-blue-50/80 text-blue-700 border-blue-100'
                                                    : 'bg-orange-50/80 text-orange-700 border-orange-100'
                                                    }`}>
                                                    {workshop.duration}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-[#244855] mb-2 leading-tight">
                                                {workshop.title}
                                            </h3>
                                            <p className="text-[#244855]/70 text-xs leading-relaxed line-clamp-2">
                                                {workshop.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="p-6 flex flex-col flex-grow bg-white">
                                        <div className="mt-auto">
                                            <button disabled className="w-full px-6 py-3 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Coming Soon
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-[#244855]/60">
                            No sessions matching "{searchQuery}" found.
                        </div>
                    )}

                    {/* Footer CTA */}
                    <div className="mt-24 p-12 text-center bg-white border border-[#244855]/10 rounded-3xl shadow-sm">
                        <h3 className="text-2xl font-bold text-[#244855] mb-4">Interested in a custom session?</h3>
                        <p className="text-[#244855]/70 mb-8 max-w-xl mx-auto">We provide tailored workshop formats for teams and organizations looking for targeted skill upgrades.</p>
                        <button
                            onClick={() => setIsInquiryOpen(true)}
                            className="bg-[#244855] text-white px-8 py-4 rounded-lg font-bold hover:bg-[#1A3340] transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1"
                        >
                            Inquire for Enterprise
                        </button>
                    </div>
                </div>
            </section>

            <EnterpriseInquiryModal isOpen={isInquiryOpen} onClose={() => setIsInquiryOpen(false)} />

            <Footer />
        </div>
    );
};

export default WorkshopPage;
