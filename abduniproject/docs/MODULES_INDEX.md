# Table 1.4 — The 9 Architectural Modules Index (CANONICAL — CORRECTED 2026-09-14)

> **System Canonical:** 5 Applications (1 Core B2B `AU BUSINESS` + 4 B2C Spokes `AU MED`, `AU DEALS`, `AU SERV`, `AU INVEST`) | 13 Smart Agents (1-13) | **EXACTLY 9 MODULES (1-9)** — Modules 10-15 references are VOID.

| # | Module | Source Card |
|---|--------|-------------|
| 1 | Authentication, Progressive Verification & Profile System | Phase 1 — Module 1 |
| 2 | Homepage, Personalized Discovery, Subscription Packages & Gamified Ads Hub | Phase 1 — Module 2 |
| 3 | Complete Stage 1 Taxonomy, Fractional & Partnership Engine, Draft Persistence & Negotiation Hub | Phase 1 — Module 3 |
| 4 | UI/UX & Single Deal Page Architecture (صفحة كل ديل، محرك الثقة، وأمان المنصة) | Phase 1 — Module 4 |
| 5 | Comprehensive Digital Wallet, Checkout Page, Commission Incentives & Penalty Engine | Phase 1 — Module 5 |
| 6 | User Interaction Hub, AI-Guarded Messaging & My Deals Center | Phase 1 — Module 6 |
| 7 | Auxiliary Services, Loyalty Points & External Coupon Engine, Blog CMS & Smart Integrations Hub | Phase 1 — Module 7 |
| 8 | AU Digital Workforce Marketplace & Commercial Business Calibrator SaaS | Phase 1 — Module 8 |
| 9 | Exhaustive Platform-Wide Master Admin Dashboard Architecture (Parts 1–3) | Phase 1 — Module 9 |

## Correction Note (2026-09-14)
- **Former Modules 10-15 VOID:** `10 Platform Core Infrastructure`, `11 Frontend Master Architecture`, `12 Backend Architecture B.1–B.14`, `13 Zero-Trust RBAC`, `14 Poison Pill DRM`, `15 Test Suites 1–13` were **NOT modules** — they are Phase 2 / 4.0 / 5.0 / 6.0 work packages and sub-systems integrated **inside** Modules 1-9 (e.g., RBAC inside Module 9 Module 7/13, Poison Pill inside Module 9 Module 14, Core Infra inside Dashboard telemetry). Any document counting 15 modules is a defect — corrected to 9.

## Notes
- **Abwab Al Khair (Charity)** is NOT a standalone module — zero-fee deal-type value within Module 3 taxonomy.
- **AU MED** clinical store uses PostgreSQL; all other modules use MySQL core.

## Module Isolation Contract (Rule 5 + Rule 30)
Each module lives at `app/Modules/{ModuleName}/` with strict layers:
- `Controllers/{Admin,User,Public}/` → HTTP only (Rule 27)
- `Actions/` or `Services/` → business logic, single-responsibility
- `Models/` → schema, relations, scopes, casts only
- `Requests/` → validation + authorization
- `Enums/` → native PHP 8.4 enums
Shared logic → `app/Modules/Shared/` (Rule 28) — never duplicated.
