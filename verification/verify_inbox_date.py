
import re
from playwright.sync_api import Page, expect, sync_playwright

def test_inbox_date_format(page: Page):
    print("Navigating to http://localhost:8081/inbox...")
    page.goto("http://localhost:8081/inbox", timeout=60000, wait_until="domcontentloaded")

    # Take a screenshot immediately to see where we landed
    page.screenshot(path="verification/initial_load.png")

    print("Waiting for date text...")
    # Regex for date: \d{6}Z [A-Z]{3} \d{2}
    # Example: 251430Z OCT 23
    date_pattern = r"\d{6}Z [A-Z]{3} \d{2}"
    date_regex = re.compile(date_pattern)

    try:
        # Wait for date to appear. Might take a moment to fetch/render.
        # Use locator and wait
        locator = page.get_by_text(date_regex).first
        locator.wait_for(timeout=30000)

        # Assert
        print("Verifying date format...")
        expect(locator).to_be_visible()

        # take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/inbox_date_verification.png")
        print("Screenshot saved to verification/inbox_date_verification.png")

    except Exception as e:
        print(f"Error waiting for date: {e}")
        page.screenshot(path="verification/error.png")
        raise e

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_inbox_date_format(page)
        except Exception as e:
            print(f"Script failed: {e}")
        finally:
            browser.close()
