from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844}) # iPhone 12 Pro dimensions
        page = context.new_page()

        try:
            print("Navigating to Travel Claim Wizard...")
            # Navigate directly to the request page
            page.goto("http://127.0.0.1:8081/travel-claim/request")

            # Wait for content to load
            print("Waiting for content...")
            page.wait_for_timeout(5000) # Give it time to compile/load

            # Take screenshot of initial state (Trip Details)
            print("Taking screenshot 1...")
            page.screenshot(path="verification/wizard_step1.png")

            # Try to click Create Draft if visible
            try:
                page.get_by_text("Create Draft").click()
                print("Clicked Create Draft")
                page.wait_for_timeout(2000)
                page.screenshot(path="verification/wizard_step1_clicked.png")
            except:
                print("Create Draft button not found")

            # Try to scroll down or interact
            # Scroll to bottom to trigger step update or just see footer
            # page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            # page.wait_for_timeout(1000)
            # page.screenshot(path="verification/wizard_bottom.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
