import request from "supertest";
import app from "../server.js";

let adminToken;
let instructorToken;
let instructorCourseId;
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

  // Instructor creates a course for papers
  const courseRes = await request(app)
    .post("/api/courses")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({
      code: "QP101",
      title: "Paper Testing Course",
      l: 3,
      t: 1,
      p: 0,
    });

  instructorCourseId = courseRes.body.data.course_id;
});

describe("QuestionPaper API", () => {
  // CREATE
  it("instructor should create a paper for their course", async () => {
    const res = await request(app)
      .post("/api/papers")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        courseId: instructorCourseId,
        title: "Midterm Examination",
        examType: "Midterm",
        semester: "5",
        academicYear: "2025-26",
        fullMarks: 50,
        duration: "2 hrs",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Midterm Examination");
    paperId = res.body.data.paper_id;
  });

  it("should reject creating a paper for a non-existent course", async () => {
    const res = await request(app)
      .post("/api/papers")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        courseId: 9999,
        title: "Ghost Paper",
        examType: "Midterm",
        semester: "5",
        academicYear: "2025-26",
        fullMarks: 50,
        duration: "2 hrs",
      });

    expect(res.statusCode).toBe(404);
  });

  // READ
  it("admin should get all papers", async () => {
    const res = await request(app)
      .get("/api/papers")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("instructor should get only their own papers", async () => {
    const res = await request(app)
      .get("/api/papers")
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(p => p.instructor_id === res.body.data[0].instructor_id)).toBe(true);
  });

  it("should fetch paper by id", async () => {
    const res = await request(app)
      .get(`/api/papers/${paperId}`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.paper_id).toBe(paperId);
  });

  it("should 404 for non-existent paper id", async () => {
    const res = await request(app)
      .get("/api/papers/99999")
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(404);
  });

  // UPDATE
  it("instructor should update their own draft paper", async () => {
    const res = await request(app)
      .put(`/api/papers/${paperId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ title: "Updated Midterm Examination" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe("Updated Midterm Examination");
  });

  it("updating non-existent paper should return 404", async () => {
    const res = await request(app)
      .put("/api/papers/99999")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ title: "No Paper" });

    expect(res.statusCode).toBe(404);
  });

  // WORKFLOW
  it("instructor should submit their paper", async () => {
    const res = await request(app)
      .post(`/api/papers/${paperId}/submit`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("submitted");
  });

  it("admin should approve a submitted paper", async () => {
    const res = await request(app)
      .post(`/api/papers/${paperId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("approved");
  });

  it("admin should reject a paper", async () => {
    const res = await request(app)
      .post(`/api/papers/${paperId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("rejected");
  });

  // DELETE
  it("instructor should NOT delete a non-draft paper", async () => {
    const res = await request(app)
      .delete(`/api/papers/${paperId}`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(403);
  });

  it("admin should delete a paper", async () => {
    const res = await request(app)
      .delete(`/api/papers/${paperId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("deleting non-existent paper should 404", async () => {
    const res = await request(app)
      .delete("/api/papers/99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});
