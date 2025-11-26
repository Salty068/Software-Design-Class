import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../db.js";
import { authenticate } from "./middleware/auth.js";

const router = Router();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = "7d";

const emailSchema = z.email()
  .trim()
  .min(1)
  .max(100)
  .transform((v) => v.toLowerCase());

const passwordSchema = z.string().min(8).max(100);

const nameSchema = z.string().trim().min(1).max(50);

const roleSchema = z.enum(["Volunteer", "Organizer", "Admin"]).optional();

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: roleSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const changePasswordSchema = z.object({
  email: emailSchema,
  currentPassword: z.string().min(8),
  newPassword: passwordSchema,
});

function computeProfileComplete(profile) {
  if (!profile) return false;
  return [profile.fullName, profile.address1, profile.city, profile.state, profile.zipCode].every(
    (v) => typeof v === "string" && v.trim().length > 0
  );
}

function buildUserResponse(credentials, profile, lastLoginIso) {
  return {
    id: credentials.userId, // Use email as the ID since it's the userId in the database
    email: credentials.userId,
    name: profile.fullName,
    role: profile.role,
    profileComplete: computeProfileComplete(profile),
    createdAt: credentials.createdAt.toISOString(),
    lastLogin: lastLoginIso ?? null,
  };
}

function signToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function formatZodErrors(error) {
  return error?.errors?.map((e) => e.message) || ['Validation error'];
}

router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Validation failed", errors: formatZodErrors(parsed.error) });

    const { email, password, name, role } = parsed.data;

    const existing = await prisma.userCredentials.findUnique({ where: { userId: email } });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const credentials = await prisma.userCredentials.create({
      data: { userId: email, password: hashedPassword },
    });

    const profile = await prisma.userProfile.create({
      data: {
        userId: email,
        fullName: name,
        role: role || "Volunteer",
        address1: "",
        city: "",
        state: "",
        zipCode: "",
        skills: [],
        availability: {},
        preferences: null,
      },
    });

    const lastLoginIso = new Date().toISOString();
    const user = buildUserResponse(credentials, profile, lastLoginIso);
    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Validation failed", errors: formatZodErrors(parsed.error) });

    const { email, password } = parsed.data;

    const credentials = await prisma.userCredentials.findUnique({ where: { userId: email } });
    if (!credentials) return res.status(401).json({ message: "Invalid email or password" });

    const valid = await bcrypt.compare(password, credentials.password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });

    const profile = await prisma.userProfile.findUnique({ where: { userId: email } });
    if (!profile) return res.status(500).json({ message: "User profile missing" });

    const lastLoginIso = new Date().toISOString();
    const user = buildUserResponse(credentials, profile, lastLoginIso);
    const token = signToken(user);

    return res.status(200).json({ token, user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", e: error });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const payload = req.user;
    if (!payload?.email) return res.status(401).json({ message: "Invalid or expired token" });

    const credentials = await prisma.userCredentials.findUnique({ where: { userId: payload.email } });
    const profile = await prisma.userProfile.findUnique({ where: { userId: payload.email } });

    if (!credentials || !profile) return res.status(401).json({ message: "Invalid or expired token" });

    const user = buildUserResponse(credentials, profile, payload.lastLogin);
    return res.status(200).json(user);
  }catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/change-password", async (req, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Validation failed", errors: formatZodErrors(parsed.error) });

    const { email, currentPassword, newPassword } = parsed.data;

    const credentials = await prisma.userCredentials.findUnique({ where: { userId: email } });
    if (!credentials) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, credentials.password);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

    const hashedNew = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.userCredentials.update({
      where: { userId: email },
      data: { password: hashedNew },
    });

    return res.status(200).json({ message: "Password changed successfully" });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;