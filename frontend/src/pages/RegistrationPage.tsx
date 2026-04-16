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
import PaymentStep from '@/components/registration/PaymentStep'

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
    const [matchPayment, paymentParams] = useRoute<{ programType: string; courseSlug: string }>('/registration/:programType/:courseSlug/payment')
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
    // We now use registrationData.slots and registrationData.showSlots directly

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(registrationData))
    }, [registrationData])

    // Determine current step based on URL
    const getCurrentStep = (): number => {
        if (matchSuccess) return 5
        if (matchPayment) return 4
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
        const slug = successParams?.courseSlug || paymentParams?.courseSlug || assessmentParams?.courseSlug || courseParams?.courseSlug
        if (slug) {
            const currentSlug = (registrationData.specificCourse || '').toLowerCase().replace(/ /g, '-')

            // Only resolve if we don't have an offeringId OR if the slug doesn't match the specificCourse title
            if (!registrationData.offeringId || currentSlug !== slug) {
                console.log(`Resolving course for slug: ${slug}, current: ${currentSlug}`);
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
                                    priceCents: matched.priceCents,
                                    showSlots: matched.showSlots,
                                    slots: Array.isArray(matched.slotsJson) ? matched.slotsJson : [],
                                    qrImageUrl: matched.qrImageUrl ?? undefined
                                }));

                                // If user is on assessment page but course doesn't require it, redirect to success/payment
                                if (matched.assessmentRequired === false && assessmentParams) {
                                    const slug = matched.title.toLowerCase().replace(/ /g, '-')
                                    if (matched.priceCents > 0) {
                                        setLocation(`/registration/${programType}/${slug}/payment`)
                                    } else {
                                        setLocation(`/registration/${programType}/${slug}/success`)
                                    }
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

    const handleSpecificCourseSelect = (selection: { offeringId: string; title: string, assessmentRequired?: boolean, priceCents?: number, showSlots?: boolean, slotsJson?: any, qrImageUrl?: string | null }) => {
        console.log("Course Selected:", selection);
        setRegistrationData(prev => ({
            ...prev,
            offeringId: selection.offeringId,
            specificCourse: selection.title,
            assessmentRequired: selection.assessmentRequired,
            priceCents: selection.priceCents,
            showSlots: selection.showSlots,
            slots: Array.isArray(selection.slotsJson) ? selection.slotsJson : [],
            qrImageUrl: selection.qrImageUrl ?? undefined
        }))
        const slug = selection.title.toLowerCase().replace(/ /g, '-')
        setLocation(`/registration/${programType}/${slug}`)
    }

    const handleRegistrationSubmit = (data: Partial<StudentData>): void => {
        // Update state first
        setRegistrationData(prev => ({ ...prev, ...data }));
        
        // Compute navigation target using the most reliable current values
        // programType is the constant from line 100 which is derived from URL/State
        // Use param from URL if possible, otherwise state
        const currentProgramType = assessmentParams?.programType || courseParams?.programType || programTypeParams?.programType || programType || registrationData.programType;
        const currentSpecificCourse = data.specificCourse || registrationData.specificCourse;
        const slug = (currentSpecificCourse || '').toLowerCase().replace(/ /g, '-');
        
        // Try to get assessmentRequired from state or data
        const assessmentRequired = data.assessmentRequired !== undefined ? data.assessmentRequired : registrationData.assessmentRequired;
        
        if (assessmentRequired === false) {
            if ((registrationData.priceCents || 0) > 0) {
                setLocation(`/registration/${currentProgramType}/${slug}/payment`);
            } else {
                setLocation(`/registration/${currentProgramType}/${slug}/success`);
            }
        } else {
            setLocation(`/registration/${currentProgramType}/${slug}/assessment`);
        }
    }

    const handleAssessmentSubmit = (answers: Answer): void => {
        setAssessmentAnswers(answers);
        const slug = (registrationData.specificCourse || '').toLowerCase().replace(/ /g, '-');
        const currentProgramType = registrationData.programType || programType;
        
        if ((registrationData.priceCents || 0) > 0) {
            setLocation(`/registration/${currentProgramType}/${slug}/payment`);
        } else {
            // Clear localStorage on success
            localStorage.removeItem(STORAGE_KEY);
            setLocation(`/registration/${currentProgramType}/${slug}/success`);
        }
    }

    const handlePaymentSubmit = (): void => {
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
                            onBack={() => {
                                goBack(1);
                            }}
                            slots={registrationData.slots || []}
                            showSlots={registrationData.showSlots ?? true}
                            assessmentRequired={registrationData.assessmentRequired !== false}
                        />
                    )}
                    {currentStep === 3 && (
                        <AssessmentStep
                            onSubmit={handleAssessmentSubmit}
                            studentData={registrationData}
                        />
                    )}
                    {currentStep === 4 && (
                        <PaymentStep
                            onSubmit={handlePaymentSubmit}
                            studentData={registrationData}
                            onBack={() => {
                                if (registrationData.assessmentRequired) {
                                    // Step 3 was assessment
                                    goBack(3)
                                } else {
                                    // No assessment, go back to registration
                                    goBack(2)
                                }
                            }}
                        />
                    )}
                    {currentStep === 5 && (
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

