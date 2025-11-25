# Authentication Migration Guide

This document outlines all the changes required across the application when full authentication is implemented by teammates.

## Overview

The current application uses `AuthContext.simple.tsx` for mock authentication. When proper authentication is implemented, changes will be required across multiple files with varying levels of impact.

## Impact Level Summary

| File | Impact Level | Changes Required |
|------|-------------|------------------|
| `src/contexts/AuthContext.simple.tsx` | 🔴 **HIGH** | Complete replacement |
| `server/api/index.js` | 🟡 **MODERATE** | API security updates |
| `src/pages/VolunteerMatching.tsx` | 🟡 **MODERATE** | Admin auth + API headers |
| `src/main.tsx` | 🟢 **LOW** | Single import change |
| `src/App.tsx` | 🟢 **LOW** | Single import change |
| All other components | 🟢 **LOW** | Single import change |

---

## 🔴 HIGH IMPACT CHANGES

### `src/contexts/AuthContext.simple.tsx`
**Status:** Complete replacement required

#### Current Implementation (Mock)
```typescript
const login = async (email: string, _password: string): Promise<boolean> => {
  // Mock login - just checks email pattern
  const userData: UserData = {
    id: '1',
    email: email,
    name: email.split('@')[0],
    role: email.includes('admin') ? 'admin' : 'volunteer',
    profileComplete: true,
    createdAt: new Date().toISOString()
  };
  
  setUser(userData);
  localStorage.setItem('authToken', 'demo-token');
  return true;
};
```

#### Required Changes
```typescript
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    setIsLoading(true);
    setError(null);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const { user, token } = await response.json();
    setUser(user);
    localStorage.setItem('authToken', token);
    return true;
  } catch (err) {
    console.error('Login failed:', err);
    setError(err instanceof Error ? err.message : 'Login failed');
    return false;
  } finally {
    setIsLoading(false);
  }
};
```

#### Additional Changes Needed
- Replace mock `register()` function with real API calls
- Implement proper `refreshUser()` with JWT token validation
- Add token expiration handling
- Add automatic logout on token expiry

---

## 🟡 MODERATE IMPACT CHANGES

### `server/api/index.js`
**Status:** Security and authentication updates required

#### Current State
```javascript
// Line 24 - Currently commented out
//router.use(auth);

// Lines 85-88 - Manual userId extraction
const { userId } = req.query;
if (!userId) {
  return res.status(400).json({ error: "userId is required" });
}
```

#### Required Changes

1. **Enable Authentication Middleware**
```javascript
// Line 24 - Uncomment
router.use(auth);
```

2. **Replace Manual userId with Authenticated User**
```javascript
// Replace lines 85-88
const userId = req.user.id; // From JWT token
// Remove userId from query parameters
```

3. **Update API Endpoints**
```javascript
// Before: GET /api/assignments?userId=123
// After:  GET /api/assignments (userId from token)

// Before: GET /api/volunteer-history?userId=123  
// After:  GET /api/volunteer-history (userId from token)
```

4. **Add Role-Based Authorization**
```javascript
router.post("/events", requireAdmin, async (req, res) => {
  // Only admins can create events
});

router.get("/admin/stats", requireAdmin, async (req, res) => {
  // Admin dashboard stats
});
```

### `src/pages/VolunteerMatching.tsx`
**Status:** Admin authorization and API security required

#### Required Changes

1. **Add Authentication Import**
```typescript
// Add to imports
import { useAuth } from '../contexts/AuthContext.tsx';
```

2. **Add Admin Authorization Check**
```typescript
export default function VolunteerMatchingDemo() {
  const { requireAdmin } = useAuth();
  
  useEffect(() => {
    requireAdmin(); // Redirect if not admin
  }, [requireAdmin]);
```

3. **Add Authorization Headers to All API Calls**

**Lines 23-24 - Initial data loading:**
```typescript
// Before
const [vRes, eRes] = await Promise.all([
  fetch("/api/match/volunteers"),
  fetch("/api/match/events"),
]);

// After
const token = localStorage.getItem('authToken');
const headers = {
  'Authorization': `Bearer ${token}`
};

const [vRes, eRes] = await Promise.all([
  fetch("/api/match/volunteers", { headers }),
  fetch("/api/match/events", { headers }),
]);
```

**Line 38 - Matching scores:**
```typescript
// Before
const res = await fetch(`/api/match/volunteer/${encodeURIComponent(volId)}?topN=9999`);

// After  
const res = await fetch(`/api/match/volunteer/${encodeURIComponent(volId)}?topN=9999`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});
```

**Lines 60-64 - Assignment API:**
```typescript
// Before
const res = await fetch("/api/match/assign", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ volunteerId: volId, eventId }),
});

// After
const token = localStorage.getItem('authToken');
if (!token) {
  notify({ title: "Authentication required", body: "Please log in", type: "error" });
  return;
}

const res = await fetch("/api/match/assign", {
  method: "POST",
  headers: { 
    "content-type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({ volunteerId: volId, eventId }),
});

if (res.status === 401) {
  notify({ title: "Unauthorized", body: "Admin access required", type: "error" });
  return;
}
```

---

## 🟢 LOW IMPACT CHANGES

### `src/main.tsx`
**Changes:** Single import path update

```typescript
// Line 18 - Change import path
// Before
import { AuthProvider } from "./contexts/AuthContext.simple.tsx";

// After  
import { AuthProvider } from "./contexts/AuthContext.tsx";
```

### `src/App.tsx`
**Changes:** Single import path update

```typescript
// Line 7 - Change import path
// Before
import { useAuth } from './contexts/AuthContext.simple.tsx';

// After
import { useAuth } from './contexts/AuthContext.tsx';
```

### All Other Components
**Files requiring single import path change:**
- `src/pages/Login.tsx`
- `src/pages/Register.tsx` 
- `src/pages/AdminDashboard.tsx`
- `src/pages/ManageUsers.tsx`
- `src/pages/FindEvents.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/RoleBasedHeader.tsx`

**Change required in each:**
```typescript
// Before
import { useAuth } from '../contexts/AuthContext.simple.tsx';

// After
import { useAuth } from '../contexts/AuthContext.tsx';
```

---

## Frontend API Call Updates

### Current Pattern (Temporary)
```typescript
// Manual userId in requests
fetch(`/api/assignments?userId=${user.id}`)
fetch(`/api/volunteer-history?userId=${user.id}`)
```

### New Pattern (Secure)
```typescript
// Token-based authentication
fetch(`/api/assignments`, {
  headers: { 'Authorization': `Bearer ${token}` }
})

fetch(`/api/volunteer-history`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

---

## Architecture Benefits

### ✅ What Won't Need to Change
- **Component interfaces** - All `useAuth()` calls remain the same
- **Component logic** - Authentication checks work as-is  
- **Route structure** - Already properly organized
- **Provider hierarchy** - Perfect architecture already in place
- **Error handling patterns** - Well designed for expansion

### ✅ Why Changes Are Minimal
- **Good interface design** - AuthContextType interface is production-ready
- **Separation of concerns** - Auth logic isolated from business logic
- **Standard patterns** - Used industry best practices
- **Future-proof architecture** - Designed with real auth in mind

---

## Implementation Priority

### Phase 1: Core Authentication
1. Replace `AuthContext.simple.tsx` with real authentication
2. Update import paths in all components (18 files)
3. Test basic login/logout functionality

### Phase 2: API Security  
1. Enable authentication middleware in `server/api/index.js`
2. Update API endpoints to use JWT tokens instead of manual userId
3. Add authorization headers to frontend API calls

### Phase 3: Enhanced Security
1. Add admin authorization checks to `VolunteerMatching.tsx`
2. Implement role-based route protection
3. Add token expiration handling
4. Add refresh token functionality

---

## Testing Checklist

### ✅ Authentication Flow
- [ ] Login with valid credentials
- [ ] Login with invalid credentials  
- [ ] Registration process
- [ ] Logout functionality
- [ ] Token persistence across browser refresh

### ✅ Authorization
- [ ] Admin-only pages redirect volunteers
- [ ] Volunteer pages work for volunteers
- [ ] Unauthenticated users redirect to login
- [ ] API calls include proper auth headers

### ✅ Error Handling
- [ ] Network errors display properly
- [ ] Invalid tokens trigger re-authentication
- [ ] Expired tokens handled gracefully
- [ ] Unauthorized access shows appropriate messages

---

## Notes for Implementation Team

### Excellent Existing Architecture
The current codebase demonstrates **professional-level architecture**:
- ✅ **Provider pattern** implemented correctly
- ✅ **Interface segregation** - clean API boundaries
- ✅ **Dependency injection** - components don't know auth implementation details
- ✅ **Error boundaries** - proper error handling patterns
- ✅ **Route organization** - logical structure ready for guards

### Recommended Approach
1. **Keep existing interfaces** - The `AuthContextType` interface is production-ready
2. **Replace implementation, not interface** - All components will continue working
3. **Add security gradually** - Start with basic auth, then add advanced features
4. **Test thoroughly** - Focus on edge cases and security scenarios

### Security Considerations
- **JWT token storage** - Consider using httpOnly cookies vs localStorage
- **Token expiration** - Implement automatic refresh mechanisms
- **Role validation** - Server-side role checks in addition to client-side
- **API rate limiting** - Add protection against brute force attacks
- **Audit logging** - Track authentication events and admin actions

---

*This migration maintains the excellent architecture already in place while adding production-ready security features.*