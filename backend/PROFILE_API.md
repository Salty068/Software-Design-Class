# Profile API Documentation

API endpoints for managing user profiles including location, skills, preferences, and availability.

## Base URL
```
/api/profile
```

## Endpoints

### 1. Get All Profiles
**GET** `/api/profile`

Returns all user profiles in the system.

**Response (200 OK)**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "userId": "user123",
      "fullName": "John Doe",
      "location": {
        "address1": "123 Main St",
        "address2": "Apt 4B",
        "city": "Houston",
        "state": "TX",
        "zipCode": "77001"
      },
      "skills": ["JavaScript", "TypeScript", "React"],
      "preferences": "Remote work preferred",
      "availability": ["Monday", "Wednesday", "Friday"]
    }
  ]
}
```

---

### 2. Get Profile by User ID
**GET** `/api/profile/:userId`

Retrieves a specific user's profile.

**URL Parameters**
- `userId` (string) - The unique user identifier

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "fullName": "John Doe",
    "location": {
      "address1": "123 Main St",
      "address2": "Apt 4B",
      "city": "Houston",
      "state": "TX",
      "zipCode": "77001"
    },
    "skills": ["JavaScript", "TypeScript", "React"],
    "preferences": "Remote work preferred",
    "availability": ["Monday", "Wednesday", "Friday"]
  }
}
```

**Response (404 Not Found)**
```json
{
  "success": false,
  "message": "Profile not found for user ID: user123"
}
```

---

### 3. Create Profile
**POST** `/api/profile/:userId`

Creates a new user profile.

**URL Parameters**
- `userId` (string) - The unique user identifier

**Request Body**
```json
{
  "fullName": "John Doe",
  "location": {
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "Houston",
    "state": "TX",
    "zipCode": "77001"
  },
  "skills": ["JavaScript", "TypeScript", "React"],
  "preferences": "Remote work preferred",
  "availability": ["Monday", "Wednesday", "Friday"]
}
```

**Required Fields**
- `fullName` (string) - User's full name
- `location` (object) - User's location
  - `address1` (string) - Primary address
  - `address2` (string, optional) - Secondary address
  - `city` (string) - City
  - `state` (string) - State
  - `zipCode` (string) - ZIP code
- `skills` (array) - Non-empty array of skills
- `availability` (array) - Non-empty array of available days/times

**Optional Fields**
- `preferences` (string) - User preferences

**Response (201 Created)**
```json
{
  "success": true,
  "message": "Profile created successfully",
  "data": {
    "userId": "user123",
    "fullName": "John Doe",
    "location": {
      "address1": "123 Main St",
      "address2": "Apt 4B",
      "city": "Houston",
      "state": "TX",
      "zipCode": "77001"
    },
    "skills": ["JavaScript", "TypeScript", "React"],
    "preferences": "Remote work preferred",
    "availability": ["Monday", "Wednesday", "Friday"]
  }
}
```

**Response (400 Bad Request)**
```json
{
  "success": false,
  "message": "Missing required fields: fullName, location, skills, and availability are required"
}
```

**Response (409 Conflict)**
```json
{
  "success": false,
  "message": "Profile already exists for user ID: user123"
}
```

---

### 4. Update Profile
**PUT** `/api/profile/:userId`

Updates an existing user profile. Only provided fields will be updated.

**URL Parameters**
- `userId` (string) - The unique user identifier

**Request Body** (all fields optional)
```json
{
  "fullName": "John Smith",
  "location": {
    "address1": "456 Oak Ave",
    "city": "Austin",
    "state": "TX",
    "zipCode": "78701"
  },
  "skills": ["JavaScript", "TypeScript", "React", "Node.js"],
  "preferences": "Flexible hours",
  "availability": ["Monday", "Tuesday", "Wednesday"]
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": "user123",
    "fullName": "John Smith",
    "location": {
      "address1": "456 Oak Ave",
      "city": "Austin",
      "state": "TX",
      "zipCode": "78701"
    },
    "skills": ["JavaScript", "TypeScript", "React", "Node.js"],
    "preferences": "Flexible hours",
    "availability": ["Monday", "Tuesday", "Wednesday"]
  }
}
```

**Response (404 Not Found)**
```json
{
  "success": false,
  "message": "Profile not found for user ID: user123"
}
```

**Response (400 Bad Request)**
```json
{
  "success": false,
  "message": "Skills must be a non-empty array"
}
```

---

### 5. Delete Profile
**DELETE** `/api/profile/:userId`

Deletes a user profile.

**URL Parameters**
- `userId` (string) - The unique user identifier

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

**Response (404 Not Found)**
```json
{
  "success": false,
  "message": "Profile not found for user ID: user123"
}
```

---

## Data Models

### UserProfile
```typescript
interface UserProfile {
  userId: string;
  fullName: string;
  location: Location;
  skills: string[];
  preferences?: string;
  availability: string[];
}
```

### Location
```typescript
interface Location {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
}
```

---

## Frontend Integration

### Example: Fetching Profile Data
```javascript
// Get profile by user ID
const fetchProfile = async (userId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/profile/${userId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Profile:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### Example: Creating a Profile
```javascript
// Create new profile
const createProfile = async (userId, profileData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/profile/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Profile created:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### Example: Updating a Profile
```javascript
// Update profile
const updateProfile = async (userId, updates) => {
  try {
    const response = await fetch(`http://localhost:3000/api/profile/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Profile updated:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

---

## Testing

Run the profile API tests:
```bash
npm test profile.test.ts
```

All endpoints are thoroughly tested including:
- Successful operations
- Validation errors
- Missing required fields
- Edge cases (empty arrays, incomplete data)
- Conflict scenarios (duplicate profiles)

---

## Notes

- Currently using in-memory storage (Map). This will be replaced with a database in future versions.
- Authentication/Authorization will be added in a future update.
- All responses follow a consistent format with `success` and either `data` or `message` fields.
