# AI Problem Solver - Architecture Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Home Page (/page.tsx)                      │
│  - Landing page with hero section                               │
│  - Features overview                                             │
│  - Link to AI Problem Solver                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         AI Problem Solver (/ai-problem-solver/page.tsx)         │
│  Main orchestrator component that manages:                      │
│  - Year selection state                                         │
│  - Projects collection                                          │
│  - Tab navigation                                               │
└──────────────┬──────────────┬───────────────┬──────────────────┘
               │              │               │
        ┌──────▼──┐    ┌──────▼──┐    ┌──────▼──┐
        │ YearSel │    │  AIChat  │    │ Upload  │
        │ ector   │    │          │    │ Project │
        └──────────┘    └──────────┘    └─────────┘
               │              │               │
               └──────┬───────┴───────┬───────┘
                      │               │
                      ▼               ▼
              ┌──────────────┐  ┌──────────────┐
              │ Projects List│  │ Statistics   │
              │              │  │ Dashboard    │
              └──────────────┘  └──────────────┘
```

## Component Dependencies

### Core Components

#### 1. AIChat.tsx
```
Dependencies:
- @/components/ui/button
- @/components/ui/card
- @/components/ui/input
- @/components/ui/scroll-area
- @/lib/data (generateMockAIResponse, simulateAIDelay)

Props:
- academicYear: AcademicYear (optional, defaults to '1st')

State:
- messages: Message[]
- input: string
- isLoading: boolean
- isOpen: boolean

Features:
- Contextual AI responses based on year
- Realistic response delay
- Quick suggestion buttons
- Smooth scroll to latest message
```

#### 2. YearSelector.tsx
```
Dependencies:
- @/components/ui/button
- @/components/ui/card
- @/lib/data (AcademicYear type)
- lucide-react (icons)

Props:
- selectedYear: AcademicYear
- onSelectYear: (year: AcademicYear) => void

Features:
- Four year buttons with color gradients
- Icons for each year level
- Descriptive text for each year
- Hover animations
```

#### 3. ProjectUpload.tsx
```
Dependencies:
- @/components/ui/button
- @/components/ui/card
- @/components/ui/input
- @/components/ui/label
- @/components/ui/textarea
- @/components/ui/select
- @/components/ui/alert
- @/lib/data (AcademicYear, Project types)

Props:
- academicYear: AcademicYear
- studentId: string
- studentName: string
- onProjectUpload: (project: Project) => void

State:
- formData: { title, description, category, fileName }
- file: File | null
- isLoading: boolean
- isSuccess: boolean
- error: string

Features:
- Form validation
- File size checking (50MB max)
- Category dropdown
- Success/error alerts
- File preview with size display
```

#### 4. ProjectsList.tsx
```
Dependencies:
- @/components/ui/card
- @/components/ui/badge
- @/lib/data (Project, AcademicYear types)
- lucide-react (icons)

Props:
- projects: Project[]
- filterByYear?: AcademicYear

Features:
- Display projects with full metadata
- Optional filtering by year
- Category color coding and icons
- File size formatting
- Empty state message
- Date formatting
```

#### 5. StatisticsDashboard.tsx
```
Dependencies:
- @/components/ui/card
- recharts (BarChart, Bar, etc.)
- @/lib/data (Statistics, Project types)
- lucide-react (icons)

Props:
- projects: Project[]

Computed:
- uniqueStudents count
- projectsByYear breakdown
- studentsByYear breakdown
- chartData for visualization

Features:
- 4 stat cards with gradients
- Interactive bar chart
- Progress bar visualizations
- Breakdown tables
- Real-time calculations
```

## Data Flow

### Project Upload Flow
```
User Input
    ↓
ProjectUpload.tsx (validation)
    ↓
onProjectUpload callback
    ↓
ai-problem-solver/page.tsx (projects state update)
    ↓
ProjectsList.tsx (re-renders with new project)
    ↓
StatisticsDashboard.tsx (updates statistics)
```

### AI Chat Flow
```
User Question
    ↓
AIChat.tsx (captures input)
    ↓
generateMockAIResponse() from lib/data.ts
    ↓
simulateAIDelay() for realism
    ↓
AIChat.tsx (displays response)
    ↓
ScrollArea (auto-scroll to latest)
```

### Year Selection Flow
```
YearSelector Button Click
    ↓
onSelectYear callback
    ↓
ai-problem-solver/page.tsx (updates state)
    ↓
AIChat.tsx (re-renders with new year)
    ↓
ProjectsList.tsx (filters by new year)
```

## State Management Strategy

### Session-Level (localStorage)
```javascript
studentId: string (unique per session)
studentName: string (display name)
```

### Page-Level (React useState)
```javascript
selectedYear: AcademicYear
projects: Project[]
isLoaded: boolean
```

### Component-Level
```javascript
AIChat: messages, input, isLoading, isOpen
ProjectUpload: formData, file, isLoading, isSuccess, error
```

## Mock Data System

### AI Response Generation
The system in `lib/data.ts` provides context-aware responses:

```
Question Type Detection:
- "error" | "debug" | "fix" → Debug responses
- "idea" | "project" | "build" → Project idea responses
- "document" | "comment" | "readme" → Documentation responses
- Default → General coding help

Year Level Adaptation:
- 1st Year: Focus on fundamentals
- 2nd Year: Introduce frameworks and libraries
- 3rd Year: Advanced patterns and optimization
- Final Year: Production-ready practices
```

## Styling System

### Color Variables (globals.css)
```
Primary: oklch(0.45 0.15 260) - Deep Blue
Accent: oklch(0.65 0.15 35) - Golden
Background: oklch(0.98 0.001 250) - Off-white
Card: oklch(1 0 0) - White
Muted: oklch(0.93 0.005 250) - Light gray
```

### Animation Classes
```
fade-in: Opacity animation (0.6s)
slide-up: Combined opacity + transform (0.6s)
hover-lift: Scale and shadow on hover
smooth-button: Button hover effects
smooth-transition: General transitions (0.3s)
```

## Performance Considerations

1. **Lazy Loading**: Components load on tab selection
2. **Memoization**: No unnecessary re-renders due to focused state management
3. **Animation Delays**: Staggered animations for better UX
4. **Scroll Optimization**: ScrollArea component for efficient rendering
5. **Real-time Updates**: Projects update immediately upon upload

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties support
- ES6+ JavaScript features
- LocalStorage API support
- ResizeObserver (for responsive components)

## Accessibility

- Semantic HTML structure
- ARIA labels on form inputs
- Keyboard navigation support
- Color contrast compliance
- Focus states on interactive elements
- Alt text for icons (via descriptions)

## Future Integration Points

1. **Real API Integration**: Replace `generateMockAIResponse()` with actual AI API calls
2. **Database Backend**: Replace localStorage with persistent database
3. **Authentication**: Add real user authentication system
4. **File Storage**: Integrate cloud storage for project files
5. **Real-time Features**: Add WebSocket support for live updates
6. **Notifications**: Implement push notifications for project interactions
