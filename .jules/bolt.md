## 2024-05-22 - Inline Functions Break React.memo
**Learning:** Passing inline arrow functions (e.g., `onSwipe={() => {}}`) to `React.memo` wrapped components defeats the memoization because a new function instance is created on every render.
**Action:** Use a stable function reference (defined outside component or via `useCallback`) for callbacks passed to memoized components.

## 2024-05-22 - Web Build Broken by import.meta
**Learning:** The project's web build fails with `SyntaxError: Cannot use 'import.meta' outside a module`, preventing frontend verification with Playwright.
**Action:** Rely on static analysis (`tsc`, lint) and manual code review for verification until the web build configuration is fixed.
