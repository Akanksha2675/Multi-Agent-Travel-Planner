import { Router } from "express";
import { registerUser, loginUser, signToken, getUserFromHeader } from "../lib/auth.js";

const router = Router();

router.post("/auth/register", (req, res) => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password || !name) {
    res.status(400).json({ error: "email, password and name are required" });
    return;
  }
  const user = registerUser(String(email), String(password), String(name));
  if (!user) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const token = signToken(user);
  res.json({ token, user });
});

router.post("/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const user = loginUser(String(email), String(password));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = signToken(user);
  res.json({ token, user });
});

router.get("/auth/me", (req, res) => {
  const user = getUserFromHeader(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ user });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ ok: true });
});

export default router;
