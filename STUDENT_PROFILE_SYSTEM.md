# CRR Project Hub - Student Profile System

## Overview

The Student Profile System allows each student to have a completely independent profile with isolated statistics and data persistence. Each student's profile is uniquely identified by their Student ID from the college database (CSV), and all their data is stored separately in localStorage.

## Key Features

### 1. **Independent Student Profiles**
- Each student has a unique Student ID (e.g., `24B81A05Q5`)
- Profiles are isolated - one student's data never affects another student
- Student information is pulled from the CSV database when available
- All statistics are student-specific and tracked independently

### 2. **CSV Integration**
- Student data is imported from the 2nd Year CSE Section E student list
- Database includes: Name, Student ID, Department, Year, Email, Mobile, Section
- Student information is read-only from the system (cannot be edited from the profile)
- Email and mobile information are displayed from official records

### 3. **Real-time Statistics Tracking**
Each student profile tracks three key metrics in real-time:
- **Projects Uploaded**: Number of projects uploaded to the platform
- **Connections**: Number of academic connections made
- **Collaborations**: Number of collaborative projects joined

Statistics update instantly when you click "+ Increment" on any metric.

### 4. **Profile Photo Upload**
- Students can upload a custom profile photo
- Photos are stored as base64 data in localStorage
- Each student's photo is completely separate
- Photos persist after page refresh

### 5. **Data Persistence**
All profile data is stored in localStorage using unique keys:
- Storage Key Format: `studentProfile_{STUDENT_ID}`
- Data includes: Name, Email, Department, Year, Statistics, Profile Photo
- Data persists across browser sessions
- Each student's data is 100% isolated

## How It Works

### Authentication Flow

1. **Student Login** (`/auth`)
   - Student enters their Student ID (10 characters, e.g., `24B81A05Q5`)
   - Student enters a password (minimum 4 characters)
   - System validates Student ID against CSV database
   - On successful login:
     - `currentStudentId` is set in localStorage
     - Student information from CSV is cached
     - Student is redirected to profile page

2. **Profile Initialization** (`/profile`)
   - Page reads `currentStudentId` from localStorage
   - Checks if student profile already exists in localStorage
   - If new student: Fetches data from CSV database and creates new profile
   - If returning student: Loads their existing profile with all statistics and photos
   - Profile photo (if uploaded) is displayed
   - All statistics are shown in real-time

### Student Selector Page (`/select-student`)

For testing and demonstration purposes, a dedicated student selector page is available:
- View all 50+ students from the CSV database
- Search by name, Student ID, or email
- Click any student to load their independent profile
- Each student automatically gets their own isolated profile with zero statistics initially
- Perfect for testing the independence of profiles

**Access**: Navbar → "Switch Student" button (visible when logged in)

## Technical Implementation

### File Structure

```
lib/
├── students.ts              # Student database and utilities
  ├── STUDENT_DATABASE       # Pre-parsed CSV data (key: Student ID)
  ├── findStudentById()      # Lookup student by ID
  ├── getAllStudents()       # Get all students
  └── formatYear()           # Format year number

app/
├── auth/
│   └── page.tsx            # Authentication with CSV validation
├── profile/
│   └── page.tsx            # Student profile page
└── select-student/
    └── page.tsx            # Student selector for testing
```

### Data Structure

**StudentRecord** (from CSV):
```typescript
{
  userId: string;           // Student ID (Primary Key)
  name: string;             // Full name
  registrationNo: string;   // Registration number
  uniqueId: string;         // Unique identifier
  year: number;             // Academic year (2 for 2nd year)
  course: string;           // Course (B.Tech- CSE)
  email: string;            // Student email
  mobileNo: string;         // Mobile number
  department: string;       // Department (CSE)
  section: string;          // Section (E)
}
```

**StudentData** (Profile Storage):
```typescript
{
  name: string;
  studentId: string;
  department: string;
  year: string;
  email: string;
  profilePhoto?: string;    // Base64 encoded image
  stats: {
    projectsUploaded: number;
    connections: number;
    collaborations: number;
  }
}
```

### localStorage Keys

```
currentStudentId           # Currently logged-in student's ID
studentProfile_{ID}        # Student's profile data (JSON)
userType                   # "student", "staff", or "admin"
year                       # Academic year
studentName                # Cached from CSV
studentDepartment          # Cached from CSV
studentEmail               # Cached from CSV
```

## Testing Guide

### Test Case 1: Create Multiple Student Profiles
1. Go to `/select-student`
2. Click on Student 1 (e.g., NALLA NEELIMA - 24B81A05Q5)
3. Upload a profile photo
4. Increment "Projects Uploaded" to 5
5. Go back to `/select-student`
6. Click on Student 2 (e.g., NALLAMELLI SANTHOSH - 24B81A05Q6)
7. **Verify**: Student 2 has no photo uploaded and 0 projects
8. Upload a different photo for Student 2
9. Increment "Connections" to 3
10. Go back to Student 1
11. **Verify**: Student 1's data is exactly as you left it (5 projects, 0 connections, original photo)

### Test Case 2: Data Persistence
1. Select a student and increment all statistics
2. Upload a profile photo
3. Refresh the page (F5 or Cmd+R)
4. **Verify**: All statistics and photo remain unchanged
5. Close the browser completely
6. Reopen browser, navigate back to `/select-student`
7. Click the same student
8. **Verify**: All data persists (statistics, photo)

### Test Case 3: Independent Statistics
1. Select Student A and set:
   - Projects: 5
   - Connections: 3
   - Collaborations: 2
2. Switch to Student B
3. Increment Projects to 1, Connections to 1
4. Switch back to Student A
5. **Verify**: Student A still shows Projects: 5, Connections: 3, Collaborations: 2
6. Switch to Student C (new student)
7. **Verify**: Student C shows all statistics at 0

### Test Case 4: CSV Data Integration
1. Log in with Student ID `24B81A05Q5`
2. Go to profile
3. **Verify**: Name shows "NALLA NEELIMA"
4. **Verify**: Department shows "CSE"
5. **Verify**: Year shows "2nd"
6. **Verify**: Email shows "NEELIMAHARI.396@GMAIL.COM"
7. **Verify**: Student ID field shows "24B81A05Q5"

### Test Case 5: Profile Photo Independence
1. Student A uploads Photo A
2. Student B uploads Photo B
3. Switch to Student A
4. **Verify**: Photo A is displayed
5. Switch to Student B
6. **Verify**: Photo B is displayed
7. Switch to Student C (new student, no photo)
8. **Verify**: Avatar shows initials (no photo uploaded)

## Features in Detail

### 1. Profile Photo Upload
- Click the profile avatar while in Edit mode
- Select an image file from your computer
- Photo is converted to base64 and stored in localStorage
- Photo persists across sessions
- Supports JPG, PNG, GIF, and other common image formats

### 2. Statistics Management
Each statistic has an independent counter:
- **"+ Increment" button**: Increases the count by 1
- Real-time UI update
- Persists to localStorage immediately
- No API calls required

### 3. CSV Data Integration
- Department and Year fields are read-only
- Cannot be changed from the profile (integrity protection)
- Source: Official CSV records
- Used only for display purposes

### 4. Student Lookup
- Search by full name (case-insensitive)
- Search by Student ID (case-insensitive)
- Search by email address
- Live filtering as you type
- Shows total student count and matching results

## API Reference

### findStudentById(studentId: string)
```typescript
import { findStudentById } from '@/lib/students';

const student = findStudentById('24B81A05Q5');
// Returns StudentRecord or null if not found
```

### getAllStudents()
```typescript
import { getAllStudents } from '@/lib/students';

const allStudents = getAllStudents();
// Returns StudentRecord[] with all students from CSV
```

### formatYear(year: number)
```typescript
import { formatYear } from '@/lib/students';

formatYear(2);  // Returns "2nd"
formatYear(1);  // Returns "1st"
```

## Troubleshooting

### Issue: Profile data not persisting
- **Solution**: Check browser's localStorage is enabled
- **Solution**: Clear browser cookies and cache if corrupted
- **Solution**: Open DevTools → Application → localStorage to verify data

### Issue: CSV data not loading
- **Solution**: Verify student ID format (10 characters, e.g., 24B81A05Q5)
- **Solution**: Check that student exists in the CSV database
- **Solution**: Try navigating to `/select-student` and selecting a student directly

### Issue: Photos not displaying
- **Solution**: Ensure browser allows file uploads
- **Solution**: Try a different image format or smaller file size
- **Solution**: Clear localStorage and re-upload (`localStorage.clear()`)

### Issue: Statistics not updating
- **Solution**: Ensure you're clicking the "+ Increment" button (not just viewing)
- **Solution**: Refresh page to see if it persisted
- **Solution**: Check DevTools console for any error messages

## Future Enhancements

1. **Backend Integration**: Replace localStorage with backend database
2. **File Upload Service**: Use cloud storage (AWS S3, Vercel Blob) for photos
3. **Social Features**: Add ability to view other students' profiles
4. **Statistics Export**: Download statistics as CSV/PDF
5. **Profile Visibility**: Control who can see your profile (public/private)
6. **Achievements**: Badge system for milestones
7. **Activity Feed**: Show recent updates across all students
8. **Department Filtering**: View statistics by department or section

## Conclusion

The Student Profile System provides a robust foundation for managing individual student profiles with complete data isolation. Each student gets their own independent workspace where they can track projects, connections, and collaborations while maintaining complete data separation from other students. The system uses localStorage for persistence and CSV integration for authentic student information.
