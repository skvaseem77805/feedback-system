# Student Profile System - User Flows & Interactions

## User Flow Diagrams

### Flow 1: First-Time Student Login & Profile Creation

```
START
  ↓
[Home Page] → Click "Login"
  ↓
[Auth Page] → Select "Student Login"
  ↓
[Student Form]
  • Choose Year (1st/2nd/3rd/Final)
  • Enter Student ID (10 chars: 24B81A05Q5)
  • Enter Password (4+ chars, any password works)
  ↓
[Validation]
  • Check if Student ID exists in CSV
  • If NOT found → Show error, ask to retry
  • If found → Continue
  ↓
[Profile Creation]
  • Load student data from CSV:
    - Name: NALLA NEELIMA
    - Department: CSE
    - Year: 2nd
    - Email: NEELIMAHARI.396@GMAIL.COM
  • Create new profile in localStorage
  • Initialize stats: (0, 0, 0)
  ↓
[Redirect to /profile]
  ↓
[Profile Page]
  • Display student info from CSV
  • Show empty stats cards
  • Show no profile photo (avatar)
  ↓
END (Profile Ready)
```

### Flow 2: Profile Photo Upload

```
[Profile Page]
  ↓
Click "Edit Profile" button
  ↓
[Edit Mode Activated]
  • Fields become editable
  • Edit button → Save & Cancel buttons
  ↓
Click on profile avatar/initials
  ↓
[File Upload Dialog]
  • Select image from computer
  • Supported: JPG, PNG, GIF, etc.
  ↓
[Image Processing]
  • Convert to base64 format
  • Store in editData state
  • Show preview immediately
  ↓
Click "Save" button
  ↓
[Data Persistence]
  • Save to localStorage:
    studentProfile_{ID}.profilePhoto = base64data
  ↓
[Profile Page]
  • Show uploaded photo in avatar
  • Photo persists on page reload
  ↓
END
```

### Flow 3: Increment Statistics

```
[Profile Page - View Mode]
  ↓
See statistics card:
  Project Card (5 projects shown)
    ├── Icon: BookOpen
    ├── Label: "Projects Uploaded"
    ├── Value: 5
    └── Button: "+ Increment"
  ↓
Click "+ Increment" button
  ↓
[Statistics Update]
  • Increment stat value by 1 (5 → 6)
  • Update React state immediately
  • Display new value in UI (smooth)
  ↓
[localStorage Update]
  • Get studentProfile_{ID}
  • Increment stats.projectsUploaded
  • Save back to localStorage
  ↓
[UI Reflects Change]
  • Value shows 6 instantly
  • No page refresh needed
  ↓
END (Ready for next action)
```

### Flow 4: Switch Between Students

```
[Current Student Profile]
  (Student A loaded, stats = 5, 3, 2)
  ↓
Click "Switch Student" in navbar
  ↓
[Navigate to /select-student]
  ↓
[Student Selection Page]
  • See grid of 50+ students
  • Can search by name/ID/email
  ↓
Search for "NANDA GOPAL" (Student B)
  ↓
[Search Results Filtered]
  • Show Student B card
  ↓
Click Student B card
  ↓
[Switch Handler]
  • Update localStorage.currentStudentId = "24B81A05Q9"
  • Update other localStorage fields
  • Navigate to /profile
  ↓
[Profile Page Loads]
  • Read currentStudentId → "24B81A05Q9"
  • Look for localStorage['studentProfile_24B81A05Q9']
  • If exists → Load saved data
  • If new → Create from CSV
  ↓
[Display Student B Profile]
  • Name: NANDA GOPAL KADALI
  • Stats: (0, 0, 0) [if new]
  • Photo: None [if never uploaded]
  ↓
END (Ready to edit Student B)

[If you switch BACK to Student A]
  ↓
[Profile Page Loads]
  • Read studentProfile_24B81A05Q5
  • Stats still show 5, 3, 2
  • Photo still present
  ↓
VERIFIED: Data completely isolated
```

### Flow 5: Data Persistence Across Sessions

```
[Session 1: Student A]
  ↓
Load /select-student
Click Student A
  ↓
Set statistics (5, 3, 2)
Upload profile photo
  ↓
localStorage contains:
  {
    currentStudentId: "24B81A05Q5",
    studentProfile_24B81A05Q5: {
      stats: {5, 3, 2},
      profilePhoto: "data:image/..."
    }
  }
  ↓
Close browser completely
  ↓
─────────────────────────────────
[Session 2: Later (new browser session)]
  ↓
Open website → /select-student
Click Student A again
  ↓
[Profile Page Loads]
  • Read localStorage.currentStudentId
  • Query localStorage['studentProfile_24B81A05Q5']
  • Data exists! Load it
  ↓
[Display Profile]
  ✓ Statistics show 5, 3, 2 (SAME)
  ✓ Profile photo displays (SAME)
  ✓ All data PERSISTED
  ↓
END (Complete persistence verified)
```

### Flow 6: Independent Statistics Test

```
[Create Test Scenario]
  Student A: Set (10, 5, 3)
  Student B: Set (2, 1, 0)
  Student C: Set (7, 7, 7)

[Switch to Student A]
  ↓
Display stats: 10, 5, 3 ✓
  ↓
Increment Projects 3 times
  → Now shows: 13, 5, 3
  ↓
localStorage saved:
  studentProfile_A: (13, 5, 3)
  ↓
Switch to Student B
  ↓
Display stats: 2, 1, 0 ✓ (NOT affected by A's increment)
  ↓
Increment Connections 2 times
  → Now shows: 2, 3, 0
  ↓
localStorage saved:
  studentProfile_B: (2, 3, 0)
  ↓
Switch back to Student A
  ↓
Display stats: 13, 5, 3 ✓ (Exactly as left, unchanged)
  ↓
VERIFIED: Complete statistical isolation
```

## Interaction Patterns

### Search Interaction
```
User arrives at /select-student
         ↓
Search box shows "Search by name, student ID, or email..."
         ↓
User types: "nand"
         ↓
Real-time filtering:
  - Show only students matching "nand"
  - Display: "Found 1 of 50 students"
  - Show card: "NANDA GOPAL KADALI"
         ↓
User clicks card
         ↓
Load that student's profile
```

### Edit Profile Interaction
```
Profile page in VIEW mode
  • Name: Read-only display
  • Department: Read-only (CSV)
  • Year: Read-only (CSV)
  • Button: "Edit Profile"
         ↓
Click "Edit Profile"
         ↓
Profile page in EDIT mode
  • Name: Editable Input field
  • Department: Disabled (shows "CSE")
  • Year: Disabled (shows "2nd")
  • Buttons: "Save", "Cancel"
         ↓
Edit Name → Click Save
         ↓
Back to VIEW mode
  • Shows new name
  • Data in localStorage updated
```

### Statistics Increment Interaction
```
Statistics Card:
  ┌─────────────────────────────┐
  │ BookOpen Icon               │
  │ "Projects Uploaded"         │
  │ Value: 5                    │
  │ ┌───────────────────────┐   │
  │ │  + Increment Button   │   │
  │ └───────────────────────┘   │
  └─────────────────────────────┘
         ↓
User clicks "+ Increment"
         ↓
[Animation]
  Value: 5 → 6 (smooth transition)
         ↓
[Sound/Feedback] (optional)
         ↓
[localStorage Update]
  stats.projectsUploaded: 5 → 6
         ↓
Ready for next action
```

## Page Layout Maps

### Profile Page Layout
```
┌─────────────────────────────────────────────┐
│              NAVBAR                         │
│   Logo | Profile | Switch Student | Logout │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          PROFILE HEADER CARD                │
│  ┌─────┐                                    │
│  │Photo│  Name (NALLA NEELIMA)              │
│  ├─────┤  Year (2nd Year)                   │
│  │  A  │  Email | Department Badge          │
│  │  N  │  ID: 24B81A05Q5                    │
│  └─────┘                                    │
│  [Edit Profile] button                      │
└─────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┐
│  Projects Uploaded   │    Connections       │
│  [Icon] "Projects"   │  [Icon] "Connections"│
│  5 projects          │  3 connections      │
│  [+ Increment]       │  [+ Increment]       │
└──────────────────────┼──────────────────────┤
│   Collaborations                            │
│  [Icon] "Collaborations"                    │
│  2 collaborations                           │
│  [+ Increment]                              │
└──────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            TABS: Overview | Guide            │
├─────────────────────────────────────────────┤
│  [Overview Tab Content]                     │
│  ┌────────────────────┐ ┌────────────────┐ │
│  │Profile Complete    │ │Student Info    │ │
│  │Basic Info: ✓       │ │ID: 24B...      │ │
│  │Photo: ○ Not Added  │ │Email: Email... │ │
│  │Stats: ✓ Tracking   │ │Dept & Year     │ │
│  └────────────────────┘ └────────────────┘ │
└─────────────────────────────────────────────┘
```

### Student Selection Page Layout
```
┌─────────────────────────────────────────────┐
│              NAVBAR                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  "Test Student Profiles"                    │
│  "Select a Student Profile"                 │
│  "Choose any student to view their..."      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Search Box:                                │
│  [Search by name, ID, or email...]          │
│  "Found 15 of 50 students"                  │
└─────────────────────────────────────────────┘

┌──────────────────┬──────────────────┬──────┐
│  Student Card    │  Student Card    │ Card │
│  ┌────────────┐  │  ┌────────────┐  │      │
│  │ NN         │  │  │ SK         │  │      │
│  │ NEELIMA    │  │  │ SANTHOSH   │  │      │
│  │ 24B81...   │  │  │ 24B81...   │  │      │
│  │ CSE  │ E   │  │  │ CSE  │ E   │  │      │
│  │ 2nd Year   │  │  │ 2nd Year   │  │      │
│  │ Email...   │  │  │ Email...   │  │      │
│  │[View Prof] │  │  │[View Prof] │  │      │
│  └────────────┘  │  └────────────┘  │      │
└──────────────────┴──────────────────┴──────┘

(Grid repeats for all 50 students)

┌─────────────────────────────────────────────┐
│  "How Independent Profiles Work"            │
│  • Each profile completely independent      │
│  • Data stored separately                   │
│  • Stats don't affect other students        │
│  • All data persists                        │
│  • Switch to test isolation                 │
└─────────────────────────────────────────────┘
```

## Common Use Cases

### Use Case 1: Daily Profile Check
```
1. User logs in with Student ID
2. Sees profile with statistics
3. Increments projects (uploaded new one)
4. Closes browser
→ Data persists for next day
```

### Use Case 2: Compare Students
```
1. Load Student A (stats: 5, 3, 2)
2. Check Student B (stats: 2, 1, 1)
3. Check Student C (stats: 0, 0, 0)
4. Can compare without affecting data
→ Each profile independent
```

### Use Case 3: Photo Update
```
1. User uploads first photo
2. Later, re-enters profile
3. Clicks Edit to change photo
4. Uploads new photo
5. Data updated, old photo replaced
→ Photo persists with profile
```

### Use Case 4: Collaboration Tracking
```
1. Students form a group
2. One student updates stats:
   - Increment Connections
   - Increment Collaborations
3. Others update their own profiles
→ Each tracks independently
```

## State Management Flow

```
Component State:
  ├── studentData: StudentData | null
  ├── isEditing: boolean
  ├── editData: Partial<StudentData>
  └── photoPreview: string | null

User Actions:
  ├── Click Edit → isEditing = true
  ├── Upload Photo → photoPreview = base64
  ├── Modify Field → editData.field = value
  ├── Click Save → Save to localStorage, isEditing = false
  ├── Click Increment → stats.field++, Save to localStorage
  └── Switch Student → Load different profileData

localStorage Keys:
  ├── currentStudentId
  └── studentProfile_{ID}
```

## Error Handling Flows

### Student Not Found
```
User enters ID: "INVALID999"
         ↓
Validation checks CSV
         ↓
Not found in STUDENT_DATABASE
         ↓
Show error: "Student ID not found in database"
         ↓
User can retry with correct ID
```

### Photo Upload Fails
```
File too large (>10MB)
         ↓
FileReader API fails or times out
         ↓
Error caught in handlePhotoUpload()
         ↓
photoPreview remains unchanged
         ↓
User can try again with smaller image
```

---

These flows represent typical user interactions with the student profile system. Each flow maintains data isolation and ensures smooth user experience.
