---
name: Diplomatic Summit
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#4c5f81'
  primary: '#000d23'
  on-primary: '#ffffff'
  primary-container: '#0d2342'
  on-primary-container: '#778baf'
  inverse-primary: '#b3c7ee'
  secondary: '#00658e'
  on-secondary: '#ffffff'
  secondary-container: '#4cc1ff'
  on-secondary-container: '#004c6c'
  tertiary: '#1a0900'
  on-tertiary: '#ffffff'
  tertiary-container: '#3a1b00'
  on-tertiary-container: '#d17200'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b3c7ee'
  on-primary-fixed: '#041b3a'
  on-primary-fixed-variant: '#344768'
  secondary-fixed: '#c7e7ff'
  secondary-fixed-dim: '#83cfff'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#004c6c'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: 0em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 26px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system projects multilateral gravitas, institutional prestige, and youthful intellectual rigor. Built for the 25th anniversary session of BIMUN, the aesthetic bridges the classical heritage of international diplomacy with the energetic clarity of collegiate summits like HNMUN and NAIMUN.

Visual tone combines:
- **Diplomatic Modernism:** Crisp layouts, high-contrast structural grids, and razor-sharp typographic hierarchy replace bureaucratic clutter.
- **Editorial Distinction:** Classical serif authority juxtaposed against architectural, hyper-legible sans-serif interface elements.
- **Academic Prestige:** Deep naval blues balanced by brilliant UN cyan focal points and rich warm-gold insignia cues that denote ceremonial protocol, committee tiers, and award statuses.

The resulting interface evokes the solemnity of the UN General Assembly Hall paired with the functional precision of real-time parliamentary debate tools.

## Colors

The palette balances institutional authority with dynamic accents:

- **Primary (`#0D2342`):** Diplomatic UN Navy. Serves as the anchor for primary navigation, main headings, structural bars, and dominant card surfaces in reversed modes.
- **Secondary (`#009EDB`):** UN Cyan Blue. Employs the quintessential hue of international peacekeeping. Used strictly for interactive callouts, active tab indicators, key interactive triggers, and global status accents.
- **Tertiary (`#D97706`):** Warm Amber Gold. Represents ceremonial excellence, anniversary heraldry, dais credentials, resolution milestones, and passing-grade badge accents.
- **Neutral (`#64748B`):** Muted Slate. Regulates secondary metadata, inactive iconography, structural dividers (`#E2E8F0`), and background canvases (`#F8FAFC`).

Surfaces are rooted in crisp white (`#FFFFFF`) with alternating soft cool slate backgrounds (`#F8FAFC`) to maintain high contrast and clarity during high-intensity caucus sessions.

## Typography

The typographical hierarchy creates an intentional editorial contrast:

- **Editorial Headings (`Playfair Display`):** Used for commemorative displays, committee names, resolution titles, and section leaders. It imbues institutional prestige and literary substance.
- **Interface & Operational Text (`Plus Jakarta Sans`):** Selected for its geometric clarity and open counters. Carries body copy, parliamentary timers, speakers lists, working papers, and interactive components with zero ambiguity.
- **All-Caps Micro Labels (`label-sm`, `label-md`):** Reserved for delegation countries, committee abbreviations (e.g., UNSC, DISEC, SOCHUM), and caucus status indicators to reinforce diplomatic filing standards.

## Layout & Spacing

The structural layout relies on a balanced 12-column responsive fluid grid with generous outer margins to simulate official multilateral documents and high-level briefing sheets.

### Breakpoints & Reflow
- **Desktop (1024px+):** 12 columns, `1.5rem` gutter, `3rem` canvas margin. Max-width container capped at `1280px` for optimal reading comfort.
- **Tablet (768px – 1023px):** 8 columns, `1.5rem` gutter, `2rem` margin. Committee directories and secretariat profiles reflow from 3-column arrays into 2-column configurations.
- **Mobile (below 768px):** 4 columns, `1rem` gutter, `1.25rem` margin. Complex data modules (speakers list timers, draft resolution clauses) reflow into stacked single-column viewports with persistent sticky command bars.

## Elevation & Depth

Visual hierarchy uses clean multi-layered planes, subtle borders, and delicate ambient light dispersal:

- **Resting Canvas:** Pure `#F8FAFC` base surface layered beneath elevated crisp white (`#FFFFFF`) containers.
- **Tonal Borders:** Every card, list group, and header utilizes a razor-thin structural outline (`1px solid #E2E8F0`) to ensure legibility across all ambient lighting conditions in committee rooms.
- **Diplomatic Shadow Architecture:**
  - *Level 1 (Cards, Action Chips):* `0 1px 3px rgba(13, 35, 66, 0.05), 0 1px 2px rgba(13, 35, 66, 0.03)`
  - *Level 2 (Hovered Cards, Dropdowns, Timers):* `0 8px 24px -4px rgba(13, 35, 66, 0.08), 0 4px 8px -2px rgba(13, 35, 66, 0.04)`
  - *Level 3 (Modals, Crisis Flash Bulletins):* `0 20px 32px -8px rgba(13, 35, 66, 0.16), 0 8px 16px -4px rgba(13, 35, 66, 0.08)`
- **Atmospheric Accents:** Key executive cards utilize a faint secondary color gradient overlay (`linear-gradient(135deg, rgba(0, 158, 219, 0.03) 0%, rgba(217, 119, 6, 0.03) 100%)`) over pure white.

## Shapes

The design system maintains a refined, tailored shape language (`roundedness: 1` / Soft). This keeps cards, containers, and data blocks structured and architectural (`0.25rem` to `0.5rem`), reflecting academic sobriety.

Pill shapes (`rounded-full`) are strictly reserved for:
- Diplomatic status tags (e.g., "Voting", "Moderated Caucus").
- Delegation flag badges and country pills.
- Quick-filter chips and secondary floating triggers.

## Components

### Buttons
- **Primary:** Diplomatic Navy background (`#0D2342`), crisp white label (`label-lg`), `0.25rem` radius, subtle lift on hover with `background: #09172B`.
- **Secondary (UN Cyan):** Vibrant cyan background (`#009EDB`), white label, for direct primary actions (e.g., "Submit Draft Resolution", "Register Delegation").
- **Outline / Parliamentary:** Border `1px solid #CBD5E1`, text `#0D2342`, background transparent. Hover transforms to `#F1F5F9`.

### Badges & Status Chips
- Fully rounded pill containers (`height: 24px` to `28px`).
- **Anniversary / Award Badge:** Gold tint background (`#FEF3C7`), text `#92400E`, border `1px solid #FCD34D`.
- **Active Session / Quorum Badge:** Cyan tint (`#E0F2FE`), text `#0369A1`, border `1px solid #BAE6FD`.
- **Crisis / Urgent Alert Badge:** Coral red tint (`#FEE2E2`), text `#991B1B`, border `1px solid #FECACA`.

### Committee Cards
Structured with `1px solid #E2E8F0` on white surfaces:
- Header contains bilingual title (English / Spanish), UN organ acronym pill, and topic agenda code.
- Centered focal block with stylized topic photography and UN crest/flag watermarks.
- Bottom metadata row featuring dais members, delegate capacity status, and a direct button to download the study guide.

### Parliamentary Timers & Caucus Displays
- Monolithic numeric readouts set in high-contrast `Plus Jakarta Sans` bold.
- Bordered in `#0D2342` with an ambient glow when speech limits dip below 15 seconds.
- Integrated speaker queue list items with drag-order indicators and delegate national flags.

### Input Fields & Search Bars
- Background `#FFFFFF`, border `1px solid #CBD5E1`, padding `space-sm space-md`.
- Active focus transitions border to UN Cyan (`#009EDB`) with a soft glow `box-shadow: 0 0 0 3px rgba(0, 158, 219, 0.15)`.

### Secretariats & Dais Profiles
- Clean architectural grid featuring institutional portraits framed in soft `0.25rem` roundedness.
- Name rendered in `Playfair Display`, designation in uppercase `label-sm` with gold accent divider.