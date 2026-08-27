---
name: Protocol Neo
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#bccac1'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#87948c'
  outline-variant: '#3d4943'
  surface-tint: '#6adbb1'
  primary: '#6adbb1'
  on-primary: '#003828'
  primary-container: '#29a37d'
  on-primary-container: '#003122'
  inverse-primary: '#006c50'
  secondary: '#ffb4aa'
  on-secondary: '#690003'
  secondary-container: '#c5020b'
  on-secondary-container: '#ffd2cc'
  tertiary: '#30e0a1'
  on-tertiary: '#003825'
  tertiary-container: '#00a573'
  on-tertiary-container: '#00311f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#87f7cc'
  primary-fixed-dim: '#6adbb1'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#00513b'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4aa'
  on-secondary-fixed: '#410001'
  on-secondary-fixed-variant: '#930005'
  tertiary-fixed: '#59febb'
  tertiary-fixed-dim: '#30e0a1'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005237'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-base:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  gutter: 1rem
  margin: 1.5rem
  max-width: 1440px
---

## Brand & Style

This design system is engineered for a high-performance programming education platform, drawing inspiration from high-frequency trading interfaces and terminal environments. The brand personality is technical, precise, and authoritative, designed to make the user feel like they are "plugged into the mainframe."

The aesthetic blends **Corporate Modern** structure with **Glassmorphism** and **Minimalist** efficiency. It prioritizes data density and code legibility while maintaining a premium, fintech-inspired polish. Visual interest is generated through light-emissive accents against ultra-dark voids, using transparency and subtle borders to define hierarchy rather than heavy shadows.

## Colors

The palette is anchored in an ultra-dark environment to reduce eye strain during long coding sessions.

- **Primary (Tether Green):** Used for primary actions, progress indicators, and successful state feedback. It acts as the "go" signal.
- **Secondary (Signal Red):** Reserved for urgent alerts, critical errors, and "hot" status badges.
- **Tertiary (Neon Mint):** High-energy hover states and active focus indicators.
- **Neutral (Slate):** Balanced grey for secondary information and meta-data to maintain focus on primary content.
- **Surfaces:** Utilize a deep charcoal base with a 1px semi-transparent white border to simulate depth without traditional shadows.

## Typography

The typography system relies on **Inter** for its neutral, highly legible character in UI applications, paired with **JetBrains Mono** for code snippets and technical metadata.

- **Headlines:** Should be bold and tightly tracked for a compact, professional look.
- **Body Text:** Uses a comfortable line height to ensure readability in documentation and tutorials.
- **Labels:** Small caps are utilized for category headers and navigation labels to create clear visual separation from body content.
- **Code:** All technical input and output must use JetBrains Mono to ensure character distinction (e.g., 0 vs O).

## Layout & Spacing

This design system uses a **Fluid Grid** model with a base-4 spacing rhythm. 

- **Desktop (1440px+):** 12-column grid, 24px gutters, 64px side margins.
- **Tablet (768px - 1439px):** 8-column grid, 16px gutters, 32px side margins.
- **Mobile (<767px):** 4-column grid, 12px gutters, 16px side margins.

Containers should maximize horizontal space to accommodate code side-by-side with instructional text. Padding within surface cards is strictly 24px (lg) to maintain a spacious, professional feel.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Glassmorphism** rather than traditional elevation.

1.  **Level 0 (Base):** Ultra-dark background (#0A0D0E).
2.  **Level 1 (Surfaces):** Deep charcoal (#121619) with a 1px `border_glass`. This is the standard for cards and sidebars.
3.  **Level 2 (Overlays):** Modals and dropdowns use the same surface color but add a 20px backdrop blur and a slightly higher border opacity (12%) to "float" above the content.

Shadows, if used at all, should be extremely subtle, long-range, and low opacity (5-8%), functioning as ambient occlusion rather than light-source shadows.

## Shapes

The shape language is "Technical Geometric." 

- **Standard Elements:** Buttons, inputs, and cards use a base 8px (0.5rem) radius.
- **Large Containers:** Educational modules and hero sections use 16px (1rem).
- **Control Elements:** Checkboxes and radio buttons maintain sharp corners (2px) to emphasize the precision-tool nature of the platform.

All borders must be 1px wide. Icons should be drawn with a 2px stroke width and sharp terminal points to match the typography.

## Components

- **Buttons:** 
    - *Primary:* Solid #26A17B background, white text. No shadow, but a 2px glow on hover using #00D092.
    - *Secondary:* Ghost style with 1px `border_glass` and slate text.
- **Inputs:** 
    - Dark background (#0A0D0E) with 1px `border_glass`. On focus, the border transitions to #26A17B with a subtle inner glow. 
    - Error state: Border changes to #FF3B30.
- **Chips/Badges:** 
    - Small, rectangular with 4px rounding. 
    - Status "Live": Pulse animation on a 6px green dot.
- **Cards:** 
    - Use the Level 1 surface. Content should be padded 24px. Header sections within cards should be separated by a 1px `border_glass` horizontal line.
- **Progress Bars:** 
    - 4px height, background #121619, fill #26A17B. For high-stakes milestones, use a subtle "scanning" animation across the fill.
- **Syntax Highlighter:** 
    - Use a custom theme matching the UI: Comments in Slate, Keywords in Tether Green, Strings in a pale mint.