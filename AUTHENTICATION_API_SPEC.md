# 🔐 Authentication API Endpoints Specification

## Required Backend Endpoints

### 1. **GET /api/auth/me**
**Purpose**: Verify current user authentication and return user data
**Headers Required**: `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "id": "user123",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "role": "volunteer", // or "admin"
  "profileComplete": true,
  "createdAt": "2023-01-15T10:30:00Z",
  "lastLogin": "2023-11-25T09:15:00Z"
}
```

**Error Response (401):**
```json
{
  "message": "Invalid or expired token"
}
```

### 2. **POST /api/auth/login**
**Purpose**: Authenticate user and return JWT token
**Body Required**:
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "volunteer",
    "profileComplete": false,
    "createdAt": "2023-01-15T10:30:00Z",
    "lastLogin": "2023-11-25T09:15:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "message": "Invalid email or password"
}
```

### 3. **POST /api/auth/register**
**Purpose**: Register new user
**Body Required**:
```json
{
  "email": "newuser@example.com",
  "password": "newpassword",
  "name": "New User",
  "role": "volunteer" // optional, defaults to "volunteer"
}
```

**Success Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "newuser456",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "volunteer",
    "profileComplete": false,
    "createdAt": "2023-11-25T10:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "message": "Email already exists"
}
```

### 4. **GET /api/admin/stats** (Admin Only)
**Purpose**: Get system statistics for admin dashboard
**Headers Required**: `Authorization: Bearer <admin-token>`

**Success Response (200):**
```json
{
  "totalUsers": 1250,
  "totalVolunteers": 1180,
  "totalAdmins": 70,
  "totalEvents": 450,
  "activeEvents": 85,
  "totalHoursLogged": 12500
}
```

**Error Response (403):**
```json
{
  "message": "Access denied. Admin privileges required."
}
```

---

## 🔧 Implementation Notes

### JWT Token Requirements
- **Algorithm**: HS256 (or RS256 for production)
- **Payload should include**:
  ```json
  {
    "userId": "user123",
    "email": "user@example.com",
    "role": "volunteer",
    "iat": 1700900000,
    "exp": 1700986400
  }
  ```
- **Expiration**: 24 hours (adjustable)

### Database Schema Updates Needed
You'll need to add these fields to your user table:

```sql
-- Add to existing users table
ALTER TABLE users ADD COLUMN role ENUM('volunteer', 'admin') DEFAULT 'volunteer';
ALTER TABLE users ADD COLUMN profile_complete BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL;
```

### Security Considerations
1. **Password Hashing**: Use bcrypt with salt rounds >= 12
2. **Token Storage**: Store securely, consider httpOnly cookies for production
3. **Rate Limiting**: Implement on login/register endpoints
4. **Input Validation**: Validate all inputs server-side
5. **CORS**: Configure properly for your domain

---

## 🚀 Frontend Integration

### How the AuthProvider Works

1. **On App Start**: Checks localStorage for token → calls `/api/auth/me`
2. **On Login**: Calls `/api/auth/login` → stores token → redirects based on role
3. **On Register**: Calls `/api/auth/register` → stores token → redirects to profile
4. **Route Protection**: Automatically redirects unauthenticated users
5. **Role-based UI**: Header changes based on user role

### Automatic Redirects

**After Login:**
- **Admin users** → `/admin/dashboard`
- **Volunteers with incomplete profile** → `/profile-page`
- **Volunteers with complete profile** → `/`

**After Registration:**
- **All new users** → `/profile-page`

**Route Protection:**
- **Unauthenticated users** → `/login`
- **Non-admin accessing admin routes** → `/` (with error message)

### Usage in Components

```tsx
// Basic usage
const { user, isAuthenticated, isAdmin, logout } = useAuth();

// Route protection
const MyComponent = () => {
  const { requireAuth } = useAuth();
  
  useEffect(() => {
    requireAuth(); // Redirects if not authenticated
  }, []);
  
  return <div>Protected content</div>;
};

// Admin-only component
const AdminComponent = withAuth(MyAdminComponent, true);
```

---

## 📋 Testing Checklist

### Backend Testing
- [ ] `/api/auth/me` returns correct user data
- [ ] `/api/auth/me` handles invalid tokens properly
- [ ] `/api/auth/login` authenticates correctly
- [ ] `/api/auth/login` rejects invalid credentials
- [ ] `/api/auth/register` creates new users
- [ ] `/api/auth/register` prevents duplicate emails
- [ ] `/api/admin/stats` requires admin privileges
- [ ] JWT tokens are properly signed and verified

### Frontend Testing
- [ ] AuthProvider initializes correctly
- [ ] Login redirects based on user role
- [ ] Registration redirects to profile page
- [ ] Route protection works for protected pages
- [ ] Admin routes block non-admin users
- [ ] Logout clears user state and redirects
- [ ] Header shows different navigation based on role
- [ ] Loading states show during authentication

This specification provides everything you need to implement the backend authentication endpoints that work with the AuthProvider! 🎯