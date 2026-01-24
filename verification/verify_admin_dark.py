from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(color_scheme='dark')
        page = context.new_page()

        print("Navigating to home...")
        page.goto("http://localhost:8081", timeout=60000)

        # Login
        try:
            page.wait_for_selector('text="Sign In with Okta"', timeout=20000)
            page.click('text="Sign In with Okta"')
        except:
            pass

        # Navigate to Admin
        print("Navigating to Admin...")
        try:
            page.wait_for_selector('text="Available Assignments"', timeout=20000) # Wait for home load
            page.get_by_role("link", name="Admin").click()
        except:
             print("Could not find Admin link, trying text")
             page.click('text="Admin"')

        # Wait for Leave Balance Card
        # Look for "Days Available" text which is in the card
        try:
            page.wait_for_selector('text="Days Available"', timeout=10000)
        except:
            print("Leave Balance Card not found")

        print("Taking admin screenshot...")
        time.sleep(2)
        if not os.path.exists("verification"):
            os.makedirs("verification")
        page.screenshot(path="verification/admin_dark.png")

        browser.close()

if __name__ == "__main__":
    run()
