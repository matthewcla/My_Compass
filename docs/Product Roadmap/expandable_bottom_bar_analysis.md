---
date created: 2026-03-02
date changed: 2026-03-02
Created by: Senior Product Owner (AI)
Updated by: Senior Product Owner (AI)
---

# Expandable Floating Bottom Bar: Design Analysis

This document analyzes the design of Apple's "Find My" application's bottom bar to inform the UX/UI of the My Compass application.

## Key Design Principles

### 1. Multi-State Architecture
The design utilizes a fluid, draggable bottom sheet with three distinct states controlled by user gestures (swiping up/down):
*   **Collapsed (The Navigation Bar):** The "resting" state. It floats slightly above the bottom of the screen (respecting the iOS home indicator) and functions purely as a tab bar to switch contexts.
*   **Half Expanded (The Quick View):** Expanding the sheet covers roughly a third of the screen, revealing critical, immediate information for the context while preserving the primary background context.
*   **Fully Expanded (The Deep Dive):** Swiping up further expands the sheet to cover most of the screen, providing maximum real estate for viewing long lists or interacting with detailed content.

### 2. Context Preservation (The "Glass" Effect)
The bottom bar uses a heavy background blur effect (vibrancy or acrylic/glassmorphism).
*   **Purpose:** This allows the user to subconsciously "feel" the primary content existing underneath the menu. It maintains grounded spatial awareness, aligning perfectly with "Home Hub" and "Bento Layout" goals by keeping the user anchored.

### 3. Gestural Affordance & Fluidity
*   **The Grabber Pill:** A small, subtle pill at the top center of the expanded sheet indicates draggability.
*   **Physics-Based Animation:** Spring-based physics ensures smooth transitions between states, snapping to the nearest state (collapsed, half, or full) upon release.

### 4. Anatomy & Typography
*   **Anchored Navigation:** The actual tab buttons remain pinned to the absolute bottom of the sheet in all states, always reachable by the thumb.
*   **Clear Hierarchy:** In the expanded state, the header typography is large and bold, establishing context, while secondary information is muted.
*   **Floating Action Overlays:** Primary actions (like a "+" button) sit prominently in the upper right of the sheet header.

## Application to My Compass

To adapt this pattern for My Compass:

1.  **Core Context:** The background context will be the central "Home Hub" or the current landing page.
2.  **Anchored Tabs:** The bottom tabs will navigate between "Hub", "Me" (Profile), and "Support".
3.  **Interaction Model (Apple UX Direct Match):**
    *   Tapping "Me" causes the sheet to expand to the "Half Expanded" state, identical to Apple's drawer entry UX. This will reveal quick-access chips and the unified Spotlight search bar.
    *   **Drag Entry/Exit:** Dragging it fully up uses Apple's native spring-physics drawer pull-up gesture to reveal the comprehensive profile and app features. Swiping it down effortlessly dismisses the sheet identically to the Apple drawer exit.
4.  **Aesthetic:** Implement a dark, deep-blur container with smooth corner radii to ensure it feels like a native, premium, enterprise-grade component.
