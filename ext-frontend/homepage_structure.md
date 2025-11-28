# MetaLearn Homepage UI Documentation & Integration Guide

This document provides a detailed breakdown of the `App.tsx` file structure and specific instructions for integrating your existing backend logic (OAuth, Video Player, etc.) into this new design.

## 1. File Structure Overview

The `App.tsx` file is a self-contained module that includes all necessary components for the homepage. It is structured as follows:

1.  **Imports**: React hooks, Framer Motion, and Lucide React icons.
2.  **Types**: TypeScript interfaces for `Course` and `Feature`.
3.  **Components**: Individual functional components (e.g., `Navbar`, `Hero`, `ValueProp`) defined inline.
4.  **Main App Component**: Assembles all sections.

## 2. Component Breakdown & Integration Points

Here is where you need to inject your existing logic.

### A. Navbar Component (`Navbar`)
**Location**: Lines ~30-80
**Purpose**: Top navigation and authentication triggers.

**Integration Instructions**:
- **Log In Button**:
    - **Current UI**: A static `<button>` with text "Log In".
    - **Action**: Replace the `onClick` handler or wrap the button with your existing OAuth login trigger.
    - **Code Target**:
      ```tsx
      <button className="bg-retro-salmon ...">
        Log In
      </button>
      ```
    - **Change to**:
      ```tsx
      <button onClick={handleGoogleLogin} className="bg-retro-salmon ...">
        {user ? user.name : "Log In"}
      </button>
      ```

- **Apply as Tutor**:
    - **Current UI**: Static button.
    - **Action**: Link to your tutor application route or modal.

### B. Hero Section (`Hero`)
**Location**: Lines ~140-320
**Purpose**: Main landing area with "Enroll" and "Play Video" actions.

**Integration Instructions**:
- **Enroll Button**:
    - **Current UI**: `<button> ... Enroll ... </button>`
    - **Action**: Connect to your course enrollment flow or scroll to the courses section.
    - **Code Target**:
      ```tsx
      <motion.button ... className="bg-retro-salmon ...">
        Enroll <ChevronRight size={20} />
      </motion.button>
      ```

- **Play Video Button**:
    - **Current UI**: `<button> ... Play Video ... </button>`
    - **Action**: The user mentioned an existing YouTube integration. You should replace this button's logic to open your video modal or player.
    - **Code Target**:
      ```tsx
      <motion.button ... className="bg-white/80 ...">
        <Play size={18} fill="currentColor" /> Play Video
      </motion.button>
      ```
    - **Change to**:
      ```tsx
      <motion.button onClick={() => setShowVideoModal(true)} ... >
        <Play size={18} fill="currentColor" /> Play Video
      </motion.button>
      ```

### C. Trending Courses (`TrendingCourses` & `CourseCard`)
**Location**: Lines ~1060-1160
**Purpose**: Displays list of courses.

**Integration Instructions**:
- **Data Source**:
    - **Current**: Uses a static `courses` array (Lines ~1040-1055).
    - **Action**: Replace the static `courses` array with data fetched from your backend/database. Ensure your data maps to the `Course` interface (id, title, rating, students, image, status).

- **Enroll / Waitlist Action**:
    - **Current UI**: Inside `CourseCard`, a button that says "Enroll >" or "Waitlist".
    - **Action**: Hook up the `onClick` to your cart or enrollment logic.
    - **Code Target**:
      ```tsx
      <button disabled={course.status !== 'Available'} ... >
        {course.status === 'Available' ? 'Enroll >' : 'Waitlist'}
      </button>
      ```

### D. Other Interactive Elements
- **Newsletter / Search**: The `TypewriterInput` (Lines ~82-138) is currently visual only. You can hook the input value to a real search function if needed.
- **FAQ**: The `FAQ` component (Lines ~1280-1320) uses static data. You can fetch this from a CMS if preferred.

## 3. Styling & Assets
- **Tailwind Classes**: The design relies on custom colors defined in your `tailwind.config.js` (`retro-teal`, `retro-salmon`, `retro-sage`, `retro-bg`, `retro-brown`, `retro-cyan`, `retro-yellow`). Ensure these are present.
- **Images**: The code uses Unsplash placeholders. Replace these with your actual asset URLs or dynamic images from your backend.

## 4. Summary Checklist for Codex/Developer
1.  [ ] **Copy** the full `App.tsx` content.
2.  [ ] **Preserve** your existing `import` statements for backend hooks (e.g., `useAuth`, `useVideoPlayer`).
3.  [ ] **Find** the "Log In" button in `Navbar` and attach your `signIn` handler.
4.  [ ] **Find** the "Play Video" button in `Hero` and attach your video modal state.
5.  [ ] **Find** the "Enroll" button in `Hero` and attach your enrollment navigation.
6.  [ ] **Replace** the `courses` constant with your API data.
