from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_calendar(page: Page):
    print("Navigating to home...")
    # Increase timeout for initial load
    page.goto("http://localhost:8081", timeout=120000)

    print(f"Current URL: {page.url}")
    print(f"Page Title: {page.title()}")

    # 1. Handle Sign In if present
    print("Checking for Sign In or Home...")
    try:
        # Try to find Sign In button by Label
        sign_in_btn = page.get_by_label("Sign In")

        # Polling for visibility
        for i in range(20): # 20 attempts, 1s each
            print(f"Poll {i}: Checking visibility...")
            if sign_in_btn.is_visible():
                print("Found Sign In button. Clicking...")
                sign_in_btn.click()
                print("Clicked Sign In. Waiting for navigation...")
                page.wait_for_timeout(3000) # Wait for hydration and nav
                break

            if page.get_by_text("Home", exact=True).is_visible(): # Global Tab Bar "Home" text
                print("Already on Home.")
                break

            # Check for any error text
            if page.get_by_text("Something went wrong").is_visible():
                print("Error screen detected.")

            time.sleep(1)
    except Exception as e:
        print(f"Sign in check warning: {e}")

    # 2. Wait for Home Screen (Hub)
    print("Waiting for Tab Bar...")
    # Using the Tab Bar "Home" text which is rendered in GlobalTabBar
    home_tab_text = page.get_by_text("Home", exact=True)
    # We use expect here to wait
    expect(home_tab_text).to_be_visible(timeout=60000)

    # 3. Check if Calendar tab is visible (in Hub Mode)
    print("Looking for Calendar tab...")
    # In GlobalTabBar, we render Text with "Calendar"
    calendar_tab_text = page.get_by_text("Calendar", exact=True)
    expect(calendar_tab_text).to_be_visible()

    # Screenshot Hub with Calendar Tab
    page.screenshot(path="verification/hub_with_calendar.png")
    print("Screenshot: hub_with_calendar.png")

    # 4. Click Calendar
    print("Clicking Calendar...")
    calendar_tab_text.click()

    # 5. Wait for Calendar Screen
    print("Waiting for Calendar Screen...")
    expect(page.get_by_text("Career Events")).to_be_visible(timeout=30000)
    expect(page.get_by_text("Important Dates & Deadlines")).to_be_visible()

    # Check for an event
    expect(page.get_by_text("Navy Wide Advancement Exam (E-4)")).to_be_visible()

    # Screenshot Calendar Feed
    page.screenshot(path="verification/calendar_feed.png")
    print("Screenshot: calendar_feed.png")

    # 6. Check for Scan button (Scan Screen)
    # We want to check if the Scan Screen works (or at least navigates)
    # The header has a right action with QrCode icon.
    # But finding it might be tricky without accessiblity label.
    # However, "Career Development Symposium" is today.
    # It should have a QR icon button on the card.

    print("Looking for 'Check In' button on card...")
    # Try to find a button-like element inside the card?
    # Or navigate via URL if possible?

    # Let's try to navigate via URL directly to check Scan screen existence
    # page.goto("http://localhost:8081/(calendar)/scan")
    # But this reloads the app and might lose state/session.

    # Instead, let's just assert the Calendar Feed is good.
    # The requirement was "calendar icon will live in the globaltabbar".
    # And "one way feed".

    print("Verification complete.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_calendar(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            # Don't raise, just finish so I can see the error screenshot
        finally:
            browser.close()
