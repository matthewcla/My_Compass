# USN Data Governance Framework — Summary for My Compass

> Derived from: **USN Data Governance Framework V0.2C (Pre-Decisional), 17 FEB 2026**
> This is a condensed reference for AI agents and developers. For full context, consult the source document.

---

## VAULTIS Principles

The DOW requires all Navy data to meet these seven attributes. My Compass implements them through typed interfaces, Zod validation, and tiered storage.

| Principle | Definition | My Compass Implementation |
|-----------|-----------|--------------------------|
| **Visible** | Consumers can locate the needed data | Every entity has a typed definition in `types/` and a home store in `store/` |
| **Accessible** | Consumers can retrieve the data | Data available via typed service interfaces in `services/api/interfaces/` |
| **Understandable** | Consumers can find descriptions to recognize content and context | Zod schemas document shape; Navy terminology enforced; field names self-describing |
| **Linked** | Consumers can exploit complementary data through relationships | Consistent foreign keys across stores; related data linked by shared IDs |
| **Trustworthy** | Consumers can be confident in data for decision-making | All external data Zod-validated at boundary; lineage traceable through services |
| **Interoperable** | Common representation and comprehension of data | Standardized service interfaces; shared Zod schemas; IDES-aligned API contracts |
| **Secure** | Data protected from unauthorized use and manipulation | Storage tiers enforced; PII in SecureStore; Zero Trust for all external data |

---

## 7 DOW Data Quality Dimensions

When designing schemas, validation, or data models, consider these dimensions as awareness principles.

| Dimension | Definition | Example in My Compass |
|-----------|-----------|----------------------|
| **Accuracy** | Data correctly reflects true values | Leave balance matches NSIPS source |
| **Completeness** | Expected information present at data set, row, or column level | Required fields in Zod schemas (`.min(1)`, `.nonempty()`) |
| **Conformity** | Data follows agreed policies, standards, and procedures | Enum values for leave types, PCS phases, billet categories |
| **Consistency** | Values uniformly represented within and across data sets | Same date format everywhere; same ID field names across stores |
| **Uniqueness** | One-to-one alignment between each event and its record | No duplicate leave requests; unique IDs for all entities |
| **Integrity** | Pedigree, provenance, and lineage known and aligned with business rules | Data transformations in `utils/` and `services/`, not scattered in components |
| **Timeliness** | Time between event and data availability | `lastSynced` timestamps; background refresh intervals |

---

## Zero Trust Model: Know / Secure / Monitor

The USN Data Governance Framework mandates a data-centric Zero Trust approach:

### Know Your Data
- Inventory and categorize all data by sensitivity
- Label with appropriate metadata (types, Zod schemas, `@security` annotations)
- Account for aggregation risk — combined unclassified data may become sensitive

### Secure Your Data
- ICAM (Identity, Credential, and Access Management) as foundation
- RBAC for organizational structure + ABAC for fine-grained policy
- Principle of least privilege — components access only what they need via store selectors
- Data Loss Prevention — never expose PII in logs, network requests, or error messages

### Monitor Your Data
- Immutable audit trails for all data access (future: TD-008 AuditLogService)
- Three audit questions: Who had access? Who actually accessed? What did they do?
- Continuous monitoring of access patterns

---

## Data Contract Required Elements

Per USN Data Governance Framework §3.5, every external API integration should document:

| Element | Description |
|---------|------------|
| Parties & POCs | Organizations entering the agreement and contact info |
| Authority | Mission-based rationale permitting the data exchange |
| Responsibilities | Obligations of each party |
| Data Specification | Specific data elements exchanged |
| Method of Exchange | Technical details (systems, protocols, APIs) |
| Frequency | Cadence of exchange (real-time, batch, on-demand) |
| Data Rights | Access and decision rights post-exchange |
| Security & Access | Access control requirements and audit methods |
| Incident Reporting | Procedures for reporting security incidents |
| Resource Impacts | Personnel, funding, and systems required |
| Dispute Resolution | Methods for mitigating risks and resolving disputes |
| Termination Terms | Conditions and notice periods for ending the agreement |

In My Compass, we implement this as `@DSA` JSDoc blocks on `real*Service.ts` files. See `services/api/CLAUDE.md` for the pattern.

---

## Edge-First / DIL Design Principles

The framework mandates that Navy systems support **Disconnected, Intermittent, Low-Bandwidth (DIL)** environments. This directly maps to My Compass's offline-first architecture:

- **Cache-first reads:** Always serve local data first, refresh in background
- **Sync queue for writes:** All mutations persist locally and retry when connectivity returns
- **Data federation over duplication:** Query at source when online, cache locally for DIL
- **Graceful degradation:** Never block UI on network; show cached data with freshness indicators

---

## Key Acronyms

| Acronym | Definition |
|---------|-----------|
| ABAC | Attribute-Based Access Control |
| CDE | Critical Data Element |
| CDAO | Chief Data and AI Officer |
| CUI | Controlled Unclassified Information |
| DAGB | Data and AI Governance Board |
| DIL | Disconnected, Intermittent, Low-Bandwidth |
| DLP | Data Loss Prevention |
| DSA | Data Sharing Agreement |
| ICAM | Identity, Credential, and Access Management |
| IDES | Interface Data Exchange Standards |
| MDM | Master Data Management |
| RAI | Responsible AI |
| RBAC | Role-Based Access Control |
| RMF | Risk Management Framework |
| VAULTIS | Visible, Accessible, Understandable, Linked, Trustworthy, Interoperable, Secure |
| ZTA | Zero Trust Architecture |

---

## Source

USN Data Governance Framework, Version 0.2C, Pre-Decisional, 17 February 2026.
Controlled By: OPNAV N2N6D. CUI Category: CTI.
