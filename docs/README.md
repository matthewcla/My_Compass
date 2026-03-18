# My Compass — Documentation Library

> **Last Updated:** 2026-02-14

This directory contains developer-facing documentation for the My Compass project. All docs reflect the **current prototyping state** — offline-first with mock data, pending live API and Identity Provider integration.

---

## 📚 Documents

### Design & Architecture

| Document | Description |
|----------|-------------|
| [COMPASS_LIFECYCLE.md](./COMPASS_LIFECYCLE.md) | Full sailor lifecycle: Assignment phases, PCS phases, transition rules, and feature activation map |
| [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) | High-Density UI philosophy, Continuous form patterns, animation standards, terminology, and component conventions |

### Security & Compliance

| Document | Description |
|----------|-------------|
| [ATO_READINESS.md](./ATO_READINESS.md) | RMF/STIG gap analysis — 26 NIST 800-53 controls + 9 DISA Mobile App SRG checks |
| [SECURITY_POSTURE.md](./SECURITY_POSTURE.md) | Current security controls inventory — PII protection, storage tiers, auth, network, crypto |
| [DEPENDENCY_MANIFEST.md](./DEPENDENCY_MANIFEST.md) | SBOM-ready audit of all 51 production dependencies with risk classification |

### Engineering

| Document | Description |
|----------|-------------|
| [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) | Prioritized debt register, including deferred production requirements (Auth, Crypto, APIs) and frontend component debt |
| [API_INTEGRATION_ROADMAP.md](./API_INTEGRATION_ROADMAP.md) | Mock-to-production transition plan for system integration (NSIPS, eCRM, MNA) |

### Feature Inventory

| Document | Description |
|----------|-------------|
| [FLOWS_IMPLEMENTED.md](./FLOWS_IMPLEMENTED.md) | All built multi-screen flows (Leave Wizard, PCS Wizard, Travel Claim, etc.) with user paths |
| [FLOWS_NOT_IMPLEMENTED.md](./FLOWS_NOT_IMPLEMENTED.md) | Planned flows not yet built (Profile Confirmation, OBLISERV Check, Screenings, etc.) |
| [WIDGETS_IMPLEMENTED.md](./WIDGETS_IMPLEMENTED.md) | All built widgets (40+) — dashboard, PCS, assignment, leave, travel, inbox |
| [WIDGETS_NOT_IMPLEMENTED.md](./WIDGETS_NOT_IMPLEMENTED.md) | Planned widgets not yet built (BAH, housing, status trackers, etc.) |
| [TOOLS_IMPLEMENTED.md](./TOOLS_IMPLEMENTED.md) | All built tools (Billet Discovery, Slating, HHG Estimator, Inbox, Calendar, etc.) |
| [TOOLS_NOT_IMPLEMENTED.md](./TOOLS_NOT_IMPLEMENTED.md) | Planned tools (BAH Calculator, TMO Scheduler, Document Vault, LES Viewer, etc.) |



---

## 🔗 Related Project Files

| File | Description |
|------|-------------|
| [CLAUDE.md](../CLAUDE.md) | AI agent instructions — tech stack, conventions, rules |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | High-level architecture and coding constitution |
| [TIMELINE.md](../TIMELINE.md) | UCT implementation plan with agent prompts |
| [_AI_CONTEXT.xml](../_AI_CONTEXT.xml) | System kernel constraints (Zero Trust, PII, platform) |
