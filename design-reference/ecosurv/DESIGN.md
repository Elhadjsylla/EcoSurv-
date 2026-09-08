---
name: EcoSurv
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006229'
  on-tertiary: '#ffffff'
  tertiary-container: '#007e37'
  on-tertiary-container: '#c1ffc5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  metric-numeral:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  layout-margin-mobile: 1rem
  layout-margin-tablet: 1.5rem
  layout-margin-desktop: 2rem
  layout-max-width: 1600px
  sidebar-width-expanded: 280px
  sidebar-width-collapsed: 72px
---

## Brand & Style

The design system embodies an institutional, precise, and highly dependable B2B administrative platform tailored for private primary, secondary, and higher-education institutions in Mauritania. It delivers total clarity in school tuition monitoring, ledger reconciliation, and guardian billing. 

The emotional signature is one of rigorous financial stewardship, structural order, and executive calm. School directors, bursars, and administrative secretaries must feel confident that every record, balance sheet, and receipt is exact.

### Design Movement: Modern Institutional Corporate
- **Structural Integrity:** Crisp horizontal metrics, strict alignment, and modular data containers inspired by modern Swiss corporate systems and enterprise financial dashboards.
- **Abstract & Anonymized Representation:** Strictly no photographs of human faces or individuals. Identity is communicated via programmatic monograms (initials seated in solid or tinted circular badges) and precise, dual-tone or monochromatic line iconography.
- **Information Density:** Optimized for tabular ledger scans, high-volume student rosters, and real-time transaction reconciliation, prioritizing legibility and scannability over ornamental flourish.
- **Language & Localization:** Built strictly around standard French administrative terminology (`Frais de scolarité`, `Échéancier`, `Impayés`, `Reçu d'encaissement`) with monetary metrics formatted in Mauritanian Ouguiya (`MRU`), enforcing standard French digit grouping (e.g., `45 000 MRU`).

## Colors

The color architecture is calibrated for high-clarity financial tracking in daylight office environments. Backgrounds remain ultra-crisp using calibrated slate whites, ensuring long-session readability without eye fatigue.

### Palette Roles & Values
- **Primary (`#2563EB` - Bleu Institutionnel):** Anchor for primary actions, current view highlights, active states, key financial totals, and progress status.
- **Secondary (`#0F172A` - Bleu Nuit Profond):** Used for primary typography, authoritative column headers, modal titles, and navigation structures. Ensures decisive contrast against all light backgrounds.
- **Tertiary / Success (`#22C55E` - Vert Règlement):** Strictly dedicated to fully settled tuitions (`Réglé`), validated transactions, and verified bank deposits.
- **Alert / Overdue (`#EF4444` - Rouge Retard):** Reserved for unpaid overdue balances (`En retard`), payment defaults, and critical administrative warnings.
- **Warning / Pending (`#F59E0B` - Ambre En Attente):** Indicates partial payments (`Partiel`) or pending bank confirmations.
- **Neutral Canvas (`#FFFFFF`, `#F8FAFC`, `#F1F5F9`):** 
  - Canvas / Foundation: `#F8FAFC`
  - Elevated Cards / Data Surfaces: `#FFFFFF`
  - Subtle Insets & Header Bars: `#F1F5F9`
- **Structural Borders (`#E2E8F0`):** Hairline demarcations between financial columns, card perimeters, and input boundaries.
- **Muted Text (`#64748B`):** Secondary metadata, helper microcopy, timestamps, and table field labels.

## Typography

Inter serves as the sole typographic engine, deployed with strict tabular numeral features (`tnum`, `cv05`) to ensure financial tables align seamlessly down decimal and unit columns.

### Type Roles & Financial Legibility
- **Currency & Metric Formatting:** Numeric amounts are rendered in `Inter` with tabular figures activated. In French locale, the non-breaking thin space is used as the thousand separator, followed by a non-breaking space and the currency acronym `MRU` (e.g., `120 000 MRU`).
- **Headings & Page Headers:** Set in bold weights (`700`) with tight letter spacing (`-0.02em`) to communicate authority and administrative certainty.
- **Labels & Table Column Headers:** Rendered in `label-sm` or `label-md` using uppercase or title case with slight positive tracking (`+0.02em` to `+0.03em`), paired with slate color `#64748B` to establish hierarchy over values.

## Layout & Spacing

The layout model is anchored by a persistent vertical navigation shell coupled with a fluid, containerized grid system that expands up to a maximum constrained width of `1600px`.

### Shell Architecture & Grid
- **Desktop (>= 1280px):** 12-column grid system with `1.5rem` (`24px`) gutters and `2rem` (`32px`) margins. Fixed-left administrative sidebar (`280px`), fixed-top institutional header (`64px`), and a fluid main dashboard panel.
- **Tablet (768px - 1279px):** 8-column layout with `1rem` (`16px`) gutters and `1.5rem` (`24px`) outer margin. The sidebar collapses into an icon-only rail (`72px`) or sheet overlay.
- **Mobile (< 768px):** Single-column stack with `1rem` (`16px`) margins. Tables collapse into structured key-value summary cards. Top header houses drawer trigger and critical school switcher.

### Spacing Rhythm
Every layout gap, padding rule, and margin derives from an 8-point base module (with 4px increments used strictly for dense data rows and input insets). Tables utilize compact vertical row padding (`0.625rem` / `10px`) to maximize the visible roster count above the fold.

## Elevation & Depth

This design system eschews theatrical lighting, thick drop shadows, and glassmorphic blurs in favor of crisp structural borders and flat, low-contrast utility planes.

### Depth Hierarchy
- **Level 0 (App Canvas):** `#F8FAFC` — Base background for the overall workspace.
- **Level 1 (Data Surfaces & Tables):** `#FFFFFF` — Primary white card containers, bound by a crisp border `1px solid #E2E8F0`. No shadow.
- **Level 2 (Hovered Rows & Interactive Items):** Background shift to `#F1F5F9` with a subtle elevation: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
- **Level 3 (Dropdowns & Popovers):** `#FFFFFF` surface with `1px solid #CBD5E1` and a disciplined ambient shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 4 (Modals & Billing Dialogs):** Centered `#FFFFFF` dialog elevated with `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`, framed by a solid `1px solid #CBD5E1` outline and backed by a `#0F172A` backdrop dimmed at 40% opacity.

## Shapes

The geometric structure relies on soft, low-radius curvature (Level 1 - Soft) to project administrative precision, architectural discipline, and density. Rounded pills are used exclusively for small status indicators and student initial monograms.

### Geometry Specifications
- **Cards, Tables, and Data Containers:** `0.5rem` (`8px`) border radius (`rounded-lg`).
- **Buttons, Form Controls, and Search Inputs:** `0.375rem` (`6px`) border radius (`rounded-md`).
- **Status Badges & Pill Chips:** Full circular radius (`9999px`) for compact state identification (`Payé`, `En retard`, `Échelonné`).
- **Student & Staff Monograms:** Strict circles (`rounded-full`) containing initials. Never employ angled squircles or photographic crop masks.

## Components

### Buttons
- **Primary:** Background `#2563EB`, text `#FFFFFF`, height `38px`, horizontal padding `16px`, font weight `600`. Hover state `#1D4ED8`. Active state `#1E40AF`.
- **Secondary / Outline:** Background `#FFFFFF`, border `1px solid #E2E8F0`, text `#0F172A`. Hover state `#F8FAFC` with border `#CBD5E1`.
- **Destructive:** Background `#EF4444`, text `#FFFFFF`. Hover state `#DC2626`. Used for irreversible actions such as payment annulment.
- **Ghost / Neutral:** Background transparent, text `#64748B`. Hover state `#F1F5F9` with text `#0F172A`.

### Status Badges & Chips
- **Réglé (Paid):** Background `#DCFCE7`, text `#15803D`, border `1px solid #BBF7D0`. Preceded by an optional `4px` solid dot.
- **En retard (Overdue):** Background `#FEE2E2`, text `#B91C1C`, border `1px solid #FECACA`.
- **Partiel (Partial):** Background `#FEF3C7`, text `#B45309`, border `1px solid #FDE68A`.
- **En attente (Pending):** Background `#F1F5F9`, text `#475569`, border `1px solid #E2E8F0`.

### Data Tables (Rosters & Ledgers)
- Table header row rendered in `#F8FAFC` with a bottom border `1px solid #E2E8F0`.
- Header text set in `label-sm` uppercase, color `#64748B`.
- Row height fixed to `48px`, striped alternate backgrounds optional, standard row `#FFFFFF`.
- Hover state on rows: `#F8FAFC`.
- Financial columns right-aligned with `metric-numeral` sizing in regular weight (`font-weight: 500`) with suffix `MRU`.

### Form Fields & Inputs
- Inputs have a height of `38px`, background `#FFFFFF`, border `1px solid #CBD5E1`, text `#0F172A`, placeholder `#94A3B8`.
- Focus state: border `#2563EB` with an ambient focus ring `0 0 0 2px rgba(37, 99, 235, 0.15)`.
- Error state: border `#EF4444` accompanied by red inline helper text in French.

### Badges for Avatars & Monograms
- Never display human photos.
- 36px circular avatar badges (`rounded-full`) with deterministic color generation from a curated muted palette (Slate, Sky, Indigo, Teal).
- Monograms display two capital initials (e.g., "MD" for Mamadou Diallo) in bold `12px` font.

### KPI & Metric Cards
- White background (`#FFFFFF`), border `1px solid #E2E8F0`, interior padding `20px`.
- Structure: Subdued uppercase label at top (`Total Recouvré`, `Reste à Recouvrer`), prominent numerical amount in `28px` bold with currency suffix (`MRU`), followed by comparative trend badge or class-year progress bar.