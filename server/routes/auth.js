import { Router } from "express";
import bcrypt from "bcrypt";
import prisma from "../db.js";

export const auth = Router();

const SALT_ROUNDS = 10;

export function validateCredentials(userId, password) {
  const errors = [];

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    errors.push('userId is required and must be a non-empty string');
  } else if (userId.length > 100) {
    errors.push('userId must not exceed 100 characters');
  }

  if (!password || typeof password !== 'string') {
    errors.push('password is required and must be a string');
  } else if (password.length < 8) {
    errors.push('password must be at least 8 characters long');
  } else if (password.length > 100) {
    errors.push('password must not exceed 100 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

auth.post("/register", async (req, res) => {
  try {
    const { userId, password } = req.body;

    const validation = validateCredentials(userId, password);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const existingUser = await prisma.userCredentials.findUnique({
      where: { userId: userId.trim() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        errors: ['A user with this userId already exists']
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.userCredentials.create({
      data: {
        userId: userId.trim(),
        password: hashedPassword
      }
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { userId: newUser.userId }
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
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['userId and password are required']
      });
    }

    const user = await prisma.userCredentials.findUnique({
      where: { userId: userId.trim() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Invalid userId or password']
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Invalid userId or password']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { userId: user.userId }
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
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['userId, currentPassword, and newPassword are required']
      });
    }

    const validation = validateCredentials(userId, newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const user = await prisma.userCredentials.findUnique({
      where: { userId: userId.trim() }
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
      where: { userId: userId.trim() },
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
