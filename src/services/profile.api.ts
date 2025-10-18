// API service for profile operations

const API_BASE_URL = "/api/profile";

export interface Location {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface ProfileData {
  fullName: string;
  location: Location;
  skills: string[];
  preferences?: string;
  availability: string[];
}

export interface ProfileResponse {
  success: boolean;
  data?: any;
  message?: string;
  errors?: string[];
}


async function requestJson(url: string, options?: RequestInit): Promise<ProfileResponse> {
  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = (data && typeof data === "object" && "message" in data)
        ? String(data.message)
        : response.statusText || "Request failed";
      const errors = (data && typeof data === "object" && "errors" in data && Array.isArray(data.errors))
        ? data.errors as string[]
        : [];

      return {
        success: false,
        message,
        errors,
        data: data && typeof data === "object" && "data" in data ? (data as Record<string, unknown>).data : undefined,
      };
    }

    if (data && typeof data === "object" && "success" in data) {
      return data as ProfileResponse;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Profile API request failed:", error);
    return {
      success: false,
      message: "Network request failed",
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

export function getProfile(userId: string): Promise<ProfileResponse> {
  return requestJson(`${API_BASE_URL}/${encodeURIComponent(userId)}`);
}

export function createProfile(userId: string, profileData: ProfileData): Promise<ProfileResponse> {
  return requestJson(`${API_BASE_URL}/${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });
}

export function updateProfile(userId: string, profileData: Partial<ProfileData>): Promise<ProfileResponse> {
  return requestJson(`${API_BASE_URL}/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });
}

export function getAllProfiles(): Promise<ProfileResponse> {
  return requestJson(API_BASE_URL);
}
