# Table 1.4 — The 15 Architectural Modules Index

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
| 10 | Platform Core Infrastructure, High-Traffic Architecture & System Extensions | Phase 2 |
| 11 | Full Frontend Master Architecture, Atomic Components & Screen Specifications | Phase 4.0 |
| 12 | Full Backend Architecture, Services B.1–B.14 & API Pipelines | Phase 5.0 |
| 13 | Zero-Trust RBAC | Phase 5.0 (B.3) |
| 14 | Poison Pill DRM Engine | Phase 5.0 (B.3) |
| 15 | Full Verification, Test Suites 1–13 & Final E2E Acceptance Blueprint | Phase 6.0 |

## Notes
- **Abwab Al Khair (Charity)** is NOT a standalone module — it is a zero-fee deal-type value within the standard taxonomy (Module 3), with no separate schema/UI/admin.
- **AU MED** clinical store uses PostgreSQL; all other modules use MySQL core.

## Module Isolation Contract (Rule 5 + Rule 30)
Each module lives at `app/Modules/{ModuleName}/` with strict layers:
- `Controllers/{Admin,User,Public}/` → HTTP only (Rule 27)
- `Actions/` or `Services/` → business logic, single-responsibility
- `Models/` → schema, relations, scopes, casts only
- `Requests/` → validation + authorization
- `Enums/` → native PHP 8.4 enums
Shared logic → `app/Modules/Shared/` (Rule 28) — never duplicated across modules.
