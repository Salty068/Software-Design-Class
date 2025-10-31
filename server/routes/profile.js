import { Router } from "express";

import { toUniqueSkills } from "../shared.js";
import { store } from "../store.memory.js";
import prisma from "../db.js";

export const profiles = new Map();

export const VALIDATION_RULES = {
  fullName: { minLength: 1, maxLength: 50 },
  address1: { minLength: 1, maxLength: 100 },
  address2: { maxLength: 100 },
  city: { minLength: 1, maxLength: 100 },
  state: { length: 2 },
  zipCode: { minLength: 5, maxLength: 10 },
  preferences: { maxLength: 500 },
  skills: { minItems: 1, maxItems: 20, itemMaxLength: 50 },
  availability: { minItems: 1, maxItems: 7 },
};

export function validateStringLength(value, fieldName, minLength, maxLength) {
  if (typeof value !== "string") {
    return { isValid: false, error: `${fieldName} must be a string` };
  }

  if (minLength !== undefined && value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} character(s) long`,
    };
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${maxLength} characters`,
    };
  }

  return { isValid: true };
}

export function validateStateCode(state) {
  if (typeof state !== "string") {
    return { isValid: false, error: "State must be a valid 2-letter uppercase code (e.g., TX, CA, NY)" };
  }

  const normalized = state.trim();
  const stateRegex = /^[A-Z]{2}$/;

  if (!stateRegex.test(normalized)) {
    return {
      isValid: false,
      error: "State must be a valid 2-letter uppercase code (e.g., TX, CA, NY)",
    };
  }

  return { isValid: true };
}

export function validateZipCode(zipCode) {
  if (typeof zipCode !== "string") {
    return { isValid: false, error: "Zip code must be in format 12345 or 12345-6789" };
  }

  const zipRegex = /^\d{5}(-\d{4})?$/;

  if (!zipRegex.test(zipCode.trim())) {
    return {
      isValid: false,
      error: "Zip code must be in format 12345 or 12345-6789",
    };
  }

  return { isValid: true };
}

export function validateArray(array, fieldName, minItems, maxItems, itemMaxLength) {
  if (!Array.isArray(array)) {
    return {
      isValid: false,
      error: `${fieldName} must be an array`,
    };
  }

  if (minItems !== undefined && array.length < minItems) {
    return {
      isValid: false,
      error: `${fieldName} must contain at least ${minItems} item(s)`,
    };
  }

  if (maxItems !== undefined && array.length > maxItems) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${maxItems} items`,
    };
  }

  for (let i = 0; i < array.length; i += 1) {
    if (typeof array[i] !== "string") {
      return {
        isValid: false,
        error: `${fieldName}[${i}] must be a string`,
      };
    }

    const item = array[i].trim();

    if (item.length === 0) {
      return {
        isValid: false,
        error: `${fieldName}[${i}] cannot be empty`,
      };
    }

    if (itemMaxLength !== undefined && item.length > itemMaxLength) {
      return {
        isValid: false,
        error: `${fieldName}[${i}] must not exceed ${itemMaxLength} characters`,
      };
    }
  }

  return { isValid: true };
}

export function validateProfileData(profileData) {
  const errors = [];

  if (!profileData || typeof profileData !== "object") {
    return {
      isValid: false,
      errors: ["Profile data is required"],
    };
  }

  if (!profileData.fullName || typeof profileData.fullName !== "string") {
    errors.push("fullName is required and must be a string");
  } else {
    const result = validateStringLength(
      profileData.fullName.trim(),
      "fullName",
      VALIDATION_RULES.fullName.minLength,
      VALIDATION_RULES.fullName.maxLength,
    );
    if (!result.isValid) errors.push(result.error);
  }

  if (!profileData.location || typeof profileData.location !== "object") {
    errors.push("location is required and must be an object");
  } else {
    const { address1, address2, city, state, zipCode } = profileData.location;

    if (!address1 || typeof address1 !== "string") {
      errors.push("location.address1 is required and must be a string");
    } else {
      const result = validateStringLength(
        address1.trim(),
        "address1",
        VALIDATION_RULES.address1.minLength,
        VALIDATION_RULES.address1.maxLength,
      );
      if (!result.isValid) errors.push(result.error);
    }

    if (address2 !== undefined && address2 !== null && address2 !== "") {
      if (typeof address2 !== "string") {
        errors.push("location.address2 must be a string");
      } else {
        const result = validateStringLength(
          address2.trim(),
          "address2",
          undefined,
          VALIDATION_RULES.address2.maxLength,
        );
        if (!result.isValid) errors.push(result.error);
      }
    }

    if (!city || typeof city !== "string") {
      errors.push("location.city is required and must be a string");
    } else {
      const result = validateStringLength(
        city.trim(),
        "city",
        VALIDATION_RULES.city.minLength,
        VALIDATION_RULES.city.maxLength,
      );
      if (!result.isValid) errors.push(result.error);
    }

    if (!state || typeof state !== "string") {
      errors.push("location.state is required and must be a string");
    } else {
      const result = validateStateCode(state.trim().toUpperCase());
      if (!result.isValid) errors.push(result.error);
    }

    if (!zipCode || typeof zipCode !== "string") {
      errors.push("location.zipCode is required and must be a string");
    } else {
      const result = validateZipCode(zipCode);
      if (!result.isValid) errors.push(result.error);
    }
  }

  const skillsResult = validateArray(
    profileData.skills,
    "skills",
    VALIDATION_RULES.skills.minItems,
    VALIDATION_RULES.skills.maxItems,
    VALIDATION_RULES.skills.itemMaxLength,
  );
  if (!skillsResult.isValid) errors.push(skillsResult.error);

  if (profileData.preferences !== undefined && profileData.preferences !== null && profileData.preferences !== "") {
    if (typeof profileData.preferences !== "string") {
      errors.push("preferences must be a string");
    } else {
      const result = validateStringLength(
        profileData.preferences.trim(),
        "preferences",
        undefined,
        VALIDATION_RULES.preferences.maxLength,
      );
      if (!result.isValid) errors.push(result.error);
    }
  }

  const availabilityResult = validateArray(
    profileData.availability,
    "availability",
    VALIDATION_RULES.availability.minItems,
    VALIDATION_RULES.availability.maxItems,
  );
  if (!availabilityResult.isValid) errors.push(availabilityResult.error);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function clearAllProfiles() {
  const existingProfiles = store.listProfiles();
  existingProfiles.forEach((profileRecord) => {
    store.removeVolunteer(profileRecord.userId);
  });
  store.clearProfiles();
}

function dedupe(values = []) {
  return Array.from(new Set(values));
}

function normalizeProfile(payload, userId) {
  return {
    userId,
    fullName: payload.fullName.trim(),
    location: {
      address1: payload.location.address1.trim(),
      address2: payload.location.address2 ? payload.location.address2.trim() : undefined,
      city: payload.location.city.trim(),
      state: payload.location.state.trim().toUpperCase(),
      zipCode: payload.location.zipCode.trim(),
    },
    skills: dedupe(payload.skills.map((skill) => skill.trim())),
    preferences: payload.preferences ? payload.preferences.trim() : undefined,
    availability: dedupe(payload.availability.map((day) => day.trim())),
  };
}

function syncVolunteerFromProfile(profileRecord) {
  store.upsertVolunteers([
    {
      id: profileRecord.userId,
      name: profileRecord.fullName,
      location: `${profileRecord.location.city}, ${profileRecord.location.state}`,
      skills: toUniqueSkills(profileRecord.skills),
    },
  ]);
}

    

function ensureUserId(res, userId) {
  if (!userId || userId.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "userId is required",
      errors: ["userId parameter cannot be empty"],
    });
    return false;
  }
  return true;
}

export const profile = Router();

profile.get("/", async (_req, res) => {
  try {
    const allProfiles = await prisma.userProfile.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const formattedProfiles = allProfiles.map(profile => ({
      userId: profile.userId,
      fullName: profile.fullName,
      location: {
        address1: profile.address1,
        address2: profile.address2,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
      },
      skills: profile.skills,
      preferences: profile.preferences,
      availability: profile.availability,
    }));

    res.status(200).json({ success: true, count: formattedProfiles.length, data: formattedProfiles });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profiles', errors: [error.message] });
  }
});

profile.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!ensureUserId(res, userId)) return;

  try {
    const profileData = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profileData) {
      res.status(404).json({ success: false, message: `Profile not found for user ID: ${userId}` });
      return;
    }

    const formattedProfile = {
      userId: profileData.userId,
      fullName: profileData.fullName,
      location: {
        address1: profileData.address1,
        address2: profileData.address2,
        city: profileData.city,
        state: profileData.state,
        zipCode: profileData.zipCode,
      },
      skills: profileData.skills,
      preferences: profileData.preferences,
      availability: profileData.availability,
    };

    res.status(200).json({ success: true, data: formattedProfile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile', errors: [error.message] });
  }
});

profile.post("/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!ensureUserId(res, userId)) return;

  try {
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (existingProfile) {
      res.status(409).json({ success: false, message: `Profile already exists for user ID: ${userId}` });
      return;
    }

    const validation = validateProfileData(req.body);
    if (!validation.isValid) {
      res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
      return;
    }

    const normalized = normalizeProfile(req.body, userId);

    const newProfile = await prisma.userProfile.create({
      data: {
        userId: normalized.userId,
        fullName: normalized.fullName,
        address1: normalized.location.address1,
        address2: normalized.location.address2,
        city: normalized.location.city,
        state: normalized.location.state,
        zipCode: normalized.location.zipCode,
        skills: normalized.skills,
        preferences: normalized.preferences,
        availability: normalized.availability,
      }
    });

    syncVolunteerFromProfile(normalized);

    const formattedProfile = {
      userId: newProfile.userId,
      fullName: newProfile.fullName,
      location: {
        address1: newProfile.address1,
        address2: newProfile.address2,
        city: newProfile.city,
        state: newProfile.state,
        zipCode: newProfile.zipCode,
      },
      skills: newProfile.skills,
      preferences: newProfile.preferences,
      availability: newProfile.availability,
    };

    res.status(201).json({ success: true, message: "Profile created successfully", data: formattedProfile });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to create profile', errors: [error.message] });
  }
});

profile.put("/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!ensureUserId(res, userId)) return;

  try {
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!existingProfile) {
      res.status(404).json({ success: false, message: `Profile not found for user ID: ${userId}` });
      return;
    }

    const errors = [];
    const updateData = req.body ?? {};

    if (updateData.fullName !== undefined) {
      if (typeof updateData.fullName !== "string" || updateData.fullName.trim().length === 0) {
        errors.push("fullName must be a non-empty string");
      } else {
        const result = validateStringLength(
          updateData.fullName.trim(),
          "fullName",
          VALIDATION_RULES.fullName.minLength,
          VALIDATION_RULES.fullName.maxLength,
        );
        if (!result.isValid) errors.push(result.error);
      }
    }

    if (updateData.location) {
      const { address1, address2, city, state, zipCode } = updateData.location;

      if (!address1 || typeof address1 !== "string" || address1.trim().length === 0) {
        errors.push("location.address1 is required and must be a non-empty string");
      } else {
        const result = validateStringLength(
          address1.trim(),
          "address1",
          VALIDATION_RULES.address1.minLength,
          VALIDATION_RULES.address1.maxLength,
        );
        if (!result.isValid) errors.push(result.error);
      }

      if (address2 !== undefined && address2 !== null && address2 !== "") {
        if (typeof address2 !== "string") {
          errors.push("location.address2 must be a string");
        } else {
          const result = validateStringLength(
            address2.trim(),
            "address2",
            undefined,
            VALIDATION_RULES.address2.maxLength,
          );
          if (!result.isValid) errors.push(result.error);
        }
      }

      if (!city || typeof city !== "string" || city.trim().length === 0) {
        errors.push("location.city is required and must be a non-empty string");
      } else {
        const result = validateStringLength(
          city.trim(),
          "city",
          VALIDATION_RULES.city.minLength,
          VALIDATION_RULES.city.maxLength,
        );
        if (!result.isValid) errors.push(result.error);
      }

      if (!state || typeof state !== "string") {
        errors.push("location.state is required and must be a string");
      } else {
        const result = validateStateCode(state.trim().toUpperCase());
        if (!result.isValid) errors.push(result.error);
      }

      if (!zipCode || typeof zipCode !== "string") {
        errors.push("location.zipCode is required and must be a string");
      } else {
        const result = validateZipCode(zipCode);
        if (!result.isValid) errors.push(result.error);
      }
    }

    if (updateData.skills !== undefined) {
      const result = validateArray(
        updateData.skills,
        "skills",
        VALIDATION_RULES.skills.minItems,
        VALIDATION_RULES.skills.maxItems,
        VALIDATION_RULES.skills.itemMaxLength,
      );
      if (!result.isValid) errors.push(result.error);
    }

    if (updateData.preferences !== undefined && updateData.preferences !== null && updateData.preferences !== "") {
      if (typeof updateData.preferences !== "string") {
        errors.push("preferences must be a string");
      } else {
        const result = validateStringLength(
          updateData.preferences.trim(),
          "preferences",
          undefined,
          VALIDATION_RULES.preferences.maxLength,
        );
        if (!result.isValid) errors.push(result.error);
      }
    }

    if (updateData.availability !== undefined) {
      const result = validateArray(
        updateData.availability,
        "availability",
        VALIDATION_RULES.availability.minItems,
        VALIDATION_RULES.availability.maxItems,
      );
      if (!result.isValid) errors.push(result.error);
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, message: "Validation failed", errors });
      return;
    }

    const updatePayload = {};

    if (updateData.fullName) {
      updatePayload.fullName = updateData.fullName.trim();
    }

    if (updateData.location) {
      updatePayload.address1 = updateData.location.address1.trim();
      updatePayload.address2 = updateData.location.address2 ? updateData.location.address2.trim() : null;
      updatePayload.city = updateData.location.city.trim();
      updatePayload.state = updateData.location.state.trim().toUpperCase();
      updatePayload.zipCode = updateData.location.zipCode.trim();
    }

    if (updateData.skills) {
      updatePayload.skills = updateData.skills.map((skill) => skill.trim());
    }

    if (updateData.preferences !== undefined) {
      updatePayload.preferences = updateData.preferences ? updateData.preferences.trim() : null;
    }

    if (updateData.availability) {
      updatePayload.availability = updateData.availability.map((day) => day.trim());
    }

    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: updatePayload
    });

    const normalized = {
      userId: updatedProfile.userId,
      fullName: updatedProfile.fullName,
      location: {
        address1: updatedProfile.address1,
        address2: updatedProfile.address2,
        city: updatedProfile.city,
        state: updatedProfile.state,
        zipCode: updatedProfile.zipCode,
      },
      skills: updatedProfile.skills,
      preferences: updatedProfile.preferences,
      availability: updatedProfile.availability,
    };

    syncVolunteerFromProfile(normalized);

    res.status(200).json({ success: true, message: "Profile updated successfully", data: normalized });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', errors: [error.message] });
  }
});

profile.delete("/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!ensureUserId(res, userId)) return;

  try {
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!existingProfile) {
      res.status(404).json({ success: false, message: `Profile not found for user ID: ${userId}` });
      return;
    }

    await prisma.userProfile.delete({
      where: { userId }
    });

    res.status(200).json({ success: true, message: "Profile deleted successfully" });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ success: false, message: 'Failed to delete profile', errors: [error.message] });
  }
});

export default profile;
