import { SecureLogger } from '../utils/logger';
import assert from 'assert';

console.log('Running Logger Verification...');

// Test 1: Sanitize SSN
const ssnInput = 'My SSN is 123-45-6789.';
const ssnExpected = 'My SSN is [REDACTED].';
assert.strictEqual(SecureLogger.sanitize(ssnInput), ssnExpected, `SSN should be redacted. Got: ${SecureLogger.sanitize(ssnInput)}`);

// Test 2: Sanitize DoD ID (10 digits)
const dodInput = 'User ID: 1234567890';
const dodExpected = 'User ID: [REDACTED]';
assert.strictEqual(SecureLogger.sanitize(dodInput), dodExpected, `DoD ID should be redacted. Got: ${SecureLogger.sanitize(dodInput)}`);

// Test 3: Sanitize Email
const emailInput = 'Contact: user@navy.mil';
const emailExpected = 'Contact: [REDACTED]';
assert.strictEqual(SecureLogger.sanitize(emailInput), emailExpected, `Email should be redacted. Got: ${SecureLogger.sanitize(emailInput)}`);

// Test 4: Mixed
const mixedInput = 'User 1234567890 (email: test@example.com) has SSN 987-65-4321';
const mixedExpected = 'User [REDACTED] (email: [REDACTED]) has SSN [REDACTED]';
assert.strictEqual(SecureLogger.sanitize(mixedInput), mixedExpected, `Mixed PII should be redacted. Got: ${SecureLogger.sanitize(mixedInput)}`);

console.log('Logger Verification Passed!');
