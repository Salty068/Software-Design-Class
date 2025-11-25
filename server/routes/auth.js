import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db.js";

export const auth = Router();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = "7d"; // Token expires in 7 days

export function validateCredentials(email, password) {
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email is required and must be a non-empty string');
  } else if (email.length > 100) {
    errors.push('Email must not exceed 100 characters');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email must be a valid email address');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required and must be a string');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length > 100) {
    errors.push('Password must not exceed 100 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generate JWT token
function generateToken(userId) {
  return jwt.sign(
    { userId, role: 'user' }, // You can add role here if you have roles in DB
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

auth.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const validation = validateCredentials(email, password);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const existingUser = await prisma.userCredentials.findUnique({
      where: { userId: email.trim().toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        errors: ['A user with this email already exists']
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.userCredentials.create({
      data: {
        userId: email.trim().toLowerCase(),
        password: hashedPassword
      }
    });

    // Generate token for immediate login after registration
    const token = generateToken(newUser.userId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { 
        email: newUser.userId,
        token // Send token back to client
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      errors: [error.message]
    });
  }
});

auth.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['Email and password are required']
      });
    }

    const user = await prisma.userCredentials.findUnique({
      where: { userId: email.trim().toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Invalid email or password']
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Invalid email or password']
      });
    }

    // Generate token
    const token = generateToken(user.userId);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { 
        email: user.userId,
        token // Send token back to client
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      errors: [error.message]
    });
  }
});

auth.put("/change-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['Email, currentPassword, and newPassword are required']
      });
    }

    const validation = validateCredentials(email, newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const user = await prisma.userCredentials.findUnique({
      where: { userId: email.trim().toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['User does not exist']
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid current password',
        errors: ['Current password is incorrect']
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.userCredentials.update({
      where: { userId: email.trim().toLowerCase() },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      errors: [error.message]
    });
  }
});

export default auth;