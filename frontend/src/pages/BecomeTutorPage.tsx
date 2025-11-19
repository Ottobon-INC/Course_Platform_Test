import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowUpRight, CheckCircle2, Layers, Sparkles } from "lucide-react";
import { buildApiUrl } from "@/lib/api";
import type {
  PageContentEntry,
  PageContentResponse,
  TutorApplicationPayload,
  TutorApplicationResponse,
} from "@/types/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SiteLayout } from "@/components/layout/SiteLayout";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  headline: "",
  courseTitle: "",
  courseDescription: "",
  targetAudience: "",
  expertiseArea: "",
  experienceYears: "",
  availability: "",
};

const highlightCards = [
  {
    title: "AI in Web Development blueprint",
    description: "We’ll use the same production and growth playbook that scaled our flagship AI course to thousands of learners.",
  },
  {
    title: "Studio + launch crew",
    description: "Scripting, recording, post-production, launch operations, and analytics dashboards included.",
  },
];

export default function BecomeTutorPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [content, setContent] = useState<PageContentEntry | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadContent() {
      setIsLoadingContent(true);
      try {
        const response = await fetch(buildApiUrl("/pages/become-a-tutor"), { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Failed to load tutor page content");
        }
        const payload = (await response.json()) as PageContentResponse;
        setContent(payload.page);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to fetch tutor page", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingContent(false);
        }
      }
    }

    void loadContent();
    return () => controller.abort();
  }, []);

  const steps = (content?.sections.steps ?? []) as Array<{ title: string; description: string }>;
  const perks = (content?.sections.perks ?? []) as Array<{ title: string; description: string }>;

  const inputClassName =
    "h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base shadow-inner focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-0";
  const textareaClassName =
    "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base shadow-inner focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-0";

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmissionId(null);

    try {
      const payload: TutorApplicationPayload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        headline: formData.headline.trim(),
        courseTitle: formData.courseTitle.trim(),
        courseDescription: formData.courseDescription.trim(),
        targetAudience: formData.targetAudience.trim(),
        expertiseArea: formData.expertiseArea.trim(),
        experienceYears: formData.experienceYears ? Number(formData.experienceYears) : undefined,
        availability: formData.availability.trim(),
      };

      const response = await fetch(buildApiUrl("/tutor-applications"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to submit application");
      }

      const json = (await response.json()) as TutorApplicationResponse;
      setSubmissionId(json.application.id);
      setFormData(INITIAL_FORM);
      toast({
        title: "Application received",
        description: "Thanks for reaching out! We’ll respond within 3 business days.",
      });
    } catch (error) {
      console.error("Failed to submit tutor application", error);
      setSubmitError((error as Error).message ?? "Submission failed");
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: (error as Error).message ?? "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SiteLayout
      headerProps={{
        currentPath: location,
        onNavigate: (href) => setLocation(href),
        showSearch: false,
        onLoginClick: () => setLocation("/dashboard"),
      }}
      contentClassName="space-y-10"
    >
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-xl shadow-emerald-100/60">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">Teach with MetaLearn</p>
          <div className="mt-4 space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Launch the next AI learning experience.
            </h1>
            <p className="text-base text-slate-600 sm:text-lg">
              Share your signature curriculum, drop your outline, and we’ll co-produce your cohort with the same team that built our
              AI in Web Development program.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
            {["Revenue share up to 60%", "Studio + editing", "Launch ops & analytics"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          {highlightCards.map((card) => (
            <Card key={card.title} className="border border-white/70 bg-white/80 shadow-sm">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">{card.title}</p>
                  <p className="text-sm text-slate-600">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="border border-slate-200 bg-white/90 shadow-lg">
            <CardContent className="space-y-3 p-6">
              <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-600">
                <Layers className="h-4 w-4" />
                Playbook
              </div>
              {(isLoadingContent ? Array.from({ length: 2 }) : perks.slice(0, 2)).map((perk, index) => (
                <div key={`perk-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  {isLoadingContent ? (
                    <>
                      <Skeleton className="mb-2 h-4 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-900">{perk.title}</p>
                      <p className="text-sm text-slate-600">{perk.description}</p>
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="border border-slate-200 bg-white shadow-xl shadow-slate-100/70">
          <CardContent className="p-8">
            <div className="flex flex-col gap-2 pb-6">
              <h2 className="text-2xl font-semibold text-slate-900">Submit your course proposal</h2>
              <p className="text-sm text-slate-600">
                Tell us who you are and how your course will transform learners. We review every application manually.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Vanapalli Jaswanth"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={inputClassName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headline">Professional headline</Label>
                  <Input
                    id="headline"
                    name="headline"
                    placeholder="AI engineer, mentor & curriculum designer"
                    value={formData.headline}
                    onChange={handleChange}
                    className={inputClassName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@studio.dev"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClassName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone / WhatsApp</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+1 555 555 0123"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expertiseArea">Expertise area</Label>
                <Input
                  id="expertiseArea"
                  name="expertiseArea"
                  placeholder="AI coaching, product engineering, GTM strategy..."
                  value={formData.expertiseArea}
                  onChange={handleChange}
                  className={inputClassName}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course title</Label>
                  <Input
                    id="courseTitle"
                    name="courseTitle"
                    placeholder="Scaling AI copilots for the enterprise"
                    value={formData.courseTitle}
                    onChange={handleChange}
                    className={inputClassName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    name="availability"
                    placeholder="Ready to record in Dec · evenings IST"
                    value={formData.availability}
                    onChange={handleChange}
                    className={inputClassName}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceYears">Years of experience</Label>
                <Input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  min={0}
                  max={60}
                  placeholder="5"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="courseDescription">Course description</Label>
                <Textarea
                  id="courseDescription"
                  name="courseDescription"
                  rows={4}
                  placeholder="Describe the transformation learners will experience, the modules you have in mind, and the core projects."
                  value={formData.courseDescription}
                  onChange={handleChange}
                  className={textareaClassName}
                  required
                  minLength={16}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target audience</Label>
                <Textarea
                  id="targetAudience"
                  name="targetAudience"
                  rows={3}
                  placeholder="Who is this for? Mention their current role, skill gaps, and why you can help them level up."
                  value={formData.targetAudience}
                  onChange={handleChange}
                  className={textareaClassName}
                  required
                  minLength={4}
                />
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-500">
                  {submitError ? <span className="text-red-500">{submitError}</span> : "We reply within 3 business days."}
                  {submissionId ? <span className="ml-2 text-emerald-600">Ref: {submissionId}</span> : null}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-200/60 hover:bg-emerald-400"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit proposal"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <CardContent className="space-y-4 p-6">
              <div className="inline-flex items-center gap-2 text-sm text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                In good company
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold">From outline to launch</p>
                <p className="text-sm text-white/80">
                  You focus on teaching; we replicate the AI in Web Development cohort formula—content strategy, studio production,
                  landing page, payments, and community ops.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-white/80">
                {["Content strategy & scripting", "Studio-quality recording", "Analytics & growth loops"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white/80 shadow-lg">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-600">
                <Sparkles className="h-4 w-4" />
                How it works
              </div>
              <div className="space-y-3">
                {(isLoadingContent ? Array.from({ length: 3 }) : steps.slice(0, 3)).map((step, index) => (
                  <div key={`step-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    {isLoadingContent ? (
                      <>
                        <Skeleton className="mb-2 h-4 w-1/3" />
                        <Skeleton className="h-4 w-5/6" />
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-400">Step {index + 1}</p>
                        <p className="text-base font-semibold text-slate-900">{step.title}</p>
                        <p className="text-sm text-slate-600">{step.description}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </SiteLayout>
  );
}
