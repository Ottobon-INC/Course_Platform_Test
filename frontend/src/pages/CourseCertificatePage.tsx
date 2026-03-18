import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Trophy, ArrowLeft } from "lucide-react";
import { buildApiUrl } from "@/lib/api";
import { ensureSessionFresh, readStoredSession } from "@/utils/session";
import logoImage from "@/logo.png";

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

const buildCertificateId = (courseName: string, issuedAt: string | null) => {
  const courseSeed = courseName
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase()
    .padEnd(6, "X");
  const dateSeed = issuedAt ? new Date(issuedAt).toISOString().slice(0, 10).replace(/-/g, "") : "NA";
  return `OTL-${dateSeed}-${courseSeed}`;
};

const CertificateFrame = ({
  userName,
  courseName,
  issuedAt,
}: {
  userName: string;
  courseName: string;
  issuedAt: string | null;
}) => {
  const certificateId = buildCertificateId(courseName, issuedAt);

  return (
    <div className="relative w-full max-w-5xl">
      <div className="relative aspect-[1.414/1] overflow-hidden rounded-[26px] border border-[#d8b87a]/60 bg-[#f7efdf] shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(230,72,51,0.22),transparent_32%),radial-gradient(circle_at_88%_82%,rgba(36,72,85,0.2),transparent_36%),linear-gradient(135deg,#f9f2e7_0%,#f4e8d6_52%,#efe0cc_100%)]" />
        <div className="absolute -left-28 top-[-130px] h-[360px] w-[900px] rotate-[14deg] bg-[linear-gradient(90deg,rgba(230,72,51,0.22),rgba(230,72,51,0.03)_65%,transparent)]" />
        <div className="absolute -right-28 bottom-[-130px] h-[280px] w-[850px] -rotate-[12deg] bg-[linear-gradient(90deg,rgba(36,72,85,0.18),rgba(36,72,85,0.02)_58%,transparent)]" />

        <div className="absolute inset-4 rounded-[22px] border border-[#caa96a]/65" />
        <div className="absolute inset-7 rounded-[20px] border border-[#d9ba80]/40" />

        <div className="relative z-10 flex h-full flex-col px-8 pb-8 pt-6 text-[#1f2b2e] sm:px-12 sm:pb-10 sm:pt-8">
          <div className="flex items-start justify-between gap-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d8b87a] bg-[#fff6e8] shadow-[0_6px_18px_rgba(0,0,0,0.12)] sm:h-16 sm:w-16">
                <img src={logoImage} alt="OttoLearn" className="h-8 w-8 object-contain sm:h-10 sm:w-10" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#874F41] sm:text-xs">OttoLearn</p>
                <p className="text-[10px] font-medium text-[#5f6a68] sm:text-xs">Career Accelerator Platform</p>
              </div>
            </div>
            <p className="rounded-full border border-[#d4b072]/70 bg-[#fff6e6]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f4f2d] sm:px-4 sm:text-xs">
              {certificateId}
            </p>
          </div>

          <div className="mt-4 flex-1 text-center sm:mt-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#874F41] sm:text-xs">Certificate Of Completion</p>
            <h2
              className="mt-2 text-[24px] font-bold leading-tight text-[#1f2b2e] sm:mt-3 sm:text-[42px]"
              style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', 'Georgia', serif" }}
            >
              This is to certify that
            </h2>

            <p
              className="mx-auto mt-2 w-[90%] border-b border-[#1f2b2e]/28 pb-2 text-[25px] font-semibold text-[#0f232d] sm:mt-5 sm:w-[82%] sm:text-[48px]"
              style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', 'Georgia', serif" }}
            >
              {userName}
            </p>

            <p className="mt-3 text-[13px] font-medium text-[#3b4f56] sm:mt-4 sm:text-xl">has successfully completed the on-demand program</p>

            <p
              className="mx-auto mt-2 w-[92%] text-[17px] font-semibold leading-tight text-[#13242d] sm:mt-4 sm:w-[78%] sm:text-[33px]"
              style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', 'Georgia', serif" }}
            >
              {courseName}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#1f2b2e]/18 pt-3 sm:mt-6 sm:pt-5">
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6a787d]">Date Issued</p>
              <p className="mt-1 text-xs font-semibold text-[#20343b] sm:text-sm">{formatIssuedDate(issuedAt) || "Pending date"}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6a787d]">Authorized Signature</p>
              <p
                className="mt-1 text-lg font-medium text-[#26343a] sm:text-2xl"
                style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', 'Georgia', serif" }}
              >
                OttoLearn Board
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CourseCertificatePage = () => {
  const { id: courseKey } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const session = useMemo(() => readStoredSession(), []);
  const fallbackName = useMemo(() => session?.fullName || session?.email || "Learner", [session]);

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
    window.print();
  };

  return (
    <div className="min-h-screen print:bg-white" style={{ background: "linear-gradient(135deg, #244855 0%, #874F41 100%)" }}>
      <style>
        {`
          @media print {
            .certificate-print-hide {
              display: none !important;
            }

            #certificate-print-area {
              margin: 0 !important;
              max-width: none !important;
              width: 100% !important;
            }
          }
        `}
      </style>

      <div className="px-4 py-12 sm:px-6">
        <button
          type="button"
          onClick={() => setLocation(`/ondemand/${courseKey}/learn/start`)}
          className="certificate-print-hide mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-[#FBE9D0]/80 transition hover:border-white/40 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to course overview
        </button>

        <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-8 text-center print:space-y-4">
          <div className="certificate-print-hide flex h-20 w-20 items-center justify-center rounded-full bg-[#FBE9D0]">
            <Trophy size={48} color="#E64833" />
          </div>

          <div className="certificate-print-hide space-y-3">
            <p className="text-xs uppercase tracking-[0.6em] text-[#F5C26B]">Certificate</p>
            <h1 className="text-4xl font-black text-[#FBE9D0] drop-shadow-lg sm:text-5xl">Congratulations!</h1>
            <p className="text-lg text-[#90AEAD]">You have successfully completed</p>
            <h2 className="text-2xl font-semibold text-[#FBE9D0]">{courseName}</h2>
            <p className="text-sm text-[#90AEAD]">Download your certificate and showcase your accomplishment</p>
          </div>

          <div id="certificate-print-area" className="w-full">
            <CertificateFrame userName={userName} courseName={courseName} issuedAt={issuedAt} />
          </div>

          <div className="certificate-print-hide flex flex-col gap-4 pt-6 text-[#FBE9D0] sm:flex-row">
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
