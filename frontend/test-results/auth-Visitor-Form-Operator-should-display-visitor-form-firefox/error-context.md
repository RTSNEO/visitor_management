# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Visitor Form (Operator) >> should display visitor form
- Location: e2e/auth.spec.ts:83:3

# Error details

```
Error: browserType.launch: 
╔══════════════════════════════════════════════════════╗
║ Host system is missing dependencies to run browsers. ║
║ Please install them with the following command:      ║
║                                                      ║
║     sudo npx playwright install-deps                 ║
║                                                      ║
║ Alternatively, use apt:                              ║
║     sudo apt-get install libx11-xcb1\                ║
║         libxrandr2\                                  ║
║         libxcomposite1\                              ║
║         libxcursor1\                                 ║
║         libxdamage1\                                 ║
║         libxi6\                                      ║
║         libxfixes3\                                  ║
║         libgtk-3-0t64\                               ║
║         libatk1.0-0t64\                              ║
║         libcairo-gobject2\                           ║
║         libgdk-pixbuf-2.0-0\                         ║
║         libasound2t64                                ║
║                                                      ║
║ <3 Playwright Team                                   ║
╚══════════════════════════════════════════════════════╝
```