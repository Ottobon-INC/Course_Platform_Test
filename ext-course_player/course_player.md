- LearningPlayer_Specification.md

This file describes the LMS interface. *CRITICAL:* This component is completely self-contained. It contains its own types, constants, data, and CSS. It does *not* import from ../constants or ../types.

```markdown
# Component Specification: LearningPlayer

## 1. Project Context & Architecture
*   *File Path:* components/LearningPlayer.tsx
*   *Nature:* Self-contained / Standalone.
*   *Styling Strategy:* Hardcoded Hex Codes (No utility classes reliance).
    *   Primary Black: #000000
    *   Primary Cream: #f8f1e6
    *   Accent Red: #bf2f1f
    *   Gray: #4a4845
*   *Injected CSS:* The component injects a <style> tag for:
    *   input[type=range] styling (Red thumb, Gray track).
    *   @keyframes fade-in.

---

## 2. Internal Data Structures
(These are defined CONSTs inside the file, not imports)

1.  **COURSE_DATA:**
    *   6 Modules.
    *   Module 1 & 2 fully populated with Submodules (Videos + Quizzes).
    *   Modules 3-6 generated via helper.
2.  **QUIZ_POOL:**
    *   Array of 5 QuizQuestion objects (LLM concepts, Vectors, RAG).
3.  **STUDY_MATERIAL_TEXT:**
    *   Markdown string containing "Introduction to LLMs", "Setting up Environment".

---

## 3. State Management Architecture

### *Navigation State*
*   activeModuleId (number): Currently selected module.
*   activeSubId (string): Unique ID of current content.
*   sidebarOpen (boolean): Visibility of left nav.
*   expandedModules (number[]): Which sidebar modules are open.

### *Player State*
*   isPlaying (boolean): Toggles video progress.
*   progress (number): 0-100 float.
*   isFullScreen (boolean): Hides sidebar/padding for "Cinema Mode".
*   isReadingMode (boolean): Swaps Video UI for Study Text UI.
*   isControlsVisible (boolean): Auto-hides video controls after 3s.

### *The Gauntlet (Quiz) State*
*   isQuizMode (boolean): *Master Toggle.* Replaces Video UI with Quiz UI.
*   quizPhase: 'intro' -> 'active' -> 'result'.
*   currentQuestions: Random subset of 3 questions.
*   userAnswers: Array of indices [-1, -1, -1].
*   quizTimer: Integer (60s countdown).

### *Floating Widgets State*
*   *Types:* chat, notes, study.
*   *State Objects:* rect: { x, y, width, height, initialized } + isOpen boolean.
*   *Logic:* useRef based dragInfo tracking startX, mouseY, resize-direction.

---

## 4. Render Logic & Visuals

### *A. Sidebar (Left)*
*   *Container:* Flex column, bg-[#000000], border-r border-[#4a4845].
*   *Width:* Transition between w-80 (Open) and w-12 (Closed).
*   *Progress Bar:* Top section. Red (#bf2f1f) fill based on Module count.
*   *List:*
    *   *Header:* Module Title (Uppercase, 10px).
    *   *Items:* Button list.
    *   *Active Item:* bg-[#bf2f1f], text-white.
    *   *Disabled State:* If isQuizMode is active, items are opacity-40 cursor-not-allowed.
*   *Minimized View:* Shows large Red square with current Module ID.

### *B. Main Stage (Right)*

#### *Scenario 1: Quiz Mode ("The Gauntlet")*
*   *Wrapper:* bg-[#000000], Red Gradient Glow.
*   *Card:* bg-[#f8f1e6], border-2 border-[#bf2f1f].
*   *Phases:*
    1.  *Intro:* Large Lock Icon. List of Rules (3 Questions, 60s, Pass/Fail). "I Accept" Button.
    2.  *Active:*
        *   Header: "Question X/3" | Timer (Pulses Red if < 10s).
        *   Question List: Options are clickable tiles (bg-white -> bg-black on select).
        *   Submit Button: Disabled until all answered.
    3.  *Result:*
        *   Score Display.
        *   Review: List of questions with "Correct"(Green)/"Wrong"(Red) labels.
        *   *Pass (>=2):* "Unlock Next Module" (calls handleNextLesson).
        *   *Fail:* "Restart Module 1" (Resets state completely).

#### *Scenario 2: Video Player*
*   *Wrapper:* bg-black. Supports isFullScreen.
*   *Video:* Image Placeholder (opacity-90).
*   *Next Lesson Overlay:* Appears when progress >= 100. 5s Countdown. "Continue" button.
*   *Controls Bar (Bottom):*
    *   Background: Gradient Black to Transparent.
    *   *Slider:* Custom Red-thumb range input.
    *   *Tools:*
        *   Play/Pause.
        *   *Widgets Toggles:* Book (Study), FileText (Notes), MessageSquare (Chat).
        *   *Cinema Toggle:* Maximize/Minimize.

#### *Scenario 3: Reading Mode*
*   Appears below video if isReadingMode is true.
*   Style: bg-[#f8f1e6], text-black.
*   Content: Parsed markdown from STUDY_MATERIAL_TEXT.

### *C. Floating Widgets (Z-Index 60)*
*   *Common Behavior:* Draggable header, Resizable edges/corners.
*   *Visuals:* Backdrop blur, shadow-2xl.
*   *Specifics:*
    1.  *AI Chat:* Dark theme (bg-black/95). Header Red. Simulated AI reply after 800ms.
    2.  *Notes:* Light theme (bg-[#f8f1e6]). Header Black. <textarea> content.
    3.  *Study Widget:* Light theme. Reusable reading content in floating window.
*   *Floating Action Button (FAB):* Bottom Right. Red Circle. Toggles Chat.

### *D. Interactions*
*   *Auto-Play:* Video progress increments 0.1 every 50ms if playing.
*   *Drag Logic:* Global mousemove listener on window updates specific widget rect based on dragInfo.current.
*   *Controls Auto-Hide:* handleGlobalMouseMove sets timeout to hide controls after 3s.

---

## 5. Logic Constraints
1.  *Quiz Locking:* You cannot navigate away from the Quiz (via sidebar) while it is active. You must submit or finish.
2.  *Widget Centering:* Widgets calculate window.innerWidth / 2 on their first open to center themselves.
3.  *Course Completion:* If the last submodule of the last module is finished, triggers "Course Complete" alert.