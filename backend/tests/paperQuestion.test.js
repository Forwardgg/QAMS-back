// tests/paperQuestion.test.js
import request from "supertest";
import app from "../server.js";

let instructorToken;
let adminToken;
let courseId;
let coId;
let paperId;
let subjectiveId;
let mcqId;
let pqId;

beforeAll(async () => {
  // Login admin
  const adminRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@example.com", password: "adminpassword" });
  adminToken = adminRes.body.token;

  // Login instructor
  const instructorRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "seed_instructor@example.com", password: "instructorpassword" });
  instructorToken = instructorRes.body.token;

  // Create course
  const courseRes = await request(app)
    .post("/api/courses")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({ code: "PQ101", title: "Paper Question Testing", l: 3, t: 0, p: 2 });
  courseId = courseRes.body.data.course_id;

  // Add CO
  const coRes = await request(app)
    .post(`/api/cos/course/${courseId}`)
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({ coNumber: "CO1", description: "Understand testing" });
  coId = coRes.body.data.co_id;

  // Add subjective
  const subjRes = await request(app)
    .post(`/api/questions/subjective/${courseId}`)
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({ content: "Explain normalization", coId });
  subjectiveId = subjRes.body.data.question_id;

  // Add MCQ
  const mcqRes = await request(app)
    .post(`/api/questions/mcq/${courseId}`)
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({
      content: "Which is a DBMS?",
      coId,
      options: [
        { optionText: "Oracle", isCorrect: true },
        { optionText: "Excel", isCorrect: false },
      ],
    });
  mcqId = mcqRes.body.data.question_id;

  // Create paper
  const paperRes = await request(app)
    .post("/api/papers")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({
      courseId,
      title: "Unit Test Paper",
      examType: "Midterm",
      semester: "5",
      academicYear: "2025-26",
      fullMarks: 50,
      duration: "2 hrs",
    });
  paperId = paperRes.body.data.paper_id;
});

describe("PaperQuestion API", () => {
  it("should add a question to paper", async () => {
    const res = await request(app)
      .post(`/api/paper-questions/${paperId}/${subjectiveId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ sequence: 1, marks: 5, section: "A" });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.paper_id).toBe(paperId);
    pqId = res.body.data.id;
  });

  it("should not allow duplicate question in paper", async () => {
    const res = await request(app)
      .post(`/api/paper-questions/${paperId}/${subjectiveId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ sequence: 1, marks: 5, section: "A" });

    expect(res.statusCode).toBe(409); // conflict
  });

  it("should bulk add questions to paper", async () => {
    const res = await request(app)
      .post(`/api/paper-questions/${paperId}/bulk`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        questions: [
          { questionId: mcqId, sequence: 2, marks: 5, section: "A" },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("should fetch all questions in paper", async () => {
    const res = await request(app)
      .get(`/api/paper-questions/${paperId}`)
      .set("Authorization", `Bearer ${instructorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("should update a paper question mapping", async () => {
    const res = await request(app)
      .put(`/api/paper-questions/${pqId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ marks: 10, sequence: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.marks).toBe(10);
  });

  it("should 404 for non-existent mapping update", async () => {
    const res = await request(app)
      .put("/api/paper-questions/99999")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ marks: 10 });
    expect(res.statusCode).toBe(404);
  });

  it("should reorder questions in a paper", async () => {
    const res = await request(app)
      .put(`/api/paper-questions/${paperId}/reorder`)
      .set("Authorization", `Bearer ${instructorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it("should remove a question from paper", async () => {
    const res = await request(app)
      .delete(`/api/paper-questions/${pqId}`)
      .set("Authorization", `Bearer ${instructorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
  });

  it("should 404 when removing non-existent paper question", async () => {
    const res = await request(app)
      .delete("/api/paper-questions/99999")
      .set("Authorization", `Bearer ${instructorToken}`);
    expect(res.statusCode).toBe(404);
  });
});
