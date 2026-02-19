## 2024-05-22 - Static Array Allocation
**Learning:** `Array.from({ length: N })` inside React components causes unnecessary array allocation on every render.
**Action:** Define static arrays (like slot indices) at the module level or use `useMemo` if they depend on props but have stable size.
