import request from "supertest";
import app from "../server.js";
import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

let adminToken, instructorToken, moderatorToken;
let paperId, moderationId;

beforeAll(async () => {
  // Reset database to a clean state
  await pool.query(`
    TRUNCATE 
      courses,
      users,
      course_outcomes,
      questions,
      options,
      question_media,
      question_papers,
      paper_questions,
      paper_moderation,
      question_moderation,
      logs
    RESTART IDENTITY CASCADE;
  `);

  // Seed users
  const adminHash = await bcrypt.hash("adminpassword", 6);
  const instructorHash = await bcrypt.hash("instructorpassword", 6);
  const moderatorHash = await bcrypt.hash("moderatorpassword", 6);

  await pool.query(`
    INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
    VALUES 
      ('Admin', 'admin@example.com', $1, 'admin', 'active', NOW(), NOW()),
      ('Instructor', 'instructor@example.com', $2, 'instructor', 'active', NOW(), NOW()),
      ('Moderator', 'moderator@example.com', $3, 'moderator', 'active', NOW(), NOW());
  `, [adminHash, instructorHash, moderatorHash]);

  // ✅ Create course and paper (submitted)
  const { rows: c } = await pool.query(`
    INSERT INTO courses (code, title, l, t, p, created_at, updated_at)
    VALUES ('CS101', 'Intro to CS', 3, 1, 0, NOW(), NOW())
    RETURNING course_id;
  `);

  const courseId = c[0].course_id;

  const { rows: p } = await pool.query(`
    INSERT INTO question_papers (course_id, title, status, version, created_at, updated_at)
    VALUES ($1, 'Mid Term Paper', 'submitted', 1, NOW(), NOW())
    RETURNING paper_id;
  `, [courseId]);

  paperId = p[0].paper_id;

  // Login and store tokens
  const login = async (email, password) => {
    const res = await request(app).post("/api/auth/login").send({ email, password });
    expect(res.statusCode).toBe(200);
    return res.body.token;
  };

  adminToken = await login("admin@example.com", "adminpassword");
  instructorToken = await login("instructor@example.com", "instructorpassword");
  moderatorToken = await login("moderator@example.com", "moderatorpassword");
});

describe("📄 Paper Moderation End-to-End Tests", () => {
  it("Moderator can claim a submitted paper", async () => {
    const res = await request(app)
      .post(`/api/paper-moderation/claim/${paperId}`)
      .set("Authorization", `Bearer ${moderatorToken}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.moderation).toHaveProperty("paper_id", paperId);
    moderationId = res.body.moderation.id;
  });

  it("Duplicate claim by same moderator should fail (400 or 409)", async () => {
    const res = await request(app)
      .post(`/api/paper-moderation/claim/${paperId}`)
      .set("Authorization", `Bearer ${moderatorToken}`);

    expect([400, 409]).toContain(res.statusCode);
  });

  it("Instructor cannot claim a paper", async () => {
  const res = await request(app)
    .post(`/api/paper-moderation/claim/${paperId}`)
    .set("Authorization", `Bearer ${instructorToken}`);

  expect(res.statusCode).toBe(403);
  const msg = res.body.message || res.body.error || res.text;
  expect(String(msg).toLowerCase()).toMatch(/forbidden|only|moderator/);
});

  it("Admin can view all moderation records for a paper", async () => {
    const res = await request(app)
      .get(`/api/paper-moderation/paper/${paperId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it("Moderator can view their claimed papers", async () => {
    const res = await request(app)
      .get("/api/paper-moderation/my")
      .set("Authorization", `Bearer ${moderatorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.moderations[0]).toHaveProperty("paper_id", paperId);
  });

  it("Moderator can approve a paper", async () => {
    const res = await request(app)
      .patch(`/api/paper-moderation/${moderationId}/approve`)
      .set("Authorization", `Bearer ${moderatorToken}`)
      .send({ comments: "Looks great overall" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.moderation.status).toBe("approved");
    expect(res.body.paperStatus).toBe("approved");

    // Verify DB reflects approved status
    const { rows } = await pool.query("SELECT status FROM question_papers WHERE paper_id=$1", [paperId]);
    expect(rows[0].status).toBe("approved");
  });

  it("Admin can reject (override) the paper", async () => {
    const res = await request(app)
      .patch(`/api/paper-moderation/${moderationId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ comments: "Found some issues" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.moderation.status).toBe("rejected");
    expect(res.body.paperStatus).toBe("rejected");

    // DB check
    const { rows } = await pool.query("SELECT status FROM question_papers WHERE paper_id=$1", [paperId]);
    expect(rows[0].status).toBe("rejected");
  });

  it("Logs table should record claim, approve, and reject actions", async () => {
    const { rows } = await pool.query(
      "SELECT action FROM logs WHERE action IN ('CLAIM_PAPER','PAPER_APPROVED','PAPER_REJECTED');"
    );
    const actions = rows.map((r) => r.action);
    expect(actions).toEqual(expect.arrayContaining(["CLAIM_PAPER", "PAPER_APPROVED", "PAPER_REJECTED"]));
  });

  it("Should prevent claiming non-submitted papers", async () => {
    // Mark paper as approved
    await pool.query("UPDATE question_papers SET status='approved' WHERE paper_id=$1", [paperId]);

    const res = await request(app)
      .post(`/api/paper-moderation/claim/${paperId}`)
      .set("Authorization", `Bearer ${moderatorToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/only submitted papers/i);
  });

  it("Moderator should not access admin-only routes", async () => {
  const res = await request(app)
    .patch(`/api/paper-moderation/${moderationId}/approve`)
    .set("Authorization", `Bearer ${instructorToken}`);

  expect(res.statusCode).toBe(403);
  const msg = res.body.message || res.body.error || res.text;
  expect(String(msg).toLowerCase()).toMatch(/forbidden|admin|moderator/);
});
});
