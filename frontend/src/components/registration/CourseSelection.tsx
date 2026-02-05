import { useLocation } from 'wouter'

interface CourseSelectionProps {
    onSelect: (type: 'cohort' | 'ondemand' | 'workshop') => void
}

const CourseSelection = ({ onSelect }: CourseSelectionProps) => {
    const [, setLocation] = useLocation()

    const handleSelect = (type: 'cohort' | 'ondemand' | 'workshop') => {
        onSelect(type)
        setLocation(`/registration/${type}`)
    }

    return (
        <div className="animate-fadeIn">
            <div className="card max-w-2xl mx-auto">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Select Your Program
                    </h2>
                    <p className="text-gray-600">
                        Choose the learning path that best fits your goals
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Cohort Option */}
                    <div
                        className="p-6 rounded-xl border-2 cursor-pointer transition-all border-gray-200 bg-white hover:border-indigo-600 hover:bg-indigo-50 group"
                        onClick={() => handleSelect('cohort')}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-900">Cohort Program</h3>
                                <p className="text-sm text-gray-500 group-hover:text-indigo-700">Live sessions, mentorship, and peer learning.</p>
                            </div>
                            <div className="text-gray-400 group-hover:text-indigo-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* On-Demand Option */}
                    <div
                        className="p-6 rounded-xl border-2 transition-all cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 grayscale"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-gray-500">On-Demand Learning</h3>
                                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
                                </div>
                                <p className="text-sm text-gray-400">Learn at your own pace with recorded content.</p>
                            </div>
                        </div>
                    </div>

                    {/* Workshop Option */}
                    <div
                        className="p-6 rounded-xl border-2 cursor-pointer transition-all border-gray-200 bg-white hover:border-indigo-600 hover:bg-indigo-50 group"
                        onClick={() => handleSelect('workshop')}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-900">Workshop</h3>
                                <p className="text-sm text-gray-500 group-hover:text-indigo-700">Intensive short-term learning sessions.</p>
                            </div>
                            <div className="text-gray-400 group-hover:text-indigo-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CourseSelection


