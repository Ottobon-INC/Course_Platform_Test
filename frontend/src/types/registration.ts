// Student and Registration Types
export interface StudentData {
    id?: string | number
    offeringId?: string
    fullName: string
    email: string
    phoneNumber: string
    profileCategory?: 'college_student' | 'school_student' | 'professional' | 'general'
    isCollegeStudent: boolean
    collegeName: string
    yearOfPassing: string
    otherYearOfPassing?: string
    branch: string
    otherBranch?: string
    selectedSlot?: string // Made optional
    sessionTime?: string  // Made optional
    mode?: string         // Made optional
    specificCourse?: string // Added
    referredBy?: string
    programType: 'cohort' | 'ondemand' | 'workshop' // Added
    plan?: string         // Added
    assessmentRequired?: boolean // Added
    applicationRequired?: boolean // Added
    priceCents?: number // Added
    showSlots?: boolean // Added
    slots?: any[]       // Added
    qrImageUrl?: string // Added
}

export interface RegistrationFormData {
    offeringId?: string
    fullName: string
    email: string
    phoneNumber: string
    profileCategory: 'college_student' | 'school_student' | 'professional' | 'general'
    isCollegeStudent: boolean
    collegeName: string
    yearOfPassing: string
    otherYearOfPassing: string
    branch: string
    otherBranch: string
    selectedSlot: string
    sessionTime: string
    mode: string
    specificCourse: string // Added
    referredBy: string
    programType: 'cohort' | 'ondemand' | 'workshop' // Added
    plan?: string         // Added
}

export type FormErrors = Record<string, string>

// Assessment Types
export interface Question {
    id: string
    question_number: number
    question_text: string
    question_type: 'text' | 'mcq'
    mcq_options?: string[]
    is_active: boolean
    specific_course_context?: string | null
    created_at?: string
    program_type?: 'cohort' | 'ondemand' | 'workshop' | 'all' // Added
}

export type Answer = Record<string, string>

export interface Submission {
    id?: string | number
    student_id: string | number
    total_questions: number
    duration_seconds?: number
    submitted_at?: string
}

export interface StudentAnswer {
    id?: string | number
    student_id: string | number
    question_id: string
    student_name: string
    student_email: string
    question_number: number
    question_text: string
    answer_text: string
    submission_id?: string | number
    created_at?: string
}

// Component Props
export interface RegistrationStepProps {
    onSubmit: (data: StudentData) => void
    programType: 'cohort' | 'ondemand' | 'workshop'
    selectedCourse?: string
    offeringId?: string
    priceCents?: number
    onBack?: () => void
    assessmentRequired?: boolean
    slots?: any[]
    showSlots?: boolean
}

export interface AssessmentStepProps {
    onSubmit: (answers: Answer) => void
    studentData: StudentData
}

export interface ProgressBarProps {
    currentStep: number
}

export interface PaymentStepProps {
    onSubmit: (paymentData: { transactionId: string, screenshot: File }) => void
    studentData: StudentData
    onBack: () => void
}

export interface SuccessStepProps {
    studentData: StudentData;
}

export interface CourseOffering {
    offeringId: string;
    courseId: string;
    title: string;
    description: string | null;
    programType: 'cohort' | 'ondemand' | 'workshop';
    isActive: boolean;
    priceCents: number;
    assessmentRequired: boolean;
    applicationRequired: boolean;
    showSlots: boolean;
    slotsJson: any; // Changed from slotsJson?: any;
    qrImageUrl?: string | null;
    course: {
        courseId: string;
        courseName: string;
        slug: string;
    };
}

// Supabase Response Types
export interface SupabaseResponse<T> {
    data: T | null
    error: {
        message: string
        code?: string
    } | null
}


