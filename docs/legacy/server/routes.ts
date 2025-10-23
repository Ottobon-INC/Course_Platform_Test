import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertAssessmentResultSchema, insertQuizResultSchema } from "@shared/schema";
import bcrypt from "bcrypt";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().min(10),
});

const progressUpdateSchema = z.object({
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  timeSpent: z.number().min(0).optional(),
  lastPosition: z.number().min(0).optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Set user session
      req.session.userId = user.id;
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ error: 'Invalid request data' });
    }
  });

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const userData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Set user session
      req.session.userId = user.id;

      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ error: 'Invalid request data' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
      });
    } catch (error) {
      console.error('Auth me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Course routes
  app.get('/api/courses', async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json({ courses });
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/courses/:slug', async (req, res) => {
    try {
      const course = await storage.getCourseBySlug(req.params.slug);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      res.json({ course });
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/courses/:courseId/sections', async (req, res) => {
    try {
      const sections = await storage.getCourseSections(req.params.courseId);
      
      // Get lessons for each section
      const sectionsWithLessons = await Promise.all(
        sections.map(async (section) => {
          const lessons = await storage.getSectionLessons(section.id);
          return { ...section, lessons };
        })
      );

      res.json({ sections: sectionsWithLessons });
    } catch (error) {
      console.error('Get course sections error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Assessment routes
  app.get('/api/courses/:courseId/assessment', async (req, res) => {
    try {
      const questions = await storage.getCourseAssessmentQuestions(req.params.courseId);
      res.json({ questions });
    } catch (error) {
      console.error('Get assessment questions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/courses/:courseId/assessment', async (req, res) => {
    try {
      // If user is authenticated, save to database
      if (req.session.userId) {
        const resultData = insertAssessmentResultSchema.parse({
          ...req.body,
          userId: req.session.userId,
          courseId: req.params.courseId,
        });

        const result = await storage.saveAssessmentResult(resultData);
        return res.json({ result });
      }

      // For unauthenticated users, calculate results without saving
      const { answers, timeSpent } = req.body;
      const questions = await storage.getCourseAssessmentQuestions(req.params.courseId);
      
      let correctAnswers = 0;
      const totalQuestions = questions.length;

      questions.forEach((question) => {
        const userAnswer = answers[question.id];
        const correctOption = question.options.find((opt: any) => opt.isCorrect);
        if (userAnswer === correctOption?.id) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / totalQuestions) * 100);

      // Generate recommendations based on score
      const recommendations = [];
      if (score < 60) {
        recommendations.push("Consider reviewing the fundamental concepts before starting the course.");
        recommendations.push("Take your time with each lesson and practice the examples provided.");
        recommendations.push("Join the community discussions to get help when needed.");
      } else if (score < 80) {
        recommendations.push("You have a good foundation! Focus on the advanced topics in the course.");
        recommendations.push("Try to complete the practical exercises to reinforce your learning.");
        recommendations.push("Consider reviewing areas where you scored lower.");
      } else {
        recommendations.push("Excellent knowledge! You're ready for advanced concepts.");
        recommendations.push("Consider helping other students in the community discussions.");
        recommendations.push("Focus on the practical projects to build your portfolio.");
      }

      const result = {
        score,
        totalQuestions,
        correctAnswers,
        timeSpent,
        recommendations,
        answers
      };

      res.json({ result });
    } catch (error) {
      console.error('Save assessment result error:', error);
      res.status(400).json({ error: 'Invalid request data' });
    }
  });

  app.get('/api/courses/:courseId/assessment/results', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const results = await storage.getUserAssessmentResults(req.session.userId, req.params.courseId);
      res.json({ results });
    } catch (error) {
      console.error('Get assessment results error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Lesson routes
  app.get('/api/lessons/:lessonId', async (req, res) => {
    try {
      const lesson = await storage.getLesson(req.params.lessonId);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      res.json({ lesson });
    } catch (error) {
      console.error('Get lesson error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/lessons/:lessonId/quiz', async (req, res) => {
    try {
      const questions = await storage.getLessonQuizQuestions(req.params.lessonId);
      res.json({ questions });
    } catch (error) {
      console.error('Get lesson quiz error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/lessons/:lessonId/quiz', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const resultData = insertQuizResultSchema.parse({
        ...req.body,
        userId: req.session.userId,
        lessonId: req.params.lessonId,
      });

      const result = await storage.saveQuizResult(resultData);
      res.json({ result });
    } catch (error) {
      console.error('Save quiz result error:', error);
      res.status(400).json({ error: 'Invalid request data' });
    }
  });

  // Progress tracking routes
  app.get('/api/courses/:courseId/progress', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const progress = await storage.getUserCourseProgress(req.session.userId, req.params.courseId);
      res.json({ progress });
    } catch (error) {
      console.error('Get course progress error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/lessons/:lessonId/progress', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const updates = progressUpdateSchema.parse(req.body);
      const progress = await storage.updateLessonProgress(req.session.userId, req.params.lessonId, updates);
      res.json({ progress });
    } catch (error) {
      console.error('Update lesson progress error:', error);
      res.status(400).json({ error: 'Invalid request data' });
    }
  });

  app.get('/api/lessons/:lessonId/progress', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const progress = await storage.getLessonProgress(req.session.userId, req.params.lessonId);
      res.json({ progress });
    } catch (error) {
      console.error('Get lesson progress error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Enrollment routes
  app.post('/api/courses/:courseId/enroll', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      // Check if already enrolled
      const existingEnrollment = await storage.getUserEnrollment(req.session.userId, req.params.courseId);
      if (existingEnrollment) {
        return res.status(409).json({ error: 'Already enrolled in this course' });
      }

      const enrollment = await storage.createEnrollment({
        userId: req.session.userId,
        courseId: req.params.courseId,
      });

      res.status(201).json({ enrollment });
    } catch (error) {
      console.error('Course enrollment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/enrollments', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const enrollments = await storage.getUserEnrollments(req.session.userId);
      res.json({ enrollments });
    } catch (error) {
      console.error('Get enrollments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/courses/:courseId/enrollment', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const enrollment = await storage.getUserEnrollment(req.session.userId, req.params.courseId);
      res.json({ enrollment });
    } catch (error) {
      console.error('Get course enrollment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
