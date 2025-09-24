import request from "supertest";
import app from "../server.js";
import { pool } from "../config/db.js";

describe("Question API", () => {
  let token;
  let courseId;
  let coId;
  let createdQuestionId;

  beforeAll(async () => {
    // login as instructor/admin
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jestinstructor_1758715660170@example.com",
        password: "password123"
      });
    token = res.body.token;

    // create a course
    const courseRes = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: `TEST${Math.floor(Math.random() * 10000)}`,
        title: "Test Course for Questions",
        ltp_structure: "3-0-0"
      });
    courseId = courseRes.body.course_id;
    if (!courseId) throw new Error("Failed to create test course");

    // create a CO for the course
    const coRes = await request(app)
      .post(`/api/cos/${courseId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        co_number: `CO${Math.floor(Math.random() * 10000)}`,
        description: "Test CO for Questions"
      });
    coId = coRes.body.co_id;
    if (!coId) throw new Error("Failed to create test CO");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("should add a subjective question", async () => {
    const res = await request(app)
      .post("/api/questions/subjective")
      .set("Authorization", `Bearer ${token}`)
      .send({
        course_id: courseId,
        co_id: coId,
        content: "Explain recursion with an example."
      });

    console.log("ADD SUBJECTIVE RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("question_id");
    createdQuestionId = res.body.question_id;
  });

  it("should add an MCQ question", async () => {
    const res = await request(app)
      .post("/api/questions/mcq")
      .set("Authorization", `Bearer ${token}`)
      .send({
        course_id: courseId,
        co_id: coId,
        content: "Which of the following is a stack operation?",
        options: [
          { text: "enqueue", is_correct: false },
          { text: "dequeue", is_correct: false },
          { text: "push", is_correct: true },
          { text: "peek", is_correct: true }
        ]
      });

    console.log("ADD MCQ RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("question_id");
    expect(res.body.options.length).toBeGreaterThan(0);
  });

  it("should fetch questions by course", async () => {
    const res = await request(app)
      .get(`/api/questions/course/${courseId}`)
      .set("Authorization", `Bearer ${token}`);

    console.log("GET BY COURSE RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should fetch questions by CO", async () => {
    const res = await request(app)
      .get(`/api/questions/co/${coId}`)
      .set("Authorization", `Bearer ${token}`);

    console.log("GET BY CO RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should edit a question (owner only)", async () => {
    const res = await request(app)
      .put(`/api/questions/${createdQuestionId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        content: "Explain recursion with an example in C++."
      });

    console.log("EDIT QUESTION RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.content).toContain("recursion");
  });

  it("should delete a question (owner only)", async () => {
    const res = await request(app)
      .delete(`/api/questions/${createdQuestionId}`)
      .set("Authorization", `Bearer ${token}`);

    console.log("DELETE QUESTION RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });
});
