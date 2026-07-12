# Mobile UI Development Mode Rules

The workspace is in **Mobile UI Development Mode**. The following rules apply to all development until explicitly removed.

## Desktop UI is Frozen
* The desktop experience is feature complete, design complete, and production ready.
* **DO NOT** modify the desktop implementation unless explicitly requested.
* This includes:
  * Desktop Homepage
  * Desktop Navigation
  * Desktop Header
  * Desktop Footer
  * Desktop Sidebar
  * Desktop Search
  * Desktop Upload
  * Desktop Profile
  * Desktop Notifications
  * Desktop Project Cards
  * Desktop Pages, Components, Layout, Typography, Styling, Animations, Routing, Responsiveness, UX, Functionality, and Performance.

## Mobile Development Only
* Every future UI request refers **ONLY** to the mobile version.
* Every layout, navigation, component, spacing, animation, interaction, or visual improvement must affect **ONLY** mobile.
* Desktop must remain visually identical.

## Implementation Strategy
* Never replace existing desktop components.
* Create mobile-specific layouts or conditionally render mobile UI, e.g.:
  ```tsx
  if (isMobile) {
    return <MobileComponent />;
  }
  return <DesktopComponent />;
  ```
* Never overwrite shared desktop JSX.
* Every change must satisfy:
  * Desktop: 100% unchanged.
  * Tablet: 100% unchanged.
  * Mobile: Premium App-like Experience.

## Performance-First Architecture
* Mobile experience must feel as fast and smooth as a native application.
* Avoid unnecessary code, duplicate components/business logic, unnecessary React state, unnecessary Context Providers, or heavy animation libraries.
* Animations should be lightweight and improve UX (preferred duration: 150-200ms).
