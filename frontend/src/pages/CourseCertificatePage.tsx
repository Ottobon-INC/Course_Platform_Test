import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Trophy, ArrowLeft } from "lucide-react";
import { buildApiUrl } from "@/lib/api";
import { ensureSessionFresh, readStoredSession } from "@/utils/session";

type CertificateSummary = {
  id: string;
  displayName: string;
  courseTitle: string;
  rating: number | null;
  feedbackText: string | null;
  issuedAt: string;
};

type CertificateResponse = {
  course?: { title?: string };
  learner?: { name?: string; email?: string };
  certificate?: CertificateSummary | null;
};

const CERTIFICATE_IMAGE_URL =
  "https://app.trickle.so/storage/public/images/usr_175de77758000001/7e0aea35-6032-47d0-92dd-c792f1d9826f.png?w=1280&h=904";

const formatIssuedDate = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const CertificateFrame = ({
  userName,
  courseName,
  issuedAt,
}: {
  userName: string;
  courseName: string;
  issuedAt: string | null;
}) => (
  <div className="relative w-full max-w-4xl">
    <div className="relative w-full aspect-[1.414/1] overflow-hidden rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${CERTIFICATE_IMAGE_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Dynamic text overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute left-[18%] top-[54%] w-[64%] text-center"
          style={{
            fontFamily: "'Times New Roman', 'Georgia', serif",
            color: "#2c2b28",
            letterSpacing: "0.02em",
          }}
        >
          <div className="text-[19px] sm:text-[22px] font-semibold leading-none">{userName}</div>
        </div>

        <div
          className="absolute left-[18%] top-[70%] w-[64%] text-center"
          style={{
            fontFamily: "'Times New Roman', 'Georgia', serif",
            color: "#2c2b28",
            letterSpacing: "0.015em",
          }}
        >
          <div className="text-[15px] sm:text-[18px] font-medium leading-none">{courseName}</div>
        </div>

        {issuedAt ? (
          <div
            className="absolute left-[18%] top-[83%] w-[64%] text-center text-[12px] sm:text-[13px]"
            style={{
              fontFamily: "'Times New Roman', 'Georgia', serif",
              color: "#2c2b28",
              letterSpacing: "0.03em",
            }}
          >
            Issued on {formatIssuedDate(issuedAt)}
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

const CourseCertificatePage = () => {
  const { id: courseKey } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const session = useMemo(() => readStoredSession(), []);
  const fallbackName = useMemo(
    () => session?.fullName || session?.email || "Learner",
    [session],
  );

  const defaultCourseTitle = "Advanced Web Development Masterclass";
  const [userName, setUserName] = useState(fallbackName);
  const [courseName, setCourseName] = useState(defaultCourseTitle);
  const [issuedAt, setIssuedAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadCertificate = async () => {
      try {
        const currentSession = await ensureSessionFresh(readStoredSession());
        const headers: HeadersInit = {};
        if (currentSession?.accessToken) {
          headers.Authorization = `Bearer ${currentSession.accessToken}`;
        }
        const res = await fetch(buildApiUrl(`/api/certificates/${courseKey}?programType=ondemand`), { headers });
        if (!res.ok) throw new Error("Unable to load certificate details");
        const payload = (await res.json()) as CertificateResponse;
        if (!mounted) return;
        const certificate = payload.certificate ?? null;
        setUserName(certificate?.displayName ?? payload.learner?.name ?? fallbackName);
        setCourseName(certificate?.courseTitle ?? payload.course?.title ?? defaultCourseTitle);
        setIssuedAt(certificate?.issuedAt ?? null);
      } catch {
        if (!mounted) return;
        setUserName(fallbackName);
      }
    };
    void loadCertificate();
    return () => {
      mounted = false;
    };
  }, [courseKey, fallbackName, defaultCourseTitle]);

  const handleDownload = () => {
    window.open(CERTIFICATE_IMAGE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #244855 0%, #874F41 100%)" }}>
      <div className="px-4 py-12 sm:px-6">
        <button
          type="button"
          onClick={() => setLocation(`/ondemand/${courseKey}/learn/start`)}
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

          <CertificateFrame userName={userName} courseName={courseName} issuedAt={issuedAt} />

          <div className="flex flex-col gap-4 pt-6 text-[#FBE9D0] sm:flex-row">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center rounded-2xl border border-[#fbe9d0]/20 bg-[#E64833] px-6 py-3 text-lg font-semibold text-[#FBE9D0] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#d23a25]"
            >
              Download Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCertificatePage;
