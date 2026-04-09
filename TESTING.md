# Testing Guide for Visitor Management System

This document provides comprehensive instructions for testing the Visitor Management System application, including unit tests, component tests, and end-to-end (E2E) tests.

## Table of Contents
1. [Backend Testing](#backend-testing)
2. [Frontend Testing](#frontend-testing)
3. [E2E Testing](#e2e-testing)
4. [Continuous Integration](#continuous-integration)

---

## Backend Testing

### Prerequisites
- Python 3.8+
- pip package manager

### Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (if not already done):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies including test dependencies:
```bash
pip install -r requirements.txt
```

### Running Tests

#### Run all tests:
```bash
pytest
```

#### Run tests with coverage report:
```bash
pytest --cov=app --cov-report=html
# Open htmlcov/index.html in your browser to view the coverage report
```

#### Run specific test file:
```bash
pytest tests/test_auth.py
pytest tests/test_api.py
```

#### Run tests matching a pattern:
```bash
pytest -k "test_login"
pytest -k "test_user"
```

#### Run tests with verbose output:
```bash
pytest -v
```

#### Run tests with detailed failure information:
```bash
pytest -vv --tb=long
```

### Test Structure

The backend tests are organized as follows:

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures and configuration
│   ├── test_auth.py         # Authentication tests
│   └── test_api.py          # API endpoint tests
└── pytest.ini               # Pytest configuration
```

### Backend Test Coverage

**test_auth.py:**
- Password hashing and verification
- Login with valid/invalid credentials
- Token generation and validation
- Current user retrieval

**test_api.py:**
- User management (create, read, update, delete)
- Access level management
- Database model validation
- Permission checking

---

## Frontend Testing

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

### Running Unit Tests

#### Run all unit tests:
```bash
npm test
```

#### Run tests in watch mode (auto-rerun on file changes):
```bash
npm test -- --watch
```

#### Run tests with UI:
```bash
npm run test:ui
```

#### Run tests with coverage:
```bash
npm run test:coverage
```

#### Run specific test file:
```bash
npm test -- LanguageToggle.test.tsx
npm test -- AuthContext.test.tsx
```

### Test Structure

The frontend tests are organized as follows:

```
frontend/
├── src/
│   └── tests/
│       ├── setup.ts                 # Test configuration and mocks
│       ├── LanguageToggle.test.tsx  # Language toggle tests
│       └── AuthContext.test.tsx     # Auth context tests
├── vitest.config.ts                 # Vitest configuration
└── package.json
```

### Frontend Test Coverage

**LanguageToggle.test.tsx:**
- Button rendering
- Language text display
- Language toggle functionality
- Document direction (LTR/RTL) switching
- Styling verification

**AuthContext.test.tsx:**
- Provider rendering
- Token initialization from localStorage
- User API fetching
- Error handling
- Loading state management
- Authorization header setup
- useAuth hook validation

---

## E2E Testing

### Setup

E2E tests are configured with Playwright and run against a live application.

1. Install Playwright browsers (one-time setup):
```bash
npx playwright install
```

### Running E2E Tests

#### Run all E2E tests:
```bash
npm run test:e2e
```

#### Run tests in UI mode (interactive):
```bash
npm run test:e2e:ui
```

#### Run tests in debug mode:
```bash
npm run test:e2e:debug
```

#### Run specific test file:
```bash
npx playwright test e2e/auth.spec.ts
```

#### Run tests on specific browser:
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

#### View test report:
```bash
npx playwright show-report
```

### E2E Test Coverage

**auth.spec.ts includes:**

1. **Login Flow Tests:**
   - Display of login page elements
   - Error handling for invalid credentials
   - Successful navigation to dashboard
   - Token persistence in localStorage

2. **Language Toggle Tests:**
   - Switching between English and Arabic
   - Document direction (RTL/LTR) changes

3. **Visitor Form Tests (Operator):**
   - Form visibility
   - Submission with required fields
   - Form validation error display

4. **Admin Dashboard Tests:**
   - Dashboard visibility for admin users
   - User creation functionality

5. **Visitor History Tests:**
   - History page display
   - Visitor search functionality

6. **Responsive Design Tests:**
   - Mobile viewport (375x667)
   - Tablet viewport (768x1024)

---

## Running Complete Test Suite

### Backend + Frontend Tests:

```bash
# Terminal 1: Backend tests
cd backend
pip install -r requirements.txt
pytest --cov=app

# Terminal 2: Frontend tests
cd frontend
npm install
npm test
```

### Including E2E Tests:

```bash
# Terminal 1: Backend server
cd backend
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend dev server
cd frontend
npm run dev

# Terminal 3: E2E tests
cd frontend
npm run test:e2e
```

---

## Continuous Integration Setup

The application is set up to work with CI/CD pipelines. Example workflow files for GitHub Actions:

### Backend CI/CD (.github/workflows/backend-tests.yml)
```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: pip install -r backend/requirements.txt
      - run: cd backend && pytest --cov=app
```

### Frontend CI/CD (.github/workflows/frontend-tests.yml)
```yaml
name: Frontend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test
      - run: cd frontend && npm run test:e2e
```

---

## Test Debugging Tips

### Backend
- Use `pytest -vv --tb=long` for detailed error messages
- Add `import pdb; pdb.set_trace()` in code to pause execution
- Check database state with `test_db.query(models.User).all()`

### Frontend
- Use `npm run test:ui` to see test UI with live debugging
- Add `console.log()` statements in components
- Use browser DevTools in Playwright with `--debug` flag
- Check network requests in Playwright Inspector

---

## Test Commands Summary

### Backend
```bash
cd backend
pytest                                    # Run all tests
pytest -v                                # Verbose output
pytest --cov=app --cov-report=html      # With coverage
pytest -k "test_login"                   # Pattern matching
```

### Frontend
```bash
cd frontend
npm test                                 # Run unit tests
npm run test:ui                         # Unit tests with UI
npm run test:coverage                   # With coverage
npm run test:e2e                        # Run E2E tests
npm run test:e2e:ui                     # E2E with UI
npm run test:e2e:debug                  # E2E debug mode
```

---

## Expected Test Results

When all tests pass, you should see:

**Backend:**
- ✓ All authentication tests passing
- ✓ All API endpoint tests passing
- ✓ All model tests passing
- ✓ Code coverage report generated

**Frontend:**
- ✓ All component tests passing
- ✓ All hook tests passing
- ✓ All E2E flows working correctly
- ✓ Responsive design verified

---

## Troubleshooting

### Backend
- **Import errors**: Ensure `pip install -r requirements.txt` is run
- **Database errors**: Tests use in-memory SQLite; no migration needed
- **Port conflicts**: Change BASE_URL in CLI or config

### Frontend
- **Module not found**: Run `npm install`
- **Port 5173 in use**: Change vite port in `vite.config.ts`
- **Playwright issues**: Run `npx playwright install --with-deps`

---

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all tests pass before committing
3. Maintain or improve code coverage
4. Update this guide if adding new test categories

For more details, see [README.md](../README.md) and [DEPLOYMENT.md](../DEPLOYMENT.md).
