import { useState, useRef } from 'react';
import { StudentData } from '@/types/registration';
import { submitPayment } from '@/lib/registrationApi';

interface PaymentStepProps {
    onSubmit: () => void;
    studentData: StudentData;
    onBack: () => void;
}

const PaymentStep = ({ onSubmit, studentData, onBack }: PaymentStepProps) => {
    const [transactionId, setTransactionId] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                setError('File size must be less than 3MB');
                return;
            }
            setScreenshot(file);
            setError(null);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanTxId = transactionId.trim();
        if (!cleanTxId) {
            setError('Please enter the Transaction ID');
            return;
        }
        
        // Strict length range based on common payment systems (12 to 64 chars)
        if (cleanTxId.length < 12) {
            setError('Transaction ID must be at least 12 characters');
            return;
        }
        if (cleanTxId.length > 64) {
            setError('Transaction ID too long (max 64 characters)');
            return;
        }

        // Optional: Check for alphanumeric only to prevent typos with symbols
        if (!/^[a-zA-Z0-9]+$/.test(cleanTxId)) {
            setError('Transaction ID should only contain letters and numbers');
            return;
        }
        if (!screenshot) {
            setError('Please upload a screenshot of your payment');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await submitPayment(studentData.id?.toString() || '', {
                transactionId,
                screenshot,
                fullName: studentData.fullName,
                courseName: studentData.specificCourse,
                programType: studentData.programType,
                amountCents: studentData.priceCents || 0
            });
            onSubmit();
        } catch (err: any) {
            console.error('Payment submission error:', err);
            setError(err.message || 'Failed to submit payment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card max-w-2xl mx-auto animate-fadeIn">
            <div className="mb-8">
                <button
                    onClick={onBack}
                    className="text-gray-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium mb-4 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to registration
                </button>

                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment</h2>
                    <p className="text-gray-600">Complete your enrollment by making the payment below</p>
                </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-indigo-900 font-medium">Course:</span>
                    <span className="text-indigo-900 font-bold">{studentData.specificCourse}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                    <span className="text-indigo-900 font-medium">Amount to Pay:</span>
                    <span className="text-orange-600 font-black">₹{(studentData.priceCents || 0) / 100}</span>
                </div>
            </div>

            <div className="space-y-8">
                <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-2xl">
                    <h3 className="font-bold text-gray-900 mb-4">Scan QR Code to Pay</h3>
                    <div className="w-56 h-56 bg-white border border-gray-200 mx-auto mb-4 flex items-center justify-center rounded-2xl shadow-md p-4">
                        {studentData.qrImageUrl ? (
                            <img 
                                src={studentData.qrImageUrl} 
                                alt="Payment QR Code"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-center">
                                <div className="text-2xl mb-2">📸</div>
                                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">QR CODE AREA</span>
                                <div className="text-[10px] text-gray-400 mt-1">QR not configured yet</div>
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-gray-500">
                        <p className="font-bold text-gray-900 leading-tight">Merchant Name: Ottobon Academy Private Limited</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="label" htmlFor="transactionId">
                            Bank Transaction ID / UTR Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="transactionId"
                            type="text"
                            className="input-field"
                            placeholder="Enter 12-digit UPI, 17-digit PayPal, or NEFT Reference ID"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="label">
                            Upload Payment Screenshot <span className="text-red-500">*</span>
                        </label>
                        <div 
                            className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center min-h-[160px] cursor-pointer ${
                                previewUrl ? 'border-indigo-400 bg-white' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <div className="text-center w-full">
                                    <div className="relative inline-block">
                                        <img src={previewUrl} alt="Preview" className="max-h-32 rounded-lg shadow-sm" />
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScreenshot(null);
                                                setPreviewUrl(null);
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-xs text-indigo-600 mt-2 font-medium">Click to change screenshot</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">Click to upload screenshot</p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 3MB</p>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 ${
                            isSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting for Verification...
                            </>
                        ) : (
                            'Submit Payment Details'
                        )}
                    </button>
                    
                    <p className="text-center text-xs text-gray-400">
                        By submitting, you agree to our terms of service regarding enrollment.
                        Payment verification typically takes 2-4 hours.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default PaymentStep;
