# Course Platform Design Guidelines

These guidelines summarise the visual language used across the SPA so new components match the rest of the experience and external reviewers (or LLMs) understand the intent behind the Tailwind tokens.

## 1. Visual Principles
1. **High-contrast hero sections** – dark backgrounds (#000000) with warm accent highlights (#bf2f1f, #f8f1e6) and subtle gradient lines borrowed from the CourseDetails hero.
2. **Education-first tone** – layouts mimic Coursera/Udemy (clean typography, well-defined whitespace, minimal distractions) with celebratory touches (progress beams, shimmering gradients) reserved for moments of delight.
3. **Responsive-first** – every major layout (landing hero, CourseDetails timeline, player sidebar, tutor dock) collapses gracefully on narrow viewports.
4. **Accessible interactions** – buttons, toasts, and prompts use at least AA contrast; questionnaire answers now render in solid black text so copy is visible even before hover.

## 2. Color Tokens
| Token | Light Mode | Usage |
| --- | --- | --- |
| `--background` | #f8f1e6 | Body backgrounds, neutral cards |
| `--foreground` | #000000 | Primary text |
| `--primary` | #bf2f1f | CTAs, hero chip borders, quiz state badges |
| `--muted` | #4a4845 | Secondary text, helper labels |
| `--sidebar` | rgba(8, 8, 8, 0.9) | Course player sidebar background |
| Persona modal | #f6f2eb base, #000 text | Ensures questionnaire options remain legible |

Dark mode relies on Tailwind's class toggles and mirrors the same hues at higher luminance: backgrounds shift to #000000, text to #f8f1e6, while accent reds stay saturated.

## 3. Typography
- **Primary font**: Inter (weights 400-800) for headings and body copy.
- **Code/monospace**: JetBrains Mono used sparingly for inline code or CLI snippets inside docs.
- Headings emphasise tight tracking and uppercase micro labels (e.g., certificate CTA, MetaLearn modal).

## 4. Layout Patterns
- **Landing & CourseDetails** – large left-aligned hero text with background line art, CTA buttons aligned to the grid, skills badges as pill buttons.
- **Course player** – two-column layout: resizable sidebar (search, progress, module accordion) and main content area with LessonTabs, video embeds, study material cards, and tutor/chat panel.
- **MetaLearn Protocol modal** – glassmorphism card with bold typography, red highlights, and a two-button footer (Accept vs Not ready).
- **Study persona dialog** – stacked questionnaire cards with pill buttons and a footer containing “See my study style”, “Maybe later”, and “Use this style”. Buttons gain gradient fills on hover.
- **Tutor dock** – floating card with blurred background, message bubbles (muted background + gradient border), suggestion chips, and warning banners for quota/cooldown messages.

## 5. Components
- **Buttons** – follow shadcn variants (`primary`, `secondary`, `ghost`, `outline`). Icon buttons adopt circular shapes with drop shadows for hero CTAs.
- **Inputs** – rounded corners, subtle border + inset shadow, leading icon for search (CourseSidebar).
- **Badges** – uppercase labels with pill shapes indicating preview/free/locked states.
- **Progress indicators** – linear progress bars for module completion; quiz cards show status badges (`Locked`, `Unlocked`, `Passed`).

## 6. Motion & Micro-interactions
- Use soft easing (`transition-all duration-200`) for hover/press states.
- Sidebar buttons animate rotation on chevrons, persona chips pulse on selection, and certificate actions rise on hover.
- Skeletons appear when hydrating course data or processing OAuth callbacks; keep them subtle to avoid distracting the learner.

## 7. Accessibility Notes
- Minimum 16px body copy with 1.5 line height in reading contexts.
- Interactive elements expose `aria-label`/`aria-pressed` (e.g., sidebar completion toggles) and keyboard handlers for Enter/Space.
- Modal dialogs trap focus (shadcn dialog primitives) and provide ESC/backdrop dismissal.
- Tutor errors report descriptive messages (401 session expired, 429 prompt limit reached, 500 fallback text) rather than generic "Something wrong" alerts.

These practices keep the application cohesive and make it easy for additional contributors (human or AI) to extend the UI without diverging from the existing experience.
