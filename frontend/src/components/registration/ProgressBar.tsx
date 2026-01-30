import { ProgressBarProps } from '@/types/registration'

const ProgressBar = ({ currentStep }: ProgressBarProps) => {
    const steps = [
        { label: 'Course Selection' },
        { label: 'Registration Details' },
        { label: 'Skill Assessment' },
        { label: 'Completion' }
    ]

    const totalSteps = steps.length
    // Shift by 1 because step 0 is program selection and not shown in this bar
    const activeStepIndex = Math.min(Math.max(currentStep - 1, 0), totalSteps - 1)

    return (
        <div className="w-full max-w-2xl mx-auto mb-10 animate-fadeIn">
            {/* Header: Label and Step Count */}
            <div className="flex justify-between items-end mb-3 px-1">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-none">
                        {steps[activeStepIndex].label}
                    </h3>
                </div>
                <div className="text-xs font-semibold text-gray-500 tracking-wide">
                    STEP {Math.min(Math.max(currentStep, 1), totalSteps)} / {totalSteps}
                </div>
            </div>

            {/* Segmented Bar */}
            <div className="flex gap-2.5 h-2.5">
                {steps.map((_, index) => {
                    const stepNum = index + 1
                    const isCompleted = currentStep > stepNum
                    const isCurrent = currentStep === stepNum

                    return (
                        <div
                            key={index}
                            className="flex-1 h-full bg-gray-100 rounded-full overflow-hidden relative"
                        >
                            <div
                                className={`absolute top-0 left-0 h-full w-full rounded-full transition-all duration-700 ease-out transform origin-left ${isCompleted || isCurrent ? 'bg-primary-600 scale-x-100' : 'bg-transparent scale-x-0'
                                    }`}
                            >
                                {isCurrent && (
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ProgressBar


