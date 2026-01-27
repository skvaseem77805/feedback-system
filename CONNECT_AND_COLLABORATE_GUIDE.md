# Connect & Collaborate Features Guide

## Overview

CRR Project Hub includes **professional networking features** that allow students to:
- **Connect** with peers via LinkedIn
- **Collaborate** via LinkedIn or Email
- Track all networking activity in real-time on profiles

## Connect Feature

### What It Does
Opens another student's LinkedIn profile in a new tab, allowing you to add them to your network.

### How It Works

1. **Find a Student**
   - Go to `/select-student` to browse all students
   - Search by name, student ID, or email

2. **Click Connect**
   - Each student card has a blue "Connect" button
   - Button opens their LinkedIn profile in new tab

3. **Stats Update**
   - Your "Connections" count increments by 1
   - Increment happens automatically when button is clicked
   - No page reload needed

### Where Connect Buttons Appear

1. **Student Browser** (`/select-student`)
   - Blue "Connect" button on each student card
   - Shows student's name and basic info

2. **Student Profile Page** (`/profile`)
   - If viewing another student's public profile
   - Connect button in header (if available)

### Example Flow

```
Step 1: Navigate to /select-student
Step 2: Search for "NALLA NEELIMA"
Step 3: Click blue "Connect" button on her card
Step 4: LinkedIn opens in new tab
Step 5: Return to browser
Step 6: Your profile now shows +1 Connection
```

## Collaborate Feature

### What It Does
Provides two ways to initiate collaboration:
- **Via LinkedIn**: Direct message on LinkedIn
- **Via Email**: Open email client with pre-filled message

### How It Works

1. **Find a Student**
   - Browse `/select-student` page
   - Each student card has "Collaborate" button

2. **Click Collaborate Button**
   - Dropdown menu appears with two options:
     - `Collaborate via LinkedIn` - Opens LinkedIn DM
     - `Collaborate via Email` - Opens email client

3. **Choose Your Method**
   - **LinkedIn Option**: 
     - Opens their LinkedIn profile in new tab
     - You can send them a direct message
   - **Email Option**: 
     - Opens your email client
     - Pre-fills: Recipient, Subject, Body
     - You compose and send your message

4. **Stats Update**
   - Your "Collaborations" count increments by 1
   - Happens automatically for both options
   - Updates instantly on your profile

### Dropdown Behavior

```
┌─────────────────────────┐
│   Collaborate Button    │  ← Click
└────────────┬────────────┘
             │
             ↓
        ┌─────────────────────────────────┐
        │ via LinkedIn                    │  ← Click to open LinkedIn
        ├─────────────────────────────────┤
        │ via Email                       │  ← Click to send email
        └─────────────────────────────────┘
```

### Email Template

When you click "Email", the following are pre-filled:

- **To**: Student's email address
- **Subject**: "Project Collaboration Request"
- **Body**:
  ```
  Hi [Student Name],
  
  I would like to collaborate with you on a project. 
  Please let me know if you are interested!
  
  Best regards
  ```

You can then modify the message before sending.

## Example Workflows

### Scenario 1: Connect with a Classmate

1. Visit `/select-student`
2. Search for "CSE" or scroll through students
3. Click blue "Connect" button
4. LinkedIn opens → Send connection request
5. Back to CRR Hub → Your profile shows +1 Connection

### Scenario 2: Collaborate via Email

1. Visit `/select-student`
2. Find a student you want to work with
3. Click "Collaborate" button
4. Select "via Email"
5. Email client opens with pre-filled message
6. Customize the message if needed
7. Send the email
8. Back to CRR Hub → Your profile shows +1 Collaboration

### Scenario 3: Quick Collaboration via LinkedIn

1. Browse student profiles
2. Click "Collaborate" → Select "via LinkedIn"
3. LinkedIn opens in new tab
4. Send them a direct message
5. Profile automatically shows +1 Collaboration

## Data Requirements

For these features to work fully:

### LinkedIn URL (Optional but Recommended)
- Each student can add their LinkedIn profile URL
- Edit profile → Enter LinkedIn URL in "LinkedIn Profile URL" field
- Format: `https://linkedin.com/in/yourprofile`
- Used by Connect and Collaborate (LinkedIn) features

### Email Address (Required for Email Collaboration)
- Pulled from student database
- Can be edited in student profile
- Must be valid email format
- Required to use "Collaborate via Email"

## Integration with Stats System

### Automatic Stat Increments

**Connections Increment:**
- Triggered: Click "Connect" button
- Incremented: 1 per connection click
- Tracked: In "Connections" stat on profile

**Collaborations Increment:**
- Triggered: Click either collaboration option
- Incremented: 1 per collaboration (regardless of method)
- Tracked: In "Collaborations" stat on profile

### Real-Time Updates

```
Time  Event                               Stats Change
─────────────────────────────────────────────────────
10:00 Click Connect on Student B          Connections: 0→1
10:05 Click Collaborate (LinkedIn)        Collaborations: 0→1
10:10 Click Collaborate (Email)           Collaborations: 1→2
10:15 Visit Profile                       All counts show instantly (0 delay)
```

## UI Components

### Student Profile Card
Located in: `/components/StudentProfileCard.tsx`

Features:
- Shows student's initials avatar
- Displays department badge
- Shows email and mobile
- Has Connect button (always visible)
- Has Collaborate button (dropdown on click)
- Optional: View Profile link

### Connect Button
- **Color**: Blue (LinkedIn brand color)
- **Text**: "Connect"
- **Icon**: LinkedIn logo
- **Action**: Opens LinkedIn profile

### Collaborate Button
- **Color**: Gray/outline
- **Text**: "Collaborate"
- **Action**: Shows dropdown menu

## Security & Privacy

### Safe Link Opening
- All external links open with `noopener,noreferrer`
- Prevents malicious scripts from accessing your page
- Opens in new tab safely

### No Direct Email Exposure
- Emails only revealed to active users
- Mailto links are standard browser feature
- No data sent to external servers

### Student Data Protection
- Only users who are logged in can see connect/collaborate buttons
- Anonymous visitors cannot interact with students
- All data stored locally in browser localStorage

## Troubleshooting

### Connect Button Not Working
**Issue**: LinkedIn doesn't open
- **Check**: Verify student has LinkedIn URL in profile
- **Fix**: Ask student to add their LinkedIn profile URL
- **Alt**: Check browser popup blocker settings

### Email Button Disabled
**Issue**: "via Email (N/A)" appears gray
- **Reason**: Student hasn't provided email address
- **Fix**: Ask student to add email to their profile
- **Alternative**: Use LinkedIn collaboration instead

### Stats Not Incrementing
**Issue**: Connections/Collaborations count doesn't increase
- **Check**: Verify you're logged in with correct student ID
- **Check**: Console for error messages
- **Fix**: Try page refresh and click button again

### Email Client Doesn't Open
**Issue**: Clicking email collaboration does nothing
- **Reason**: May need to set default email client
- **Fix**: In browser settings, confirm default email app
- **Alt**: Copy recipient email and use your email directly

## Platform Integration

### Where to Access

| Feature | URL | Access |
|---------|-----|--------|
| Student Browser | `/select-student` | Any logged-in student |
| Profile Page | `/profile` | View your own profile |
| Other Profiles | `/profile?id=studentId` | View another student |
| Upload | `/upload` | Students uploading projects |

### Supported Browsers

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design

## Best Practices

1. **Add Your LinkedIn URL** first so others can connect with you
2. **Complete Your Email** so others can reach you via email
3. **Use Connect** for networking and adding to your professional circle
4. **Use Collaborate** when you want to work on a specific project
5. **Check Your Profile** regularly to see updated stats

## Real-World Example

### Project Collaboration Flow

```
Day 1:
  - Browse /select-student
  - Find talented designer "Priya"
  - Click Connect → Add to LinkedIn network
  - Collaborations: 0 → Connections: 1

Day 2:
  - See a great project idea
  - Want to collaborate with Priya
  - Click Collaborate → Choose Email
  - Send: "Let's build a web app together?"
  - Profile: Collaborations: 0 → 1

Day 3:
  - Priya responds positively
  - Work together on project
  - Both upload project
  - Upload page auto-increments: Projects Uploaded: 0 → 1

Day 5:
  - Visit profile
  - See stats: Projects: 1, Connections: 1, Collaborations: 1
  - All reflecting real activity!
```

## FAQ

**Q: Will people know I connected with them?**
A: Only through LinkedIn notifications (same as manual connections).

**Q: Can I undo a connection click?**
A: Yes - the stat isn't a binding contract, just tracks your attempts.

**Q: What if a student has no email?**
A: Email button will be disabled. Use LinkedIn instead.

**Q: Do my stats reset?**
A: No - they persist until manually cleared or browser cache cleared.

**Q: Can I connect with myself?**
A: No - the system prevents self-interaction for sensible metrics.

---

**Last Updated**: January 2026  
**Status**: Production Ready ✓
