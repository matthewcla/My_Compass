from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to root
    print("Navigating to root...")
    page.goto("http://localhost:8081")

    # Wait for loading
    page.wait_for_timeout(15000)

    # Try to click Admin link/tab.
    try:
        admin_link = page.get_by_role("link", name="Admin")
        if admin_link.count() > 0:
            print("Found Admin link, clicking...")
            admin_link.first.click()
        else:
            print("Admin link not found, trying to navigate directly to /admin")
            page.goto("http://localhost:8081/admin")
    except Exception as e:
        print(f"Error finding admin link: {e}")
        page.goto("http://localhost:8081/admin")

    page.wait_for_timeout(3000)

    # Check for "My Leave" text
    try:
        expect(page.get_by_text("My Leave")).to_be_visible()
        print("Verified 'My Leave' text is visible")
    except Exception as e:
        print(f"Warning: 'My Leave' text not found: {e}")

    # Check for "Recent Requests"
    try:
        expect(page.get_by_text("Recent Requests")).to_be_visible()
        print("Verified 'Recent Requests' text is visible")
    except Exception as e:
        print(f"Warning: 'Recent Requests' text not found: {e}")

    # Check for "No recent leave requests"
    try:
        expect(page.get_by_text("No recent leave requests")).to_be_visible()
        print("Verified 'No recent leave requests' text is visible")
    except Exception as e:
        print(f"Warning: 'No recent leave requests' text not found: {e}")

    page.screenshot(path="verification/verification.png")
    print("Screenshot taken at verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
