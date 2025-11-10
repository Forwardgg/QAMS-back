// course.test.js
import request from "supertest";
import app from "../server.js";

let adminToken;
let instructorToken;
let adminCourseId;
let instructorCourseId;

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
});

describe("Course API", () => {
  // CREATE
  it("admin should create a course", async () => {
    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "CS101",
        title: "Intro to CS",
        l: 3,
        t: 1,
        p: 0,
      });

    expect(res.statusCode).toBe(201);
    adminCourseId = res.body.data.course_id;
  });

  it("instructor should create their own course", async () => {
    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        code: "CS201",
        title: "Data Structures",
        l: 3,
        t: 0,
        p: 2,
      });

    expect(res.statusCode).toBe(201);
    instructorCourseId = res.body.data.course_id;
  });

  it("should reject invalid LTP values", async () => {
    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "BAD101", title: "Invalid", l: -1, t: "x", p: 0 });

    expect(res.statusCode).toBe(400);
  });

  it("should reject duplicate course codes", async () => {
    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "CS101", title: "Duplicate", l: 3, t: 1, p: 0 });

    expect(res.statusCode).toBe(409);
  });

  // READ
  it("admin should fetch all courses", async () => {
    const res = await request(app)
      .get("/api/courses")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("instructor should fetch only their own courses", async () => {
    const res = await request(app)
      .get("/api/courses/mine")
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(c => c.created_by_name === "Seed Instructor")).toBe(true);
  });

  it("public should fetch courses without login", async () => {
    const res = await request(app).get("/api/courses/public");
    expect(res.statusCode).toBe(200);
    expect(res.body.data[0]).toHaveProperty("code");
    expect(res.body.data[0]).toHaveProperty("title");
  });

  it("get course by code should work", async () => {
    const res = await request(app).get("/api/courses/code/CS101");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.code).toBe("CS101");
  });

  it("get course by code should 404 if not found", async () => {
    const res = await request(app).get("/api/courses/code/NOPE999");
    expect(res.statusCode).toBe(404);
  });

  it("search by title should work", async () => {
    const res = await request(app).get("/api/courses/search?title=Data");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.some(c => c.title.includes("Data"))).toBe(true);
  });

  it("search without title query should 400", async () => {
    const res = await request(app).get("/api/courses/search");
    expect(res.statusCode).toBe(400);
  });

  // UPDATE
  it("admin should update a course", async () => {
    const res = await request(app)
      .put(`/api/courses/${adminCourseId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "CS101", title: "Intro to Computer Science", l: 3, t: 1, p: 0 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe("Intro to Computer Science");
  });

  it("instructor should update their own course", async () => {
    const res = await request(app)
      .put(`/api/courses/${instructorCourseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ code: "CS201", title: "Advanced Data Structures", l: 3, t: 0, p: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe("Advanced Data Structures");
  });

  it("instructor should NOT update admin's course", async () => {
    const res = await request(app)
      .put(`/api/courses/${adminCourseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ code: "CS101", title: "Hacked", l: 3, t: 1, p: 0 });

    expect(res.statusCode).toBe(403);
  });

  it("updating non-existent course should 404", async () => {
    const res = await request(app)
      .put("/api/courses/9999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "NOPE", title: "Does Not Exist", l: 1, t: 0, p: 0 });

    expect(res.statusCode).toBe(404);
  });

  // DELETE
  it("instructor should delete their own course", async () => {
    const res = await request(app)
      .delete(`/api/courses/${instructorCourseId}`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("instructor should NOT delete admin's course", async () => {
    const res = await request(app)
      .delete(`/api/courses/${adminCourseId}`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(403);
  });

  it("admin should delete their own course", async () => {
    const res = await request(app)
      .delete(`/api/courses/${adminCourseId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("deleting non-existent course should 404", async () => {
    const res = await request(app)
      .delete("/api/courses/9999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});
