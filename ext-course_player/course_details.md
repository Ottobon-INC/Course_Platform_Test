# Component Specification: LandingPage

## 1. Project Context & Architecture
*   **File Path:** `components/LandingPage.tsx`
*   **Nature:** Self-contained / Standalone.
*   **External Dependencies:** `lucide-react`, `react`.
*   **Styling Strategy:** Hardcoded Hex Codes (No utility classes reliance, specific to MetaLearn theme).
    *   `bg-[#000000]` (Black)
    *   `bg-[#f8f1e6]` (Cream)
    *   `bg-[#bf2f1f]` (Red)
    *   `bg-[#4a4845]` (Gray)
*   **Injected CSS:** The component injects a `<style>` tag for `@keyframes fade-in` animation used in the accordion.

---

## 2. Internal Data Structures & Constants
*(These are defined CONSTs inside the file, not imports)*

1.  **`COURSE_DATA`:**
    *   A constant object containing the course Title ("AI Engineer Bootcamp") and 6 Modules.
    *   Modules 1 & 2 have explicit submodules (Video/Quiz).
    *   Modules 3-6 use a helper function `generateModuleContent` to populate placeholder data.

2.  **Types:**
    *   `SubModule`: { id, title, duration, type ('video'|'quiz') }
    *   `Module`: { id, title, submodules, locked }
    *   `CourseData`: { title, modules }

---

## 3. Sub-Component: `ProtocolModal`
*(Defined internally within `LandingPage.tsx`)*

**Role:** A strict, immersive modal that forces the user to acknowledge the difficulty of the course before enrolling.

### **Props Interface**
*   `isOpen` (boolean)
*   `onClose` (function)
*   `onAccept` (function)

### **Visual Implementation**
1.  **Backdrop:** Fixed, `inset-0`, `z-50`, `bg-[#000000]/90`, `backdrop-blur-sm`.
2.  **Card Container:** `max-w-lg`, `bg-[#f8f1e6]`, `rounded-xl`, `shadow-2xl`, `border-2 border-[#000000]`.
3.  **Header Section:**
    *   Background: `bg-[#000000]` (Text: White).
    *   Icon: `<Lock>` centered in a circle (`bg-[#bf2f1f]/20`, `border border-[#bf2f1f]`).
    *   Title: "The MetaLearn Protocol".
    *   Subtitle: "Strict Enrollment Validation".
4.  **Body Section:**
    *   **Warning Text:** "Are you ready to commit? This is not just a video course."
    *   **Rules Box:** `bg-white/50`, `border border-[#4a4845]/30`, `rounded-lg`.
        *   **Rule 1:** `<ShieldCheck>` -> "Structured Path: 6 Modules... No skipping."
        *   **Rule 2:** `<AlertTriangle>` (Red) -> "The Gauntlet: Mandatory Quiz... Score < 70%..."
        *   **Rule 3:** `<CheckCircle2>` -> "Certification: Issued ONLY upon 100% completion."
5.  **Actions:**
    *   **Accept Button:** `bg-[#bf2f1f]`, `hover:bg-[#a62619]`, `w-full`, `shadow-lg`, `active:scale-95`. Text: "I Accept the Challenge & Start Learning".
    *   **Decline Button:** Text only (`text-[#4a4845]`), "I'm not ready yet".

---

## 4. Main Component: `LandingPage`

### **State Management**
*   `isModalOpen` (boolean): Controls the visibility of the internal `ProtocolModal`.
*   `expandedModules` (number[]): Array of IDs for currently open accordion items. **Default:** `[1]`.

### **Logic Handlers**
*   `toggleModule(id)`: Adds ID if missing, removes if present.
*   `handleExpandAll()`:
    *   If current length matches total modules -> Clear array (Collapse all).
    *   Else -> Set array to all module IDs (Expand all).

### **Render Structure**

#### **A. Navbar (`<nav>`)**
*   **Position:** Sticky `top-0`, `z-40`, `bg-[#000000]`, `border-b border-[#4a4845]`.
*   **Logo:** "Meta" (White) + "Learn" (Red). Font Extrabold.
*   **Links:** "Curriculum", "Mentors", "Reviews" (Hidden on mobile).

#### **B. Hero Section (`<header>`)**
*   **Background:** `bg-[#000000]`.
*   **Visual Background (The "Liquid Ribbon"):**
    *   **Container:** Absolute `inset-0`, `z-0`, `opacity-40`.
    *   **SVG Defs:**
        *   `fluidGradient`: Linear (Left Black/Transparent -> Right `#bf2f1f` opacity 0.9).
        *   `shineGradient`: Linear (Cream highlights, opacity 0.6).
        *   `glassGlow`: Gaussian Blur (Deviation 15).
    *   **SVG Paths:**
        1.  **Base Flow:** Filled with `fluidGradient`, blurred.
        2.  **Top Ribbon:** No fill, Stroke `fluidGradient` (Width 120), `mix-blend-screen`.
        3.  **Top Overlay:** Stroke `shineGradient` (Width 20), `mix-blend-overlay`.
        4.  **Bottom Ribbon:** Intersecting path, similar logic.
*   **Foreground Content (Z-Index 10):**
    *   **Badge:** "New for 2025" (`bg-[#4a4845]`, text-cream).
    *   **H1:** "The AI Engineer Course 2025: **Complete Bootcamp**" (Red accent).
    *   **Stats Row:** 4.8 Rating (5 Stars), 148,000 Students, Updated 11/2025.
    *   **Features:** Video hours, Exercises, Articles.
    *   **CTA Block:**
        *   Button: "Enroll Now" (Triggers internal `setIsModalOpen(true)`).
        *   Price: ₹499 (Strike ₹3,999).

#### **C. "What you'll learn" Grid**
*   **Layout:** `grid md:grid-cols-3`.
*   **Left Column (Outcomes):**
    *   List of 3 items. Bullet point is a Red Circle with a White `<Check>`.
    *   Text: "Fundamental concepts...", "Build Generative AI apps...", "Python & Flask...".
*   **Right Column (Skills Tags):**
    *   Container: `space-y-6`. Header: "Skills you'll gain".
    *   **Tags:** `bg-white`, `border-2 border-[#000000]`, Uppercase, Bold.
    *   **Hover Effect:** Invert colors (`bg-[#000000]`, `text-white`).

#### **D. Course Content Accordion**
*   **Container:** `bg-white`, `border-2 border-[#000000]`, `rounded-xl`, `p-8`.
*   **Controls Header:** Title + "Expand/Collapse all sections" button (`text-[#bf2f1f]`).
*   **Module Item:**
    *   **Wrapper:** `bg-[#f8f1e6]`, `border border-[#000000]`, `rounded-lg`.
    *   **Head:** Clickable. Contains Rotatable `<ChevronDown>`, Title, Duration, Lock Icon (if locked).
    *   **Body (Submodules):**
        *   Visible only if ID in `expandedModules`.
        *   Animation: `animate-fade-in` (Defined in injected styles).
        *   **Row Item:** Icon (`PlayCircle` or `Lightbulb`), Title (Red/Bold if Quiz), Duration (if video), Badge "Mandatory" (if Quiz).

### **Interaction Flow**
1.  User lands on page.
2.  Clicks "Enroll Now".
3.  `ProtocolModal` appears (rendered internally).
4.  User clicks "I Accept...".
5.  `onEnroll` prop is called (Switching view in parent App).