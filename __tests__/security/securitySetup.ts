/**
 * IAST Security Instrumentation Layer
 *
 * Runs after the standard __tests__/setup.ts mock setup. Wraps console methods
 * and key storage calls with PII pattern detection. Any PII found at runtime
 * (during test execution) is recorded and reported as a security violation.
 *
 * PII definitions per CLAUDE.md §4.5: SSN, DoD ID, email, phone, full name,
 * home address, emergency contact info.
 *
 * This file is not loaded by the standard jest.config.js — only by
 * jest.security.config.js (used in the IAST CI workflow).
 */

import fs from "fs";
import path from "path";

// ── PII Detection Patterns ─────────────────────────────────────────────────
const PII_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: "SSN", pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/ },
  { label: "DoDID", pattern: /\b\d{10}\b/ },
  {
    label: "Email",
    pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/,
  },
  { label: "Phone", pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/ },
];

interface Violation {
  type: string;
  piiLabel: string;
  location: string;
  snippet: string;
}

const violations: Violation[] = [];

function scanForPII(data: unknown, location: string): void {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  for (const { label, pattern } of PII_PATTERNS) {
    if (pattern.test(str)) {
      violations.push({
        type: "pii-exposure",
        piiLabel: label,
        location,
        snippet: str.slice(0, 150),
      });
      break; // one violation entry per call site
    }
  }
}

// ── Console Interception ───────────────────────────────────────────────────
// Captures all console output during test execution and scans for PII.
// Per CLAUDE.md §4.5: console.log(user.*) is explicitly forbidden.

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    scanForPII(args, "console.log");
    originalLog(...args);
  });

  jest.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    scanForPII(args, "console.warn");
    originalWarn(...args);
  });

  jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    scanForPII(args, "console.error");
    originalError(...args);
  });

  // ── AsyncStorage setItem interception ─────────────────────────────────
  // AsyncStorage is mocked in __tests__/setup.ts. Per storage tier rules
  // (CLAUDE.md §3 Tier 1), PII must go through expo-secure-store — never
  // through AsyncStorage. Detect and flag any PII written to AsyncStorage.
  try {
    const asyncStorageMock = jest.requireMock(
      "@react-native-async-storage/async-storage",
    ) as { default: { setItem: jest.Mock } };

    jest
      .spyOn(asyncStorageMock.default, "setItem")
      .mockImplementation(async (key: string, value: string) => {
        scanForPII(value, `AsyncStorage.setItem("${key}")`);
        return undefined;
      });
  } catch {
    // Mock may not be registered if AsyncStorage isn't used in this run — skip.
  }
});

// ── Teardown & Report ──────────────────────────────────────────────────────
afterAll(() => {
  jest.restoreAllMocks();

  const report = {
    timestamp: new Date().toISOString(),
    violations,
    summary: {
      total: violations.length,
      passed: violations.length === 0,
    },
  };

  const reportPath = path.join(process.cwd(), "iast-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  if (violations.length > 0) {
    const details = violations
      .map((v) => `  [${v.piiLabel}] ${v.location}: ${v.snippet}`)
      .join("\n");
    throw new Error(
      `IAST: ${violations.length} PII exposure violation(s) detected at runtime:\n${details}\n\nSee iast-report.json for full report.`,
    );
  }
});
