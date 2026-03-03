---
date created: 2026-03-02
date changed: 2026-03-02
Created by: Senior Product Owner (AI)
Updated by: Senior Product Owner (AI)
---

# My Compass - Product Execution Plan

As the Senior Product Owner, I have analyzed the requested features and organized them into a safe, efficient, and logical roadmap. This approach prioritizes foundational UX/UI stability and high-impact navigational changes first, followed by establishing core read/write workflows (Leave, Admin), and culminates in complex integrations (Auth, Medical records) and advanced platform features (Lock Screen Widgets, KSD Extraction).

## Phase 1: Foundation, UX Polish & Navigation (Sprint 1-2)
*Goal: Fix immediate UX issues, modernize constraints, and deploy the new navigation paradigm without touching deeper data pipelines. This establishes trust and usability immediately.*

### 1. Design & UX Standards Focus
- **De-AI the Polish**: Audit visual assets and copy to ensure a human-centered, premium enterprise feel. Avoid any elements that "scream AI made this."
- **Form Input Enhancements**: Add an "Exit / Return" button when typing to quickly dismiss keyboards. Implement a visual validation system (e.g., dynamic red X or green checkmark when a field is filled).
- **Validation Highlighting**: Implement mandatory red highlighting for missed fields to immediately draw the user's attention back to the issue area.
- **Support Integration**: Design and implement a "Contact Support / Detailer" page accessible from key failure points and menus.

### 2. Navigation Architecture Overhaul
- **Expandable Floating Bottom Bar**: Redesign the bottom navigation to be dynamic.
  - Make the drawer entry and exit identical to Apple's UX gestures (swipe up/down states).
  - Repurpose the former "Menu" tab to be the "Me" tab (My Profile entry point).
  - Integrate a functional Spotlight Search within the expandable bar.
- **Replace Spotlight Search Bar**: Swap the static, universal search bar on the landing page for functional chips (Hub, Admin, Leave, Assignment, PCS) to guide user context switching explicitly.
- **Bento Layout Implementation**: Formalize the design patterns for rendering "Home Hub" widgets into a clean, scannable Bento layout. Make widgets permanent + temporal access points where the landing pages become the widget.

## Phase 2: Core Workflows & The "Everyday App" (Sprint 3-4)
*Goal: Build out the most frequent user interactions to make the app relevant outside of the MNA/PCS cycles, establishing daily or weekly utility.*

### 1. Leave Function
- **Widget Update**: Enhance the leave widget to reflect today's balance AND project the balance over a future timeframe (e.g., +6 months).
- **Routing & Approvals**: Route leave requests functionally into the "My Admin" domain.
- **Status Tracking**: Implement review chain visibility, approval status, and push notifications for state changes.

### 2. My Admin (The Request Hub)
- **Request Flows**: Build out standardized UI flows for all necessary administrative requests.
- **Lifecycle Management**: Design the UX for Request states: Historical (archived), Processing (active), and Kick-back (returned with issues).
- **Review/Approval UX**: Standardize the manager-facing side of the approval and kick-back process.

### 3. Submission Feedback Standardization
- **Application Request Updates**: Update all submission responses (across applications) to match the clear, reassuring feedback loop already established in leave and travel claims.

## Phase 3: Advanced Features & PCS Ecosystem (Sprint 5-6)
*Goal: Deliver high-value, device-level capabilities and optimize the critical PCS process to drive platform adoption.*

### 1. My PCS & Key Supporting Document (KSD) Development
- **Receipt Scanner Upgrade**: Expand the widget from a simple camera to a robust tool allowing data logging and review, not just taking photos.
- **Doc Analysis & Extraction**: Implement OCR/Data extraction protocols for receipts.
- **Routing & Workflow**: Implement UCT Routing, review/approval tracking, and kick-back functionally (with dedicated comment areas for notes).

### 2. Lock Screen Widgets (iOS/Android Native)
*Prioritize widgets for immediate glanceability and interaction.*
- **Receipt Scanner**: Quick launch into the scanner.
- **Status Boards**: Dedicated widgets for MNA Status, Orders Status, and PCS Status.
- **Notifications**: "New NAVADMIN / Inbox Note" and priority alerts like "You have a new message from your detailer."

## Phase 4: Identity, Profile & Deep Integrations (Sprint 7-8+)
*Goal: Integrate sensitive systems, enhance the user identity profile, and provide strategic value to leadership.*

### 1. Enterprise Identity & Onboarding
- **Okta "Baked-in" Auth**: Deep integration of Okta to handle SSO authentication seamlessly and securely.
- **App & Command Onboarding**: Create a robust platform onboarding experience and dedicated flows for Command onboarding (checking into a new unit).

### 2. My Profile & Career Hub (The Big Shift)
- **Performance Reports (Evals)**: Add lightweight metadata (similar to NSIPS) to show performance history without relying on downloading heavy PDFs. Allows low bandwidth usage.
- **ETJ Data Integration**: Add new sections populated directly by the Electronic Training Jacket.
- **"My Career" Section**: Separate out the career trajectory and position orientation into its own dedicated section for clarity.
- **Role-Based Browsing**: Enable users to browse profiles based on user roles (DIVO, DH, DCPO, SWO, Enlisted Watch Officer, Triad). This adds immense value for detailing, mentorship, and leadership/debriefing (no more paper charts).

### 3. Complex Connections & Document Uploads
- **Surveys**: Investigate partnering with platforms like Qualtrics using embedded webviews to handle official surveys natively and offload analytics functions.
- **Vital Records**: Flow for birth and marriage certificate scanning and submission (integrating towards DEERS).
- **Medical**: Initial research and architectural spiking for MHS Genesis / IMR Connections.
