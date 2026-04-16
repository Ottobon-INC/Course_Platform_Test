import { useState, useEffect } from "react";
import { readStoredSession } from "@/utils/session";
import { submitRegistration } from "@/lib/registrationApi";
import {
    RegistrationStepProps,
    RegistrationFormData,
    FormErrors,
} from "@/types/registration";

// Feature flags for future course availability
const ON_DEMAND_AVAILABLE = false; // set to true when on-demand courses are ready
const WORKSHOP_AVAILABLE = true; // set to true when workshop courses are ready

const PROFILE_OPTIONS = [
    { value: "college_student", label: "College Student" },
    { value: "school_student", label: "School Student" },
    { value: "professional", label: "Professional" },
    { value: "general", label: "General" },
] as const;

const RegistrationStep = ({ onSubmit, programType, selectedCourse, offeringId, priceCents, onBack, slots = [], showSlots = true, assessmentRequired = true }: RegistrationStepProps & { slots?: any[], showSlots?: boolean, assessmentRequired?: boolean }) => {
    const session = readStoredSession();
    const initialProfileCategory =
        programType === "workshop" ? "general" : "college_student";

    const [formData, setFormData] = useState<RegistrationFormData>({
        fullName: session?.fullName || "",
        email: session?.email || "",
        phoneNumber: "",
        profileCategory: initialProfileCategory,
        isCollegeStudent: initialProfileCategory === "college_student",
        collegeName: "",
        yearOfPassing: "",
        otherYearOfPassing: "",
        branch: "",
        otherBranch: "",
        selectedSlot: "",
        sessionTime: "",
        mode: "",
        specificCourse: selectedCourse || "",
        referredBy: "",
        programType: programType,
        plan: "",
    });

    useEffect(() => {
        setFormData((prev) => {
            const defaultProfile =
                programType === "workshop" ? "general" : "college_student";
            const profileCategory =
                prev.programType === programType ? prev.profileCategory : defaultProfile;
            const isCollegeStudent = profileCategory === "college_student";

            return {
                ...prev,
                programType,
                specificCourse: selectedCourse || prev.specificCourse,
                profileCategory,
                isCollegeStudent,
                plan: priceCents !== undefined ? (priceCents / 100).toString() : prev.plan,
                ...(!isCollegeStudent
                    ? {
                        collegeName: "",
                        yearOfPassing: "",
                        otherYearOfPassing: "",
                        branch: "",
                        otherBranch: "",
                    }
                    : {}),
            };
        });
    }, [programType, selectedCourse, priceCents]);

    useEffect(() => {
        if (priceCents !== undefined) {
            setFormData(prev => ({
                ...prev,
                plan: (priceCents / 100).toString()
            }));
        }
    }, [priceCents]);

    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    // Using slots prop directly

    const shouldCollectAcademicDetails =
        programType !== "workshop" || formData.profileCategory === "college_student";

    const validateEmail = (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validatePhoneNumber = (phone: string): boolean => {
        const re =
            /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,5}[-\s.]?[0-9]{1,5}$/;
        return re.test(phone) && phone.replace(/\D/g, "").length >= 10;
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = "Name must be at least 2 characters";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!validateEmail(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required";
        } else if (!validatePhoneNumber(formData.phoneNumber)) {
            newErrors.phoneNumber =
                "Please enter a valid phone number (at least 10 digits)";
        }

        if (programType === "workshop" && !formData.profileCategory) {
            newErrors.profileCategory = "Please choose one option";
        }

        if (shouldCollectAcademicDetails) {
            if (!formData.collegeName.trim()) {
                newErrors.collegeName = "College name is required";
            }

            if (!formData.yearOfPassing) {
                newErrors.yearOfPassing = "Year of passing is required";
            } else if (
                formData.yearOfPassing === "Other" &&
                !formData.otherYearOfPassing.trim()
            ) {
                newErrors.otherYearOfPassing = "Please enter your year of passing";
            }

            if (!formData.branch.trim()) {
                newErrors.branch = "Branch is required";
            } else if (formData.branch === "Other" && !formData.otherBranch.trim()) {
                newErrors.otherBranch = "Please enter your specialization";
            }
        }

        if (programType === "cohort" || programType === "workshop") {
            if (showSlots && !formData.selectedSlot && slots.length > 0) {
                newErrors.selectedSlot = "Please select a slot";
            }

            if (!formData.mode) {
                newErrors.mode = "Please select a preferred mode";
            }

            if (!formData.specificCourse) {
                newErrors.specificCourse = "Please select a course";
            }
        } else if (programType === "ondemand") {
            if (!formData.specificCourse) {
                newErrors.specificCourse = "Please select a course";
            }
        }

        if (programType === "workshop") {
            // Only require plan if price is > 0, or if price is 0 explicitly allow it
            if (formData.plan === "" && priceCents !== 0) {
                newErrors.plan = "Please select a plan";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProfileSelect = (
        nextProfile: RegistrationFormData["profileCategory"],
    ) => {
        const isCollegeStudent = nextProfile === "college_student";
        setFormData((prev) => ({
            ...prev,
            profileCategory: nextProfile,
            isCollegeStudent,
            ...(!isCollegeStudent
                ? {
                    collegeName: "",
                    yearOfPassing: "",
                    otherYearOfPassing: "",
                    branch: "",
                    otherBranch: "",
                }
                : {}),
        }));

        setTouched((prev) => ({
            ...prev,
            profileCategory: true,
            ...(!isCollegeStudent
                ? {
                    collegeName: false,
                    yearOfPassing: false,
                    otherYearOfPassing: false,
                    branch: false,
                    otherBranch: false,
                }
                : {}),
        }));

        setErrors((prev) => {
            const next: FormErrors = { ...prev };
            delete next.profileCategory;
            if (!isCollegeStudent) {
                delete next.collegeName;
                delete next.yearOfPassing;
                delete next.otherYearOfPassing;
                delete next.branch;
                delete next.otherBranch;
            }
            return next;
        });
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ): void => {
        const { name, value } = e.target;

        if (name === "branch") {
            setFormData((prev) => ({
                ...prev,
                branch: value,
                otherBranch: value === "Other" ? prev.otherBranch : "",
            }));
            setErrors((prev) => {
                const next: FormErrors = { ...prev, branch: "" };
                if (value !== "Other") delete next.otherBranch;
                return next;
            });
            return;
        }

        if (name === "selectedSlot") {
            const slot = slots.find((s: any) => s.name === value);
            setFormData(prev => ({
                ...prev,
                selectedSlot: value,
                sessionTime: slot?.time || ""
            }));
            if (errors.selectedSlot) {
                setErrors(prev => ({ ...prev, selectedSlot: "" }));
            }
            return;
        }

        if (name === "yearOfPassing") {
            setFormData((prev) => ({
                ...prev,
                yearOfPassing: value,
                otherYearOfPassing: value === "Other" ? prev.otherYearOfPassing : "",
            }));
            setErrors((prev) => {
                const next: FormErrors = { ...prev, yearOfPassing: "" };
                if (value !== "Other") delete next.otherYearOfPassing;
                return next;
            });
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleBlur = (
        e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
    ): void => {
        const { name } = e.target;
        setTouched((prev) => ({
            ...prev,
            [name]: true,
        }));
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        e.preventDefault();

        setTouched({
            fullName: true,
            email: true,
            phoneNumber: true,
            profileCategory: programType === "workshop",
            collegeName: shouldCollectAcademicDetails,
            yearOfPassing: shouldCollectAcademicDetails,
            otherYearOfPassing:
                shouldCollectAcademicDetails && formData.yearOfPassing === "Other",
            branch: shouldCollectAcademicDetails,
            otherBranch:
                shouldCollectAcademicDetails && formData.branch === "Other",
            specificCourse: true,
            selectedSlot: programType === "cohort" || programType === "workshop",
            sessionTime: programType === "cohort" || programType === "workshop",
            mode: programType === "cohort" || programType === "workshop",
            plan: programType === "workshop",
        });

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (!offeringId) {
                setErrors({ submit: "Please select a course offering first." });
                return;
            }

            const isCollegeStudent =
                programType === "workshop"
                    ? formData.profileCategory === "college_student"
                    : true;
            const resolvedBranch = shouldCollectAcademicDetails
                ? formData.branch === "Other"
                    ? formData.otherBranch.trim()
                    : formData.branch
                : null;
            const resolvedYearOfPassing = shouldCollectAcademicDetails
                ? formData.yearOfPassing === "Other"
                    ? formData.otherYearOfPassing.trim()
                    : formData.yearOfPassing
                : null;

            const payload = {
                offeringId,
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                isCollegeStudent,
                collegeName: shouldCollectAcademicDetails ? formData.collegeName : null,
                yearOfPassing: resolvedYearOfPassing,
                branch: resolvedBranch,
                selectedSlot: (programType === "cohort" || programType === "workshop") ? formData.selectedSlot : null,
                sessionTime: (programType === "cohort" || programType === "workshop") ? formData.sessionTime : null,
                mode: (programType === "cohort" || programType === "workshop") ? formData.mode : null,
                referredBy: formData.referredBy || null,
                plan: programType === "workshop" ? formData.plan : null,
            };

            const response = await submitRegistration(payload);
            const registrationId =
                response?.registration?.registrationId ?? `local-${Date.now()}`;

            onSubmit({
                ...formData,
                id: registrationId,
                offeringId,
                isCollegeStudent,
                yearOfPassing: resolvedYearOfPassing ?? "",
                otherYearOfPassing:
                    formData.yearOfPassing === "Other" ? formData.otherYearOfPassing : "",
                branch: resolvedBranch ?? "",
                otherBranch: formData.branch === "Other" ? formData.otherBranch : "",
            });
        } catch (error) {
            console.error("Error submitting registration:", error);
            setErrors({
                submit: `Error: ${(error as any).message || "Unknown error occurred"}`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getProgramTitle = () => {
        switch (programType) {
            case "ondemand":
                return "On-Demand Learning Registration";
            case "workshop":
                return "Workshop Registration";
            default:
                return "Cohort Registration";
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="card max-w-4xl mx-auto">
                <div className="mb-8">
                    {onBack && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onBack();
                            }}
                            className="text-gray-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium mb-4 transition-colors"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Change Course
                        </button>
                    )}
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {getProgramTitle()}
                    </h2>
                    {programType === "cohort" && (
                        <p className="text-gray-900 font-semibold mb-2">
                            Cohort is available for both online and offline
                        </p>
                    )}
                    <p className="text-gray-600">
                        Please provide your information to begin the enrollment process
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
                >
                    <div className="md:col-span-2 bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-2">
                        <label className="block text-sm font-medium text-indigo-900 mb-1">
                            Selected Course
                        </label>
                        <div className="text-lg font-bold text-indigo-700">
                            {formData.specificCourse || "No course selected"}
                        </div>
                    </div>

                    <div className="md:col-span-2 border-b border-gray-100 pb-2 mt-4">
                        <h3 className="text-lg font-bold text-gray-800">Personal Details</h3>
                        <p className="text-xs text-gray-400">Basic contact information</p>
                    </div>

                    <div>
                        <label htmlFor="fullName" className="label">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`input-field ${touched.fullName && errors.fullName ? "border-red-500" : ""
                                }`}
                            placeholder="Enter your full name"
                        />
                        {touched.fullName && errors.fullName && (
                            <p className="error-text">{errors.fullName}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="email" className="label">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`input-email ${touched.email && errors.email ? "border-red-500" : ""
                                }`}
                            placeholder="your.email@example.com"
                        />
                        {touched.email && errors.email && (
                            <p className="error-text">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="phoneNumber" className="label">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`input-field ${touched.phoneNumber && errors.phoneNumber ? "border-red-500" : ""
                                }`}
                            placeholder="+1 (555) 123-4567"
                        />
                        {touched.phoneNumber && errors.phoneNumber && (
                            <p className="error-text">{errors.phoneNumber}</p>
                        )}
                    </div>

                    {programType === "workshop" && (
                        <div className="md:col-span-2 rounded-xl border border-indigo-200 bg-indigo-50/40 p-5">
                            <label className="label mb-3 block">
                                What describes you best? <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {PROFILE_OPTIONS.map((option) => {
                                    const selected = formData.profileCategory === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleProfileSelect(option.value)}
                                            className={`rounded-2xl px-5 py-3 text-base font-semibold border transition-all ${selected
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-[0_8px_24px_rgba(79,70,229,0.35)]"
                                                : "bg-white text-indigo-900 border-indigo-200 hover:border-indigo-400"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {touched.profileCategory && errors.profileCategory && (
                                <p className="error-text mt-2">{errors.profileCategory}</p>
                            )}
                        </div>
                    )}

                    {shouldCollectAcademicDetails && (
                        <>
                            <div className="md:col-span-2 border-b border-gray-100 pb-2 mt-4">
                                <h3 className="text-lg font-bold text-gray-800">Academic Background</h3>
                                <p className="text-xs text-gray-400">Information about your education</p>
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="collegeName" className="label">
                                    College Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="collegeName"
                                    name="collegeName"
                                    value={formData.collegeName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`input-field ${touched.collegeName && errors.collegeName ? "border-red-500" : ""
                                        }`}
                                    placeholder="Enter your college name"
                                />
                                {touched.collegeName && errors.collegeName && (
                                    <p className="error-text">{errors.collegeName}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="yearOfPassing" className="label">
                                    Year of Passing <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="yearOfPassing"
                                    name="yearOfPassing"
                                    value={formData.yearOfPassing}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`input-field ${touched.yearOfPassing && errors.yearOfPassing ? "border-red-500" : ""
                                        }`}
                                >
                                    <option value="">Select year</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                    <option value="2027">2027</option>
                                    <option value="2028">2028</option>
                                    <option value="Other">Other</option>
                                </select>
                                {touched.yearOfPassing && errors.yearOfPassing && (
                                    <p className="error-text">{errors.yearOfPassing}</p>
                                )}
                            </div>

                            {formData.yearOfPassing === "Other" && (
                                <div className="md:col-span-2">
                                    <label htmlFor="otherYearOfPassing" className="label">
                                        Please specify your year of passing{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="otherYearOfPassing"
                                        name="otherYearOfPassing"
                                        value={formData.otherYearOfPassing}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`input-field ${touched.otherYearOfPassing && errors.otherYearOfPassing
                                            ? "border-red-500"
                                            : ""
                                            }`}
                                        placeholder="Enter your year of passing"
                                    />
                                    {touched.otherYearOfPassing && errors.otherYearOfPassing && (
                                        <p className="error-text">{errors.otherYearOfPassing}</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label htmlFor="branch" className="label">
                                    Majors/Specialization <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="branch"
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`input-field ${touched.branch && errors.branch ? "border-red-500" : ""
                                        }`}
                                >
                                    <option value="">Select your major</option>
                                    <option value="Computer Science Engineering (CSE)">
                                        Computer Science Engineering (CSE)
                                    </option>
                                    <option value="Artificial Intelligence & Machine Learning (AIML)">
                                        Artificial Intelligence & Machine Learning (AIML)
                                    </option>
                                    <option value="Data Science">Data Science</option>
                                    <option value="Information Technology (IT)">
                                        Information Technology (IT)
                                    </option>
                                    <option value="Electronics and Communication Engineering (ECE)">
                                        Electronics and Communication Engineering (ECE)
                                    </option>
                                    <option value="Electrical Engineering (EE)">
                                        Electrical Engineering (EE)
                                    </option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                    <option value="Civil Engineering">Civil Engineering</option>
                                    <option value="Chemical Engineering">Chemical Engineering</option>
                                    <option value="Biotechnology">Biotechnology</option>
                                    <option value="Aerospace Engineering">Aerospace Engineering</option>
                                    <option value="Automobile Engineering">Automobile Engineering</option>
                                    <option value="Industrial Engineering">Industrial Engineering</option>
                                    <option value="Robotics Engineering">Robotics Engineering</option>
                                    <option value="Cyber Security">Cyber Security</option>
                                    <option value="Other">Other</option>
                                </select>
                                {touched.branch && errors.branch && (
                                    <p className="error-text">{errors.branch}</p>
                                )}
                            </div>

                            {formData.branch === "Other" && (
                                <div className="md:col-span-2">
                                    <label htmlFor="otherBranch" className="label">
                                        Please specify your specialization{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="otherBranch"
                                        name="otherBranch"
                                        value={formData.otherBranch}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`input-field ${touched.otherBranch && errors.otherBranch
                                            ? "border-red-500"
                                            : ""
                                            }`}
                                        placeholder="Enter your specialization"
                                    />
                                    {touched.otherBranch && errors.otherBranch && (
                                        <p className="error-text">{errors.otherBranch}</p>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {(programType === "cohort" || programType === "workshop") && (
                        <div className="md:col-span-2 border-b border-gray-100 pb-2 mt-4">
                            <h3 className="text-lg font-bold text-gray-800">Course Preferences</h3>
                            <p className="text-xs text-gray-400">
                                Tell us how you'd like to participate
                            </p>
                        </div>
                    )}

                    {(programType === "cohort" || programType === "workshop") && showSlots && slots.length > 0 && (
                        <>
                            <div>
                                <label htmlFor="selectedSlot" className="label">
                                    Select Slot to Start Course{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="selectedSlot"
                                    name="selectedSlot"
                                    value={formData.selectedSlot}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`input-field ${touched.selectedSlot && errors.selectedSlot
                                        ? "border-red-500"
                                        : ""
                                        }`}
                                >
                                    <option value="">Select your preferred date/slot</option>
                                    {slots.map((slot: any) => (
                                        <option key={slot.id} value={slot.name}>
                                            {slot.name} {slot.time ? `(${slot.time})` : ""}
                                        </option>
                                    ))}
                                </select>
                                {touched.selectedSlot && errors.selectedSlot && (
                                    <p className="error-text">{errors.selectedSlot}</p>
                                )}
                            </div>

                        </>
                    )}

                    {(programType === "cohort" || programType === "workshop") && (
                        <>
                            <div>
                                <label htmlFor="mode" className="label">
                                    Preferred Mode <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="mode"
                                    name="mode"
                                    value={formData.mode}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`input-field ${touched.mode && errors.mode ? "border-red-500" : ""
                                        }`}
                                >
                                    <option value="">Select mode</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                </select>
                                {touched.mode && errors.mode && (
                                    <p className="error-text">{errors.mode}</p>
                                )}
                            </div>
                        </>
                    )}

                    {programType === "workshop" && (
                        <div>
                            <label className="label">
                                Course Price <span className="text-gray-400 font-normal ml-1">(Automatic)</span>
                            </label>
                            <div className="input-field bg-gray-50 flex items-center justify-between border-gray-200">
                                <span className="text-gray-900 font-bold italic">
                                    One-time payment
                                </span>
                                <span className="text-orange-600 font-black text-xl">
                                    ₹{priceCents !== undefined ? priceCents / 100 : '---'}
                                </span>
                            </div>
                            <input type="hidden" name="plan" value={formData.plan} />
                            {touched.plan && errors.plan && (
                                <p className="error-text text-red-500 text-xs mt-1">{errors.plan}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label htmlFor="referredBy" className="label">
                            Referred By{" "}
                            <span className="text-gray-400 font-normal text-sm ml-1">
                                (Optional)
                            </span>
                        </label>
                        <input
                            type="text"
                            id="referredBy"
                            name="referredBy"
                            value={formData.referredBy}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="input-field"
                            placeholder="Enter name of person who referred you"
                        />
                    </div>

                    {errors.submit && (
                        <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
                            <p className="text-red-700 text-sm">{errors.submit}</p>
                        </div>
                    )}

                    <div className="md:col-span-2 pt-4">
                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg
                                        className="inline-block mr-2 w-5 h-5 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    {assessmentRequired ? 'Continue to Assessment' : (priceCents && priceCents > 0 ? 'Continue to Payment' : 'Complete Registration')}
                                    <svg
                                        className="inline-block ml-2 w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegistrationStep;
