import { SuccessStepProps } from '@/types/registration'

const SuccessStep = ({ studentData }: SuccessStepProps) => {
    return (
        <div className="animate-fadeIn">
            <div className="card max-w-2xl mx-auto text-center">
                {/* Success Icon */}
                <div className="mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl animate-bounce-slow">
                        <svg
                            className="w-12 h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                </div>

                {/* Success Message */}
                {studentData.programType === 'cohort' ? (
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Assessment Submitted Successfully!
                    </h2>
                ) : (
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Registration Completed Successfully!
                    </h2>
                )}

                {studentData.programType === 'cohort' ? (
                    <p className="text-lg text-gray-600 mb-8">
                        Thank you, <span className="font-semibold text-primary-700">{studentData.fullName}</span>, for completing the entrance assessment.
                    </p>
                ) : (
                    <p className="text-lg text-gray-600 mb-8">
                        Thank you, <span className="font-semibold text-primary-700">{studentData.fullName}</span>, for completing your registration.
                    </p>
                )}

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
                    {/* What Happens Next - Compact */}
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-primary-900 mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            What Happens Next?
                        </h3>
                        {studentData.programType === 'cohort' ? (
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                Thank you for registering! You will receive the cohort details, including the schedule and access link, on your registered email shortly.
                            </p>
                        ) : studentData.programType === 'workshop' ? (
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                Thank you for registering! You will receive the workshop details, including the schedule and access link, on your registered email shortly.
                            </p>
                        ) : (
                            <p className="text-sm text-gray-700">You'll receive enrollment instructions and next steps shortly.</p>
                        )}
                    </div>

                    {/* WhatsApp Community - Compact */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.698c1.005.572 1.903.882 3.037.883 3.182 0 5.768-2.587 5.769-5.766.001-3.181-2.584-5.767-5.998-5.764zm12 5.762c0 6.627-5.373 12-12 12S0 18.57 0 11.933 5.373-.067 12-.067s12 5.373 12 12zM12.031 2.378c-5.269 0-9.563 4.298-9.563 9.566 0 1.945.578 3.513 1.488 4.965l-1.575 5.747 5.922-1.554c1.378.75 2.581 1.15 4.312 1.151 5.27 0 9.565-4.298 9.565-8.995 0-5.267-4.295-9.565-9.565-9.565z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-green-800 mb-1">
                            Join our Community
                        </h3>
                        <p className="text-xs text-gray-600 mb-3">
                            Get updates & connect with peers!
                        </p>
                        <a
                            href="https://whatsapp.com/channel/0029Vb7tcNALtOjIc4utTp14"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full text-sm transition-all transform hover:scale-105 shadow-sm flex items-center gap-1"
                        >
                            Join WhatsApp
                        </a>
                    </div>
                </div>

                {/* Registration Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 text-left">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Registration Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
                        <div className="flex flex-col border-b border-gray-100 pb-2">
                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Course</span>
                            <span className="font-bold text-gray-800">{studentData.specificCourse}</span>
                        </div>
                        <div className="flex flex-col border-b border-gray-100 pb-2">
                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Program Type</span>
                            <span className="font-bold text-gray-800 capitalize tracking-wide">{studentData.programType}</span>
                        </div>
                        {studentData.programType === 'workshop' && studentData.plan && (
                            <div className="flex flex-col border-b border-gray-100 pb-2">
                                <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Selected Plan</span>
                                <span className="font-bold text-orange-600">₹{studentData.plan}</span>
                            </div>
                        )}
                        <div className="flex flex-col border-b border-gray-100 pb-2">
                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Registered Email</span>
                            <span className="font-medium text-gray-600 truncate">{studentData.email}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="text-xs text-gray-500 mt-2">
                    <p><strong>Tip:</strong> Check your spam folder if you don't see our email.</p>
                </div>



            </div>
        </div>
    )
}

export default SuccessStep


