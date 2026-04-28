---
description: Preserve CollapsibleScaffold — collapsible header and footer are protected design features
---

# CollapsibleScaffold Protection Rule

## ⚠️ DO NOT remove or replace `CollapsibleScaffold`

The `CollapsibleScaffold` component (`components/CollapsibleScaffold.tsx`) provides:
- **Collapsible header**: The top bar slides up on scroll via DiffClamp animation
- **Collapsible footer/tab bar**: Works in concert with `ScrollControlContext` to hide the tab bar on scroll
- **Cross-platform support**: Handles iOS (Reanimated translateY) and web (`position: sticky`) separately

These are **core design features** of every spoke screen. They must be preserved.

## Rules

1. **Never replace `CollapsibleScaffold` with a plain `ScrollView` or `ScreenGradient + ScrollView`.**
2. **When refactoring screens that use `CollapsibleScaffold`**: keep it as the root scroll container. Extract internal content into child components, but the scaffolding must remain.
3. **When adding animations (e.g. `Animated.View` morphing)**: place them *inside* the `CollapsibleScaffold` children, not as a replacement for it.
4. **The render-prop pattern** (`{(listProps) => <Animated.ScrollView {...listProps}>}`) must be preserved — it wires up the scroll event handlers for header/footer collapse.

## Correct Pattern

```tsx
<ScreenGradient>
  <CollapsibleScaffold topBar={<ScreenHeader ... />}>
    {(listProps) => (
      <Animated.ScrollView {...listProps}>
        {/* Content and animations go HERE, inside the scaffold */}
        <Animated.View layout={Layout.springify()}>
          {children}
        </Animated.View>
      </Animated.ScrollView>
    )}
  </CollapsibleScaffold>
</ScreenGradient>
```

## Wrong Pattern

```tsx
{/* ❌ NEVER do this — breaks collapsible header/footer */}
<ScreenGradient>
  <View>
    <ScreenHeader ... />
  </View>
  <ScrollView>
    {children}
  </ScrollView>
</ScreenGradient>
```
