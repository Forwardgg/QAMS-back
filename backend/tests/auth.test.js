import request from "supertest";
import app from "../server.js";
import { pool } from "../config/db.js";

describe("Auth Endpoints", () => {
  let token;
  let userId;

  it("should register a new instructor", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "testuser@example.com",
        password: "Testpass123",
        role: "instructor",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      name: "Test User",
      role: "instructor",
    });
    userId = res.body.user.id;
  });

  it("should reject duplicate registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "testuser@example.com",
        password: "Testpass123",
        role: "instructor",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/already registered/i);
  });

  it("should login with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "testuser@example.com",
        password: "Testpass123",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "testuser@example.com",
        password: "WrongPassword",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it("should allow seeded instructor to login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "seed_instructor@example.com",
        password: "instructorpassword",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      role: "instructor",
    });
  });

  it("should request a password reset", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "testuser@example.com" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/reset link sent/i);
  });

  it("should reset password with a valid token", async () => {
    const jwt = (await import("jsonwebtoken")).default;

    const resetToken = jwt.sign(
      { user_id: userId },
      process.env.JWT_RESET_SECRET,
      { expiresIn: process.env.JWT_RESET_EXPIRES_IN, algorithm: "HS256" }
    );

    const resetRes = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: resetToken,
        newPassword: "Newpass123",
      });

    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.body).toHaveProperty("message", "Password reset successful");

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "testuser@example.com",
        password: "Newpass123",
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty("token");
  });

  it("should soft delete user (admin only)", async () => {
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@example.com",
        password: "adminpassword", // seeded in jest.setup.js
      });

    expect(adminLogin.statusCode).toBe(200);
    const adminToken = adminLogin.body.token;

    const res = await request(app)
      .delete(`/api/auth/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    // If user exists → 200, if already deleted → 404
    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("message", "User deactivated successfully");
      expect(res.body.user).toHaveProperty("status", "inactive");
    }
  });
});
