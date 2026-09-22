---
name: Alpen Glow
colors:
  surface: '#f9faf7'
  surface-dim: '#d9dad8'
  surface-bright: '#f9faf7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f1'
  surface-container: '#edeeeb'
  surface-container-high: '#e7e8e6'
  surface-container-highest: '#e2e3e0'
  on-surface: '#191c1b'
  on-surface-variant: '#414844'
  inverse-surface: '#2e312f'
  inverse-on-surface: '#f0f1ee'
  outline: '#717974'
  outline-variant: '#c1c8c3'
  surface-tint: '#416656'
  primary: '#002116'
  on-primary: '#ffffff'
  primary-container: '#12372a'
  on-primary-container: '#7ba190'
  inverse-primary: '#a8cfbd'
  secondary: '#3a6753'
  on-secondary: '#ffffff'
  secondary-container: '#bceed3'
  on-secondary-container: '#406d58'
  tertiary: '#2c1700'
  on-tertiary: '#ffffff'
  tertiary-container: '#482a00'
  on-tertiary-container: '#c98c42'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c3ebd8'
  primary-fixed-dim: '#a8cfbd'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#2a4e3f'
  secondary-fixed: '#bceed3'
  secondary-fixed-dim: '#a1d1b8'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#214f3c'
  tertiary-fixed: '#ffddba'
  tertiary-fixed-dim: '#fdb96a'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#663d00'
  background: '#f9faf7'
  on-background: '#191c1b'
  surface-variant: '#e2e3e0'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style

The design system is crafted for a premium, AI-powered tourism platform focused on the Uttarakhand region. It bridges the gap between rugged adventure and high-end serenity. The personality is **Cinematic, Majestic, and Effortless**, designed to evoke the feeling of standing on a mountain peak at dawn.

The aesthetic leans into **Organic Minimalism**—a blend of "Apple-level" cleanliness with a high-touch, editorial feel. It utilizes generous whitespace to allow high-resolution photography of mist-covered forests and snow-capped peaks to breathe. Subtle glassmorphism is employed for navigational layers to mimic the translucent quality of mountain air and ice.

## Colors

The palette is rooted in the natural lifecycle of the Himalayas. 
- **Deep Forest Green** serves as the primary anchor for text and core brand elements, representing stability and depth.
- **Mountain Green** variants provide tonal layering for UI components.
- **Warm Sunrise Gold** is used sparingly as an accent for AI-powered features, call-to-actions, and highlights, mimicking the first light hitting a peak.
- **Earth & Sand** are utilized for secondary backgrounds and dividers to keep the interface feeling grounded and organic rather than clinical.

In Dark Mode, the background shifts to a deep, desaturated green-black (#0D1713) to maintain the "night in the forest" atmosphere while ensuring high-contrast legibility.

## Typography

The typography strategy employs a high-contrast serif/sans-serif pairing. 
- **Playfair Display** is reserved for editorial headings, destination names, and hero sections. It conveys a sense of timeless luxury and storytelling.
- **Plus Jakarta Sans** handles all functional UI, body copy, and navigation. Its soft, modern geometry ensures maximum readability and a contemporary tech feel.

Use "Display" sizes specifically for hero headers over cinematic imagery. "Label" styles should always use increased letter spacing for clarity at small sizes.

## Layout & Spacing

This design system uses a **Fluid 12-Column Grid** for desktop and a **4-Column Grid** for mobile. The layout philosophy emphasizes "The Breathable Frame"—maintaining wide margins (64px+) on desktop to create a premium, gallery-like experience.

Spacing follows a strict 8px base unit. Section-to-section transitions should be expansive (typically 120px on desktop) to reinforce the sense of mountain vastness. Elements should be grouped using proximity, with larger gaps between distinct functional areas to avoid visual clutter.

## Elevation & Depth

Hierarchy is established through **Ambient Depth** and **Tonal Layering**. 
- **Level 1 (Base):** The canvas background (#F4F5F1).
- **Level 2 (Cards):** Surfaces use a subtle "Snow" tint (#F7F8F5) with a 1px border of "Sand" (#E8DDC8) at 40% opacity. 
- **Level 3 (Navigation/Overlays):** Glassmorphism is the signature for floating elements. Use a backdrop blur (20px) with a semi-transparent white or primary-dark fill (80% opacity).
- **Shadows:** Avoid heavy black shadows. Use soft, diffused shadows tinted with the Primary color (e.g., `rgba(18, 55, 42, 0.08)`) with a large blur radius (30px+) and 0px spread to create a natural "lift."

## Shapes

The shape language is defined by **Softened Precision**. UI elements use a standard 0.5rem (8px) radius to maintain a modern, clean look that isn't overly bubbly or aggressive. 

- Large image containers and cards should use `rounded-xl` (1.5rem) to mimic the smooth weathering of river stones.
- Interactive elements like buttons and input fields use `rounded-md` (0.5rem). 
- Avoid full-pill shapes to keep the aesthetic "Apple-level" and professional rather than casual.

## Components

### Buttons
- **Primary:** Deep Forest Green background, white text. Solid, no gradient.
- **Secondary:** Transparent background, 1.5px border of Deep Forest Green.
- **AI-Action:** Warm Sunrise Gold background with white or dark-green text. Used exclusively for "AI Recommendations" or "Plan My Trip."

### Cards
- Cards feature a 1px interior stroke. Images within cards should have a subtle darkening overlay (20%) at the bottom to ensure white text overlay legibility for destination names.

### Input Fields
- Understated design. A simple 1px "Sand" border that transitions to "Mountain Green" on focus. Use Plus Jakarta Sans for all placeholder and input text.

### Navigation (The Mist Bar)
- The header should be a floating glassmorphic container with rounded-lg corners, centered at the top of the viewport with a subtle shadow.

### Chips/Tags
- Small, uppercase labels with a Sand background and Earth-colored text. Used for "Trekking," "Luxury," or "Spiritual" categories.