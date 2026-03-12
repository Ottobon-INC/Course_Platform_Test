import { useState, useEffect, useRef } from 'react'
import { fetchAssessmentQuestions, submitRegistration } from '@/lib/registrationApi'
import { AssessmentStepProps, Question, Answer, FormErrors } from '@/types/registration'

const AssessmentStep = ({ onSubmit, studentData }: AssessmentStepProps) => {
    const [questions, setQuestions] = useState<any[]>([])
    const [answers, setAnswers] = useState<Answer>({})
    const [errors, setErrors] = useState<FormErrors>({})
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    // --- UI State (new, no logic changes) ---
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
    const [showIntro, setShowIntro] = useState(true)

    // Timer: Ref to store start time (initialized on mount)
    const startTimeRef = useRef<number>(Date.now())

    // Fetch questions from API on component mount
    useEffect(() => {
        startTimeRef.current = Date.now()

        const fetchQuestions = async (): Promise<void> => {
            try {
                if (!studentData?.offeringId) {
                    setErrors({ fetch: "Missing offering selection. Please go back and select a course." })
                    setIsLoading(false)
                    return
                }

                const programType = studentData.programType || 'cohort'
                const { questions: data } = await fetchAssessmentQuestions({
                    offeringId: studentData.offeringId,
                    programType,
                })

                if (!data || data.length === 0) {
                    setQuestions([])
                    setErrors({ fetch: "No assessment questions found for this program." })
                    setIsLoading(false)
                    return
                }

                const mcqs = data.filter((q: any) => q.questionType === 'mcq')
                const texts = data.filter((q: any) => q.questionType === 'text')

                const interleaved: Question[] = []
                let mcqIdx = 0
                let textIdx = 0

                while (mcqIdx < mcqs.length || textIdx < texts.length) {
                    for (let i = 0; i < 3 && mcqIdx < mcqs.length; i++) {
                        interleaved.push(mcqs[mcqIdx++])
                    }
                    for (let i = 0; i < 2 && textIdx < texts.length; i++) {
                        interleaved.push(texts[textIdx++])
                    }
                }

                setQuestions(interleaved)
                const initialAnswers: Answer = interleaved.reduce((acc, q: any) => ({ ...acc, [q.questionId]: '' }), {})
                setAnswers(initialAnswers)
            } catch (error) {
                console.error('Error fetching questions:', error)
                setErrors({ fetch: `Failed to load questions: ${(error as Error).message}` })
            } finally {
                setIsLoading(false)
            }
        }

        fetchQuestions()
    }, [studentData])

    const handleAnswerChange = (questionId: string, value: string): void => {
        setAnswers(prev => ({ ...prev, [questionId]: value }))
        if (errors[questionId]) {
            setErrors(prev => ({ ...prev, [questionId]: '' }))
        }
    }

    const validateAnswers = (): boolean => {
        const newErrors: FormErrors = {}
        questions.forEach((q: any) => {
            const answer = answers[q.questionId]?.trim()
            if (!answer) {
                newErrors[q.questionId] = 'This question requires an answer'
            }
        })
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()

        if (!validateAnswers()) {
            const firstErrorId = Object.keys(errors)[0]
            const element = document.getElementById(`ans_${firstErrorId}`)
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return
        }

        if (!studentData?.offeringId) {
            setErrors({ submit: 'System Error: Offering selection missing.' })
            return
        }

        setIsSubmitting(true)

        try {
            const now = Date.now()
            const start = startTimeRef.current
            let durationSeconds = Math.floor((now - start) / 1000)
            if (isNaN(durationSeconds) || durationSeconds < 0) durationSeconds = 0
            const isCollegeStudent = studentData.isCollegeStudent ?? true

            const payload = {
                offeringId: studentData.offeringId,
                fullName: studentData.fullName,
                email: studentData.email,
                phoneNumber: studentData.phoneNumber,
                isCollegeStudent,
                collegeName: isCollegeStudent ? studentData.collegeName : null,
                yearOfPassing: isCollegeStudent ? studentData.yearOfPassing : null,
                branch: isCollegeStudent ? studentData.branch : null,
                selectedSlot: studentData.selectedSlot || null,
                sessionTime: studentData.sessionTime || null,
                mode: studentData.mode || null,
                referredBy: studentData.referredBy || null,
                status: "assessed",
                answersJson: answers,
                questionsSnapshot: questions,
                assessmentSubmittedAt: new Date().toISOString(),
                durationSeconds,
                plan: studentData.plan || null,
            }

            await submitRegistration(payload)
            onSubmit(answers)
        } catch (error) {
            console.error('Submission error:', error)
            setErrors({ submit: `Error: ${(error as Error).message}` })
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const getAnsweredCount = (): number => Object.values(answers).filter(a => a.trim().length > 0).length

    // --- Navigation Handlers (UI only) ---
    const goToNext = () => {
        setSlideDirection('right')
        setCurrentQuestionIndex(prev => Math.min(prev + 1, questions.length - 1))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const goToPrev = () => {
        setSlideDirection('left')
        setCurrentQuestionIndex(prev => Math.max(prev - 1, 0))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const goToQuestion = (index: number) => {
        setSlideDirection(index > currentQuestionIndex ? 'right' : 'left')
        setCurrentQuestionIndex(index)
    }

    // --- Derived UI Values ---
    const currentQuestion = questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === questions.length - 1
    const isFirstQuestion = currentQuestionIndex === 0
    const isCurrentAnswered = currentQuestion ? (answers[currentQuestion.questionId]?.trim()?.length || 0) > 0 : false
    const progressPercent = questions.length > 0 ? Math.round((getAnsweredCount() / questions.length) * 100) : 0

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-500 font-medium">Loading your assessment…</p>
            </div>
        )
    }

    // --- Error State ---
    if (errors.fetch) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 text-center">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
                    <p className="text-red-700 mb-4">{errors.fetch}</p>
                </div>
            </div>
        )
    }

    // --- Intro Screen ---
    if (showIntro) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeIn">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
                    <div className="text-center mb-8">
                        <span className="inline-block px-4 py-1.5 mb-4 text-xs font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full border border-indigo-100">
                            Before You Begin
                        </span>
                        <h2 className="text-3xl font-black text-gray-900 mb-3">Entrance Assessment</h2>
                        <p className="text-gray-500 font-medium">
                            Welcome, <span className="text-indigo-600 font-black">{studentData?.fullName || 'Student'}</span>! Please read the instructions before your begin.
                        </p>
                    </div>

                    {/* Warning Note at top */}
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-8 flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-red-700 font-semibold">
                            <strong>Important:</strong> Do not refresh the page as your responses may be lost. Please maintain a stable network connection throughout.
                        </p>
                    </div>

                    {/* STAR Method */}
                    <div className="mb-8">
                        <h3 className="text-lg font-black text-gray-800 mb-4">How to Answer Written Questions</h3>
                        <p className="text-gray-500 font-medium mb-5">We care more about <strong>how you think</strong> than what you know. For written responses, use the <strong>STAR method</strong> and write 5–10 sentences:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { letter: 'S', label: 'Situation', desc: 'Describe the specific situation you were in.' },
                                { letter: 'T', label: 'Task',      desc: 'What was your responsibility or challenge?' },
                                { letter: 'A', label: 'Action',    desc: 'What steps did you take to address it?' },
                                { letter: 'R', label: 'Result',    desc: 'What was the outcome? What did you learn?' },
                            ].map(({ letter, label, desc }) => (
                                <div key={letter} className="bg-indigo-50 rounded-2xl p-4 flex gap-3">
                                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg">
                                        {letter}
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 text-sm">{label}</p>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowIntro(false)}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-base shadow-lg hover:shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        Start Assessment
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-3">
            <style>{`
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(48px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-48px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .slide-right { animation: slideInRight 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
                .slide-left  { animation: slideInLeft  0.28s cubic-bezier(0.22, 1, 0.36, 1); }
            `}</style>


            {/* Header */}
            <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 tracking-wide uppercase">
                        Question <span className="text-indigo-600">{currentQuestionIndex + 1}</span> of {questions.length}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                        {getAnsweredCount()} answered &middot; {progressPercent}%
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Dot indicators */}
                <div className="mt-2 flex flex-wrap gap-1">
                    {questions.map((q, idx) => {
                        const isAnswered = (answers[q.questionId]?.trim()?.length || 0) > 0
                        const isCurrent = idx === currentQuestionIndex
                        return (
                            <button
                                key={q.questionId}
                                type="button"
                                onClick={() => goToQuestion(idx)}
                                title={`Question ${idx + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer
                                    ${isCurrent ? 'w-5 bg-indigo-600' : isAnswered ? 'w-1.5 bg-indigo-300' : 'w-1.5 bg-gray-200 hover:bg-gray-300'}
                                `}
                            />
                        )
                    })}
                </div>
            </div>

            {/* Question Card */}
            <form onSubmit={handleSubmit}>
                {currentQuestion && (
                    <div
                        key={currentQuestionIndex}
                        className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-3 ${slideDirection === 'right' ? 'slide-right' : 'slide-left'}`}
                    >
                        {/* Question type badge */}
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-3
                            ${currentQuestion.questionType === 'mcq'
                                ? 'bg-violet-50 text-violet-600'
                                : 'bg-amber-50 text-amber-600'}
                        `}>
                            {currentQuestion.questionType === 'mcq' ? 'Multiple Choice' : 'Written Response'}
                        </span>

                        <h3
                            className="text-base font-black text-gray-900 leading-snug mb-4"
                            id={`ans_${currentQuestion.questionId}`}
                        >
                            {currentQuestion.questionText}
                        </h3>

                        {/* MCQ Options */}
                        {currentQuestion.questionType === 'mcq' ? (
                            <div className="space-y-2">
                                {currentQuestion.mcqOptions?.map((option: string, idx: number) => {
                                    const isSelected = answers[currentQuestion.questionId] === option
                                    return (
                                        <label
                                            key={idx}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-150
                                                ${isSelected
                                                    ? 'border-indigo-600 bg-indigo-50'
                                                    : 'border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/50'}
                                            `}
                                        >
                                            <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                                                ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}
                                            >
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name={`q_${currentQuestion.questionId}`}
                                                value={option}
                                                checked={isSelected}
                                                onChange={(e) => handleAnswerChange(currentQuestion.questionId, e.target.value)}
                                                className="sr-only"
                                            />
                                            <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{option}</span>
                                        </label>
                                    )
                                })}
                            </div>
                        ) : (
                            /* Text Response */
                            <div>
                                <textarea
                                    className={`w-full p-3 rounded-xl border-2 bg-gray-50 focus:bg-white focus:ring-0 outline-none min-h-[160px] transition-all font-medium text-gray-800 resize-none text-sm
                                        ${errors[currentQuestion.questionId] ? 'border-red-300' : 'border-gray-100 focus:border-indigo-400'}`}
                                    placeholder="Type your detailed response here…"
                                    value={answers[currentQuestion.questionId] || ''}
                                    onChange={(e) => handleAnswerChange(currentQuestion.questionId, e.target.value)}
                                />
                                <div className="flex justify-end mt-1">
                                    <span className={`text-xs font-bold ${(answers[currentQuestion.questionId]?.length || 0) >= 50 ? 'text-green-500' : 'text-gray-400'}`}>
                                        {answers[currentQuestion.questionId]?.length || 0} / 50 min characters
                                    </span>
                                </div>
                            </div>
                        )}


                    </div>
                )}

                {/* Submit error */}
                {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                        <p className="text-red-700 text-sm font-semibold">{errors.submit}</p>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                    {/* Previous */}
                    <button
                        type="button"
                        onClick={goToPrev}
                        disabled={isFirstQuestion}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-400 hover:text-gray-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        Previous
                    </button>

                    {/* Next OR Submit */}
                    {isLastQuestion ? (
                        <button
                            type="submit"
                            disabled={isSubmitting || getAnsweredCount() === 0}
                            className="flex-1 flex items-center justify-center gap-2 py-4 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-base shadow-lg hover:shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Submitting…
                                </>
                            ) : (
                                <>
                                    Submit Assessment
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={goToNext}
                            disabled={!isCurrentAnswered}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 px-8 rounded-2xl font-black text-base transition-all
                                ${isCurrentAnswered
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                            `}
                        >
                            Next Question
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    )}
                </div>


            </form>
        </div>
    )
}

export default AssessmentStep
