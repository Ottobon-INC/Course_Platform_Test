import React from 'react';
import { useLocation } from "wouter";
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';

const OfferingsNavbar: React.FC<{ sections?: { id: string; label: string }[] }> = ({ sections = [] }) => {
    const [location, setLocation] = useLocation();
    const [activeSection, setActiveSection] = React.useState<string>("");

    React.useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 100; // Offset for navbar height

            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (
                        scrollPosition >= offsetTop &&
                        scrollPosition < offsetTop + offsetHeight
                    ) {
                        setActiveSection(section.id);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [sections]);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const navbarHeight = 80; // Approximate height of sticky + global nav overlap
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - navbarHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    const getLinkClass = (id: string) => {
        return activeSection === id
            ? "text-sm font-bold text-black border-b-2 border-black px-4 py-2 transition-all cursor-pointer"
            : "text-sm font-medium text-slate-500 hover:text-black px-4 py-2 transition-all cursor-pointer";
    };

    return (
        <nav className="sticky top-[60px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 py-2 shadow-sm transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
                <div className="flex items-center gap-6 md:gap-8 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setLocation('/our-courses/cohort')}
                        className={`text-sm md:text-base font-semibold py-2 border-b-2 transition-all ${location === '/our-courses/cohort' ? 'text-retro-teal border-retro-teal' : 'text-gray-500 border-transparent hover:text-retro-teal/70'}`}
                    >
                        Cohort Program
                    </button>
                    <button
                        onClick={() => setLocation('/our-courses/on-demand')}
                        className={`text-sm md:text-base font-semibold py-2 border-b-2 transition-all ${location === '/our-courses/on-demand' ? 'text-retro-teal border-retro-teal' : 'text-gray-500 border-transparent hover:text-retro-teal/70'}`}
                    >
                        On-Demand
                    </button>
                    <button
                        onClick={() => setLocation('/our-courses/workshops')}
                        className={`text-sm md:text-base font-semibold py-2 border-b-2 transition-all ${location === '/our-courses/workshops' ? 'text-retro-teal border-retro-teal' : 'text-gray-500 border-transparent hover:text-retro-teal/70'}`}
                    >
                        Workshops
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default OfferingsNavbar;
