import request from "supertest";
import app from "../server.js";
import { pool } from "../config/db.js";

describe("Moderation API", () => {
  let tokenModerator;
  let tokenInstructor;
  let questionId;

  // test accounts
  const instructor = {
    name: "test instructor",
    email: `instructor_${Date.now()}@example.com`,
    password: "password123",
    role: "instructor"
  };

  const moderator = {
    name: "test moderator",
    email: `moderator_${Date.now()}@example.com`,
    password: "password123",
    role: "moderator"
  };

  afterAll(async () => {
    await pool.end();
  });

  it("should register an instructor and moderator", async () => {
    const res1 = await request(app).post("/api/auth/register").send(instructor);
    expect([200, 201, 400]).toContain(res1.statusCode);

    const res2 = await request(app).post("/api/auth/register").send(moderator);
    expect([200, 201, 400]).toContain(res2.statusCode);
  });

  it("should login instructor and moderator", async () => {
    const loginInstructor = await request(app).post("/api/auth/login").send({
      email: instructor.email,
      password: instructor.password,
    });
    expect(loginInstructor.statusCode).toBe(200);
    tokenInstructor = loginInstructor.body.token;

    const loginModerator = await request(app).post("/api/auth/login").send({
      email: moderator.email,
      password: moderator.password,
    });
    expect(loginModerator.statusCode).toBe(200);
    tokenModerator = loginModerator.body.token;
  });

  it("instructor should create a question", async () => {
    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${tokenInstructor}`)
      .send({
        course_id: 1,
        question_type: "subjective",
        content: "Explain ACID properties in DBMS",
        co_id: 1
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("question_id");
    questionId = res.body.question_id;
  });

  it("moderator should review the question", async () => {
    const res = await request(app)
      .post("/api/moderation/review")
      .set("Authorization", `Bearer ${tokenModerator}`)
      .send({
        question_id: questionId,
        status: "approved",
        comments: "Looks fine"
      });

    console.log("MODERATION RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("moderation_id");
    expect(res.body.status).toBe("approved");
  });

  it("should fetch moderation logs for the question", async () => {
    const res = await request(app)
      .get(`/api/moderation/question/${questionId}`)
      .set("Authorization", `Bearer ${tokenModerator}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("status");
  });
});
