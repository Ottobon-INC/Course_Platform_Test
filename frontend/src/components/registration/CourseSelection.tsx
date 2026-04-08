import { useLocation } from 'wouter'
import { useState, useEffect } from 'react'
import { fetchActiveProgramTypes } from '@/lib/registrationApi'

interface CourseSelectionProps {
    onSelect: (type: 'cohort' | 'ondemand' | 'workshop') => void
}

const CourseSelection = ({ onSelect }: CourseSelectionProps) => {
    const [, setLocation] = useLocation()
    const [activeTypes, setActiveTypes] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const { activeTypes } = await fetchActiveProgramTypes()
                setActiveTypes(activeTypes)
            } catch (e) {
                console.error('Failed to load active types:', e)
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [])

    const handleSelect = (type: 'cohort' | 'ondemand' | 'workshop') => {
        onSelect(type)
        setLocation(`/registration/${type}`)
    }

    const isAvailable = (type: string) => activeTypes.includes(type)

    return (
        <div className="animate-fadeIn pb-12">
            <div className="max-w-5xl mx-auto">
                <div className="mb-12 text-center">
                    <span className="inline-block px-4 py-1.5 mb-4 text-xs font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full border border-indigo-100">
                        Choose Your Path
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                        Elevate Your Skills.
                    </h2>
                    <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium">
                        Select a program designed to take you from fundamentals to mastery in record time.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Cohort Card */}
                    {isAvailable('cohort') ? (
                        <div
                            className="group relative h-full flex flex-col p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 border-gray-100 bg-white hover:border-indigo-600 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] hover:-translate-y-2"
                            onClick={() => handleSelect('cohort')}
                        >
                            <div className="mb-8 w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-2xl font-black text-gray-900">Career Cohort</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-indigo-500 rounded-md uppercase tracking-tighter">Live</span>
                                </div>
                                <p className="text-gray-500 font-medium leading-relaxed mb-6">
                                    Experience intensive live mentorship, peer collaboration, and guided projects to build your tech career.
                                </p>
                                
                                <ul className="space-y-3 mb-8">
                                    {[ '1-on-1 Mentorship', 'Live Practice', 'Elite Community' ].map((feat) => (
                                        <li key={feat} className="flex items-center text-sm text-gray-600 font-bold italic">
                                            <svg className="w-4 h-4 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-indigo-600 font-black text-sm group-hover:translate-x-1 transition-transform">
                                <span>Get Started</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative h-full flex flex-col p-8 rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 opacity-80 cursor-default grayscale transition-all">
                             <div className="mb-8 w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-gray-400">Career Cohort</h3>
                                <p className="text-gray-400 font-medium leading-relaxed mb-6 mt-3">
                                    Experience intensive live mentorship, peer collaboration, and guided projects to build your tech career.
                                </p>
                            </div>
                            <div className="pt-6 border-t border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-widest">
                                Coming Soon
                            </div>
                        </div>
                    )}

                    {/* Workshop Card */}
                    {isAvailable('workshop') ? (
                        <div
                            className="group relative h-full flex flex-col p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 border-gray-100 bg-white hover:border-rose-500 hover:shadow-[0_20px_50px_rgba(244,63,94,0.1)] hover:-translate-y-2"
                            onClick={() => handleSelect('workshop')}
                        >
                            <div className="mb-8 w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-2xl font-black text-gray-900">Workshops</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-rose-500 rounded-md uppercase tracking-tighter">Fast-Track</span>
                                </div>
                                <p className="text-gray-500 font-medium leading-relaxed mb-6">
                                    Master a specific high-demand skill in just a few days through intensive, focused training sessions.
                                </p>
                                
                                <ul className="space-y-3 mb-8">
                                    {[ 'Skill-Based Training', 'Industry Experts', 'Certificate issued' ].map((feat) => (
                                        <li key={feat} className="flex items-center text-sm text-gray-600 font-bold italic">
                                            <svg className="w-4 h-4 mr-2 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-rose-500 font-black text-sm group-hover:translate-x-1 transition-transform">
                                <span>Explore Sessions</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative h-full flex flex-col p-8 rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 opacity-80 cursor-default grayscale transition-all">
                             <div className="mb-8 w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-gray-400">Workshops</h3>
                                <p className="text-gray-400 font-medium leading-relaxed mb-6 mt-3">
                                    Master a specific high-demand skill in just a few days through intensive, focused training sessions.
                                </p>
                            </div>
                            <div className="pt-6 border-t border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-widest">
                                Coming Soon
                            </div>
                        </div>
                    )}

                    {/* On-Demand Card */}
                    {isAvailable('ondemand') ? (
                        <div
                            className="group relative h-full flex flex-col p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 border-gray-100 bg-white hover:border-emerald-600 hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] hover:-translate-y-2"
                            onClick={() => handleSelect('ondemand')}
                        >
                            <div className="mb-8 w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-2xl font-black text-gray-900">On-Demand</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-emerald-500 rounded-md uppercase tracking-tighter">Self-Paced</span>
                                </div>
                                <p className="text-gray-500 font-medium leading-relaxed mb-6">
                                    Learn on your own schedule with lifetime access to high-quality recorded sessions and resources.
                                </p>
                                
                                <ul className="space-y-3 mb-8">
                                    {[ 'Lifetime Access', 'Self-Paced Learning', 'Community Support' ].map((feat) => (
                                        <li key={feat} className="flex items-center text-sm text-gray-600 font-bold italic">
                                            <svg className="w-4 h-4 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-emerald-600 font-black text-sm group-hover:translate-x-1 transition-transform">
                                <span>Get Access</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative h-full flex flex-col p-8 rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 opacity-80 cursor-default grayscale transition-all">
                            <div className="mb-8 w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-2xl font-black text-gray-400">On-Demand</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold text-gray-400 bg-gray-200 rounded-md uppercase tracking-tighter">Coming Soon</span>
                                </div>
                                <p className="text-gray-400 font-medium leading-relaxed mb-6">
                                    Learn on your own schedule with lifetime access to high-quality recorded sessions and resources.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-widest">
                                Join the waitlist
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CourseSelection


