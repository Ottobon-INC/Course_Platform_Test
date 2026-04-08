import { useState, useEffect } from 'react'
import { useRoute, useLocation } from 'wouter'
import '@/styles/registration.css'
import ProgressBar from '@/components/registration/ProgressBar'
import RegistrationStep from '@/components/registration/RegistrationStep'
import AssessmentStep from '@/components/registration/AssessmentStep'
import SuccessStep from '@/components/registration/SuccessStep'
import CourseSelection from '@/components/registration/CourseSelection'
import SpecificCourseSelection from '@/components/registration/SpecificCourseSelection'
import { StudentData, Answer } from '@/types/registration'
import { fetchOfferings } from '@/lib/registrationApi'

const STORAGE_KEY = 'ottolearn_reg_draft'

const defaultRegistrationData: StudentData = {
    offeringId: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    profileCategory: 'general',
    isCollegeStudent: true,
    collegeName: '',
    yearOfPassing: '',
    otherYearOfPassing: '',
    branch: '',
    otherBranch: '',
    selectedSlot: '',
    sessionTime: '',
    mode: '',
    programType: 'cohort',
    specificCourse: '',
    plan: '',
    assessmentRequired: true
}

function RegistrationPage() {
    const [, setLocation] = useLocation()

    // URL route matching
    const [matchRoot] = useRoute('/registration')
    const [matchProgramType, programTypeParams] = useRoute<{ programType: string }>('/registration/:programType')
    const [matchCourseSlug, courseParams] = useRoute<{ programType: string; courseSlug: string }>('/registration/:programType/:courseSlug')
    const [matchAssessment, assessmentParams] = useRoute<{ programType: string; courseSlug: string }>('/registration/:programType/:courseSlug/assessment')
    const [matchSuccess, successParams] = useRoute<{ programType: string; courseSlug: string }>('/registration/:programType/:courseSlug/success')

    // Initialize state from localStorage
    const [registrationData, setRegistrationData] = useState<StudentData>(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                const resolvedProfileCategory =
                    parsed?.profileCategory === 'college_student' ||
                        parsed?.profileCategory === 'school_student' ||
                        parsed?.profileCategory === 'professional' ||
                        parsed?.profileCategory === 'general'
                        ? parsed.profileCategory
                        : parsed?.programType === 'workshop'
                            ? 'general'
                            : 'college_student'
                const resolvedIsCollegeStudent =
                    typeof parsed?.isCollegeStudent === 'boolean'
                        ? parsed.isCollegeStudent
                        : resolvedProfileCategory === 'college_student'
                return {
                    ...defaultRegistrationData,
                    ...parsed,
                    profileCategory: resolvedProfileCategory,
                    isCollegeStudent: resolvedIsCollegeStudent
                }
            } catch (e) {
                console.error("Failed to parse saved registration data", e)
            }
        }
        return defaultRegistrationData
    })

    const [assessmentAnswers, setAssessmentAnswers] = useState<Answer>({})

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(registrationData))
    }, [registrationData])

    // Determine current step based on URL
    const getCurrentStep = (): number => {
        if (matchSuccess) return 4
        if (matchAssessment) return 3
        if (matchCourseSlug) return 2
        if (matchProgramType) return 1
        if (matchRoot) return 0
        return 0
    }

    const currentStep = getCurrentStep()
    const programType = (successParams?.programType || assessmentParams?.programType || courseParams?.programType || programTypeParams?.programType || 'cohort') as 'cohort' | 'ondemand' | 'workshop'

    // Slug resolution from URL
    useEffect(() => {
        const slug = successParams?.courseSlug || assessmentParams?.courseSlug || courseParams?.courseSlug
        if (slug) {
            const currentSlug = (registrationData.specificCourse || '').toLowerCase().replace(/ /g, '-')

            // Only resolve if slug doesn't match or we don't have an offeringId
            if (currentSlug !== slug || !registrationData.offeringId) {
                const resolveSlug = async () => {
                    try {
                        let offeringsData;
                        try {
                            offeringsData = await fetchOfferings({ courseSlug: slug });
                        } catch (e) {
                            // If fetching by slug fails, fallback to default main course to see if it's an offering slug
                            console.log("Course slug not found, trying default course fallback...");
                            offeringsData = await fetchOfferings({ courseSlug: 'ai-native-fullstack-developer' });
                        }

                        if (offeringsData?.offerings) {
                            const matched = offeringsData.offerings.find(o => {
                                const offeringSlug = o.title.toLowerCase().replace(/ /g, '-');
                                return o.isActive && o.programType === programType && offeringSlug === slug;
                            });

                            if (matched) {
                                setRegistrationData(prev => ({
                                    ...prev,
                                    offeringId: matched.offeringId,
                                    specificCourse: matched.title,
                                    programType: programType,
                                    assessmentRequired: matched.assessmentRequired,
                                    priceCents: matched.priceCents
                                }));

                                // If user is on assessment page but course doesn't require it, redirect to success
                                if (matched.assessmentRequired === false && assessmentParams) {
                                    const slug = matched.title.toLowerCase().replace(/ /g, '-')
                                    setLocation(`/registration/${programType}/${slug}/success`)
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Failed to resolve offering from slug", e);
                    }
                };
                resolveSlug();
            }
        }
    }, [successParams?.courseSlug, assessmentParams?.courseSlug, courseParams?.courseSlug, programType, registrationData.offeringId, registrationData.specificCourse])

    const handleCourseSelect = (type: 'cohort' | 'ondemand' | 'workshop') => {
        setRegistrationData(prev => ({ ...prev, programType: type }))
        setLocation(`/registration/${type}`)
    }

    const handleSpecificCourseSelect = (selection: { offeringId: string; title: string, assessmentRequired?: boolean, priceCents?: number }) => {
        setRegistrationData(prev => ({
            ...prev,
            offeringId: selection.offeringId,
            specificCourse: selection.title,
            assessmentRequired: selection.assessmentRequired,
            priceCents: selection.priceCents
        }))
        const slug = selection.title.toLowerCase().replace(/ /g, '-')
        setLocation(`/registration/${programType}/${slug}`)
    }

    const handleRegistrationSubmit = (data: Partial<StudentData>): void => {
        setRegistrationData(prev => {
            const updated = { ...prev, ...data }
            const slug = (updated.specificCourse || '').toLowerCase().replace(/ /g, '-')
            
            // Perform navigation based on the updated state
            if (updated.assessmentRequired === false) {
                setLocation(`/registration/${updated.programType}/${slug}/success`)
            } else {
                setLocation(`/registration/${updated.programType}/${slug}/assessment`)
            }
            
            return updated
        })
    }

    const handleAssessmentSubmit = (answers: Answer): void => {
        setAssessmentAnswers(answers)
        const slug = (registrationData.specificCourse || '').toLowerCase().replace(/ /g, '-')
        // Clear localStorage on success
        localStorage.removeItem(STORAGE_KEY)
        setLocation(`/registration/${registrationData.programType}/${slug}/success`)
    }

    const goBack = (targetStep: number) => {
        const slug = (registrationData.specificCourse || '').toLowerCase().replace(/ /g, '-')

        switch (targetStep) {
            case 0:
                setLocation('/registration')
                break
            case 1:
                setLocation(`/registration/${programType}`)
                break
            case 2:
                setLocation(`/registration/${programType}/${slug}`)
                break
            default:
                setLocation('/registration')
        }
    }

    return (
        <div className="registration-page min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-rose-50">
            <div className={`container mx-auto px-4 py-8 ${currentStep === 0 ? 'max-w-6xl' : 'max-w-4xl'}`}>
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
                            priceCents={registrationData.priceCents}
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
                        <SuccessStep studentData={{ ...registrationData, programType }} />
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

