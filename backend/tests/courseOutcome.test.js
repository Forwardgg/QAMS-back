// co.test.js
import request from "supertest";
import app from "../server.js";

let adminToken;
let instructorToken;
let adminCourseId;
let instructorCourseId;
let adminCOId;
let instructorCOId;

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

  // Create courses for testing
  const adminCourseRes = await request(app)
    .post("/api/courses")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ code: "CO101", title: "CO Testing - Admin", l: 3, t: 1, p: 0 });
  adminCourseId = adminCourseRes.body.data.course_id;

  const instructorCourseRes = await request(app)
    .post("/api/courses")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({ code: "CO201", title: "CO Testing - Instructor", l: 2, t: 1, p: 1 });
  instructorCourseId = instructorCourseRes.body.data.course_id;
});

describe("Course Outcome (CO) API", () => {
  // CREATE
  it("admin should create a CO for their course", async () => {
    const res = await request(app)
      .post(`/api/cos/course/${adminCourseId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ coNumber: "CO1", description: "Understand basics" });

    expect(res.statusCode).toBe(201);
    adminCOId = res.body.data.co_id;
  });

  it("instructor should create a CO for their course", async () => {
    const res = await request(app)
      .post(`/api/cos/course/${instructorCourseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ coNumber: "CO1", description: "Apply concepts" });

    expect(res.statusCode).toBe(201);
    instructorCOId = res.body.data.co_id;
  });

  it("should reject duplicate CO number in same course", async () => {
    const res = await request(app)
      .post(`/api/cos/course/${adminCourseId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ coNumber: "CO1", description: "Duplicate test" });

    expect(res.statusCode).toBe(409);
  });

  // READ
  it("should fetch COs by course (public)", async () => {
    const res = await request(app).get(`/api/cos/by-course/${adminCourseId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.outcomes.length).toBeGreaterThan(0);
  });

  it("should fetch all courses with COs (public)", async () => {
    const res = await request(app).get("/api/cos");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.some(c => c.outcomes.length > 0)).toBe(true);
  });

  // UPDATE
  it("admin should update their CO", async () => {
    const res = await request(app)
      .put(`/api/cos/outcome/${adminCOId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Updated CO description" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.description).toBe("Updated CO description");
  });

  it("instructor should update their own CO", async () => {
    const res = await request(app)
      .put(`/api/cos/outcome/${instructorCOId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ description: "Updated Instructor CO" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.description).toBe("Updated Instructor CO");
  });

  it("instructor should NOT update admin's CO", async () => {
    const res = await request(app)
      .put(`/api/cos/outcome/${adminCOId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ description: "Hack attempt" });

    expect(res.statusCode).toBe(403);
  });

  it("updating non-existent CO should return 404", async () => {
    const res = await request(app)
      .put("/api/cos/outcome/9999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Does not exist" });

    expect(res.statusCode).toBe(404);
  });

  // DELETE
  it("instructor should delete their own CO", async () => {
    const res = await request(app)
      .delete(`/api/cos/outcome/${instructorCOId}`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.co_id).toBe(instructorCOId);
  });

  it("instructor should NOT delete admin's CO", async () => {
    const res = await request(app)
      .delete(`/api/cos/outcome/${adminCOId}`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(403);
  });

  it("admin should delete their CO", async () => {
    const res = await request(app)
      .delete(`/api/cos/outcome/${adminCOId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.co_id).toBe(adminCOId);
  });

  it("deleting non-existent CO should return 404", async () => {
    const res = await request(app)
      .delete("/api/cos/outcome/9999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});
