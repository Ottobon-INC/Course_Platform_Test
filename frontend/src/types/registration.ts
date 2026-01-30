// Student and Registration Types
export interface StudentData {
    id?: string | number
    offeringId?: string
    fullName: string
    email: string
    phoneNumber: string
    collegeName: string
    yearOfPassing: string
    branch: string
    selectedSlot?: string // Made optional
    sessionTime?: string  // Made optional
    mode?: string         // Made optional
    specificCourse?: string // Added
    referredBy?: string
    programType: 'cohort' | 'ondemand' | 'workshop' // Added
}

export interface RegistrationFormData {
    offeringId?: string
    fullName: string
    email: string
    phoneNumber: string
    collegeName: string
    yearOfPassing: string
    branch: string
    selectedSlot: string
    sessionTime: string
    mode: string
    specificCourse: string // Added
    referredBy: string
    programType: 'cohort' | 'ondemand' | 'workshop' // Added
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
    onBack?: () => void
}

export interface AssessmentStepProps {
    onSubmit: (answers: Answer) => void
    studentData: StudentData
}

export interface ProgressBarProps {
    currentStep: number
}

export interface SuccessStepProps {
    studentData: StudentData;
}

// Supabase Response Types
export interface SupabaseResponse<T> {
    data: T | null
    error: {
        message: string
        code?: string
    } | null
}


