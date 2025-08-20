# Technical Debt and Future Work

This document tracks known issues and potential areas for future improvement.

## 1. Test Suite Refactoring

### Issue:
The primary test suite, `test/test-basic.js`, is written as a CommonJS module. However, recent refactoring has converted core application scripts like `install.js` and `intelligence-engine/complexity-analyzer.js` into modern ES Modules (using `import`/`export`).

This has created a module compatibility conflict that makes it difficult to add new tests to `test/test-basic.js`, especially for testing the installer script. Attempts to do so resulted in a series of complex module resolution and syntax errors.

### Current Workaround:
A separate, standalone "smoke test" (`test/test-installer.js`) was created to verify the new documentation generation feature. This test is a pure ES Module and works correctly, but it means the test suite is fragmented.

### Recommended Fix:
The `test/test-basic.js` file and any other CommonJS test files should be fully refactored to use ES Module syntax (`import`/`export`). This would modernize the test suite, resolve the underlying compatibility issues, and create a single, consistent testing environment for the entire project. This would be a good task to undertake before adding significant new features.
