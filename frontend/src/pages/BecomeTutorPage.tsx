import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Presentation, Send } from "lucide-react";
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
  expertiseArea: "",
  proposedCourseTitle: "",
  courseLevel: "",
  deliveryFormat: "",
  availability: "",
  experienceYears: "",
  outline: "",
  motivation: "",
};

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
        if ((err as Error).name === "AbortError") {
          return;
        }
        console.error("Failed to fetch tutor page", err);
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
  const heroHeading = "Add your course to MetaLearn and start earning.";
  const heroSubtitle =
    "Share your course idea, drop your outline, and we’ll co-produce the cohort with mentors, editors, and launch support.";
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
        expertiseArea: formData.expertiseArea.trim(),
        proposedCourseTitle: formData.proposedCourseTitle.trim(),
        courseLevel: formData.courseLevel.trim() || undefined,
        deliveryFormat: formData.deliveryFormat.trim() || undefined,
        availability: formData.availability.trim() || undefined,
        experienceYears: formData.experienceYears ? Number(formData.experienceYears) : undefined,
        outline: formData.outline.trim(),
        motivation: formData.motivation.trim(),
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
        description: "Our partnerships team will respond within 2-3 business days.",
      });
    } catch (err) {
      console.error("Failed to submit tutor application", err);
      const message = err instanceof Error ? err.message : "Unexpected error";
      setSubmitError(message);
      toast({
        variant: "destructive",
        title: "Could not submit",
        description: "Please review the form and try again.",
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
      <section className="space-y-8 rounded-3xl border border-slate-100 bg-white/95 p-6 sm:p-10 shadow-sm">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">Teach with MetaLearn</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{heroHeading}</h1>
          <p className="text-base text-slate-600">{heroSubtitle}</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Revenue share up to 60%
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Studio & editing support
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Launch help + analytics
            </span>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              minLength={3}
              className={inputClassName}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={inputClassName}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 555 555 0123"
                className={inputClassName}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="expertiseArea">Expertise area</Label>
              <Input
                id="expertiseArea"
                name="expertiseArea"
                value={formData.expertiseArea}
                onChange={handleChange}
                required
                minLength={3}
                className={inputClassName}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="proposedCourseTitle">Proposed course title</Label>
              <Input
                id="proposedCourseTitle"
                name="proposedCourseTitle"
                value={formData.proposedCourseTitle}
                onChange={handleChange}
                required
                minLength={4}
                className={inputClassName}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="courseLevel">Target level</Label>
              <Input
                id="courseLevel"
                name="courseLevel"
                value={formData.courseLevel}
                onChange={handleChange}
                placeholder="Beginner"
                className={inputClassName}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="deliveryFormat">Delivery format</Label>
              <Input
                id="deliveryFormat"
                name="deliveryFormat"
                value={formData.deliveryFormat}
                onChange={handleChange}
                placeholder="Cohort, self-paced, hybrid"
                className={inputClassName}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="experienceYears">Years of teaching</Label>
              <Input
                id="experienceYears"
                name="experienceYears"
                type="number"
                min="0"
                max="60"
                value={formData.experienceYears}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="availability">Availability & timeline</Label>
            <Input
              id="availability"
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              placeholder="e.g., 6 weeks from now, evenings only"
              className={inputClassName}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="outline">Course outline (modules, projects)</Label>
            <Textarea
              id="outline"
              name="outline"
              rows={4}
              value={formData.outline}
              onChange={handleChange}
              required
              minLength={20}
              className={textareaClassName}
            />
            <p className="text-xs text-slate-500">Minimum 20 characters.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="motivation">Motivation & teaching approach</Label>
            <Textarea
              id="motivation"
              name="motivation"
              rows={4}
              value={formData.motivation}
              onChange={handleChange}
              required
              minLength={20}
              className={textareaClassName}
            />
            <p className="text-xs text-slate-500">Minimum 20 characters.</p>
          </div>
          {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}
          {submissionId ? (
            <p className="text-sm text-emerald-600">
              Application #{submissionId.slice(0, 8)} received. We will reply over email shortly.
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-300/40 hover:from-emerald-400 hover:to-teal-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit application"}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-100 bg-white p-6 sm:grid-cols-3">
        {(isLoadingContent ? Array.from({ length: 3 }) : steps).map((step, index) =>
          isLoadingContent ? (
            <Skeleton key={`step-skeleton-${index}`} className="h-36 rounded-2xl bg-slate-100" />
          ) : (
            <div key={step.title} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-emerald-600">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Step {index + 1}</span>
              </div>
              <p className="text-base font-semibold text-slate-900">{step.title}</p>
              <p className="text-sm text-slate-600">{step.description}</p>
            </div>
          ),
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {(isLoadingContent ? Array.from({ length: 3 }) : perks).map((perk, index) =>
          isLoadingContent ? (
            <Skeleton key={`perk-skeleton-${index}`} className="h-32 rounded-2xl bg-slate-100" />
          ) : (
            <Card key={perk.title} className="border-slate-100 bg-white shadow-sm">
              <CardContent className="space-y-2 p-5">
                <p className="text-base font-semibold text-slate-900">{perk.title}</p>
                <p className="text-sm text-slate-600">{perk.description}</p>
              </CardContent>
            </Card>
          ),
        )}
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-100 bg-white p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">What we look for</h3>
            <p className="text-sm text-slate-600">
              Share recordings, slides, demo projects, or any proof of teaching. The stronger the evidence, the faster we launch your program.
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Presentation className="h-4 w-4 text-emerald-500" />
              Studio support
            </div>
            <p className="text-sm text-slate-600">
              We provide teleprompters, editing, captions, and producer support so you can focus on teaching.
            </p>
          </div>
          <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Cohort economics snapshot</p>
            <ul className="list-inside list-disc text-sm text-slate-600">
              <li>Average cohort size: 45 learners</li>
              <li>Avg. NPS: 63</li>
              <li>Payouts delivered monthly with analytics dashboard</li>
            </ul>
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Need inspiration?</p>
          <p>
            Browse live tracks, talk to other creators, or schedule a quick call with our partnerships team. We’ll help you shape the first module,
            record the pilot, and invite the first learners.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-100" onClick={() => setLocation("/courses")}>
              See live courses
            </Button>
            <Button className="bg-emerald-500 text-white hover:bg-emerald-400" onClick={() => setLocation("/about")}>
              Talk to us
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
