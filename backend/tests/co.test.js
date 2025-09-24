import request from "supertest";
import app from "../server.js";
import { pool } from "../config/db.js";

describe("Course Outcome API", () => {
  let token;
  let courseId = 1;
  let createdCOId;

  beforeAll(async () => {
    // login as instructor/admin
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jestinstructor_1758715660170@example.com",
        password: "password123"
      });
    token = res.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  it("should add a new CO to a course", async () => {

    // co_number must be <= 10 chars
    const shortCoNumber = `CO${Math.floor(Math.random() * 10000)}`;
    const res = await request(app)
      .post(`/api/cos/${courseId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        co_number: shortCoNumber, // unique and short
        description: "Understand basics of algorithms"
      });

    console.log("ADD CO RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("co_id");
    createdCOId = res.body.co_id;
  });

  it("should fetch COs for a course", async () => {
    const res = await request(app)
      .get(`/api/cos/${courseId}`)
      .set("Authorization", `Bearer ${token}`);

    console.log("GET COs RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should not allow adding CO without token", async () => {
    const res = await request(app)
      .post(`/api/cos/${courseId}`)
      .send({
        co_number: "COX",
        description: "Should fail"
      });

    expect(res.statusCode).toBe(401); // unauthorized
  });
});
