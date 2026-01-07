import React from "react";

export type SimulationPayload = {
  title: string;
  body: unknown;
};

type NormalizedStep = {
  title: string;
  challenge?: string;
  task?: string;
};

type NormalizedSimulation = {
  scenario?: string;
  goal?: string;
  overview?: string;
  contextStory?: string;
  constraints: string[];
  deliverables: string[];
  validationChecklist: string[];
  commonFailureModes: string[];
  estimatedTimeMinutes?: number;
  dependencyFromPrevious?: string | null;
  progressionNote?: string;
  steps: NormalizedStep[];
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const normalizeSimulation = (simulation: SimulationPayload): NormalizedSimulation => {
  const raw = simulation.body as Record<string, unknown> | null;
  const scenario = typeof raw?.scenario === "string" ? raw.scenario : undefined;
  const goal = typeof raw?.goal === "string" ? raw.goal : undefined;
  const overview = typeof raw?.overview === "string" ? raw.overview : undefined;
  const contextStory = typeof raw?.context_story === "string" ? raw.context_story : undefined;
  const constraints = toStringArray(raw?.constraints);
  const deliverables = toStringArray(raw?.deliverables);
  const validationChecklist = toStringArray(raw?.validation_checklist);
  const commonFailureModes = toStringArray(raw?.common_failure_modes);
  const estimatedTimeMinutes =
    typeof raw?.estimated_time_minutes === "number" ? raw.estimated_time_minutes : undefined;
  const dependencyFromPrevious =
    typeof raw?.dependency_from_previous === "string" || raw?.dependency_from_previous === null
      ? (raw.dependency_from_previous as string | null)
      : undefined;
  const progressionNote = typeof raw?.progression_note === "string" ? raw.progression_note : undefined;
  const stepsSource = Array.isArray(raw?.steps) ? raw?.steps : [];
  const steps = stepsSource
    .map((entry, index) => {
      if (typeof entry === "string") {
        const trimmed = entry.trim();
        if (!trimmed) {
          return null;
        }
        return { title: `Step ${index + 1}`, task: trimmed };
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const node = entry as Record<string, unknown>;
      const title =
        typeof node.title === "string" && node.title.trim().length > 0
          ? node.title.trim()
          : `Scenario ${index + 1}`;
      const challenge = typeof node.challenge === "string" ? node.challenge : undefined;
      const task = typeof node.task === "string" ? node.task : undefined;
      return { title, challenge, task };
    })
    .filter((step): step is NormalizedStep => Boolean(step));

  return {
    scenario,
    goal,
    overview,
    contextStory,
    constraints,
    deliverables,
    validationChecklist,
    commonFailureModes,
    estimatedTimeMinutes,
    dependencyFromPrevious,
    progressionNote,
    steps,
  };
};

export const SimulationExercise: React.FC<{ simulation: SimulationPayload }> = ({ simulation }) => {
  const normalized = normalizeSimulation(simulation);
  return (
    <div className="mt-8 rounded-[32px] border border-[#e8e1d8] bg-white shadow-lg shadow-[#000000]/5">
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#E5583E] font-semibold mb-2">Simulation Exercise</p>
          <h3 className="text-2xl font-black text-[#1E3A47]">{simulation.title}</h3>
          <div className="mt-3 space-y-3">
            {normalized.scenario && (
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#E5583E]/80 font-semibold">Scenario</p>
                <p className="text-base sm:text-lg text-[#4a4845] leading-relaxed">{normalized.scenario}</p>
              </div>
            )}
            {normalized.goal && (
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#E5583E]/80 font-semibold">Goal</p>
                <p className="text-base sm:text-lg text-[#4a4845] leading-relaxed">{normalized.goal}</p>
              </div>
            )}
            {normalized.contextStory && (
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#E5583E]/80 font-semibold">Context</p>
                <p className="text-base sm:text-lg text-[#4a4845] leading-relaxed">{normalized.contextStory}</p>
              </div>
            )}
            {normalized.overview && (
              <p className="text-base sm:text-lg text-[#4a4845] leading-relaxed">{normalized.overview}</p>
            )}
            {typeof normalized.estimatedTimeMinutes === "number" && (
              <p className="text-sm text-[#4a4845]/80">
                Estimated time: {normalized.estimatedTimeMinutes} minutes
              </p>
            )}
            {normalized.dependencyFromPrevious && (
              <p className="text-sm text-[#4a4845]/80">
                Depends on: {normalized.dependencyFromPrevious}
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-4">
          {normalized.steps.map((step, index) => (
            <div key={`${step.title}-${index}`} className="rounded-2xl border border-[#f2ebe0] bg-[#fff8f4] p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-[#E5583E]/80 font-semibold">Step {index + 1}</p>
              <h4 className="text-lg font-bold text-[#1E3A47] mt-1">{step.title}</h4>
              {step.challenge && <p className="text-sm text-[#4a4845]/80 mt-2 leading-relaxed">{step.challenge}</p>}
              {step.task && (
                <div className="mt-3 rounded-xl bg-white border border-[#f5c4b6] p-3 text-sm text-[#782f1b]">
                  <span className="font-semibold text-[#C03520]">Task:</span> {step.task}
                </div>
              )}
            </div>
          ))}
        </div>
        {(normalized.constraints.length > 0 ||
          normalized.deliverables.length > 0 ||
          normalized.validationChecklist.length > 0 ||
          normalized.commonFailureModes.length > 0 ||
          normalized.progressionNote) && (
          <div className="space-y-4">
            {normalized.constraints.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#E5583E]/80 font-semibold">Constraints</p>
                <ul className="mt-2 list-disc pl-6 text-sm text-[#4a4845]">
                  {normalized.constraints.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {normalized.deliverables.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#E5583E]/80 font-semibold">Deliverables</p>
                <ul className="mt-2 list-disc pl-6 text-sm text-[#4a4845]">
                  {normalized.deliverables.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {normalized.validationChecklist.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#E5583E]/80 font-semibold">
                  Validation checklist
                </p>
                <ul className="mt-2 list-disc pl-6 text-sm text-[#4a4845]">
                  {normalized.validationChecklist.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {normalized.commonFailureModes.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#E5583E]/80 font-semibold">
                  Common failure modes
                </p>
                <ul className="mt-2 list-disc pl-6 text-sm text-[#4a4845]">
                  {normalized.commonFailureModes.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {normalized.progressionNote && (
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#E5583E]/80 font-semibold">
                  Progression note
                </p>
                <p className="mt-2 text-sm text-[#4a4845]">{normalized.progressionNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationExercise;
