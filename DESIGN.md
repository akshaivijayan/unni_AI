# Design System Document: The Intelligence of Space

## 1. Overview & Creative North Star: "The Digital Architect"
The Creative North Star for this design system is **The Digital Architect**. In a world of cluttered productivity tools, this system acts as a silent, high-end concierge. It moves away from the "app-in-a-box" aesthetic toward a **High-End Editorial** experience. 

We achieve this through **Organic Precision**: a layout strategy that favors intentional asymmetry, extreme breathing room (whitespace), and tonal depth over rigid borders. The interface should feel like it was "composed" by an AI rather than "built" on a grid—fluid, intelligent, and unobtrusive. By using dramatic typography scales and overlapping surface layers, we create a sense of focused calm that empowers professional efficiency.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is built on a foundation of deep, intelligent blues and vibrant teals, designed to feel both authoritative and energetic.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or layout containment. 
*   **How to define boundaries:** Use background color shifts. A `surface-container-low` (#f2f3ff) section sitting on a `surface` (#faf8ff) background creates a sophisticated edge without the visual noise of a line.
*   **Surface Hierarchy:** Treat the UI as stacked sheets of fine paper. Use `surface-container-lowest` (#ffffff) for the most prominent foreground elements (like active task cards) to create a natural, soft lift.

### The "Glass & Gradient" Rule
To signal "AI-Powered" capabilities, move beyond flat fills:
*   **Signature Gradients:** Use a subtle linear gradient from `primary` (#0048e1) to `primary_container` (#3063ff) for primary CTAs and hero headers. This adds "soul" and a sense of movement.
*   **Glassmorphism:** For floating menus or AI-assist panels, use `surface_bright` (#faf8ff) at 70% opacity with a `20px` backdrop-blur. This allows the primary brand colors to bleed through softly, ensuring the UI feels integrated and high-end.

---

## 3. Typography: Editorial Authority
The system pairs **Manrope** (Display/Headline) for a modern, geometric character with **Inter** (Body/Title) for surgical legibility.

*   **Display Scale (`display-lg` 3.5rem):** Reserved for empty states or "Productivity Pulses." This is your editorial moment. Use high-contrast sizing to create an "asymmetric anchor" on the page.
*   **Headline Scale (`headline-sm` 1.5rem):** Used for primary module titles. Pair this with generous top-margin (`spacing-12`) to allow the eye to rest.
*   **Body & Labels:** `body-md` (0.875rem) is the workhorse. It must always be set in `on_surface_variant` (#424656) to reduce eye strain, while `title-sm` (1rem) in `on_surface` (#131b2e) is used for active content to create hierarchy.

---

## 4. Elevation & Depth: The Layering Principle
We reject traditional drop shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking" the surface tiers. 
    *   *Example:* Place a `surface-container-lowest` card on top of a `surface-container-low` sidebar. The slight shift in hex code is enough to signal a change in elevation.
*   **Ambient Shadows:** If a floating element (like a Modal or AI Command Bar) requires a shadow, it must be "Ambient." 
    *   **Blur:** 40px - 60px.
    *   **Opacity:** 6%.
    *   **Color:** Use a tint of `on_surface` (#131b2e) rather than pure black.
*   **The "Ghost Border" Fallback:** If accessibility demands a border, use `outline_variant` (#c2c6d8) at **15% opacity**. Anything higher is considered "visual clutter" and must be removed.

---

## 5. Components: Precision Utilitarianism

### Buttons & Chips
*   **Primary Button:** Gradient-fill (`primary` to `primary_container`), `rounded-lg` (0.5rem). Use `label-md` for text, all-caps with 0.05em letter spacing for an "AI-Command" feel.
*   **Chips:** Use `secondary_container` (#6cf8bb) with `on_secondary_container` (#00714d) for "Active" states. Use `surface_container_high` for inactive states. **No borders.**

### Input Fields & Search
*   **The "Floating Input":** Instead of a boxed field, use a `surface_container_highest` fill with a `rounded-md` corner. On focus, transition the background to `surface_container_lowest` and apply a subtle `primary` ghost-border (15% opacity).
*   **AI Command Bar:** A center-aligned, floating bar using the Glassmorphism rule. Use `display-sm` for the input text to emphasize the importance of the user's intent.

### Cards & Lists
*   **List Items:** Forbid the use of divider lines. Separate tasks using `spacing-2` of vertical white space.
*   **Task Cards:** Use `surface_container_lowest`. When "Completed," transition the background to `surface_dim` (#d2d9f4) and reduce the opacity of the text—creating a visual "receding" effect.

### AI Suggestion Engine (Custom Component)
*   **The "Pulse" Card:** A card that uses a very subtle animated gradient border (rotating `primary` to `secondary`) to signify an AI-generated insight. This is the only exception to the "No-Line" rule.

---

## 6. Do's and Don'ts

### Do
*   **DO** use white space as a structural element. If a layout feels "off," add more space (`spacing-16` or `spacing-20`) rather than adding a line.
*   **DO** use `surface_container_low` for large background areas to make `surface_container_lowest` elements "pop."
*   **DO** keep typography left-aligned for editorial consistency, even in asymmetric layouts.

### Don't
*   **DON'T** use pure black (#000000) for text. Use `on_surface` (#131b2e) to maintain a premium, ink-like feel.
*   **DON'T** use `rounded-none` or `rounded-sm`. Productivity should feel fluid; stick to `rounded-md` (0.375rem) or `rounded-lg` (0.5rem).
*   **DON'T** clutter the top navigation. If it isn't a primary action, move it to a "secondary" glassmorphic sidebar or a hidden "Command Center."