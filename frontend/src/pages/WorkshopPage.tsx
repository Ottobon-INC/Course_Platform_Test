import React from 'react';
import OfferingsNavbar from '@/components/layout/OfferingsNavbar';
import Footer from '@/components/layout/Footer';
import WorkshopGroupImage from '@/assets/workshop-group.jpg';

const CharacteristicCard: React.FC<{ title: string; text: string }> = ({ title, text }) => (
    <div className="p-8 bg-white border border-[#90AEAD]/20 rounded-xl hover:border-[#E64833]/30 transition-colors shadow-sm">
        <h3 className="text-lg font-bold text-[#244855] mb-3">{title}</h3>
        <p className="text-[#244855]/70 text-sm leading-relaxed">{text}</p>
    </div>
);

const FormatItem: React.FC<{ type: string; title: string; description: string }> = ({ type, title, description }) => (
    <div className="flex flex-col md:flex-row md:items-center gap-6 p-8 bg-white border border-[#90AEAD]/20 rounded-2xl shadow-sm hover:shadow-md transition-all group">
        <div className="w-16 h-16 shrink-0 bg-[#FBE9D0]/50 border border-[#90AEAD]/20 rounded-xl flex items-center justify-center text-xl font-black text-[#E64833] group-hover:scale-110 transition-transform">
            {type}
        </div>
        <div>
            <h4 className="text-lg font-bold text-[#244855] mb-1">{title}</h4>
            <p className="text-[#244855]/70 text-sm">{description}</p>
        </div>
    </div>
);

const WorkshopPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = React.useState("");

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

    const filteredCharacteristics = characteristics.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFormats = formats.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const hasResults = filteredCharacteristics.length > 0 || filteredFormats.length > 0;

    return (
        <div className="animate-fadeIn min-h-screen bg-[#FBE9D0]/30">
            <OfferingsNavbar />
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
                                Workshops at Ottobon are intensive, hands-on sessions focused on a specific skill, tool, or real-world problem. These sessions are designed for rapid learning and immediate application.
                            </p>
                            <p className="text-[#244855]/80 text-lg md:text-xl leading-relaxed">
                                The emphasis is on active participation rather than theory, helping learners gain clarity, confidence, and practical exposure in a short time.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative max-w-xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-[#244855]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search workshop topics or formats..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#90AEAD]/30 bg-white focus:border-[#E64833] focus:ring-4 focus:ring-[#E64833]/10 transition-all font-medium text-[#244855] placeholder-[#244855]/40 shadow-sm"
                            />
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

                {hasResults ? (
                    <>
                        {/* Workshop Characteristics */}
                        {filteredCharacteristics.length > 0 && (
                            <div className="mt-20">
                                <h2 className="text-2xl font-bold text-[#244855] mb-10">Workshop Characteristics</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {filteredCharacteristics.map((item, i) => (
                                        <CharacteristicCard key={i} title={item.title} text={item.text} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Workshop Formats */}
                        {filteredFormats.length > 0 && (
                            <div className="mt-24 pt-12 border-t border-[#244855]/10">
                                <h2 className="text-2xl font-bold text-[#244855] mb-10">Formats</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {filteredFormats.map((item, i) => (
                                        <FormatItem
                                            key={i}
                                            type={item.type}
                                            title={item.title}
                                            description={item.description}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mt-20 py-12 text-center text-[#244855]/60">
                        No workshops matching "{searchQuery}" found.
                    </div>
                )}

                {/* Footer CTA */}
                <div className="mt-24 p-12 text-center bg-white border border-[#244855]/10 rounded-3xl shadow-sm">
                    <h3 className="text-2xl font-bold text-[#244855] mb-4">Interested in a custom session?</h3>
                    <p className="text-[#244855]/70 mb-8 max-w-xl mx-auto">We provide tailored workshop formats for teams and organizations looking for targeted skill upgrades.</p>
                    <button className="bg-[#244855] text-white px-8 py-4 rounded-lg font-bold hover:bg-[#1A3340] transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1">
                        Inquire for Enterprise
                    </button>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default WorkshopPage;
