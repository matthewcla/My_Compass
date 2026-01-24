from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create context with dark mode
        context = browser.new_context(color_scheme='dark')
        page = context.new_page()

        print("Navigating to home...")
        try:
            page.goto("http://localhost:8081", timeout=60000)
        except Exception as e:
            print(f"Failed to load page: {e}")
            return

        # Wait for animation and button
        print("Waiting for login button...")
        try:
            # The button text is "Sign In with Okta"
            page.wait_for_selector('text="Sign In with Okta"', timeout=20000)
            print("Login button found, clicking...")
            page.click('text="Sign In with Okta"')
        except Exception as e:
            print(f"Login button not found or error: {e}")
            # maybe we are already logged in?
            pass

        # Wait for navigation to assignments
        # Look for "Available Assignments"
        print("Waiting for assignments...")
        try:
            page.wait_for_selector('text="Available Assignments"', timeout=20000)
        except:
             print("Could not find Available Assignments header. Trying to take screenshot anyway.")
             if not os.path.exists("verification"):
                os.makedirs("verification")
             page.screenshot(path="verification/error_login.png")
             # Try to dump content
             with open("verification/page_dump.html", "w") as f:
                 f.write(page.content())
             return

        # Take screenshot of assignments in dark mode
        print("Taking assignments screenshot...")
        time.sleep(3) # Wait for animations
        if not os.path.exists("verification"):
            os.makedirs("verification")
        page.screenshot(path="verification/assignments_dark.png")

        # Navigate to Profile
        print("Navigating to Profile...")
        try:
            # Tabs usually have role="link" or button
            # Expo router web tabs are usually links
            page.get_by_role("link", name="Profile").click()
        except:
             print("Could not find Profile link, trying text")
             page.click('text="Profile"')

        # Wait for Profile content
        try:
            page.wait_for_selector('text="Profile & Preferences"', timeout=10000)
        except:
            print("Profile header not found")

        print("Taking profile screenshot...")
        time.sleep(2)
        page.screenshot(path="verification/profile_dark.png")

        print("Done.")
        browser.close()

if __name__ == "__main__":
    run()
