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
import { buildApiUrl } from '@/lib/api'

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

const toSlug = (value?: string | null): string =>
    (value ?? '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')

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

    const [resolvedCourseSlug, setResolvedCourseSlug] = useState<string>('')
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
    const routeCourseKey = successParams?.courseSlug || paymentParams?.courseSlug || assessmentParams?.courseSlug || courseParams?.courseSlug || ''

    const getRoutingCourseKey = (fallbackTitle?: string): string => {
        const fallbackSlug = toSlug(fallbackTitle ?? registrationData.specificCourse)
        return resolvedCourseSlug || routeCourseKey || fallbackSlug
    }

    // Resolve direct route course key (slug/id) to canonical course + offering.
    useEffect(() => {
        if (!routeCourseKey) {
            setResolvedCourseSlug('')
            return
        }

        let mounted = true

        const resolveRouteCourse = async () => {
            try {
                const currentCourseSlug = toSlug(registrationData.specificCourse)
                if (
                    currentCourseSlug !== routeCourseKey ||
                    !registrationData.offeringId
                ) {
                    setRegistrationData(prev => ({
                        ...prev,
                        offeringId: '',
                        specificCourse: '',
                    }))
                }

                // 1) Resolve the course key to canonical course id/slug.
                const courseRes = await fetch(buildApiUrl(`/api/courses/${encodeURIComponent(routeCourseKey)}`))
                if (!courseRes.ok) {
                    throw new Error(`Failed to resolve course key (${courseRes.status})`)
                }
                const coursePayload = await courseRes.json()
                const resolvedCourseId: string | undefined = coursePayload?.course?.id
                const canonicalSlug: string = coursePayload?.course?.slug ?? routeCourseKey

                if (!resolvedCourseId) {
                    throw new Error('Resolved course id missing in response')
                }

                // 2) Fetch offerings tied to this exact course id + selected program type.
                const offeringsData = await fetchOfferings({ courseId: resolvedCourseId, programType })
                const matched = offeringsData?.offerings?.find(o => o.isActive && o.programType === programType)

                if (!matched || !mounted) {
                    return
                }

                setResolvedCourseSlug(canonicalSlug)
                setRegistrationData(prev => ({
                    ...prev,
                    offeringId: matched.offeringId,
                    specificCourse: matched.title,
                    programType,
                    assessmentRequired: matched.assessmentRequired,
                    priceCents: matched.priceCents,
                    showSlots: matched.showSlots,
                    slots: Array.isArray(matched.slotsJson) ? matched.slotsJson : [],
                    qrImageUrl: matched.qrImageUrl ?? undefined
                }))

                // If user is on assessment route but this offering does not require assessment, redirect forward.
                if (matched.assessmentRequired === false && assessmentParams) {
                    if (matched.priceCents > 0) {
                        setLocation(`/registration/${programType}/${canonicalSlug}/payment`)
                    } else {
                        setLocation(`/registration/${programType}/${canonicalSlug}/success`)
                    }
                }
            } catch (e) {
                // Backward-compat fallback for legacy title-slug route values.
                try {
                    const legacy = await fetchOfferings({ courseSlug: routeCourseKey, programType })
                    const matchedLegacy = legacy?.offerings?.find(o => {
                        const offeringSlug = toSlug(o.title)
                        return o.isActive && o.programType === programType && offeringSlug === routeCourseKey
                    })

                    if (matchedLegacy && mounted) {
                        setResolvedCourseSlug(routeCourseKey)
                        setRegistrationData(prev => ({
                            ...prev,
                            offeringId: matchedLegacy.offeringId,
                            specificCourse: matchedLegacy.title,
                            programType,
                            assessmentRequired: matchedLegacy.assessmentRequired,
                            priceCents: matchedLegacy.priceCents,
                            showSlots: matchedLegacy.showSlots,
                            slots: Array.isArray(matchedLegacy.slotsJson) ? matchedLegacy.slotsJson : [],
                            qrImageUrl: matchedLegacy.qrImageUrl ?? undefined
                        }))
                    }
                } catch {
                    console.error('Failed to resolve route course offering', e)
                }
            }
        }

        void resolveRouteCourse()
        return () => {
            mounted = false
        }
    }, [routeCourseKey, programType, assessmentParams, setLocation])

    const handleCourseSelect = (type: 'cohort' | 'ondemand' | 'workshop') => {
        setRegistrationData(prev => ({ ...prev, programType: type }))
        setLocation(`/registration/${type}`)
    }

    const handleSpecificCourseSelect = (selection: { offeringId: string; title: string, assessmentRequired?: boolean, priceCents?: number, showSlots?: boolean, slotsJson?: any, qrImageUrl?: string | null }) => {
        const slug = toSlug(selection.title)
        setResolvedCourseSlug(slug)
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
        setLocation(`/registration/${programType}/${slug}`)
    }

    const handleRegistrationSubmit = (data: Partial<StudentData>): void => {
        setRegistrationData(prev => {
            const updated = { ...prev, ...data }
            const slug = getRoutingCourseKey(updated.specificCourse)
            
            // Perform navigation based on the updated state
            if (updated.assessmentRequired === false) {
                if ((updated.priceCents || 0) > 0) {
                    setLocation(`/registration/${updated.programType}/${slug}/payment`)
                } else {
                    setLocation(`/registration/${updated.programType}/${slug}/success`)
                }
            } else {
                setLocation(`/registration/${updated.programType}/${slug}/assessment`)
            }
            
            return updated
        })
    }

    const handleAssessmentSubmit = (_answers: Answer): void => {
        const slug = getRoutingCourseKey()
        
        if ((registrationData.priceCents || 0) > 0) {
            setLocation(`/registration/${registrationData.programType}/${slug}/payment`)
        } else {
            // Clear localStorage on success
            localStorage.removeItem(STORAGE_KEY)
            setLocation(`/registration/${registrationData.programType}/${slug}/success`)
        }
    }

    const handlePaymentSubmit = (): void => {
        const slug = getRoutingCourseKey()
        // Clear localStorage on success
        localStorage.removeItem(STORAGE_KEY)
        setLocation(`/registration/${registrationData.programType}/${slug}/success`)
    }

    const goBack = (targetStep: number) => {
        const slug = getRoutingCourseKey()

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

