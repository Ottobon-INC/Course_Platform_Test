import { db } from "./db";
import { courses, lessons, sections, assessmentQuestions, users } from "../shared/schema";
import bcrypt from "bcrypt";

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Clear existing data (for development)
    await db.delete(assessmentQuestions);
    await db.delete(lessons);
    await db.delete(sections);
    await db.delete(courses);
    await db.delete(users);

    // Create demo user
    const hashedPassword = await bcrypt.hash("demo123", 10);
    const [user] = await db.insert(users).values({
      username: "demo",
      email: "demo@example.com",
      password: hashedPassword,
      fullName: "Demo User",
    }).returning();

    console.log("Created demo user:", user.email);

    // Create courses
    const courseData = [
      {
        slug: "ai-in-web-development",
        title: "AI in Web Development: A Personal Learning Journey",
        description: "Embark on a transformative journey to master web development using AI tools and techniques. This course combines traditional web development skills with cutting-edge AI technologies to accelerate your learning and boost your productivity.",
        shortDescription: "Travel and learn web development with AI as your guide",
        instructor: "Dr. Emma Rodriguez",
        instructorBio: "AI Researcher and Full-Stack Developer with 10+ years experience in machine learning and web technologies",
        rating: 498,
        studentsCount: 1247,
        duration: "12 hours",
        difficulty: "Beginner",
        price: 1500, // Price in cents ($15)
        originalPrice: 2500,
        heroImage: "/api/placeholder/800/400",
        tags: ["AI", "Web Development", "Learning Journey", "Productivity"],
        isPublished: true,
      },
      {
        slug: "introduction-to-react",
        title: "Introduction to React",
        description: "Learn the fundamentals of React.js and build interactive web applications",
        shortDescription: "React fundamentals for beginners",
        instructor: "Sarah Chen",
        instructorBio: "Senior Frontend Developer with 8+ years experience",
        rating: 485,
        studentsCount: 2847,
        duration: "8 hours",
        difficulty: "Beginner",
        price: 9900, // Price in cents
        originalPrice: 14900,
        heroImage: "/api/placeholder/800/400",
        tags: ["React", "JavaScript", "Frontend"],
        isPublished: true,
      },
      {
        slug: "advanced-typescript",
        title: "Advanced TypeScript",
        description: "Master advanced TypeScript patterns and build type-safe applications",
        shortDescription: "Advanced TypeScript for professionals",
        instructor: "Alex Rodriguez",
        instructorBio: "TypeScript core contributor and tech lead",
        rating: 492,
        studentsCount: 1623,
        duration: "12 hours", 
        difficulty: "Advanced",
        price: 14900,
        originalPrice: 19900,
        heroImage: "/api/placeholder/800/400",
        tags: ["TypeScript", "JavaScript", "Advanced"],
        isPublished: true,
      },
      {
        slug: "nodejs-backend-development",
        title: "Node.js Backend Development",
        description: "Build scalable backend applications with Node.js and Express",
        shortDescription: "Complete backend development guide",
        instructor: "Michael Johnson",
        instructorBio: "Full-stack architect and Node.js expert",
        rating: 478,
        studentsCount: 3156,
        duration: "15 hours",
        difficulty: "Intermediate",
        price: 12900,
        originalPrice: 17900,
        heroImage: "/api/placeholder/800/400",
        tags: ["Node.js", "Express", "Backend"],
        isPublished: true,
      }
    ];

    const insertedCourses = await db.insert(courses).values(courseData).returning();
    console.log("Created courses:", insertedCourses.map(c => c.title));

    // Create sections for each course
    const sectionData = [
      // AI in Web Development Course Sections
      {
        courseId: insertedCourses[0].id,
        title: "Starting Your AI-Powered Journey",
        description: "Introduction to AI tools and setting up your development environment",
        orderIndex: 0,
      },
      {
        courseId: insertedCourses[0].id,
        title: "AI-Assisted Frontend Development",
        description: "Using AI to accelerate HTML, CSS, and JavaScript development",
        orderIndex: 1,
      },
      {
        courseId: insertedCourses[0].id,
        title: "Backend Development with AI",
        description: "Leveraging AI for server-side development and API creation",
        orderIndex: 2,
      },
      {
        courseId: insertedCourses[0].id,
        title: "Advanced AI Integration",
        description: "Integrating AI services and building intelligent web applications",
        orderIndex: 3,
      },
      {
        courseId: insertedCourses[0].id,
        title: "Your Personal Project Journey",
        description: "Building a complete web application with AI assistance",
        orderIndex: 4,
      },
      // React Course Sections
      {
        courseId: insertedCourses[1].id,
        title: "Getting Started",
        description: "Introduction to React fundamentals",
        orderIndex: 0,
      },
      {
        courseId: insertedCourses[1].id,
        title: "Core Concepts",
        description: "Understanding React's core features",
        orderIndex: 1,
      },
      // TypeScript Course Section
      {
        courseId: insertedCourses[2].id,
        title: "Advanced Patterns",
        description: "Advanced TypeScript features and patterns",
        orderIndex: 0,
      },
      // Node.js Course Section
      {
        courseId: insertedCourses[3].id,
        title: "Backend Fundamentals",
        description: "Core backend development concepts",
        orderIndex: 0,
      },
    ];

    const insertedSections = await db.insert(sections).values(sectionData).returning();
    console.log("Created sections:", insertedSections.length);

    // Create lessons for each section
    const lessonData = [
      // AI in Web Development Course Lessons
      // Section 1: Starting Your AI-Powered Journey
      {
        sectionId: insertedSections[0].id,
        slug: "welcome-to-ai-journey",
        title: "Welcome to Your AI Learning Journey",
        description: "Introduction to the course and how AI will transform your web development experience",
        type: "video",
        duration: "8 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        notes: "Welcome to an exciting journey where you'll learn web development with AI as your personal assistant. This course is designed to be your companion as you travel through the world of modern web development.",
        orderIndex: 0,
        isPreview: true,
      },
      {
        sectionId: insertedSections[0].id,
        slug: "ai-tools-overview",
        title: "Essential AI Tools for Developers",
        description: "Discover the AI tools that will accelerate your development workflow",
        type: "video",
        duration: "12 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        notes: "Explore ChatGPT, GitHub Copilot, Claude, and other AI tools that will become your development companions.",
        orderIndex: 1,
      },
      {
        sectionId: insertedSections[0].id,
        slug: "setting-up-ai-workspace",
        title: "Setting Up Your AI-Enhanced Workspace",
        description: "Configure your development environment with AI tools",
        type: "video",
        duration: "15 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        orderIndex: 2,
      },
      
      // Section 2: AI-Assisted Frontend Development
      {
        sectionId: insertedSections[1].id,
        slug: "html-with-ai",
        title: "Crafting HTML with AI Assistance",
        description: "Learn how AI can help you write semantic and accessible HTML",
        type: "video",
        duration: "18 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        notes: "Discover how to use AI prompts to generate clean, semantic HTML structures and improve accessibility.",
        orderIndex: 0,
      },
      {
        sectionId: insertedSections[1].id,
        slug: "css-ai-magic",
        title: "CSS Magic with AI",
        description: "Transform your designs using AI-powered CSS generation",
        type: "video",
        duration: "22 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        orderIndex: 1,
      },
      {
        sectionId: insertedSections[1].id,
        slug: "javascript-ai-companion",
        title: "JavaScript with Your AI Companion",
        description: "Write cleaner, more efficient JavaScript with AI assistance",
        type: "video",
        duration: "25 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        notes: "Learn to collaborate with AI to write better JavaScript, debug code, and implement complex features.",
        orderIndex: 2,
      },
      {
        sectionId: insertedSections[1].id,
        slug: "react-ai-development",
        title: "Building React Components with AI",
        description: "Accelerate React development using AI-generated components",
        type: "video",
        duration: "28 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        orderIndex: 3,
      },

      // Section 3: Backend Development with AI
      {
        sectionId: insertedSections[2].id,
        slug: "nodejs-ai-server",
        title: "Building Node.js Servers with AI",
        description: "Create robust backend services with AI assistance",
        type: "video",
        duration: "30 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        notes: "Learn to build scalable Node.js applications with AI helping you write server logic, handle routes, and manage databases.",
        orderIndex: 0,
      },
      {
        sectionId: insertedSections[2].id,
        slug: "api-design-ai",
        title: "API Design and Development with AI",
        description: "Design and implement RESTful APIs using AI guidance",
        type: "video",
        duration: "26 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
        orderIndex: 1,
      },
      {
        sectionId: insertedSections[2].id,
        slug: "database-ai-integration",
        title: "Database Integration with AI",
        description: "Connect and manage databases using AI-assisted code",
        type: "video",
        duration: "24 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        orderIndex: 2,
      },

      // Section 4: Advanced AI Integration
      {
        sectionId: insertedSections[3].id,
        slug: "ai-apis-integration",
        title: "Integrating AI APIs in Web Apps",
        description: "Add AI capabilities to your web applications",
        type: "video",
        duration: "32 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
        notes: "Learn to integrate OpenAI, Google AI, and other AI services into your web applications.",
        orderIndex: 0,
      },
      {
        sectionId: insertedSections[3].id,
        slug: "chatbot-development",
        title: "Building AI Chatbots for Web",
        description: "Create intelligent chatbots for your websites",
        type: "video",
        duration: "35 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        orderIndex: 1,
      },
      {
        sectionId: insertedSections[3].id,
        slug: "ai-content-generation",
        title: "AI-Powered Content Generation",
        description: "Implement dynamic content generation using AI",
        type: "video",
        duration: "28 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
        orderIndex: 2,
      },

      // Section 5: Your Personal Project Journey
      {
        sectionId: insertedSections[4].id,
        slug: "project-planning-ai",
        title: "Planning Your Project with AI",
        description: "Use AI to plan and architect your web application",
        type: "video",
        duration: "20 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        notes: "Learn to use AI for project planning, feature definition, and technical architecture decisions.",
        orderIndex: 0,
      },
      {
        sectionId: insertedSections[4].id,
        slug: "building-with-ai",
        title: "Building Your Dream Project",
        description: "Step-by-step development of a complete web application",
        type: "video",
        duration: "45 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        orderIndex: 1,
      },
      {
        sectionId: insertedSections[4].id,
        slug: "deployment-ai-assistance",
        title: "Deployment and Optimization with AI",
        description: "Deploy and optimize your application using AI tools",
        type: "video",
        duration: "25 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        orderIndex: 2,
      },
      {
        sectionId: insertedSections[4].id,
        slug: "journey-reflection",
        title: "Reflecting on Your Learning Journey",
        description: "Celebrate your progress and plan your next steps",
        type: "video",
        duration: "15 min",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        notes: "Congratulations on completing your AI-powered web development journey! Reflect on what you've learned and discover your next adventure.",
        orderIndex: 3,
      },

      // React Course Lessons (Getting Started Section)
      {
        sectionId: insertedSections[5].id,
        slug: "introduction-to-react",
        title: "Introduction to React",
        description: "Learn what React is and why it's popular",
        type: "video",
        duration: "15 min",
        videoUrl: "/api/placeholder/video/react-intro",
        notes: "React is a JavaScript library for building user interfaces...",
        orderIndex: 0,
        isPreview: true,
      },
      {
        sectionId: insertedSections[5].id,
        slug: "setting-up-environment",
        title: "Setting Up Your Environment",
        description: "Install Node.js, npm, and create your first React app",
        type: "video",
        duration: "12 min",
        videoUrl: "/api/placeholder/video/setup",
        orderIndex: 1,
      },
      // React Course Lessons (Core Concepts Section)
      {
        sectionId: insertedSections[6].id,
        slug: "components-and-jsx",
        title: "Components and JSX",
        description: "Understanding React components and JSX syntax",
        type: "video",
        duration: "20 min",
        videoUrl: "/api/placeholder/video/components-jsx",
        notes: "Components are the building blocks of React applications...",
        orderIndex: 0,
      },
      {
        sectionId: insertedSections[6].id,
        slug: "state-and-props",
        title: "State and Props",
        description: "Managing state and passing data with props",
        type: "video",
        duration: "25 min",
        videoUrl: "/api/placeholder/video/state-props",
        orderIndex: 1,
      },
      // TypeScript Course Lessons
      {
        sectionId: insertedSections[7].id,
        slug: "advanced-types",
        title: "Advanced Types",
        description: "Exploring advanced TypeScript type features",
        type: "video",
        duration: "30 min",
        videoUrl: "/api/placeholder/video/advanced-types",
        orderIndex: 0,
        isPreview: true,
      },
      // Node.js Course Lessons
      {
        sectionId: insertedSections[8].id,
        slug: "express-fundamentals",
        title: "Express.js Fundamentals",
        description: "Getting started with Express framework",
        type: "video",
        duration: "25 min",
        videoUrl: "/api/placeholder/video/express-basics",
        orderIndex: 0,
        isPreview: true,
      },
    ];

    const insertedLessons = await db.insert(lessons).values(lessonData).returning();
    console.log("Created lessons:", insertedLessons.length);

    // Create assessment questions
    const assessmentQuestionData = [
      // AI in Web Development Course Questions
      {
        courseId: insertedCourses[0].id,
        question: "Which AI tool is most commonly used for code generation and completion?",
        options: [
          { id: "a", text: "GitHub Copilot", isCorrect: true },
          { id: "b", text: "Photoshop AI", isCorrect: false },
          { id: "c", text: "Google Translate", isCorrect: false },
          { id: "d", text: "Spotify AI", isCorrect: false }
        ],
        explanation: "GitHub Copilot is specifically designed to assist developers with code generation and completion using AI.",
        orderIndex: 0,
      },
      {
        courseId: insertedCourses[0].id,
        question: "What is the main benefit of using AI in web development?",
        options: [
          { id: "a", text: "It replaces the need for developers", isCorrect: false },
          { id: "b", text: "It accelerates development and improves productivity", isCorrect: true },
          { id: "c", text: "It makes websites load faster", isCorrect: false },
          { id: "d", text: "It reduces server costs", isCorrect: false }
        ],
        explanation: "AI tools help developers work more efficiently by automating repetitive tasks and providing intelligent suggestions.",
        orderIndex: 1,
      },
      {
        courseId: insertedCourses[0].id,
        question: "Which of these is NOT a recommended practice when using AI for coding?",
        options: [
          { id: "a", text: "Review and test AI-generated code", isCorrect: false },
          { id: "b", text: "Use clear and specific prompts", isCorrect: false },
          { id: "c", text: "Blindly copy-paste AI code without understanding", isCorrect: true },
          { id: "d", text: "Iterate and refine AI suggestions", isCorrect: false }
        ],
        explanation: "Always review, understand, and test AI-generated code before using it in production applications.",
        orderIndex: 2,
      },
      {
        courseId: insertedCourses[0].id,
        question: "What type of AI API would you use to add chatbot functionality to a website?",
        options: [
          { id: "a", text: "Image recognition API", isCorrect: false },
          { id: "b", text: "Natural Language Processing API", isCorrect: true },
          { id: "c", text: "Weather API", isCorrect: false },
          { id: "d", text: "Payment processing API", isCorrect: false }
        ],
        explanation: "Natural Language Processing APIs like OpenAI's GPT models are ideal for creating conversational chatbots.",
        orderIndex: 3,
      },
      {
        courseId: insertedCourses[0].id,
        question: "In the context of AI-assisted development, what does 'prompt engineering' refer to?",
        options: [
          { id: "a", text: "Building AI hardware", isCorrect: false },
          { id: "b", text: "Crafting effective instructions for AI tools", isCorrect: true },
          { id: "c", text: "Debugging AI systems", isCorrect: false },
          { id: "d", text: "Training AI models", isCorrect: false }
        ],
        explanation: "Prompt engineering is the practice of designing clear, specific instructions to get the best results from AI tools.",
        orderIndex: 4,
      },
      // React Course Questions
      {
        courseId: insertedCourses[1].id,
        question: "What is JSX?",
        options: [
          { id: "a", text: "A JavaScript extension", isCorrect: false },
          { id: "b", text: "A templating language", isCorrect: false },
          { id: "c", text: "A syntax extension for JavaScript", isCorrect: true },
          { id: "d", text: "A CSS framework", isCorrect: false }
        ],
        explanation: "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in JavaScript files.",
        orderIndex: 0,
      },
      {
        courseId: insertedCourses[1].id,
        question: "Which method is used to update state in a React component?",
        options: [
          { id: "a", text: "updateState()", isCorrect: false },
          { id: "b", text: "setState()", isCorrect: true },
          { id: "c", text: "changeState()", isCorrect: false },
          { id: "d", text: "modifyState()", isCorrect: false }
        ],
        explanation: "setState() is the correct method to update component state in React class components.",
        orderIndex: 1,
      },
      {
        courseId: insertedCourses[1].id,
        question: "What are props in React?",
        options: [
          { id: "a", text: "Mutable data", isCorrect: false },
          { id: "b", text: "Read-only properties passed to components", isCorrect: true },
          { id: "c", text: "Local component state", isCorrect: false },
          { id: "d", text: "CSS styles", isCorrect: false }
        ],
        explanation: "Props are read-only properties that are passed from parent to child components.",
        orderIndex: 2,
      },
      // TypeScript Course Questions
      {
        courseId: insertedCourses[2].id,
        question: "What is a generic constraint in TypeScript?",
        options: [
          { id: "a", text: "A way to limit generic types", isCorrect: true },
          { id: "b", text: "A type error", isCorrect: false },
          { id: "c", text: "A runtime check", isCorrect: false },
          { id: "d", text: "A compiler option", isCorrect: false }
        ],
        explanation: "Generic constraints allow you to limit the types that can be used with a generic parameter.",
        orderIndex: 0,
      },
      // Node.js Course Questions
      {
        courseId: insertedCourses[3].id,
        question: "What is Express.js?",
        options: [
          { id: "a", text: "A database", isCorrect: false },
          { id: "b", text: "A minimal web framework for Node.js", isCorrect: true },
          { id: "c", text: "A testing library", isCorrect: false },
          { id: "d", text: "A frontend framework", isCorrect: false }
        ],
        explanation: "Express.js is a minimal and flexible Node.js web application framework.",
        orderIndex: 0,
      },
    ];

    const insertedQuestions = await db.insert(assessmentQuestions).values(assessmentQuestionData).returning();
    console.log("Created assessment questions:", insertedQuestions.length);

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();