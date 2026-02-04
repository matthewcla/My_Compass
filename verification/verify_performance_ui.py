from playwright.sync_api import Page, expect, sync_playwright

def test_app_navigation(page: Page):
    # 1. Arrange: Go to the home page
    print("Navigating to home...")
    page.goto("http://localhost:8081", timeout=60000)

    # Wait for loading
    page.wait_for_timeout(5000)

    # Check for login button
    if page.get_by_text("Sign In with Okta").is_visible():
        print("Logging in...")
        page.get_by_text("Sign In with Okta").click()
        page.wait_for_timeout(3000) # Wait for hydration

    # 2. Navigate to Cycle Screen (My Applications)
    print("Navigating to Cycle screen...")
    page.goto("http://localhost:8081/cycle", timeout=60000)
    page.wait_for_timeout(5000)

    # Assert title or content
    expect(page.get_by_text("My Applications")).to_be_visible(timeout=30000)

    page.screenshot(path="verification/cycle_screen.png")
    print("Cycle screen screenshot taken.")

    # 3. Navigate to Manifest Screen (Archive)
    print("Navigating to Manifest screen...")
    page.goto("http://localhost:8081/manifest", timeout=60000)
    page.wait_for_timeout(5000)

    # Assert title
    # Use exact=True to avoid matching "No archived items."
    expect(page.get_by_text("Archive", exact=True)).to_be_visible(timeout=30000)

    page.screenshot(path="verification/manifest_screen.png")
    print("Manifest screen screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_app_navigation(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
