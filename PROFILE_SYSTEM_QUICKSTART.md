# Student Profile System - Quick Start Guide

## Getting Started in 3 Steps

### Step 1: Access the Student Selector
Navigate to `/select-student` to see all 50+ students from the CSE Department, Section E.

### Step 2: Choose a Student
Click on any student card to load their independent profile. For example:
- **NALLA NEELIMA** (24B81A05Q5)
- **NALLAMELLI SANTHOSH KUMAR** (24B81A05Q6)
- **NANDA GOPAL KADALI** (24B81A05Q9)

### Step 3: Explore the Profile
Once on the profile page, you can:
- Upload a profile photo
- View your CSV data (read-only)
- Track statistics with real-time counters
- Edit basic profile information

## Quick Features Tour

### Upload Profile Photo
1. Click "Edit Profile" button
2. Click on the avatar circle
3. Select an image from your computer
4. Click "Save" to persist

**Result**: Photo is stored and will appear on page reload.

### Track Statistics
On the profile overview, you'll see three cards:
- **Projects Uploaded** - Click "+ Increment" each time you upload a project
- **Connections** - Click "+ Increment" to add a connection
- **Collaborations** - Click "+ Increment" for each collaboration

**Result**: Numbers update instantly and persist across sessions.

### View Your Information
Your profile displays:
- Student Name (from CSV)
- Department (from CSV)
- Academic Year (from CSV)
- Student ID
- Email Address
- Profile Photo (if uploaded)

## Test Scenarios

### Scenario 1: Create Independent Profiles
```
Student A: Upload photo + set stats to (5, 3, 2)
Student B: Upload different photo + set stats to (2, 1, 1)
Student C: New profile with (0, 0, 0)

Switch between them → Each maintains independent data
```

### Scenario 2: Verify Data Persistence
```
Load Student A
Set Projects = 10
Refresh page (F5)
→ Projects still shows 10
```

### Scenario 3: Test Photo Isolation
```
Student A uploads photo A
Student B uploads photo B
Switch to A → Shows photo A
Switch to B → Shows photo B
Switch to C → Shows avatar initials (no photo)
```

## Key Points

✓ **Each student has independent data**
- Statistics are not shared
- Photos are not shared
- Edit history is not shared

✓ **Data persists automatically**
- No manual save needed for statistics
- Profile photo saved when you click "Save"
- All data survives page refresh and browser restart

✓ **CSV data is read-only**
- Department and Year cannot be changed
- Prevents accidental data corruption
- Official records remain intact

✓ **Search and discovery**
- Find students by name, ID, or email
- Live filtering as you type
- Shows how many students match your search

## Common Actions

**Increment a Statistic**
→ Click "+ Increment" button on any metric card

**Upload New Photo**
→ Edit Profile → Click Avatar → Select Image → Save

**Search for a Student**
→ `/select-student` → Type in search box

**Switch Student**
→ Navbar → "Switch Student" button → Select new student

**Edit Profile Name**
→ Edit Profile → Modify "Student Name" → Save

**View Statistics**
→ Check the three large cards on profile page

**Check Data Persistence**
→ Increment stats → Refresh page → Stats remain

## Sample Student IDs

Copy and use these Student IDs to test:
- `24B81A05Q5` - NALLA NEELIMA
- `24B81A05Q6` - NALLAMELLI SANTHOSH KUMAR
- `24B81A05Q7` - NALLAMOTHU GANDHARVA NARASIMHA NAIDU
- `24B81A05Q8` - NALLAPU YASVARDHAN
- `24B81A05Q9` - NANDA GOPAL KADALI
- `24B81A05R0` - NARRA PALLAVI
- `24B81A05R1` - NAVYACHOWDARY VEGUNTA
- `24B81A05R5` - NUTALAPATI HARSHITHA
- `24B81A05R6` - NUVVULA VARUN KRISHNA
- `24B81A05S5` - PALLI BHINDU SHALINI

Or browse all students at `/select-student`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Photo not saving | Click "Save" button after upload |
| Stats reset on refresh | Check if localStorage is enabled in browser |
| Can't find a student | Use `/select-student` to browse all students |
| Profile shows "loading" | Wait a moment or refresh the page |
| Edit fields not saving | Make sure to click "Save" button |

## Data Storage Location

All data is stored in browser localStorage:
- Key: `studentProfile_{STUDENT_ID}`
- Format: JSON
- Access: DevTools → Application → localStorage

Example key: `studentProfile_24B81A05Q5`

## Next Steps

1. **Test Profile Independence**
   - Load 2-3 students
   - Set different statistics for each
   - Switch between them

2. **Test Photo Upload**
   - Upload a photo for one student
   - Switch to another student
   - Verify photo is not shared

3. **Test Data Persistence**
   - Make changes
   - Refresh browser
   - Verify all data remains

4. **Explore Search**
   - Go to `/select-student`
   - Try searching by name, ID, or email
   - See live filtering in action

## Need More Details?

See **STUDENT_PROFILE_SYSTEM.md** for:
- Complete feature documentation
- Technical architecture details
- API reference
- Advanced testing guide
- Future enhancement ideas

---

**Ready to test?** Navigate to `/select-student` to get started! 🚀
