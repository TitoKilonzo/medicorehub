# MediCore Hub

**Integrated Health Intelligence Platform for East Africa**

---

## Overview

MediCore Hub is a comprehensive, production-grade Health IT web application designed to serve Kenya's and East Africa's healthcare facilities — from Level 2 dispensaries to national referral hospitals. The platform unifies clinical, administrative, financial, and public health workflows on a single secure, interoperable system built on HL7 FHIR R4 open standards.

The web application is a marketing and product showcase site for the MediCore Hub platform, featuring detailed module descriptions, live-style analytics dashboards, interoperability architecture, security documentation, and a full contact/demo request flow.

---

## Project Name Origin

**MediCore** — "Medi" from *medicine/medical*, "Core" representing the central, essential hub of all health system operations. The name communicates that MediCore Hub is the nucleus around which all clinical and administrative workflows revolve.

---

## Live Features

- **6-page responsive website** with full navigation, active page highlighting, and mobile hamburger menu
- **Animated hero** with gradient text, counter animations, and scroll-cue
- **Scrolling marquee** feature strip
- **8 detailed module pages** — EHR, LIS, Pharmacy, Radiology, Scheduling, RCM, Telemedicine, Supply Chain
- **Live-style analytics dashboard** — line chart, donut chart, horizontal bars, KPI tiles, alerts panel
- **Interoperability architecture** diagram with integration cards
- **Security page** — compliance badges and illustrative audit log table
- **Contact page** — full enquiry form with animated success state and FAQ section
- **Scroll-triggered card reveal animations**
- **Counter animations** that fire when stats scroll into view
- **Offline-capable** — all critical assets are local (no external dependencies beyond fonts and Lucide icons CDN)

---

## Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--navy` | `#0B1929` | Primary background |
| `--navy-mid` | `#112236` | Section alternates |
| `--navy-light` | `#1A3149` | Cards, panels |
| `--teal` | `#0EA5A0` | Primary brand / CTA |
| `--teal-light` | `#2EC4BF` | Highlights, links |
| `--teal-dark` | `#087872` | Dark accents, marquee |
| `--amber` | `#F59E0B` | Secondary accent / alerts |
| `--amber-light` | `#FCD34D` | Warm highlights |

### Typography

- **Headings:** Sora (Google Fonts) — weights 300–800
- **Body:** DM Sans (Google Fonts) — weights 300–500
- **Sizing:** Fluid with `clamp()` for responsive scaling

### Icons

All icons use [Lucide Icons](https://lucide.dev/) via unpkg CDN — SVG-based, consistent 24px grid, no emoji used anywhere in the project.

---

## File Structure

```
medicorehub/
├── index.html                  # Homepage / landing page
├── favicon.svg                 # SVG favicon (activity/pulse icon)
├── README.md                   # This file
│
├── css/
│   └── main.css                # Complete stylesheet (all pages)
│
├── js/
│   └── main.js                 # Navigation, counter animations, scroll reveal
│
└── pages/
    ├── modules.html            # All 8 platform module detail pages
    ├── analytics.html          # Analytics & reporting with mock dashboard
    ├── interoperability.html   # Integration standards & architecture
    ├── security.html           # Security architecture & compliance
    └── contact.html            # Demo request form & FAQ
```

---

## Pages

### 1. `index.html` — Homepage
- Full-viewport hero with Unsplash background, animated headline, stat counters
- Feature marquee strip
- Mission section with image stack + floating badge
- 8-module grid with featured card
- Analytics preview section with mock charts
- Interoperability logos strip
- Testimonials from three Kenyan clinicians
- Security credential strip
- CTA banner with background image
- Full footer

### 2. `pages/modules.html` — Platform Modules
- Detailed alternating-layout sections for each of 8 modules
- Real Unsplash clinical photography per module
- Feature bullet lists per module
- Individual CTA per module linking to contact form

### 3. `pages/analytics.html` — Analytics & Reporting
- 4 animated metric KPI cards
- Full mock dashboard with:
  - SVG line chart (OPD attendance trend)
  - SVG donut chart (payer mix)
  - Horizontal bar chart (top diagnoses by ICD-10)
  - KPI panel
  - Alerts panel
- 6 report type cards covering clinical, financial, regulatory, HR, supply chain, and geospatial

### 4. `pages/interoperability.html` — Interoperability
- Open standards breakdown (FHIR, OpenHIE, SNOMED, HL7 v2)
- Visual integration architecture diagram
- 6 pre-built integration cards (NHIF, DHIS2, KEMSA, M-Pesa, AfricasTalking, PEPFAR)

### 5. `pages/security.html` — Security & Compliance
- 6 security pillar cards (encryption, RBAC, audit, BCM, MFA, pen testing)
- Compliance certification badges (ISO 27001, DPA 2019, SOC 2 Type II, FHIR, GDPR, MoH)
- Illustrative audit log table

### 6. `pages/contact.html` — Contact & Demo
- Split-layout contact page: info + form
- Full enquiry form with field validation
- Animated form-to-success-state transition
- Office hours and dedicated support line information
- Nairobi map placeholder with Unsplash aerial image
- 6-item FAQ section

---

## Technologies Used

| Technology | Version | Purpose |
|---|---|---|
| HTML5 | — | Semantic markup |
| CSS3 | — | Custom properties, Grid, Flexbox, animations |
| Vanilla JavaScript | ES6+ | Counter animations, scroll reveal, nav, form |
| Lucide Icons | Latest (CDN) | SVG icon system |
| Google Fonts | — | Sora + DM Sans typefaces |
| Unsplash | — | Real clinical photography |

**No frameworks. No build tools. No dependencies beyond CDN-loaded fonts and icons.** The site opens directly from the filesystem without a local server.

---

## Setup & Running

### Option A — Open directly in browser
Simply open `index.html` in any modern browser. All pages and assets are self-contained with relative paths.

```bash
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

### Option B — Local development server (recommended for full experience)

Using Python:
```bash
cd medicorehub
python3 -m http.server 8080
# Then open http://localhost:8080
```

Using Node.js (npx serve):
```bash
cd medicorehub
npx serve .
```

Using VS Code Live Server:
Right-click `index.html` → Open with Live Server

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome 90+ | Full |
| Firefox 88+ | Full |
| Safari 14+ | Full |
| Edge 90+ | Full |
| Mobile Chrome / Safari | Full (responsive) |

---

## Health IT Standards Referenced

- **HL7 FHIR R4** — RESTful API standard for clinical data exchange
- **OpenHIE** — Open Health Information Exchange component framework
- **SNOMED CT** — Clinical terminology for diagnoses and procedures
- **ICD-10-CM/PCS** — International Classification of Diseases coding
- **DICOM** — Digital imaging standard for radiology
- **Kenya Data Protection Act 2019** — National patient data privacy law
- **NHIF/SHA** — National Hospital Insurance Fund / Social Health Authority (Kenya)
- **KHIS/DHIS2** — Kenya Health Information System
- **KEMSA** — Kenya Medical Supplies Authority
- **MOH forms** — 240, 257, 333, 405, 705A/B, HMIS 710

---

## Customisation

### Changing the color theme
All colors are CSS custom properties in `css/main.css` under `:root`. Update `--teal`, `--navy`, and `--amber` to rebrand to any color scheme.

### Adding a real backend form
Replace the `form` submit handler in `pages/contact.html` with a `fetch()` POST to your API endpoint:

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  await fetch('https://your-api.com/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  // show success state
});
```

### Replacing Unsplash images
All images use Unsplash URLs with width and quality parameters (`?w=800&q=80`). Replace with your own hosted images by swapping the `src` attributes in any HTML file.

---

## Inspiration & Context

This project was built as an extension of [AfyaTech](https://afyatech.vercel.app/), an AI-powered healthcare startup for East Africa. MediCore Hub takes the Health IT focus further — building a full clinical operations platform rather than an AI advisory layer, addressing the complete facility management lifecycle from patient registration to revenue cycle and supply chain.

---

## License

This project is provided as a demonstration web application. All Unsplash images are used under the [Unsplash License](https://unsplash.com/license). Lucide Icons are licensed under the [ISC License](https://github.com/lucide-icons/lucide/blob/main/LICENSE). Google Fonts are used under the [SIL Open Font License](https://scripts.sil.org/OFL).

---

## Contact

**MediCore Hub Ltd.**  
Upper Hill Medical Centre, 5th Floor  
Hospital Road, Nairobi, Kenya  
hello@medicorehub.co.ke  
+254 700 000 000

---

*Built with precision for East Africa's health system — 2026*
