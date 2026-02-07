from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Navigate to the app (increased timeout for initial build)
    print("Navigating to app...")
    page.goto("http://localhost:8081", timeout=120000)

    # 2. Sign In
    print("Signing in...")
    # Wait for the button to be ready
    sign_in_button = page.get_by_role("button", name="Sign In")
    expect(sign_in_button).to_be_visible(timeout=30000)

    sign_in_button.click()

    # 3. Wait for Dashboard (just to be sure login worked)
    print("Waiting for Dashboard...")
    page.wait_for_timeout(3000) # Give it a moment to process login

    # 4. Navigate to Discovery
    print("Navigating to Discovery directly...")
    page.goto("http://localhost:8081/discovery")

    # 5. Check for BilletSwipeCard accessibility
    print("Checking accessibility elements...")

    # "Show Details" button
    # Pick the last one (active card should be on top/last in DOM)
    show_details = page.get_by_role("button", name="Show Details").last
    expect(show_details).to_be_visible(timeout=20000)
    print("✓ Found 'Show Details' button")

    # Click it to open drawer
    # Force click because the control bar overlay might be interfering with pointer events check
    show_details.click(force=True)

    # "Close Details" button
    # Might also be duplicated if multiple cards are rendered, but drawer is usually on top.
    # However, drawer is inside the card component, so it might be duplicated too if cards are pre-rendered.
    close_details = page.get_by_role("button", name="Close Details").first
    expect(close_details).to_be_visible(timeout=10000)
    print("✓ Found 'Close Details' button")

    # Take screenshot
    page.screenshot(path="verification/accessibility_check.png")
    print("Screenshot saved to verification/accessibility_check.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
