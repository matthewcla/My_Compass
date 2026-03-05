---
description: Perform a systematic audit of a specific interaction or data flow feature using Architect, Engineer, and QA personas.
---

# Interaction Audit Workflow

This workflow integrates the Architect, Engineer, and QA personas to systematically audit, test, and harden any complex data interaction within the application (e.g., Billet Swiping, Form Submissions, Complex Navigation State). It ensures zero data loss, strict adherence to state management principles, and high-fidelity UI synchronization.

When requested to run `/interaction-audit` on a specific feature, execute the following phases sequentially:

## Phase 1: The Architect (Data Flow & State Validation)
*Focus: Global state, persistence, and safe mutations.*

1. **Audit the Store Logic:**
   - Locate the primary store(s) managing the interaction (e.g., Zustand/Redux stores).
   - Review the mutation functions (adding, removing, updating state).
   - Verify that data integrity is maintained (e.g., preventing duplicate entries, ensuring clean state transitions).
2. **Persistence Check:**
   - Verify if the store hydration correctly persists the necessary data across application restarts, if applicable.
3. **Data Constraints & Guardrails:**
   - Ensure specific business logic constraints (e.g., maximum slot limits, date validation) are strictly enforced at the reducer/store level, not just the UI layer.

## Phase 2: The Engineer (Interaction Sync & Optimistic UI)
*Focus: UI synchronization, thread stability, and race conditions.*

1. **Animation vs. State Sync:**
   - Audit any gesture handlers (e.g., `PanGestureHandler`) or complex animations (`react-native-reanimated`).
   - Ensure state mutations (e.g., via `runOnJS`) accurately trigger *only* when visually appropriate (e.g., after an animation commits).
2. **Optimistic Updates:**
   - Verify that the UI reflects user intent instantly (Optimistic UI), while any necessary background API syncing or heavy processing happens silently without blocking the UI thread.
3. **Render Efficiency Assessment:**
   - Check component subscriptions to the store. Are they using selective subscriptions (e.g., `useShallow` in Zustand) to prevent unnecessary re-renders when unrelated state changes?

## Phase 3: The QA / SDET (Destructive Testing & Edge Cases)
*Focus: Breaking the flow, functional boundaries, and error boundaries.*

1. **The "Rapid Fire" Test:**
   - Simulate rapid, repeated interactions (e.g., fast swiping, multi-tapping buttons) to identify race conditions, dropped frames, or duplicate state mutations.
2. **Boundary & Rejection Testing:**
   - Attempt to violate business logic limits (e.g., adding an 8th item to a 7-item list, submitting an invalid form).
   - **Expected Result:** The interaction should be gracefully rejected, the UI should reset safely, and clear user feedback (Toast/Alert) should display.
3. **Reversal & Recovery Flow:**
   - Execute the interaction, then attempt to undo or recover the previous state (if applicable to the feature). Verify the state is accurately rebuilt without corruption.
4. **Offline / Disconnected Resilience:**
   - Simulate performing the interaction while offline. Verify the action is queued, cached, or handled gracefully without triggering a hard crash.

## Execution Directives
When asked to perform an **`/interaction-audit`**, execute these phases sequentially. You may act as all three personas, noting any structural deviations from defined architectural standards (e.g., the Naval UX Design System "Fail-Safe Schema"). Document findings clearly.
