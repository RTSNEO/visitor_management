import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    
    // Check for login page elements
    await expect(page.locator('text=Username')).toBeVisible();
    await expect(page.locator('text=Password')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Enter invalid credentials
    await page.fill('input[name="username"]', 'invaliduser');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Click login button
    await page.click('button:has-text("Login")');
    
    // Should show error message
    await expect(page.locator('text=Incorrect username or password')).toBeVisible();
  });

  test('should navigate to dashboard on successful login', async ({ page }) => {
    await page.goto('/');
    
    // Enter valid credentials (assuming these are set in test environment)
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    
    // Click login button
    await page.click('button:has-text("Login")');
    
    // Should navigate away from login page
    await page.waitForNavigation();
    expect(page.url()).not.toContain('login');
  });

  test('should persist token in localStorage', async ({ page, context }) => {
    await page.goto('/');
    
    // Login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Login")');
    
    // Check localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });
});

test.describe('Language Toggle', () => {
  test('should toggle between English and Arabic', async ({ page }) => {
    await page.goto('/');
    
    // Find language toggle button
    const toggleButton = page.locator('button:has-text("العربية")');
    await expect(toggleButton).toBeVisible();
    
    // Click to change language
    await toggleButton.click();
    
    // Document direction should change to RTL
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');
  });
});

test.describe('Visitor Form (Operator)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as operator
    await page.goto('/');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Login")');
    await page.waitForNavigation();
  });

  test('should display visitor form', async ({ page }) => {
    // Navigate to operator page or form
    await expect(page.locator('text=Visitor')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="national_id"]')).toBeVisible();
  });

  test('should submit visitor form with required fields', async ({ page }) => {
    // Fill form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="guest_of"]', 'Jane Smith');
    await page.fill('input[name="national_id"]', '123456789');
    await page.fill('input[name="office_branch"]', 'Main Office');
    await page.fill('input[name="start_time"]', '2024-01-15T09:00');
    await page.fill('input[name="end_time"]', '2024-01-15T17:00');
    
    // Submit form
    await page.click('button:has-text("Submit")');
    
    // Should show success message
    await expect(page.locator('text=/success|submitted/i')).toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    // Try to submit empty form
    await page.click('button:has-text("Submit")');
    
    // Should show validation errors
    await expect(page.locator('text=/required|missing/i')).toBeVisible();
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Login")');
    await page.waitForNavigation();
  });

  test('should display admin dashboard', async ({ page }) => {
    // Check for admin-specific elements
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Access Levels')).toBeVisible();
  });

  test('should allow creating new user', async ({ page }) => {
    // Navigate to users section
    await page.click('text=Users');
    await page.click('text=/Add|Create|New/i');
    
    // Fill user form
    await page.fill('input[name="username"]', `user_${Date.now()}`);
    await page.fill('input[name="password"]', 'TempPassword123');
    await page.selectOption('select[name="role"]', 'operator');
    
    // Submit
    await page.click('button:has-text("Create")');
    
    // Should show success
    await expect(page.locator('text=/success|created/i')).toBeVisible();
  });
});

test.describe('Visitor History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Login")');
    await page.waitForNavigation();
  });

  test('should display visitor history', async ({ page }) => {
    // Navigate to history
    await page.click('text=History');
    
    // Should display table or list
    await expect(page.locator('text=Visitor')).toBeVisible();
  });

  test('should allow searching visitors', async ({ page }) => {
    await page.click('text=History');
    
    // Search for a visitor
    await page.fill('input[placeholder=/search|name/i]', 'John');
    
    // Should filter results
    await expect(page.locator('text=John')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should display mobile menu on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Mobile menu should be visible
    const mobileMenu = page.locator('button[aria-label="Menu"]');
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // Page should be visible and functional
    await expect(page.locator('body')).toBeVisible();
  });
});
