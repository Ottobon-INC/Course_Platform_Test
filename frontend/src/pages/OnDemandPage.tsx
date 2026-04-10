import React from 'react';
import { useLocation } from 'wouter';
import { buildApiUrl } from '@/lib/api';
import OfferingsNavbar from '@/components/layout/OfferingsNavbar';
import Footer from '@/components/layout/Footer';
import OnDemandHeroImage from '@/assets/ondemand-hero.png';

interface OnDemandOfferingCourseApi {
    courseId: string;
    slug?: string | null;
    courseName?: string | null;
    description?: string | null;
    durationMinutes?: number | null;
    thumbnailUrl?: string | null;
}

interface OnDemandOfferingApi {
    offeringId: string;
    title?: string | null;
    description?: string | null;
    isActive: boolean;
    course?: OnDemandOfferingCourseApi | null;
}

interface OnDemandOfferingsResponse {
    offerings?: OnDemandOfferingApi[];
}

interface OnDemandCourseCard {
    id: string;
    title: string;
    description: string;
    duration: string;
    image: string;
    url: string;
}

const FALLBACK_ONDEMAND_IMAGES = [
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
    "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
    "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
];

const trimOrNull = (value?: string | null): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const formatDuration = (durationMinutes?: number | null): string => {
    if (typeof durationMinutes !== "number" || durationMinutes <= 0) return "Self-paced";

    const minsInWeek = 7 * 24 * 60;
    const minsInDay = 24 * 60;

    if (durationMinutes >= minsInWeek) {
        const weeks = Math.max(1, Math.round(durationMinutes / minsInWeek));
        return `${weeks} Week${weeks === 1 ? "" : "s"}`;
    }

    if (durationMinutes >= minsInDay) {
        const days = Math.max(1, Math.round(durationMinutes / minsInDay));
        return `${days} Day${days === 1 ? "" : "s"}`;
    }

    if (durationMinutes >= 60) {
        const hours = Math.max(1, Math.round(durationMinutes / 60));
        return `${hours} Hour${hours === 1 ? "" : "s"}`;
    }

    return `${durationMinutes} Mins`;
};

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

const OnDemandPage: React.FC = () => {
    // Auth state handled in App.tsx now
    const [, setLocation] = useLocation();
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedDuration, setSelectedDuration] = React.useState("All");
    const [courses, setCourses] = React.useState<OnDemandCourseCard[]>([]);
    const [coursesLoading, setCoursesLoading] = React.useState(true);
    const [coursesError, setCoursesError] = React.useState<string | null>(null);

    const highlights = [
        "Short-duration courses (approximately 2 weeks)",
        "Personalized learning paths based on learner profiles",
        "Simulation-based practice and exercises",
        "AI tutor support for doubt clarification",
        "Certificate issued upon completion"
    ];

    React.useEffect(() => {
        let mounted = true;

        const loadOnDemandCourses = async () => {
            setCoursesLoading(true);
            setCoursesError(null);

            try {
                const res = await fetch(buildApiUrl("/api/registrations/offerings?programType=ondemand"));
                if (!res.ok) {
                    throw new Error(`Failed to load on-demand offerings (${res.status})`);
                }

                const payload = (await res.json()) as OnDemandOfferingsResponse;
                const offerings = payload.offerings ?? [];

                const mapped: OnDemandCourseCard[] = offerings
                    .filter((offering) => offering.isActive && offering.course?.courseId)
                    .map((offering, index) => {
                        const course = offering.course as OnDemandOfferingCourseApi;
                        const title = trimOrNull(offering.title) ?? trimOrNull(course.courseName) ?? "On-Demand Course";
                        const description =
                            trimOrNull(offering.description) ??
                            trimOrNull(course.description) ??
                            "Self-paced learning experience with guided outcomes.";
                        const routeKey = trimOrNull(course.slug) ?? course.courseId;

                        return {
                            id: offering.offeringId,
                            title,
                            description,
                            duration: formatDuration(course.durationMinutes),
                            image: trimOrNull(course.thumbnailUrl) ?? FALLBACK_ONDEMAND_IMAGES[index % FALLBACK_ONDEMAND_IMAGES.length],
                            url: `/ondemand/${encodeURIComponent(routeKey)}/learn/intro`,
                        };
                    });

                if (!mounted) return;
                setCourses(mapped);
            } catch (error) {
                if (!mounted) return;
                const message = error instanceof Error ? error.message : "Unable to load on-demand courses.";
                setCourses([]);
                setCoursesError(message);
            } finally {
                if (mounted) {
                    setCoursesLoading(false);
                }
            }
        };

        void loadOnDemandCourses();
        return () => {
            mounted = false;
        };
    }, []);

    const durationOptions = React.useMemo(
        () => Array.from(new Set(courses.map((course) => course.duration))).sort((a, b) => a.localeCompare(b)),
        [courses],
    );

    React.useEffect(() => {
        if (selectedDuration !== "All" && !durationOptions.includes(selectedDuration)) {
            setSelectedDuration("All");
        }
    }, [durationOptions, selectedDuration]);

    const filteredCourses = courses.filter(course =>
        (selectedDuration === "All" || course.duration === selectedDuration) &&
        (course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="animate-fadeIn min-h-screen bg-[#FBE9D0]/30 pt-[72px]">
            <OfferingsNavbar
                sections={[
                    { id: 'overview', label: 'Overview' },
                    { id: 'available-courses', label: 'Courses' }
                ]}
            />
            {/* Hero Section */}
            <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    <div className="flex-1 max-w-3xl">
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

                        <div className="mt-8">
                            <button
                                onClick={() => document.getElementById('available-courses')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-6 py-3 bg-transparent border-2 border-[#244855] text-[#244855] font-bold rounded-full hover:bg-[#244855] hover:text-white transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm"
                            >
                                View All Courses
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 hidden lg:block relative">
                        <img
                            src={OnDemandHeroImage}
                            alt="On-Demand Learning"
                            className="w-full h-auto max-w-md mx-auto object-cover rounded-3xl shadow-xl hover:opacity-100 transition-all duration-700"
                        />
                    </div>
                </div>

                {/* Key Highlights Grid */}
                <div className="mt-20">
                    <h2 className="text-2xl font-bold text-[#244855] mb-10">What You’ll Experience</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {highlights.map((item, i) => (
                            <HighlightItem key={i} text={item} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Available Courses */}
            <section id="available-courses" className="bg-slate-50 py-32 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                        <h2 className="text-2xl font-bold text-[#244855]">Available Courses</h2>

                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            {/* Duration Dropdown */}
                            <div className="relative min-w-[180px]">
                                <select
                                    value={selectedDuration}
                                    onChange={(e) => setSelectedDuration(e.target.value)}
                                    className="appearance-none w-full pl-4 pr-10 py-2 rounded-lg border border-[#90AEAD]/30 bg-white focus:border-[#E64833] focus:ring-2 focus:ring-[#E64833]/10 transition-all text-sm font-medium text-[#244855] shadow-sm cursor-pointer"
                                >
                                    <option value="All">All Durations</option>
                                    {durationOptions.map((duration) => (
                                        <option key={duration} value={duration}>
                                            {duration}
                                        </option>
                                    ))}
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
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#90AEAD]/30 bg-white focus:border-[#E64833] focus:ring-2 focus:ring-[#E64833]/10 transition-all text-sm font-medium text-[#244855] placeholder-[#244855]/40"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {coursesLoading ? (
                            <div className="col-span-full py-12 text-center text-[#244855]/60">
                                Loading available on-demand courses...
                            </div>
                        ) : coursesError ? (
                            <div className="col-span-full py-12 text-center text-[#244855]/60">
                                {coursesError}
                            </div>
                        ) : filteredCourses.length > 0 ? (
                            filteredCourses.map((course) => (
                                <div key={course.id} className="group bg-white rounded-[1.5rem] border border-[#90AEAD]/20 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-[transform,shadow] duration-300 flex flex-col h-full ring-1 ring-[#90AEAD]/10 overflow-hidden transform-gpu">

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
                                            <button
                                                onClick={() => setLocation(course.url)}
                                                className="w-fit px-6 py-2.5 bg-[#E64833] hover:bg-[#D53F2B] text-white text-xs font-bold rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                            >
                                                Start Learning
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-[#244855]/60">
                                {searchQuery ? `No courses found matching "${searchQuery}".` : "No active on-demand offerings found."}
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
