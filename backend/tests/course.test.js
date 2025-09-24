import request from "supertest";
import app from "../server.js";
import { pool } from "../config/db.js";

describe("Course API", () => {
  let token;

  beforeAll(async () => {
    // ✅ Login with admin user from your seed DB
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jestinstructor_1758715660170@example.com",
        password: "password123"
      });

    token = res.body.token;
  });

  afterAll(async () => {
    await pool.end(); // ✅ close DB pool
  });

  it("should create a new course", async () => {
    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: `TEST${Date.now()}`,   // unique code
        title: "Jest Testing Course",
        ltp_structure: "3-0-0"
      });

    console.log("CREATE COURSE RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("course_id");
    expect(res.body).toHaveProperty("assessments");
  });

  it("should fetch all courses", async () => {
    const res = await request(app)
      .get("/api/courses")
      .set("Authorization", `Bearer ${token}`);

    console.log("GET COURSES RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should fetch courses with COs", async () => {
  const res = await request(app)
    .get("/api/courses/with-cos")
    .set("Authorization", `Bearer ${token}`);

  console.log("GET COURSES WITH COs RESPONSE:", res.statusCode, res.body);

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

it("should reject course creation without token", async () => {
  const res = await request(app)
    .post("/api/courses")
    .send({
      code: `NOTOKEN${Date.now()}`,
      title: "Should Fail",
      ltp_structure: "2-0-0"
    });

  expect(res.statusCode).toBe(401); // unauthorized
});

it("should reject course creation with wrong role", async () => {
  // login as a student (assuming you have one in DB)
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "student@qams.com", password: "student123" });

  const studentToken = loginRes.body.token;

  const res = await request(app)
    .post("/api/courses")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({
      code: `STUDENTFAIL${Date.now()}`,
      title: "Should Fail",
      ltp_structure: "2-1-0"
    });

  expect(res.statusCode).toBe(403); // forbidden
});

});


