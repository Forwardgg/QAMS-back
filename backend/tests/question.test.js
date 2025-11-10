// tests/question.test.js
import request from "supertest";
import app from "../server.js";

let adminToken;
let instructorToken;
let courseId;
let coId;
let mcqId;
let subjectiveId;
let paperId;

beforeAll(async () => {
  // Login seeded admin
  const adminRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@example.com", password: "adminpassword" });
  adminToken = adminRes.body.token;

  // Login seeded instructor
  const instructorRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "seed_instructor@example.com", password: "instructorpassword" });
  instructorToken = instructorRes.body.token;

  // Instructor creates a course
  const courseRes = await request(app)
    .post("/api/courses")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({ code: "Q101", title: "Question Testing", l: 3, t: 1, p: 0 });
  courseId = courseRes.body.data.course_id;

  // Add a CO for the course
  const coRes = await request(app)
    .post(`/api/cos/course/${courseId}`)
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({ coNumber: "CO1", description: "Test Outcome" });
  coId = coRes.body.data.co_id;
});

describe("Question API", () => {
  // CREATE
  it("should add a subjective question with media", async () => {
    const res = await request(app)
      .post(`/api/questions/subjective/${courseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        content: "Explain database normalization.",
        coId,
        media: [{ mediaUrl: "https://dummyimage.com/test.png", caption: "Diagram" }],
      });

    expect(res.statusCode).toBe(201);
    subjectiveId = res.body.data.question_id;
    expect(res.body.data.media.length).toBe(1);
  });

  it("should reject empty subjective question", async () => {
    const res = await request(app)
      .post(`/api/questions/subjective/${courseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ content: "   ", coId });
    expect(res.statusCode).toBe(400);
  });

  it("should add an MCQ with options and media", async () => {
    const res = await request(app)
      .post(`/api/questions/mcq/${courseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        content: "Which of these is a DBMS?",
        coId,
        options: [
          { optionText: "Oracle", isCorrect: true },
          { optionText: "Excel", isCorrect: false },
        ],
        media: [{ mediaUrl: "https://dummyimage.com/db.png", caption: "DBMS Logo" }],
      });

    expect(res.statusCode).toBe(201);
    mcqId = res.body.data.question_id;
    expect(res.body.data.options.length).toBe(2);
    expect(res.body.data.media.length).toBe(1);
  });

  it("should reject MCQ with fewer than 2 options", async () => {
    const res = await request(app)
      .post(`/api/questions/mcq/${courseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        content: "Invalid MCQ?",
        coId,
        options: [{ optionText: "Only one", isCorrect: true }],
      });
    expect(res.statusCode).toBe(400);
  });

  it("should reject MCQ with no correct option", async () => {
    const res = await request(app)
      .post(`/api/questions/mcq/${courseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        content: "Invalid MCQ 2?",
        coId,
        options: [
          { optionText: "Wrong1", isCorrect: false },
          { optionText: "Wrong2", isCorrect: false },
        ],
      });
    expect(res.statusCode).toBe(400);
  });

  // READ
  it("should fetch all questions for a course", async () => {
    const res = await request(app)
      .get(`/api/questions/course/${courseId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  // PAPER SETUP
  it("should create a question paper and attach questions", async () => {
    const paperRes = await request(app)
      .post("/api/papers")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        courseId,
        title: "Midterm Test Paper",
        examType: "Midterm",
        semester: "5",
        academicYear: "2025-26",
        fullMarks: 50,
        duration: "2 hrs",
      });

    expect(paperRes.statusCode).toBe(201);
    paperId = paperRes.body.data.paper_id;

    const pq1 = await request(app)
      .post(`/api/paper-questions/${paperId}/${subjectiveId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ sequence: 1, marks: 5, section: "A" });
    expect(pq1.statusCode).toBe(201);

    const pq2 = await request(app)
      .post(`/api/paper-questions/${paperId}/${mcqId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ sequence: 2, marks: 5, section: "A" });
    expect(pq2.statusCode).toBe(201);
  });

  it("should fetch questions by paper", async () => {
    const res = await request(app).get(`/api/questions/paper/${paperId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data.length).toBe(2);
  });

  it("should fetch questions for course + paper", async () => {
    const res = await request(app).get(`/api/questions/course/${courseId}/paper/${paperId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data.every(q => q.course_id === courseId)).toBe(true);
  });

  // UPDATE
  it("should update an existing MCQ", async () => {
    const res = await request(app)
      .put(`/api/questions/${mcqId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        content: "Which of these is a relational DBMS?",
        coId,
        options: [
          { optionText: "Oracle", isCorrect: true },
          { optionText: "MongoDB", isCorrect: false },
          { optionText: "PostgreSQL", isCorrect: true },
        ],
        media: [],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.options.length).toBe(3);
  });

  it("updating non-existent question should 404", async () => {
    const res = await request(app)
      .put("/api/questions/99999")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ content: "Ghost question", coId });
    expect(res.statusCode).toBe(404);
  });

  // DELETE
  it("should delete a question (soft delete + cleanup)", async () => {
    const res = await request(app)
      .delete(`/api/questions/${subjectiveId}`)
      .set("Authorization", `Bearer ${instructorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("deleting non-existent question should 404", async () => {
    const res = await request(app)
      .delete("/api/questions/99999")
      .set("Authorization", `Bearer ${instructorToken}`);
    expect(res.statusCode).toBe(404);
  });
});
