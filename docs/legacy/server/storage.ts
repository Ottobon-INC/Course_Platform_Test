import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  Course,
  InsertCourse,
  Section,
  InsertSection,
  Lesson,
  InsertLesson,
  AssessmentQuestion,
  InsertAssessmentQuestion,
  LessonQuiz,
  InsertLessonQuiz,
  Enrollment,
  InsertEnrollment,
  LessonProgress,
  InsertLessonProgress,
  AssessmentResult,
  InsertAssessmentResult,
  QuizResult,
  InsertQuizResult,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Course methods
  getCourse(id: string): Promise<Course | undefined>;
  getCourseBySlug(slug: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;

  // Section methods
  getCourseSections(courseId: string): Promise<Section[]>;
  getSection(id: string): Promise<Section | undefined>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: string, updates: Partial<InsertSection>): Promise<Section | undefined>;

  // Lesson methods
  getSectionLessons(sectionId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonBySlug(sectionId: string, slug: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, updates: Partial<InsertLesson>): Promise<Lesson | undefined>;

  // Assessment methods
  getCourseAssessmentQuestions(courseId: string): Promise<AssessmentQuestion[]>;
  createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<AssessmentQuestion>;
  getLessonQuizQuestions(lessonId: string): Promise<LessonQuiz[]>;
  createLessonQuiz(quiz: InsertLessonQuiz): Promise<LessonQuiz>;

  // Enrollment methods
  getUserEnrollments(userId: string): Promise<Enrollment[]>;
  getUserEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, updates: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;

  // Progress tracking
  getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | undefined>;
  getUserCourseProgress(userId: string, courseId: string): Promise<LessonProgress[]>;
  updateLessonProgress(userId: string, lessonId: string, updates: Partial<InsertLessonProgress>): Promise<LessonProgress>;

  // Results
  saveAssessmentResult(result: InsertAssessmentResult): Promise<AssessmentResult>;
  getUserAssessmentResults(userId: string, courseId: string): Promise<AssessmentResult[]>;
  saveQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getUserQuizResults(userId: string, lessonId: string): Promise<QuizResult[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  // Course methods
  async getCourse(id: string): Promise<Course | undefined> {
    const result = await db.select().from(schema.courses).where(eq(schema.courses.id, id)).limit(1);
    return result[0];
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const result = await db.select().from(schema.courses).where(eq(schema.courses.slug, slug)).limit(1);
    return result[0];
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const result = await db.insert(schema.courses).values(course).returning();
    return result[0];
  }

  async updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course | undefined> {
    const result = await db.update(schema.courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.courses.id, id))
      .returning();
    return result[0];
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(schema.courses).where(eq(schema.courses.isPublished, true));
  }

  // Section methods
  async getCourseSections(courseId: string): Promise<Section[]> {
    return await db.select().from(schema.sections)
      .where(eq(schema.sections.courseId, courseId))
      .orderBy(schema.sections.orderIndex);
  }

  async getSection(id: string): Promise<Section | undefined> {
    const result = await db.select().from(schema.sections).where(eq(schema.sections.id, id)).limit(1);
    return result[0];
  }

  async createSection(section: InsertSection): Promise<Section> {
    const result = await db.insert(schema.sections).values(section).returning();
    return result[0];
  }

  async updateSection(id: string, updates: Partial<InsertSection>): Promise<Section | undefined> {
    const result = await db.update(schema.sections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.sections.id, id))
      .returning();
    return result[0];
  }

  // Lesson methods
  async getSectionLessons(sectionId: string): Promise<Lesson[]> {
    return await db.select().from(schema.lessons)
      .where(eq(schema.lessons.sectionId, sectionId))
      .orderBy(schema.lessons.orderIndex);
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const result = await db.select().from(schema.lessons).where(eq(schema.lessons.id, id)).limit(1);
    return result[0];
  }

  async getLessonBySlug(sectionId: string, slug: string): Promise<Lesson | undefined> {
    const result = await db.select().from(schema.lessons)
      .where(and(eq(schema.lessons.sectionId, sectionId), eq(schema.lessons.slug, slug)))
      .limit(1);
    return result[0];
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const result = await db.insert(schema.lessons).values(lesson).returning();
    return result[0];
  }

  async updateLesson(id: string, updates: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const result = await db.update(schema.lessons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.lessons.id, id))
      .returning();
    return result[0];
  }

  // Assessment methods
  async getCourseAssessmentQuestions(courseId: string): Promise<AssessmentQuestion[]> {
    return await db.select().from(schema.assessmentQuestions)
      .where(eq(schema.assessmentQuestions.courseId, courseId))
      .orderBy(schema.assessmentQuestions.orderIndex);
  }

  async createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<AssessmentQuestion> {
    const result = await db.insert(schema.assessmentQuestions).values(question).returning();
    return result[0];
  }

  async getLessonQuizQuestions(lessonId: string): Promise<LessonQuiz[]> {
    return await db.select().from(schema.lessonQuizzes)
      .where(eq(schema.lessonQuizzes.lessonId, lessonId))
      .orderBy(schema.lessonQuizzes.orderIndex);
  }

  async createLessonQuiz(quiz: InsertLessonQuiz): Promise<LessonQuiz> {
    const result = await db.insert(schema.lessonQuizzes).values(quiz).returning();
    return result[0];
  }

  // Enrollment methods
  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    return await db.select().from(schema.enrollments)
      .where(eq(schema.enrollments.userId, userId))
      .orderBy(desc(schema.enrollments.enrolledAt));
  }

  async getUserEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const result = await db.select().from(schema.enrollments)
      .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)))
      .limit(1);
    return result[0];
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const result = await db.insert(schema.enrollments).values(enrollment).returning();
    return result[0];
  }

  async updateEnrollment(id: string, updates: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const result = await db.update(schema.enrollments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.enrollments.id, id))
      .returning();
    return result[0];
  }

  // Progress tracking
  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | undefined> {
    const result = await db.select().from(schema.lessonProgress)
      .where(and(eq(schema.lessonProgress.userId, userId), eq(schema.lessonProgress.lessonId, lessonId)))
      .limit(1);
    return result[0];
  }

  async getUserCourseProgress(userId: string, courseId: string): Promise<LessonProgress[]> {
    return await db.select({
        progress: schema.lessonProgress,
        lesson: schema.lessons
      })
      .from(schema.lessonProgress)
      .innerJoin(schema.lessons, eq(schema.lessonProgress.lessonId, schema.lessons.id))
      .innerJoin(schema.sections, eq(schema.lessons.sectionId, schema.sections.id))
      .where(and(
        eq(schema.lessonProgress.userId, userId),
        eq(schema.sections.courseId, courseId)
      )) as any;
  }

  async updateLessonProgress(userId: string, lessonId: string, updates: Partial<InsertLessonProgress>): Promise<LessonProgress> {
    // Try to update existing progress first
    const existing = await this.getLessonProgress(userId, lessonId);
    
    if (existing) {
      const result = await db.update(schema.lessonProgress)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(schema.lessonProgress.userId, userId), eq(schema.lessonProgress.lessonId, lessonId)))
        .returning();
      return result[0];
    } else {
      // Create new progress record
      const result = await db.insert(schema.lessonProgress)
        .values({ userId, lessonId, ...updates })
        .returning();
      return result[0];
    }
  }

  // Results
  async saveAssessmentResult(result: InsertAssessmentResult): Promise<AssessmentResult> {
    const saved = await db.insert(schema.assessmentResults).values(result).returning();
    return saved[0];
  }

  async getUserAssessmentResults(userId: string, courseId: string): Promise<AssessmentResult[]> {
    return await db.select().from(schema.assessmentResults)
      .where(and(eq(schema.assessmentResults.userId, userId), eq(schema.assessmentResults.courseId, courseId)))
      .orderBy(desc(schema.assessmentResults.completedAt));
  }

  async saveQuizResult(result: InsertQuizResult): Promise<QuizResult> {
    const saved = await db.insert(schema.quizResults).values(result).returning();
    return saved[0];
  }

  async getUserQuizResults(userId: string, lessonId: string): Promise<QuizResult[]> {
    return await db.select().from(schema.quizResults)
      .where(and(eq(schema.quizResults.userId, userId), eq(schema.quizResults.lessonId, lessonId)))
      .orderBy(desc(schema.quizResults.completedAt));
  }
}

export const storage = new DatabaseStorage();
