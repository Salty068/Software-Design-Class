import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import { authenticate } from "./middleware/auth.js";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = "7d";
const DEFAULT_ROLE = "Volunteer";

const auth = Router();

const PROFILE_DEFAULTS = {
  address1: "",
  address2: "",
  city: "",
  state: "",
  zipCode: "",
  skills: [],
  availability: {},
  preferences: null,
};

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function requireEmailAndPassword(body = {}) {
  const { email, password } = body;
  const missing = !email || typeof email !== "string" || !password || typeof password !== "string";
  return missing ? ["Email and password are required"] : [];
}

function fallbackProfile(userId, name, role = DEFAULT_ROLE) {
  return {
    userId,
    fullName: name || userId,
    role,
    ...PROFILE_DEFAULTS,
  };
}

function computeProfileComplete(profile) {
  if (!profile) return false;
  const fields = [profile.fullName, profile.address1, profile.city, profile.state, profile.zipCode];
  return fields.every((value) => typeof value === "string" && value.trim().length > 0);
}

function normalizeDate(value) {
  if (value instanceof Date && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!isNaN(parsed)) return parsed;
  }
  return new Date();
}

function buildUserResponse(credentials = {}, profile = null, lastLoginIso = null) {
  const normalizedProfile =
    profile ?? fallbackProfile(credentials?.userId ?? "", credentials?.userId ?? "", DEFAULT_ROLE);
  const createdAt = normalizeDate(credentials?.createdAt ?? new Date());

  return {
    id: credentials?.userId ?? "",
    email: credentials?.userId ?? "",
    name: normalizedProfile.fullName,
    role: normalizedProfile.role || DEFAULT_ROLE,
    profileComplete: computeProfileComplete(normalizedProfile),
    createdAt: createdAt.toISOString(),
    lastLogin: lastLoginIso,
  };
}

function signToken(email) {
  const payload = { userId: email, role: "user" };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function findProfile(userId) {
  return (
    (await prisma.userProfile?.findUnique?.({ where: { userId } })) ??
    fallbackProfile(userId, userId, DEFAULT_ROLE)
  );
}

async function createProfile(userId, name, role) {
  return (
    (await prisma.userProfile?.create?.({
      data: {
        userId,
        fullName: name || userId,
        role: role || DEFAULT_ROLE,
        ...PROFILE_DEFAULTS,
      },
    })) ?? fallbackProfile(userId, name, role)
  );
}

auth.post("/register", async (req, res) => {
  try {
    const errors = requireEmailAndPassword(req.body);
    if (errors.length) return res.status(400).json({ success: false, errors });

    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const name =
      typeof req.body.name === "string" && req.body.name.trim().length
        ? req.body.name.trim()
        : email;
    const allowedRoles = new Set(["Volunteer", "Organizer", "Admin"]);
    const role =
      typeof req.body.role === "string" && allowedRoles.has(req.body.role)
        ? req.body.role
        : DEFAULT_ROLE;

    const existing = await prisma.userCredentials.findUnique({ where: { userId: email } });
    if (existing) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const credentials = await prisma.userCredentials.create({
      data: { userId: email, password: hashedPassword },
    });

    const profile = await createProfile(email, name, role);
    const user = buildUserResponse(credentials, profile, new Date().toISOString());
    const token = signToken(email);

    return res.status(201).json({
      success: true,
      data: { email, token },
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

auth.post("/login", async (req, res) => {
  try {
    const errors = requireEmailAndPassword(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    const credentials = await prisma.userCredentials.findUnique({ where: { userId: email } });
    if (!credentials) return res.status(401).json({ errors: ["Invalid email or password"] });

    const valid = await bcrypt.compare(password, credentials.password);
    if (!valid) return res.status(401).json({ errors: ["Invalid email or password"] });

    const profile = await findProfile(email);
    const user = buildUserResponse(credentials, profile, new Date().toISOString());
    const token = signToken(email);

    return res.status(200).json({
      success: true,
      data: { email, token },
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

auth.get("/me", authenticate, async (req, res) => {
  try {
    const userId = normalizeEmail(req.user?.userId || req.user?.email);
    if (!userId) return res.status(401).json({ message: "Invalid or expired token" });

    const credentials = await prisma.userCredentials.findUnique({ where: { userId } });
    if (!credentials) return res.status(401).json({ message: "Invalid or expired token" });

    const profile = await findProfile(userId);
    const user = buildUserResponse(credentials, profile, req.user?.lastLogin ?? null);
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

auth.put("/change-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body || {};
    if (
      !email ||
      typeof email !== "string" ||
      !currentPassword ||
      typeof currentPassword !== "string" ||
      !newPassword ||
      typeof newPassword !== "string"
    ) {
      return res
        .status(400)
        .json({ errors: ["Email, currentPassword, and newPassword are required"] });
    }

    const normalizedEmail = normalizeEmail(email);
    const credentials = await prisma.userCredentials.findUnique({ where: { userId: normalizedEmail } });
    if (!credentials) return res.status(404).json({ errors: ["User not found"] });

    const valid = await bcrypt.compare(currentPassword, credentials.password);
    if (!valid) return res.status(401).json({ errors: ["Current password is incorrect"] });

    const hashedNew = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.userCredentials.update({
      where: { userId: normalizedEmail },
      data: { password: hashedNew },
    });

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export { auth };
export default auth;
