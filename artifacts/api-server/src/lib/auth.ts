import jwt from "jsonwebtoken";
import { createHash } from "crypto";

const SECRET = process.env["SESSION_SECRET"] ?? "demo-secret-key";

export interface User {
  id: string;
  email: string;
  name: string;
}

interface StoredUser extends User {
  passwordHash: string;
}

const users = new Map<string, StoredUser>();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + SECRET).digest("hex");
}

export function registerUser(email: string, password: string, name: string): User | null {
  if (users.has(email)) return null;
  const id = createHash("sha256").update(email).digest("hex").slice(0, 16);
  const user: StoredUser = { id, email, name, passwordHash: hashPassword(password) };
  users.set(email, user);
  return { id, email, name };
}

export function loginUser(email: string, password: string): User | null {
  const stored = users.get(email);
  if (!stored) return null;
  if (stored.passwordHash !== hashPassword(password)) return null;
  return { id: stored.id, email: stored.email, name: stored.name };
}

export function signToken(user: User): string {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): User | null {
  try {
    const payload = jwt.verify(token, SECRET) as { sub: string; email: string; name: string };
    return { id: payload.sub, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

export function getUserFromHeader(authHeader: string | undefined): User | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifyToken(authHeader.slice(7));
}
