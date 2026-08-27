---
name: Protocol Neo Light
colors:
  surface: '#FFFFFF'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#3d4943'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a73'
  outline-variant: '#bccac1'
  surface-tint: '#006c50'
  primary: '#00694e'
  on-primary: '#ffffff'
  primary-container: '#008563'
  on-primary-container: '#f5fff8'
  inverse-primary: '#6adbb1'
  secondary: '#bc0009'
  on-secondary: '#ffffff'
  secondary-container: '#e2241e'
  on-secondary-container: '#fffbff'
  tertiary: '#006948'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855c'
  on-tertiary-container: '#f5fff7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#87f7cc'
  primary-fixed-dim: '#6adbb1'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#00513b'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4a9'
  on-secondary-fixed: '#410001'
  on-secondary-fixed-variant: '#930005'
  tertiary-fixed: '#7afac1'
  tertiary-fixed-dim: '#5cdda6'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005237'
  background: '#F8FAFC'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
  heading: '#0F172A'
  border-soft: '#E2E8F0'
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
    fontFamily: jetbrainsMono
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
  gutter-desktop: 1.5rem
  margin-desktop: 4rem
  max-width: 1440px
---

## Brand & Style

This design system is a high-clarity evolution of the original dark-mode technical interface, pivotally adapted for a **Corporate Modern** light-mode environment. It retains its fintech and developer-centric roots, moving from a "terminal" feel to a "clean-room" aesthetic. The brand personality is professional, transparent, and authoritative, emphasizing precision and trust.

The visual style is characterized by **Minimalism** and **Tactile** subtlety. It moves away from emissive glows and glassmorphism toward a system of structured tonal layers, crisp slate borders, and intentional use of whitespace. The interface should feel like a high-end financial instrument: light, responsive, and meticulously organized.

## Colors

The color palette shifts to a high-contrast light environment to maximize readability and reduce visual fatigue in well-lit workspaces.

- **Primary (Tether Green):** The core brand color, used for primary calls-to-action, success states, and key navigational highlights.
- **Secondary (Signal Red):** Reserved for high-priority alerts, destructive actions, and critical data points.
- **Surface & Background:** The foundation uses a subtle off-white (#F8FAFC) for the background to reduce glare, while interactive surfaces use pure white (#FFFFFF) to create a clear visual hierarchy.
- **Typography:** Headings are rendered in a deep dark navy (#0F172A) for maximum impact, while body text uses a softer slate grey (#475569) to maintain a comfortable reading experience.

## Typography

The system utilizes **Inter** for its neutral, highly legible character across all UI applications, ensuring a professional and systematic appearance. **JetBrains Mono** is strictly reserved for technical data and code blocks.

- **Headlines:** Use tight letter spacing and heavy weights to anchor the page.
- **Body:** Standardized on a 16px base for optimal information density without sacrificing clarity.
- **Small Caps:** Use `label-caps` for metadata, category tags, and overlines to create a distinct secondary hierarchy level.
- **Technical Content:** All monospaced text should leverage the distinct character shapes of JetBrains Mono to prevent confusion between similar characters like `0` and `O`.

## Layout & Spacing

This design system adheres to a **Fluid Grid** model with a 4px base-unit spacing rhythm.

- **Desktop (1440px+):** 12-column grid with 24px gutters and wide 64px margins to allow content to breathe.
- **Tablet (768px - 1439px):** 8-column grid with 16px gutters and 32px margins.
- **Mobile (<767px):** 4-column grid with 12px gutters and 16px margins.

Spacing should be generous between sections to emphasize the minimalist aesthetic. Internal card padding is standardized at 24px (`lg`) to ensure that dense technical information does not feel cluttered.

## Elevation & Depth

In light mode, the system replaces transparency with **Tonal Layers** and **Ambient Shadows** to define the Z-axis.

- **Level 0 (Base):** The #F8FAFC background layer.
- **Level 1 (Default Surface):** Pure white cards using a soft 1px border (#E2E8F0).
- **Level 2 (Raised):** Used for hover states on interactive cards. Includes a subtle, diffused shadow: `0 4px 12px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Overlay):** Modals and dropdowns use a more pronounced shadow for clear separation: `0 12px 32px rgba(15, 23, 42, 0.1)`.

Avoid heavy gradients; depth should be felt through clean lines and soft transitions in elevation.

## Shapes

The shape language is "Technical Geometric," balancing approachability with professional rigor.

- **Standard Elements:** 8px (0.5rem) radius for buttons, inputs, and cards.
- **Large Containers:** 16px (1rem) for major content sections or educational modules.
- **Precision Elements:** 2px or 4px radius for checkboxes and internal status badges to maintain a crisp, industrial feel.

Borders are consistently 1px. Icons should utilize a 2px stroke with slightly rounded caps to match the `roundedness: 2` logic of the buttons.

## Components

- **Buttons:** 
    - *Primary:* Solid #26A17B background with white text. On hover, the color deepens slightly. 
    - *Secondary:* White background with a 1px #E2E8F0 border and #475569 text.
- **Inputs:** 
    - Pure white background with a 1px #E2E8F0 border. On focus, the border transitions to #26A17B with a 2px soft outer glow in the same color (20% opacity).
- **Cards:** 
    - White surface, 1px #E2E8F0 border. Header sections should be separated by a subtle 1px horizontal rule of the same color.
- **Chips/Badges:** 
    - Rectangular with 4px rounding. Use light tinted backgrounds (e.g., 10% primary color) with high-contrast text.
- **Progress Bars:** 
    - 6px height, background #E2E8F0, fill #26A17B.
- **Lists:** 
    - Items should be separated by thin 1px lines (#E2E8F0), with 12px vertical padding to ensure high touch/click targets.