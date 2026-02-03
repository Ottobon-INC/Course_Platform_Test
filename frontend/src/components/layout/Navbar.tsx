import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { ChevronRight, LogOut, Menu, User, X } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfile {
    fullName?: string;
    email?: string;
    picture?: string;
}

interface NavbarProps {
    onLogin?: () => void;
    onApplyTutor?: () => void;
    isAuthenticated?: boolean;
    user?: UserProfile;
    onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
    onLogin = () => { },
    onApplyTutor = () => { },
    isAuthenticated = false,
    user,
    onLogout = () => { }
}) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [location, setLocation] = useLocation();

    // Check if we are on the tutor page to conditionally hide elements
    const isTutorPage = location === '/become-a-tutor';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        } else {
            setLocation(`/#${id}`);
            if (window.location.pathname !== '/') {
                window.location.href = `/#${id}`;
            }
        }
    };

    return (
        <motion.nav
            className={`fixed top-0 left-0 right-0 z-50 bg-retro-bg/95 backdrop-blur-md shadow-sm py-3 transition-colors duration-300`}
            initial={{ y: 0 }}
            animate={{ y: 0 }}
        >
            <div className="w-full px-6 md:px-12 flex justify-between items-center">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation('/')}>
                    <div className="w-9 h-9 bg-retro-sage rounded-lg transform rotate-45 shadow-lg shadow-retro-sage/50 shrink-0 flex items-center justify-center">
                        <span className="-rotate-45 text-white font-bold text-xs">OL</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-2xl text-retro-teal tracking-tighter leading-none">Ottolearn</span>
                        <span className="text-[10px] text-retro-salmon font-bold uppercase tracking-wider mt-0.5">
                            Inspired by Harvard Method of Teaching
                        </span>
                    </div>
                </div>

                {!isTutorPage && (
                    <div className="hidden md:flex gap-8 font-medium text-retro-teal/80 items-center">
                        <button
                            onClick={() => setLocation('/our-courses/cohort')}
                            className={`transition-colors ${window.location.pathname.startsWith('/our-courses') ? 'text-retro-salmon font-bold' : 'hover:text-retro-salmon'}`}
                        >
                            Our Courses
                        </button>
                        <button
                            onClick={() => setLocation('/methodology')}
                            className={`transition-colors ${window.location.pathname === '/methodology' ? 'text-retro-salmon font-bold' : 'hover:text-retro-salmon'}`}
                        >
                            Methodology
                        </button>

                        <button
                            onClick={() => setLocation('/more-info')}
                            className={`transition-colors ${window.location.pathname.startsWith('/more-info') ? 'text-retro-salmon font-bold' : 'hover:text-retro-salmon'}`}
                        >
                            About
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    {!isTutorPage && (
                        <button
                            onClick={onApplyTutor}
                            className="hidden md:inline-flex bg-white text-retro-teal border-2 border-retro-teal px-6 py-2 rounded-full font-medium hover:bg-retro-teal hover:text-white transition-all hover:shadow-lg hover:scale-105 active:scale-95 duration-200"
                        >
                            Apply as Tutor
                        </button>
                    )}
                    {isAuthenticated && user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="hidden md:flex group items-center gap-3 rounded-full border border-retro-sage/60 bg-white/90 px-3 py-1.5 text-left text-sm font-medium text-retro-teal shadow-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-retro-salmon/40"
                                >
                                    <Avatar className="h-9 w-9 bg-retro-sage">
                                        {user.picture ? (
                                            <AvatarImage
                                                src={user.picture}
                                                alt={user.fullName ?? 'User'}
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <AvatarFallback className="text-sm font-semibold text-retro-teal">
                                                {(user.fullName ?? user.email ?? 'U')
                                                    .split(' ')
                                                    .map((p) => p[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="hidden sm:flex min-w-0 flex-col leading-tight text-left">
                                        <span className="text-xs text-retro-teal/70">Signed in</span>
                                        <span className="truncate text-sm font-semibold text-retro-teal max-w-[150px]">
                                            {user.fullName ?? user.email}
                                        </span>
                                    </div>
                                    <span className="sm:hidden text-sm font-semibold text-retro-teal">
                                        {(user.fullName ?? user.email ?? 'User').split(' ')[0]}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-retro-teal/70 transition-transform group-data-[state=open]:rotate-90" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-semibold leading-none text-foreground">
                                            {user.fullName ?? 'Learner'}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="flex items-center gap-2 cursor-pointer"
                                    onSelect={() => setLocation('/student-dashboard')}
                                >
                                    <User className="h-4 w-4" />
                                    My Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                                    onSelect={onLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        !isTutorPage && (
                            <button
                                type="button"
                                onClick={onLogin}
                                className="hidden md:flex w-full max-w-[350px] items-center justify-center rounded-full border border-retro-salmon bg-retro-salmon px-6 py-2 text-base font-bold text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-md hover:bg-[#d23a25] focus:outline-none focus-visible:ring-2 focus-visible:ring-retro-salmon sm:w-auto">
                                Login / Signup
                            </button>
                        )
                    )}
                    <button
                        className="md:hidden inline-flex items-center justify-center rounded-full border border-retro-teal/30 p-2 text-retro-teal bg-white/80 shadow-sm"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        aria-label="Toggle navigation"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden px-6 pt-3 pb-6"
                    >
                        <div className="flex flex-col gap-3 rounded-2xl border border-retro-sage/30 bg-white/90 p-4 shadow-lg">
                            {!isTutorPage && (
                                <>
                                    <button
                                        onClick={() => {
                                            setLocation('/methodology');
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full text-left font-semibold text-retro-teal hover:text-retro-salmon transition"
                                    >
                                        Methodology
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLocation('/our-courses/cohort');
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full text-left font-semibold text-retro-teal hover:text-retro-salmon transition"
                                    >
                                        Our Courses
                                    </button>
                                    {['Cohort Program', 'OnDemand Courses', 'Workshops'].map((item, idx) => {
                                        const paths = ['/our-courses/cohort', '/our-courses/on-demand', '/our-courses/workshops'];
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setLocation(paths[idx]);
                                                    setMobileMenuOpen(false);
                                                }}
                                                className="w-full text-left font-semibold text-retro-teal hover:text-retro-salmon transition ml-2 text-sm"
                                            >
                                                - {item}
                                            </button>
                                        );
                                    })}
                                </>
                            )}
                            {!isTutorPage && (
                                <button
                                    onClick={onApplyTutor}
                                    className="w-full mt-2 text-center bg-retro-teal text-white py-2 rounded-lg font-bold"
                                >
                                    Apply as Tutor
                                </button>
                            )}
                            {!isAuthenticated && !isTutorPage && (
                                <button
                                    onClick={onLogin}
                                    className="w-full text-center border border-retro-salmon bg-retro-salmon text-white py-2 rounded-lg font-bold hover:bg-[#d23a25] transition"
                                >
                                    Login / Signup
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
