import request from "supertest";
import app from "../server.js";
import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

let adminToken, instructorToken, moderatorToken;
let courseId, paperId, questionId, moderationId;

// Clean slate before all tests
beforeAll(async () => {
  await pool.query(`
    TRUNCATE 
      users,
      courses,
      course_outcomes,
      questions,
      options,
      question_media,
      question_papers,
      paper_questions,
      paper_moderation,
      question_moderation,
      logs
    RESTART IDENTITY CASCADE
  `);

  // 🧩 Seed users
  const hash = (pwd) => bcrypt.hash(pwd, 6);
  const [adminHash, instructorHash, moderatorHash] = await Promise.all([
    hash("adminpass"),
    hash("instructorpass"),
    hash("moderatorpass"),
  ]);

  await pool.query(`
    INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
    VALUES 
      ('Admin User', 'admin@example.com', '${adminHash}', 'admin', 'active', NOW(), NOW()),
      ('Instructor User', 'instructor@example.com', '${instructorHash}', 'instructor', 'active', NOW(), NOW()),
      ('Moderator User', 'moderator@example.com', '${moderatorHash}', 'moderator', 'active', NOW(), NOW());
  `);

  // 🧩 Login all roles
  const login = async (email, password) =>
    (await request(app).post("/api/auth/login").send({ email, password })).body.token;

  adminToken = await login("admin@example.com", "adminpass");
  instructorToken = await login("instructor@example.com", "instructorpass");
  moderatorToken = await login("moderator@example.com", "moderatorpass");

  // 🧩 Create course
  const { rows: c } = await pool.query(`
    INSERT INTO courses (code, title, l, t, p, created_at, updated_at)
    VALUES ('CS201', 'Data Structures', 3, 1, 0, NOW(), NOW())
    RETURNING course_id;
  `);
  courseId = c[0].course_id;

  // 🧩 Create question (simple subjective)
  const { rows: q } = await pool.query(`
    INSERT INTO questions (course_id, content, question_type, is_active)
    VALUES ($1, 'Explain linked lists.', 'subjective', true)
    RETURNING question_id;
  `, [courseId]);
  questionId = q[0].question_id;

  // 🧩 Create paper (submitted)
  const { rows: p } = await pool.query(`
    INSERT INTO question_papers (course_id, instructor_id, title, exam_type, semester, academic_year, full_marks, duration, status, version)
    VALUES ($1, 2, 'Midterm Paper', 'midsem', 3, '2024-25', 50, 60, 'submitted', 1)
    RETURNING paper_id;
  `, [courseId]);
  paperId = p[0].paper_id;

  // 🧩 Add question to paper
  await pool.query(`
    INSERT INTO paper_questions (paper_id, question_id, marks, sequence)
    VALUES ($1, $2, 10, 1);
  `, [paperId, questionId]);
});

// 🧩 Don’t close pool here – jest.setup.js handles it
// afterAll(async () => {
//   await pool.end();
// });

describe("🧠 Question Moderation End-to-End Tests", () => {

  it("Moderator can claim a question for moderation", async () => {
    const res = await request(app)
      .post(`/api/question-moderation/claim/${paperId}/${questionId}`)
      .set("Authorization", `Bearer ${moderatorToken}`)
      .send({ comments: "Claiming for review" });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.moderation).toHaveProperty("paper_id", paperId);
    expect(res.body.moderation).toHaveProperty("question_id", questionId);
    moderationId = res.body.moderation.id;
  });

  it("Duplicate claim by same moderator should fail", async () => {
    const res = await request(app)
      .post(`/api/question-moderation/claim/${paperId}/${questionId}`)
      .set("Authorization", `Bearer ${moderatorToken}`)
      .send({ comments: "Trying duplicate claim" });

    expect([400, 409]).toContain(res.statusCode);
  });

  it("Instructor cannot claim a question", async () => {
    const res = await request(app)
      .post(`/api/question-moderation/claim/${paperId}/${questionId}`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(403);
    const msg = res.body.message || res.body.error || res.text;
    expect(String(msg).toLowerCase()).toMatch(/forbidden|only|moderator/);
  });

  it("Admin can view all question moderation records for a paper", async () => {
    const res = await request(app)
      .get(`/api/question-moderation/paper/${paperId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it("Moderator can view their claimed question moderations", async () => {
    const res = await request(app)
      .get(`/api/question-moderation/my`)
      .set("Authorization", `Bearer ${moderatorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.moderations[0]).toHaveProperty("paper_id", paperId);
  });

  it("Moderator can approve a question moderation record", async () => {
    const res = await request(app)
      .patch(`/api/question-moderation/${moderationId}/approve`)
      .set("Authorization", `Bearer ${moderatorToken}`)
      .send({ comments: "Question approved" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.moderation.status).toBe("approved");
  });

  it("Admin can reject (override) a question moderation record", async () => {
    // 🧩 Create a new moderator so we can claim again
    const hash = await bcrypt.hash("newmodpass", 6);
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
      VALUES ('Extra Moderator', 'extra_mod@example.com', '${hash}', 'moderator', 'active', NOW(), NOW());
    `);
    const extraModLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "extra_mod@example.com", password: "newmodpass" });
    const extraModToken = extraModLogin.body.token;

    // 🧩 Claim question using the *new moderator*
    const { body } = await request(app)
      .post(`/api/question-moderation/claim/${paperId}/${questionId}`)
      .set("Authorization", `Bearer ${extraModToken}`)
      .send({ comments: "For rejection test" });

    expect(body.success).toBe(true);
    const newModerationId = body.moderation.id;

    // 🧩 Admin rejects that moderation
    const res = await request(app)
      .patch(`/api/question-moderation/${newModerationId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ comments: "Found issues" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.moderation.status).toBe("rejected");
  });

  it("Logs table should record claim, approve, and reject actions", async () => {
    const { rows } = await pool.query(
      "SELECT action FROM logs ORDER BY created_at DESC LIMIT 10;"
    );
    const actions = rows.map((r) => r.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        "CLAIM_QUESTION",
        "APPROVE_QUESTION",
        "QUESTION_APPROVED",
        "QUESTION_REJECTED",
        "REJECT_QUESTION",
      ])
    );
  });

  it("Should prevent claiming questions from non-submitted papers", async () => {
    const { rows: draftPaper } = await pool.query(`
      INSERT INTO question_papers (course_id, instructor_id, title, exam_type, semester, academic_year, full_marks, duration, status, version)
      VALUES ($1, 2, 'Draft Paper', 'final', 4, '2024-25', 50, 60, 'draft', 1)
      RETURNING paper_id;
    `, [courseId]);

    const badPaperId = draftPaper[0].paper_id;

    const res = await request(app)
      .post(`/api/question-moderation/claim/${badPaperId}/${questionId}`)
      .set("Authorization", `Bearer ${moderatorToken}`);

    expect(res.statusCode).toBe(400);
    const msg = res.body.message || res.text;
    expect(String(msg).toLowerCase()).toMatch(/submitted/);
  });

  it("Moderator should not access admin-only routes", async () => {
    const res = await request(app)
      .patch(`/api/question-moderation/${moderationId}/reject`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(403);
    const msg = res.body.message || res.body.error || res.text;
    expect(String(msg).toLowerCase()).toMatch(/forbidden|admin|moderator/);
  });
});
