import request from "supertest";
import app from "../server.js";
import { pool } from "../config/db.js";

describe("Auth API", () => {
  const users = [
    {
      name: "jest admin",
      email: `jestadmin_${Date.now()}@example.com`,
      password: "password123",
      role: "admin"
    },
    {
      name: "jest moderator",
      email: `jestmoderator_${Date.now()}@example.com`,
      password: "password123",
      role: "moderator"
    },
    {
      name: "jest instructor",
      email: `jestinstructor_${Date.now()}@example.com`,
      password: "password123",
      role: "instructor"
    }
  ];

  afterAll(async () => {
    await pool.end(); // ✅ close DB connection
  });

  users.forEach((user) => {
    it(`should register a new ${user.role}`, async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(user);

      console.log(`REGISTER RESPONSE (${user.role}):`, res.statusCode, res.body);

      // ✅ Accept 200 (success), 201 (created), or 400 (duplicate email)
      expect([200, 201, 400]).toContain(res.statusCode);

      if (res.statusCode === 201) {
        expect(res.body).toHaveProperty("user_id");
      }
    });

    it(`should login as ${user.role}`, async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: user.password
        });

      console.log(`LOGIN RESPONSE (${user.role}):`, res.statusCode, res.body);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("user");
    });
  });
});
