import { useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { Trophy, ArrowLeft } from "lucide-react";
import { readStoredSession } from "@/utils/session";

const CertificateFrame = ({ userName, courseName }: { userName: string; courseName: string }) => (
  <div
    className="relative w-full max-w-4xl aspect-[1.414/1] overflow-hidden rounded-md shadow-[0_15px_40px_rgba(0,0,0,0.4)]"
    style={{
      backgroundImage: "url(https://app.trickle.so/storage/public/images/usr_175de77758000001/7e0aea35-6032-47d0-92dd-c792f1d9826f.png?w=1280&h=904)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    <div className="absolute inset-0 flex flex-col justify-center pl-16 pr-12 sm:pl-20 sm:pr-16">
      <div className="mt-24 space-y-6 sm:mt-32">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-[#2d2d2d]/70">Awarded to</p>
          <h2 className="text-2xl font-semibold text-[#2d2d2d]" style={{ fontFamily: "serif" }}>
            {userName}
          </h2>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#2d2d2d]/70">For completing</p>
          <h3 className="text-lg font-medium text-[#2d2d2d]" style={{ fontFamily: "serif" }}>
            {courseName}
          </h3>
        </div>
      </div>
    </div>
  </div>
);

const CourseCertificatePage = () => {
  const { id: courseKey } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const session = readStoredSession();

  const userName = useMemo(() => {
    const stored = localStorage.getItem("courseCertificateName");
    return stored || session?.fullName || session?.email || "Learner";
  }, [session]);

  const courseName = useMemo(() => {
    return localStorage.getItem("courseCertificateTitle") || "Advanced Web Development Masterclass";
  }, []);

  const handlePayment = () => {
    // Example Razorpay integration — keep placeholder behavior for now
    const options = {
      key: "RAZORPAY_KEY",
      amount: "49900",
      currency: "INR",
      name: "MetaLearn Courses",
      description: "Certificate Upgrade",
      handler: (response: unknown) => {
        alert(`Payment successful: ${JSON.stringify(response)}`);
      },
    };
    if ((window as any).Razorpay) {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      alert("Razorpay SDK not loaded. Please check your internet connection.");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #244855 0%, #874F41 100%)" }}>
      <div className="px-4 py-12 sm:px-6">
        <button
          type="button"
          onClick={() => setLocation(`/course/${courseKey}`)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-[#FBE9D0]/80 transition hover:border-white/40 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to course overview
        </button>

        <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FBE9D0]">
            <Trophy size={48} color="#E64833" />
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.6em] text-[#F5C26B]">Certificate</p>
            <h1 className="text-4xl font-black text-[#FBE9D0] drop-shadow-lg sm:text-5xl">Congratulations!</h1>
            <p className="text-lg text-[#90AEAD]">You have successfully completed</p>
            <h2 className="text-2xl font-semibold text-[#FBE9D0]">{courseName}</h2>
            <p className="text-sm text-[#90AEAD]">Download your certificate and showcase your accomplishment</p>
          </div>

          <CertificateFrame userName={userName} courseName={courseName} />

          <div className="flex flex-col gap-4 pt-6 text-[#FBE9D0] sm:flex-row">
            <button
              type="button"
              onClick={handlePayment}
              className="inline-flex items-center justify-center rounded-2xl border border-[#fbe9d0]/20 bg-[#E64833] px-6 py-3 text-lg font-semibold text-[#FBE9D0] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#d23a25]"
            >
              Complete Payment
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3 text-lg font-semibold text-white transition hover:bg-white/10"
            >
              Download (Print)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCertificatePage;
