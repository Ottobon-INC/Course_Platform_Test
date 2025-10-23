# Course Learning Platform Design Guidelines

## Design Approach
**Reference-Based Approach** - Drawing inspiration from leading online learning platforms like Coursera, Udemy, and Khan Academy for their proven educational UX patterns while maintaining modern aesthetics.

## Core Design Elements

### Color Palette
**Light Mode:**
- Primary: 220 85% 45% (Professional blue for trust and learning)
- Secondary: 220 15% 95% (Light gray backgrounds)
- Accent: 142 76% 36% (Success green for progress/completion)
- Text: 220 13% 18% (Dark charcoal for readability)

**Dark Mode:**
- Primary: 220 85% 60% (Lighter blue for contrast)
- Secondary: 220 13% 10% (Dark background)
- Accent: 142 76% 45% (Brighter success green)
- Text: 220 15% 95% (Light text)

### Typography
- **Primary Font:** Inter (Google Fonts) - Clean, professional, excellent readability
- **Headings:** Inter 600-700 weights
- **Body:** Inter 400-500 weights
- **Code/Technical:** JetBrains Mono for syntax highlighting

### Layout System
**Tailwind Spacing Units:** Consistent use of 2, 4, 6, 8, 12, 16 units
- Micro spacing: p-2, m-2 (8px)
- Standard spacing: p-4, m-4 (16px) 
- Section spacing: p-8, m-8 (32px)
- Large spacing: p-12, m-12 (48px)

## Component Library

### Navigation & Structure
- **Sidebar Curriculum Tree:** Collapsible with nested lesson structure, progress indicators, and smooth expand/collapse animations
- **Top Navigation:** Clean header with course title, progress bar, and user controls
- **Tabbed Content:** Professional tabs for Transcript, Notes, Resources, Quizzes

### Interactive Elements
- **Video Player:** Custom controls with progress bar, speed controls (0.5x-2x), chapter markers, and keyboard shortcuts
- **Progress Indicators:** Circular progress rings, completion badges, and milestone celebrations
- **Assessment Components:** Interactive quiz cards with immediate feedback and explanation reveals
- **Form Elements:** Clean input styling with validation states and helpful error messages

### Content Displays
- **Course Cards:** Professional layout with thumbnails, titles, progress, and enrollment status
- **Lesson Content:** Rich text with syntax highlighting for code blocks
- **Results Pages:** Clean data visualization for assessment scores and recommendations

### Overlays & Feedback
- **Toast Notifications:** Subtle success/error messages for user actions
- **Loading States:** Smooth skeleton screens and progress indicators
- **Modals:** Clean overlay design for enrollment forms and confirmations

## Key Design Principles

1. **Educational Focus:** Clean, distraction-free interface that prioritizes content consumption
2. **Progress Visibility:** Clear visual feedback on learning progress and achievements
3. **Professional Aesthetics:** Coursera/Udemy-inspired design with modern touches
4. **Responsive Design:** Seamless experience across desktop, tablet, and mobile devices
5. **Accessibility First:** High contrast ratios, keyboard navigation, and screen reader support

## Special Interactions
- **Minimal Animations:** Subtle fade-ins, smooth transitions, and gentle hover states
- **Progress Persistence:** Visual continuity when resuming courses
- **Contextual Help:** Tooltips and guidance without overwhelming the interface

This design system creates a professional, trustworthy learning environment that encourages course completion while maintaining visual appeal and usability across all device types.