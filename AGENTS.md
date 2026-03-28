# Agent Instructions

This file provides skill discovery for AI coding agents (Jules, Claude Code, and others) working on this codebase.

## Project Context

My Compass is a universal military personnel management app for U.S. Navy sailors. It handles PII and CUI data and must meet government security and compliance standards. See `CLAUDE.md` for the full project constitution.

## Government Compliance Skills

These skills encode requirements from NIST SP 800-53 Rev 5, DISA Mobile Application SRG, OWASP MASVS v2, and the USN Data Governance Framework (VAULTIS). They apply to all code that touches security-relevant areas.

- [Government Secure Storage](docs/skills/government-secure-storage/SKILL.md) — Use when implementing encryption, key management, data storage, database schemas, or persisting data to disk
- [Government Auth and Access](docs/skills/government-auth-and-access/SKILL.md) — Use when implementing authentication, authorization, session management, route protection, or audit logging
- [Government Data Handling](docs/skills/government-data-handling/SKILL.md) — Use when handling PII/CUI data, designing data models, implementing logging, building API integrations, or network communication

## Additional References

| Topic | Document |
|-------|----------|
| Project constitution and rules | `CLAUDE.md` |
| Security controls and posture | `docs/SECURITY_POSTURE.md` |
| ATO readiness and compliance gaps | `docs/ATO_READINESS.md` |
| Architecture review findings | `docs/reviews/2026-03-28-architecture-review.md` |
| Security audit findings | `docs/reviews/2026-03-28-security-audit.md` |
| Compliance gap analysis | `docs/reviews/2026-03-28-compliance-gap-analysis.md` |
