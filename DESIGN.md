# DESIGN.md

## Purpose

This file defines the visual, interaction, and UX principles for this codebase.

All new UI and all UI refactors should follow these rules unless a product requirement explicitly overrides them.

The design system is based on:

- **shadcn/ui**
- **Luma style**
- **Animate UI**
- **Motion** where custom interaction behavior is needed
- **Tailwind CSS** for styling

The goal is not to visually copy Apple products.

The goal is to achieve a similar level of interaction quality: interfaces should feel calm, precise, tactile, responsive, coherent, and polished. Motion should be subtle and purposeful. The product should retain its own identity.

---

## Core Design Principle

Design for **feel before spectacle**.

The interface should feel:

- immediate
- stable
- spatially coherent
- tactile
- restrained
- predictable
- refined
- fast

Users should notice that the application feels unusually smooth, not that it contains many animations.

When choosing between a more impressive animation and a faster, clearer interaction, choose the faster and clearer interaction.

---

## Design Stack

Use the following hierarchy:

1. **shadcn/ui Luma** for the base visual system and common UI primitives.
2. **Animate UI** for animated primitives and interaction patterns.
3. **Motion** for custom state transitions, gestures, layout transitions, and spring physics when Animate UI does not cover the required interaction.
4. **Tailwind CSS and shared design tokens** for styling.
5. Custom components only when the product requires behavior that the shared primitives cannot reasonably provide.

Do not introduce another general-purpose component library unless there is a strong technical reason.

Do not create custom versions of common controls when a suitable shadcn/ui primitive already exists.

---

## Product Identity

Do not turn the product into an Apple clone or a generic shadcn demo.

Preserve:

- product branding
- information architecture
- domain-specific UX
- meaningful brand colors
- application-specific interaction patterns
- existing features and business logic

Apple is a reference for interaction quality, restraint, hierarchy, and polish — not a visual template.

Do not copy:

- Apple product layouts
- Apple-specific navigation structures
- Apple proprietary assets
- Apple icons
- Apple exact color values
- Apple-specific UI chrome

---

# Visual Language

## Layout

Favor clear hierarchy and generous but controlled whitespace.

Layouts should feel spacious without wasting space.

Prefer:

- strong alignment
- consistent horizontal rhythm
- deliberate section spacing
- clear grouping
- limited nesting
- simple surfaces
- stable page structure

Avoid:

- unnecessary containers
- excessive card grids
- deeply nested panels
- random spacing values
- dense clusters of controls without hierarchy

Not every section needs a card.

Whitespace is often a better separator than borders or containers.

---

## Spacing

Use the shared spacing scale.

Avoid arbitrary values unless required by a specific visual or technical constraint.

Spacing should communicate hierarchy:

- tightly related elements use small gaps
- controls within a group use moderate gaps
- separate sections use larger gaps
- major page regions use the largest spacing

Repeated UI patterns should use identical spacing rules.

---

## Border Radius

Use Luma-style soft geometry.

Corners should generally feel smooth and modern, but not excessively rounded.

Use larger radii for:

- cards
- dialogs
- sheets
- floating surfaces
- large interactive containers

Use smaller radii for:

- compact controls
- input fields
- badges
- table elements

Avoid turning every element into a pill.

Pill shapes should be reserved for controls where the geometry makes semantic sense.

---

## Borders

Borders should be restrained.

Prefer subtle borders with low contrast.

Use borders to clarify structure, not to decorate every surface.

Avoid heavy outlines around large sections unless they communicate a meaningful boundary.

---

## Shadows and Elevation

Use soft, restrained shadows.

Elevation should communicate layering.

Higher elevation may be used for:

- dialogs
- popovers
- menus
- floating controls
- sheets
- transient overlays

Avoid strong drop shadows.

Prefer subtle combinations of:

- surface contrast
- border
- shadow
- translucency

rather than relying on large shadows alone.

---

## Color

Use semantic design tokens rather than hardcoded colors.

Prefer tokens such as:

- background
- foreground
- muted
- muted-foreground
- card
- popover
- border
- input
- primary
- primary-foreground
- secondary
- destructive
- accent

Product brand colors may extend the token set when required.

Avoid arbitrary hex values inside feature components.

Do not use color as the only way to communicate state.

---

## Dark Mode

Dark mode is a first-class design target.

Do not treat it as a simple color inversion.

Verify:

- hierarchy
- border visibility
- surface separation
- text contrast
- hover states
- disabled states
- shadows
- translucent surfaces
- focus states

Avoid pure black backgrounds unless intentionally required.

---

## Typography

Prefer a system-oriented font stack unless the product has an intentional brand typeface.

Recommended fallback stack:

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Helvetica,
  Arial,
  sans-serif;
```

Do not include proprietary Apple font files in the repository.

Typography hierarchy should primarily use:

- size
- weight
- line-height
- spacing
- contrast

Avoid excessive use of decorative colors or font styles.

Headings should be clear but not oversized without reason.

Body text should prioritize readability.

---

# Component System

## Default Rule

Use shadcn/ui primitives as the starting point for common interface components.

Prefer shared components over repeated raw Tailwind implementations.

The intended architecture is:

```text
feature UI
    ↓
shared application components
    ↓
shadcn/ui + Animate UI primitives
    ↓
design tokens + motion tokens
```

Avoid:

```text
feature UI
    ↓
large repeated blocks of arbitrary Tailwind classes
```

---

## Preferred shadcn/ui Components

Use shadcn/ui for common primitives including, when applicable:

- Button
- Input
- Textarea
- Select
- Combobox
- Command
- Dialog
- Sheet
- Drawer
- Dropdown Menu
- Context Menu
- Popover
- Tooltip
- Tabs
- Accordion
- Checkbox
- Radio Group
- Switch
- Slider
- Card
- Badge
- Avatar
- Table
- Sidebar
- Breadcrumb
- Navigation Menu
- Skeleton
- Toast
- Calendar
- Date Picker

Do not reimplement accessibility behavior already handled by the underlying primitives.

---

## Cards

Use cards only when a container represents a meaningful conceptual group.

Avoid placing every page section inside a card.

Prefer flat page composition when hierarchy can be communicated through spacing and typography.

Interactive cards should have restrained hover feedback.

Do not dramatically scale cards on hover.

---

## Buttons

Buttons should feel tactile and immediate.

Use clear visual hierarchy between:

- primary
- secondary
- outline
- ghost
- destructive

Press feedback should normally be subtle.

Typical press behavior:

- slight compression
- immediate action
- controlled spring back to rest

Avoid exaggerated scale changes.

A typical press scale should remain approximately within:

```text
0.97 – 0.99
```

Hover scale, if used at all, should normally remain around:

```text
1.00 – 1.015
```

Do not delay the action until the visual animation completes.

---

## Inputs

Inputs should be visually quiet.

Prioritize:

- readable labels
- strong focus states
- clear validation
- appropriate touch targets
- consistent height
- predictable spacing

Do not remove focus indicators.

Style them to fit the design system instead.

---

## Dialogs, Sheets, and Drawers

Use these based on context, not interchangeably.

Dialogs are appropriate for focused tasks.

Sheets and drawers are appropriate when spatial continuity or mobile ergonomics make them preferable.

Animation should coordinate:

- backdrop
- container
- content

Use restrained:

- opacity
- scale
- translation
- blur where appropriate

Avoid dramatic zoom effects.

On mobile, prefer sheets or drawers over centered dialogs when that better fits the task.

---

## Menus, Popovers, and Tooltips

Transient surfaces should feel connected to their trigger.

Animate from a logical transform origin where possible.

Use short, restrained combinations of:

- opacity
- small scale
- slight translation

Avoid large movement distances.

Tooltips should not become distracting through excessive animation.

---

## Tabs and Segmented Controls

Prefer a single moving active indicator where practical.

The active indicator should appear to travel from the previous selection to the next.

Avoid destroying and recreating visually identical indicators if a shared transition can preserve continuity.

Tab content may use a subtle transition when it improves orientation.

Do not animate content aggressively.

---

## Accordions and Collapsible Regions

Animate expansion and collapse smoothly.

Surrounding content should move naturally instead of jumping.

The animation should clarify where content came from and where it went.

Do not add bounce.

---

## Lists

When items are:

- inserted
- removed
- reordered
- filtered

prefer layout-aware motion so existing items visibly move into their new positions.

Avoid teleporting items when the relationship between old and new layout matters.

Do not animate very large lists in ways that harm performance.

---

## Navigation

Navigation should preserve the user's mental map.

Prefer:

- stable application chrome
- shared active indicators
- subtle local transitions
- consistent placement

Do not animate every route aggressively.

Navigation transitions should never make the application feel slower.

---

## Icons

Use a consistent icon family throughout the product.

Animated icons should be used only when animation communicates a state change.

Good examples:

- menu ↔ close
- play ↔ pause
- expand ↔ collapse
- chevron rotation
- copy → copied
- loading → success
- visibility state

Do not animate decorative icons simply because animation is available.

---

# Motion System

## Motion Philosophy

Motion is part of the design system.

It should communicate:

1. feedback
2. state change
3. hierarchy
4. spatial continuity
5. cause and effect

Motion should not exist purely as decoration.

Default to less motion.

---

## Interaction Sequence

Direct interactions should generally feel like:

```text
user action
    ↓
immediate visual feedback
    ↓
state changes
    ↓
motion explains the transition
    ↓
interface settles quickly
```

Never force the user to wait for an animation before the application responds.

---

## Motion Priority

Prefer animation for:

- direct manipulation
- selection changes
- expanding/collapsing UI
- dialogs and sheets
- menus and popovers
- dynamic lists
- loading state changes
- navigation indicators
- meaningful state transitions

Avoid animation for:

- static decoration
- every section entering the viewport
- every icon
- every card
- purely ornamental movement

---

## Movement Distance

Keep movement small.

Typical interface motion should generally use:

- `1–4px` for micro-feedback
- `4–12px` for small entrances or local state changes
- larger distances only when the component itself physically moves, such as a drawer or sheet

Avoid unnecessary large translations.

---

## Timing

Use these as perceptual guidelines, not rigid constants.

### Micro feedback

```text
100–180ms
```

Examples:

- hover
- press
- icon response
- tiny state changes

### Small UI transitions

```text
160–250ms
```

Examples:

- popovers
- menus
- tooltips
- compact content transitions

### Larger state/layout transitions

```text
220–400ms
```

Examples:

- dialogs
- sheets
- expanding content
- substantial layout transitions

Springs may technically run longer but should respond immediately and settle quickly.

---

## Easing

Use standard easing for simple:

- opacity transitions
- color transitions
- subtle non-physical visual effects

Use spring motion when the interaction represents physical movement or direct manipulation.

---

## Springs

Prefer controlled springs for:

- buttons
- toggles
- drawers
- sheets
- selection indicators
- tabs
- expanding cards
- layout transitions
- draggable elements
- stateful controls

Springs should feel responsive rather than playful.

Favor:

- relatively high stiffness
- sufficient damping
- fast settling
- little or no visible oscillation

Avoid obvious bouncing unless the product specifically calls for playful behavior.

---

## Shared Motion Tokens

Do not define arbitrary transition values in every component.

Create and reuse centralized motion tokens.

The codebase should expose concepts similar to:

```ts
motion.fast
motion.default
motion.slow

spring.snappy
spring.smooth
spring.gentle

transition.fade
transition.popover
transition.dialog
transition.layout
```

Exact implementation may differ, but the principle is mandatory:

**similar interactions should use similar motion.**

Do not create a unique spring configuration for every component.

---

## Animate UI

Use Animate UI when it provides a suitable animated primitive.

Prefer Animate UI for high-value interactions such as:

- dialogs
- sheets
- drawers
- tabs
- accordions
- collapsibles
- dropdowns
- popovers
- tooltips
- stateful icons
- command interfaces
- expandable content

Do not replace every shadcn component with an animated equivalent automatically.

Use animated variants only when motion improves understanding or tactile feedback.

---

## Custom Motion

Use Motion directly when a product-specific interaction requires behavior not provided by Animate UI.

Good uses include:

- shared layout transitions
- custom state morphing
- reordering
- drag interactions
- shared selection indicators
- coordinated multi-element transitions

Do not introduce custom animation code when a simpler shared primitive already solves the problem.

---

## Spatial Continuity

Preserve object identity whenever possible.

Prefer:

```text
selected card
    ↓
expands into detail
```

over:

```text
selected card disappears
    ↓
unrelated panel appears
```

Prefer:

```text
active tab indicator moves from A to B
```

over:

```text
indicator A disappears
indicator B appears
```

Prefer:

```text
list items move into new positions
```

over:

```text
old list disappears
new list appears
```

The user should be able to understand where interface objects came from and where they went.

---

## Hover

Hover feedback should be subtle.

Prefer:

- slight background changes
- small border changes
- restrained elevation
- small icon movement
- minimal scale changes

Do not depend on hover for functionality.

Touch devices must receive equivalent interaction clarity.

---

## Press

Press states should feel tactile.

Use subtle compression or positional feedback.

The press reaction should begin immediately.

Do not wait for network requests or application state updates before showing press feedback.

---

# State Design

## Loading

Optimize for perceived performance.

Prefer:

- skeletons shaped like the real content
- local loading indicators
- optimistic UI where safe
- preserving surrounding content
- progressive updates

Avoid replacing an entire page with a centered spinner unless necessary.

When a button triggers an action, prefer an inline button loading state over blocking the entire interface.

---

## Success

Success states should be clear but restrained.

Where useful, transition the control itself:

```text
idle → loading → success
```

instead of replacing the whole region with an unrelated success screen.

---

## Errors

Errors should appear close to the action or field that caused them.

Use clear language.

Do not rely only on red color.

Avoid unnecessary shaking animations.

If motion is used for an error, keep it subtle and accessible.

---

## Empty States

Empty states should explain:

- what is empty
- why it may be empty
- what the user can do next

Keep them visually simple.

Do not fill empty states with unnecessary illustration or animation unless it materially improves the experience.

---

# Glass, Blur, and Translucency

Use translucency selectively.

Appropriate contexts may include:

- overlays
- floating navigation
- sheets
- command interfaces
- transient controls

Do not apply glass effects globally.

Do not attempt to reproduce Apple's Liquid Glass appearance literally.

Readability and hierarchy always take priority over visual effects.

If blur reduces clarity or performance, remove it.

---

# Accessibility

Accessibility is part of the design system.

Do not trade accessibility for visual polish.

All relevant UI must support:

- keyboard navigation
- visible focus states
- semantic HTML
- appropriate ARIA behavior
- sufficient color contrast
- accessible labels
- usable touch targets
- reduced motion
- screen-reader-compatible state changes

Preserve the accessibility behavior of shadcn and underlying primitives.

Do not remove focus rings.

Restyle them when necessary.

---

## Reduced Motion

Respect:

```css
prefers-reduced-motion
```

Reduced-motion mode must remain fully functional.

Reduce or remove:

- large transforms
- spring travel
- layout movement
- parallax
- decorative animation
- nonessential morphing

Simple opacity changes may remain when appropriate.

Functionality must never depend on an animation completing.

---

# Responsive Design

Responsive layouts should feel intentionally designed for each size.

Do not simply shrink desktop layouts.

On smaller screens:

- simplify dense interfaces
- preserve comfortable touch targets
- reduce unnecessary chrome
- adapt navigation
- avoid horizontal overflow
- reconsider dialog vs sheet behavior
- maintain clear hierarchy

Interaction motion should also adapt to device context.

Do not depend on hover on touch devices.

---

# Performance

Interaction latency is more important than visual sophistication.

Prefer animations using:

- `transform`
- `opacity`

Avoid unnecessarily animating expensive layout properties.

Use JavaScript animation only when it provides behavior CSS cannot reasonably provide.

Prevent:

- layout thrashing
- unnecessary rerenders
- animation-induced hydration issues
- heavy scroll effects
- excessive blur
- animations on hundreds of elements at once

Do not sacrifice responsiveness to preserve an animation.

---

# Implementation Rules

When building or modifying UI:

1. Inspect existing shared components before creating a new one.
2. Use shadcn/ui primitives where suitable.
3. Use Luma styling as the baseline.
4. Preserve product identity.
5. Reuse design tokens.
6. Reuse motion tokens.
7. Use Animate UI only where motion improves UX.
8. Use custom Motion behavior only when needed.
9. Preserve accessibility.
10. Verify mobile behavior.
11. Verify dark mode.
12. Verify reduced motion.
13. Avoid unnecessary abstraction.
14. Avoid isolated arbitrary styling values.
15. Do not change business logic during visual refactors unless required.

---

# Refactoring Existing UI

When migrating an existing screen:

1. Understand the current functionality first.
2. Preserve routing, state, validation, API behavior, and application logic.
3. Identify reusable patterns.
4. Replace common primitives with shadcn/ui equivalents.
5. Consolidate styling into shared tokens and variants.
6. Introduce Animate UI only for meaningful interactions.
7. Remove obsolete component-library styles after migration.
8. Verify that no behavior regressed.

Treat UI migration as a design-system refactor, not an application rewrite.

---

# Anti-Patterns

Avoid the following.

## Visual

- excessive rounded corners
- excessive glassmorphism
- heavy shadows
- excessive gradients
- giant headings without purpose
- unnecessary borders
- cards around every section
- random colors
- arbitrary spacing
- inconsistent control heights

## Motion

- bouncing everywhere
- large hover scaling
- constant floating elements
- large parallax
- animations on every viewport entrance
- long transitions
- motion that delays user actions
- decorative motion with no UX purpose
- unique spring physics for every component
- aggressive page transitions

## Architecture

- duplicating shadcn primitives
- feature-specific versions of identical controls
- large repeated Tailwind class strings
- mixing multiple general-purpose UI libraries
- hardcoded design values throughout feature code
- changing business logic during visual migration without reason

---

# Quality Bar

Before considering a UI change complete, evaluate it against these questions:

- Is feedback immediate?
- Does the interface feel stable?
- Does motion explain a state change?
- Is the animation subtle?
- Does it settle quickly?
- Is spatial continuity preserved?
- Does the interaction feel coherent with the rest of the product?
- Does it work with keyboard navigation?
- Does it work on touch devices?
- Does it respect reduced motion?
- Does it work in light and dark modes?
- Does it remain smooth on lower-powered hardware?
- Does it preserve the product's own identity?
- Is the component built from shared primitives where appropriate?
- Would removing the animation make the interaction harder to understand?

If the answer to the last question is no, strongly consider removing the animation.

---

# Final Design Standard

The interface should not look like an animated website.

It should feel like a carefully engineered product.

The target experience is:

> **precise, tactile, calm, responsive, spatially coherent, restrained, and quietly sophisticated.**

Use shadcn/ui Luma to establish the visual foundation.

Use Animate UI and Motion to create continuity, feedback, and physicality.

Use motion sparingly.

Preserve the application's identity.

Prioritize clarity, responsiveness, accessibility, and consistency over visual novelty.
