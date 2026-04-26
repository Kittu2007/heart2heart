---
name: BOND Relationship OS
colors:
  surface: '#f9f9f7'
  surface-dim: '#dadad8'
  surface-bright: '#f9f9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#5b4041'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#8f6f71'
  outline-variant: '#e3bdbf'
  surface-tint: '#bc0b3b'
  primary: '#b90538'
  on-primary: '#ffffff'
  primary-container: '#dc2c4f'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb2b7'
  secondary: '#5f5e60'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfe1'
  on-secondary-container: '#636264'
  tertiary: '#5c5b5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#757476'
  on-tertiary-container: '#fffcfe'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdadb'
  primary-fixed-dim: '#ffb2b7'
  on-primary-fixed: '#40000d'
  on-primary-fixed-variant: '#92002a'
  secondary-fixed: '#e5e2e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1b1b1d'
  on-secondary-fixed-variant: '#474648'
  tertiary-fixed: '#e4e2e4'
  tertiary-fixed-dim: '#c8c6c8'
  on-tertiary-fixed: '#1b1b1d'
  on-tertiary-fixed-variant: '#474649'
  background: '#f9f9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e1'
typography:
  display:
    fontFamily: Inter
    fontSize: 80px
    fontWeight: '900'
    lineHeight: '1.05'
    letterSpacing: -0.04em
  h1:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 19px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  button:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: -0.01em
  label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 64px
  margin: max(20px, 5vw)
  gutter: 20px
---

## Brand & Style
BOND is a high-end, relationship-focused platform that blends the polished utility of a productivity suite with the warmth of a personal connection app. The design style is **Apple-inspired Modernism** with a heavy emphasis on **Glassmorphism** and **Tactile Minimalism**.

The brand personality is intimate yet professional, using a "Digital Sanctuary" approach. The UI evokes a sense of calm, precision, and affection through a soft warm-tinted color palette, generous whitespace, and fluid, interactive components. Visual weight is carried by high-quality typography and subtle depth rather than heavy ornamentation.

## Colors
The palette is rooted in a warm "Living White" spectrum, moving away from sterile grays toward soft rose and cream undertones. 

- **Primary:** A vibrant Rose-500 (#F43F5E) used for calls to action, progress indicators, and emotive highlights.
- **Surface Strategy:** Layers are built using varying levels of Rose-tinted whites (`surface-container` variants) to create a soft, nested hierarchy.
- **Background:** A dual-tone linear gradient (`#FFF5F5` to `#FFFBF0`) provides a sophisticated, paper-like warmth that prevents the interface from feeling cold.
- **Typography:** Deep Onyx (#1D1D1F) for high-contrast readability, with a Muted Stone (#86868B) for secondary metadata.

## Typography
The system utilizes **Inter** for its utilitarian precision, though it is styled with extreme character tracking and tight line heights to mimic high-end editorial layouts. 

- **Display & Headlines:** Feature aggressive negative letter-spacing and heavy weights (700-900) to create a dominant visual anchor.
- **Body:** Standardized at 16px and 19px for optimal legibility within dense information cards.
- **Labels:** Uppercase with wide tracking is reserved for group headers and category identifiers to provide structural rhythm.
- **Smoothing:** `-webkit-font-smoothing: antialiased` must be applied globally to maintain the refined, thin-stroke appearance of Inter.

## Layout & Spacing
The system uses a **Bento Grid** philosophy for the dashboard, combined with a **Fixed-Max Fluid** layout for the canvas. 

- **Max Width:** The primary content container is capped at 1200px.
- **Grid:** A 12-column underlying structure that collapses into a 1-column stack on mobile. Gutters are fixed at 20px to maintain a tight, integrated look.
- **Padding:** Outer page margins use a dynamic `5vw` to ensure the content breathes on large displays, while internal card padding is generous (minimum 24px-32px).

## Elevation & Depth
Depth is achieved through **Ambient Shadows** and **Glassmorphism** rather than traditional elevation levels.

- **The "Apple Card":** Pure white surfaces with a very soft, diffused shadow (`0 4px 24px rgba(0, 0, 0, 0.04)`). On hover, shadows expand to `0 8px 32px rgba(0, 0, 0, 0.08)` and the card may subtly scale.
- **Blur Effects:** Navigation bars and floating menus utilize `backdrop-blur(20px)` with a semi-transparent white background (`white/70`).
- **Tonal Depth:** Inner sections within cards (like mood selectors) use recessed `surface-container` backgrounds to create "wells" of depth without using shadows.
- **Gradients:** Subtle primary-tinted radial gradients (e.g., `primary/5`) are used as decorative background glows behind key data points.

## Shapes
The shape language is extremely organic and "squircle" based. 

- **Cards:** Use a large `24px` (1.5rem) radius to feel friendly and approachable.
- **Buttons & Pills:** Full `9999px` rounding for primary actions and toggles.
- **Inner Elements:** Nested components like progress bars or status icons use a `rounded-full` or `rounded-xl` (12-16px) style to follow the outer container's curvature.
- **Borders:** Ultra-thin (1px) with low opacity (`outline/10` or `outline/5`) are used to define edges where shadows are insufficient.

## Components
- **Primary Buttons:** Capsule-shaped with a vibrant Rose gradient. They feature a `0.95` scale transform on active state for tactile feedback.
- **Secondary Buttons:** Ghost-style or semi-transparent white backgrounds with light borders and subtle `surface-container-low` hover states.
- **Bento Cards:** The core container. Must include a thin border, the "apple-card" shadow, and internal padding of `xl` (32px).
- **Segmented Control:** A "sliding thumb" indicator style. A container with a recessed background where the active state is a white floating pill with its own shadow.
- **Grouped Lists:** iOS-style grouped settings. Rounded containers with `1px` dividers that have a `68px` left-margin inset to clear the icon space.
- **Progress Bars:** Thick, vertical or horizontal pills. Use gradient fills and high-glow shadows for "active" or "perfect" scores.
- **Iconography:** Use **Material Symbols Outlined** with a weight of 400. Emotive icons (favorites, moods) should use the "Fill" variation to draw focus.