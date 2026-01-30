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
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start">
                                    <svg className="w-4 h-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Team reviews responses</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-4 h-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Email in 3-5 business days</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-4 h-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>If selected, enrollment info sent</span>
                                </li>
                            </ul>
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
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            Join WhatsApp
                        </a>
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


