# Activity Tracking System - Visual Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRR PROJECT HUB                              │
│              Activity Tracking System                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────┐  ┌────────────────────┐  ┌──────────────┐  │
│  │   /upload page      │  │ /select-student    │  │  /profile    │  │
│  │                     │  │                    │  │   page       │  │
│  │  Upload Project     │  │  Browse Students   │  │              │  │
│  │  (Auto-tracking)    │  │  • Connect btn     │  │  Auto-update │  │
│  │                     │  │  • Collaborate btn │  │  stats:      │  │
│  │  On Submit:         │  │                    │  │  • Projects  │  │
│  │  📊 Stats +1        │  │  Click Connect:    │  │  • Connect   │  │
│  │                     │  │  📊 Stats +1       │  │  • Collabs   │  │
│  │                     │  │                    │  │              │  │
│  │                     │  │  Click Collab:     │  │  Every 1sec: │  │
│  │                     │  │  📊 Stats +1       │  │  Refresh ↻   │  │
│  └─────────────────────┘  └────────────────────┘  └──────────────┘  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      STATS TRACKER LAYER                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   incrementProjectsUploaded(studentId)                              │
│   incrementConnections(studentId)                                   │
│   incrementCollaborations(studentId)                                │
│   getStudentStats(studentId)                                        │
│   getCurrentStudentId()                                             │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      DATA STORAGE LAYER                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Browser localStorage                                               │
│  ├─ studentStats_24B81A05Q5: {projects: 3, connections: 5, ...}   │
│  ├─ studentStats_24B81A05Q6: {projects: 0, connections: 0, ...}   │
│  └─ studentStats_24B81A05Q7: {projects: 1, connections: 1, ...}   │
│                                                                       │
│  ✓ Persistent across sessions                                       │
│  ✓ Student-specific isolation                                       │
│  ✓ Independent data per student                                     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
USER ACTION (Upload / Connect / Collaborate)
        │
        ├─── Upload Project ──→ validateForm() ──→ ✓
        │                              │
        │                              ↓
        │                    incrementProjectsUploaded()
        │
        ├─── Click Connect ────→ handleConnect() ──→ Open LinkedIn
        │                              │
        │                              ↓
        │                    incrementConnections()
        │
        └─── Click Collaborate ─→ handleCollaborate() 
                                       │
                        ┌──────────────┼──────────────┐
                        ↓                             ↓
                 Via LinkedIn            Via Email
                        │                             │
                        ↓                             ↓
             Open LinkedIn                 Open Email Client
                        │                             │
                        ↓                             ↓
             incrementCollaborations()    incrementCollaborations()
                        │                             │
                        └──────────────┬──────────────┘
                                       ↓
                          getCurrentStudentId()
                                       ↓
                          getStudentStats(studentId)
                                       ↓
                          Increment counter by 1
                                       ↓
                          saveStudentStats(studentId, updated)
                                       ↓
                          localStorage updated
                                       ↓
                          Profile auto-refreshes (1 sec)
                                       ↓
                          Stats cards display new count
                                       ↓
                          USER SEES UPDATE ✓
```

## Student Profile Card Layout

```
┌─────────────────────────────────────────┐
│                                         │
│   ┌────────────┐    ┌────────────────┐  │
│   │ 🔤 Avatar  │    │  Department    │  │
│   │  (Initials)│    │    Badge       │  │
│   └────────────┘    └────────────────┘  │
│                                         │
│   Student Name (Bold)                   │
│   B.Tech- CSE 2024                     │
│                                         │
│   ✉️ email@example.com                 │
│   📞 9876543210                        │
│                                         │
│   ─────────────────────────────────────│
│                                         │
│   ┌─────────────────────────────────────┐
│   │  LinkedIn  Connect Button           │
│   └─────────────────────────────────────┘
│                                         │
│   ┌─────────────────────────────────────┐
│   │  Collaborate Button                 │
│   │  ┌─ via LinkedIn                   │
│   │  └─ via Email                      │
│   └─────────────────────────────────────┘
│                                         │
│   ┌─────────────────────────────────────┐
│   │  View Profile                       │
│   └─────────────────────────────────────┘
│                                         │
└─────────────────────────────────────────┘
```

## Profile Stats Display

```
┌──────────────────────────────────────────────────────────────┐
│  Your Profile - Statistics                                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  📚 Projects │  │  🤝 Connect │  │  ⚡ Collabs │         │
│  │   Uploaded   │  │   ions      │  │   orations  │         │
│  │              │  │             │  │             │         │
│  │      3       │  │      5      │  │      2      │         │
│  │   (Blue)     │  │  (Green)    │  │ (Purple)    │         │
│  │              │  │             │  │             │         │
│  │ Auto-updated │  │ Auto-updated│  │ Auto-updated│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
│  ↻ Refreshes every 1 second                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Connect Flow

```
START
  │
  ├─→ Navigate to /select-student
  │
  ├─→ Search or browse students
  │
  ├─→ Find desired student
  │   │
  │   └─→ Click Blue "Connect" Button
  │       │
  │       ├─→ Function Call: incrementConnections(studentId)
  │       │   │
  │       │   └─→ getStudentStats() → Increment → saveStudentStats()
  │       │       │
  │       │       └─→ localStorage['studentStats_XXX'].connections += 1
  │       │
  │       ├─→ Open LinkedIn Profile in New Tab
  │       │   │
  │       │   └─→ User can send connection request
  │       │
  │       └─→ Return to Browser
  │
  └─→ View Your Profile
      │
      └─→ See Connections: 0 → 1 ✓ Updated!
```

## Collaborate Flow (LinkedIn)

```
START
  │
  ├─→ Navigate to /select-student
  │
  ├─→ Find student to collaborate with
  │   │
  │   └─→ Click "Collaborate" Button
  │       │
  │       └─→ Dropdown Appears
  │           │
  │           ├─→ [Option 1] via LinkedIn
  │           │
  │           └─→ [Option 2] via Email
  │
  ├─→ Select "via LinkedIn"
  │   │
  │   ├─→ Function Call: incrementCollaborations(studentId)
  │   │   │
  │   │   └─→ getStudentStats() → Increment → saveStudentStats()
  │   │       │
  │   │       └─→ localStorage['studentStats_XXX'].collaborations += 1
  │   │
  │   ├─→ Open LinkedIn Profile in New Tab
  │   │   │
  │   │   └─→ User sends direct message
  │   │
  │   └─→ Return to Browser
  │
  └─→ Collaborations: 0 → 1 ✓ Updated!
```

## Collaborate Flow (Email)

```
START
  │
  ├─→ Navigate to /select-student
  │
  ├─→ Find student to collaborate with
  │   │
  │   └─→ Click "Collaborate" Button
  │       │
  │       └─→ Dropdown Appears
  │
  ├─→ Select "via Email"
  │   │
  │   ├─→ Function Call: incrementCollaborations(studentId)
  │   │   │
  │   │   └─→ getStudentStats() → Increment → saveStudentStats()
  │   │       │
  │   │       └─→ localStorage['studentStats_XXX'].collaborations += 1
  │   │
  │   ├─→ Open Default Email Client
  │   │   │
  │   │   ├─ To: student@email.com
  │   │   ├─ Subject: "Project Collaboration Request"
  │   │   └─ Body: "Hi [Name], I would like to collaborate..."
  │   │
  │   ├─→ User edits and sends email
  │   │
  │   └─→ Return to Browser
  │
  └─→ Collaborations: 0 → 1 ✓ Updated!
```

## Project Upload Flow

```
START
  │
  ├─→ Navigate to /upload
  │
  ├─→ Fill Form
  │   ├─ Project Title
  │   ├─ Description
  │   ├─ Category
  │   ├─ Department
  │   ├─ Project URL
  │   └─ Demo Video (Optional)
  │
  ├─→ Click "Upload Project"
  │   │
  │   ├─→ Validate Form
  │   │   └─ Check required fields
  │   │
  │   └─→ Show Loading State
  │
  ├─→ On Success
  │   │
  │   ├─→ Function Call: incrementProjectsUploaded(studentId)
  │   │   │
  │   │   └─→ getStudentStats() → Increment → saveStudentStats()
  │   │       │
  │   │       └─→ localStorage['studentStats_XXX'].projectsUploaded += 1
  │   │
  │   ├─→ Show Success Message
  │   │   │
  │   │   └─→ "Project Uploaded Successfully!"
  │   │
  │   ├─→ Auto-redirect to /projects (2 sec)
  │
  └─→ Your Profile Now Shows: Projects: 0 → 1 ✓
```

## Multi-Student Scenario

```
Timeline of Events:

Time: 10:00 AM
┌──────────────────────────────────┐
│ Student A Logged In              │
│ Stats: { projects: 0, conn: 0 }  │
└──────────────────────────────────┘

Time: 10:05 AM - Student A Uploads Project
┌──────────────────────────────────┐
│ Student A                        │
│ Stats: { projects: 1, conn: 0 }  │  ✓ Incremented
└──────────────────────────────────┘

Time: 10:10 AM - Student A Connects with B
┌──────────────────────────────────┐
│ Student A                        │
│ Stats: { projects: 1, conn: 1 }  │  ✓ Incremented
└──────────────────────────────────┘

Time: 10:15 AM - Switch to Student B
┌──────────────────────────────────┐
│ Student B Logged In              │
│ Stats: { projects: 0, conn: 0 }  │  ✓ Completely separate!
└──────────────────────────────────┘

Time: 10:20 AM - Student B Uploads Project
┌──────────────────────────────────┐
│ Student B                        │
│ Stats: { projects: 1, conn: 0 }  │  ✓ B's own increment
└──────────────────────────────────┘

Time: 10:25 AM - Switch Back to Student A
┌──────────────────────────────────┐
│ Student A                        │
│ Stats: { projects: 1, conn: 1 }  │  ✓ EXACT same as before!
└──────────────────────────────────┘
   ↑
   Perfect data isolation!
```

## localStorage State Diagram

```
Key: studentStats_24B81A05Q5
Value: {"projectsUploaded":0,"connections":0,"collaborations":0}
              │
              ├─ User uploads project
              ↓
Key: studentStats_24B81A05Q5
Value: {"projectsUploaded":1,"connections":0,"collaborations":0}
              │
              ├─ User clicks Connect
              ↓
Key: studentStats_24B81A05Q5
Value: {"projectsUploaded":1,"connections":1,"collaborations":0}
              │
              ├─ User Collaborates (Email)
              ↓
Key: studentStats_24B81A05Q5
Value: {"projectsUploaded":1,"connections":1,"collaborations":1}
              │
              ├─ Page Refresh / Browser Restart
              ↓
Key: studentStats_24B81A05Q5
Value: {"projectsUploaded":1,"connections":1,"collaborations":1}
              │
              └─ ✓ Data persists!
```

## Component Hierarchy

```
App Root
  │
  ├── Layout
  │   ├── Navbar
  │   └── Main Content
  │
  ├── /profile
  │   ├── Profile Header
  │   ├── Stats Cards (Auto-refresh every 1s)
  │   │   ├── Projects Card
  │   │   ├── Connections Card
  │   │   └── Collaborations Card
  │   └── Tabs
  │       ├── Overview
  │       └── How It Works
  │
  ├── /select-student
  │   ├── Header
  │   ├── Search Bar
  │   └── Student Grid
  │       └── StudentProfileCard (Reusable) ✓
  │           ├── Avatar
  │           ├── Name & Info
  │           ├── Connect Button
  │           ├── Collaborate Button
  │           │   ├── LinkedIn Option
  │           │   └── Email Option
  │           └── View Profile Button
  │
  └── /upload
      └── Upload Form
          └── On Submit → Increment Stats
```

## Color Scheme & Icons

```
Projects Uploaded
  Icon: 📚 BookOpen
  Color: Blue (#2563EB)
  Usage: Shows academic/project count

Connections
  Icon: 🤝 Network
  Color: Green (#16A34A)
  Usage: Shows professional network size

Collaborations
  Icon: ⚡ Zap
  Color: Purple (#9333EA)
  Usage: Shows collaboration engagement

Connect Button
  Icon: 🔗 LinkedIn
  Color: Blue (#1D4ED8)
  Usage: LinkedIn professional network

Collaborate Button
  Icon: 💬 MessageSquare
  Color: Gray/Default
  Usage: Multiple options for collaboration
```

## Response Time Guarantee

```
User Action (ms)         │ Result
─────────────────────────┼────────────────────────────
Click Button             │ 0-50ms (instant feedback)
Stats Update             │ 0-100ms (localStorage write)
Profile Refresh          │ 1000ms (every 1 second)
Visible on Screen        │ 1000-1100ms (worst case)

Average User Experience: < 1 second
```

## Performance Metrics

```
Memory Usage per Student: ~100 bytes
  - 3 integers (projects, connections, collabs)

Total for 50 Students: ~5 KB
  - Negligible browser storage

Update Latency: < 100 ms
  - Direct to localStorage

Profile Refresh: Every 1 second
  - Zero page reload

External Links: Safe
  - noopener, noreferrer flags
```

---

This visual guide complements the technical and user documentation. For detailed information, refer to the other documentation files in the system.
