import { useState, useEffect } from 'react'
import '@/styles/registration.css'
import ProgressBar from '@/components/registration/ProgressBar'
import RegistrationStep from '@/components/registration/RegistrationStep'
import AssessmentStep from '@/components/registration/AssessmentStep'
import SuccessStep from '@/components/registration/SuccessStep'
import CourseSelection from '@/components/registration/CourseSelection'
import SpecificCourseSelection from '@/components/registration/SpecificCourseSelection'
import { StudentData, Answer } from '@/types/registration'

function RegistrationPage() {
    const [currentStep, setCurrentStep] = useState<number>(0)

    // Scroll to top whenever step changes
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [currentStep])
    const [programType, setProgramType] = useState<'cohort' | 'ondemand' | 'workshop'>('cohort')
    const [registrationData, setRegistrationData] = useState<StudentData>({
        offeringId: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        collegeName: '',
        yearOfPassing: '',
        branch: '',
        selectedSlot: '',
        sessionTime: '',
        mode: '',
        programType: 'cohort',
        specificCourse: ''
    })
    const [assessmentAnswers, setAssessmentAnswers] = useState<Answer>({})

    const handleCourseSelect = (type: 'cohort' | 'ondemand' | 'workshop') => {
        setProgramType(type)
        setRegistrationData(prev => ({ ...prev, programType: type }))
        setCurrentStep(1) // Move to Specific Course Selection
    }

    const handleSpecificCourseSelect = (selection: { offeringId: string; title: string }) => {
        setRegistrationData(prev => ({
            ...prev,
            offeringId: selection.offeringId,
            specificCourse: selection.title
        }))
        setCurrentStep(2) // Move to Registration
    }

    const handleRegistrationSubmit = (data: StudentData): void => {
        setRegistrationData(data)
        setCurrentStep(3) // Move to Assessment
    }

    const handleAssessmentSubmit = (answers: Answer): void => {
        setAssessmentAnswers(answers)
        setCurrentStep(4) // Move to Success
    }

    const goBack = (step: number) => {
        setCurrentStep(step)
    }

    return (
        <div className="registration-page min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-rose-50">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-black mb-3">
                        OttoLearn
                    </h1>
                </div>

                {/* Progress Bar - Only show if currentStep > 0 */}
                {currentStep > 0 && <ProgressBar currentStep={currentStep} />}

                {/* Step Content */}
                <div className="mt-12">
                    {currentStep === 0 && (
                        <CourseSelection onSelect={handleCourseSelect} />
                    )}
                    {currentStep === 1 && (
                        <SpecificCourseSelection
                            programType={programType}
                            onSelect={handleSpecificCourseSelect}
                            onBack={() => goBack(0)}
                        />
                    )}
                    {currentStep === 2 && (
                        <RegistrationStep
                            onSubmit={handleRegistrationSubmit}
                            programType={programType}
                            selectedCourse={registrationData.specificCourse}
                            offeringId={registrationData.offeringId}
                            onBack={() => goBack(1)}
                        />
                    )}
                    {currentStep === 3 && (
                        <AssessmentStep
                            onSubmit={handleAssessmentSubmit}
                            studentData={registrationData}
                        />
                    )}
                    {currentStep === 4 && (
                        <SuccessStep studentData={registrationData} />
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-16 text-sm text-gray-500">
                    <p>(c) 2026 OttoLearn. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}

export default RegistrationPage


