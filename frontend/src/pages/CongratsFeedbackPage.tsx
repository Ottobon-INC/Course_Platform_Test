import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Check } from "lucide-react";

const CongratsFeedbackPage = () => {
  const { id: courseKey } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation(`/course/${courseKey}/congrats/certificate`);
    }, 2000);
    return () => clearTimeout(timer);
  }, [courseKey, setLocation]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #244855 0%, #874F41 100%)" }}>
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E64833]">
          <Check size={40} color="#FBE9D0" />
        </div>
        <h1 className="text-3xl font-bold text-[#FBE9D0]">Thank you for your feedback!</h1>
        <p className="mt-4 text-lg text-[#90AEAD]">Redirecting to your certificate...</p>
      </div>
    </div>
  );
};

export default CongratsFeedbackPage;
