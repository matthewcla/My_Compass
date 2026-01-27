import time
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate a mobile device
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()

        print("Navigating to app...")
        # Retry connection
        for i in range(30):
            try:
                page.goto("http://localhost:8081", timeout=3000)
                break
            except Exception as e:
                print(f"Waiting for server... ({i})")
                time.sleep(2)

        # Wait for "HOME" title
        print("Waiting for Home...")
        try:
            # The header title is "HOME"
            # It might be in a View, looking for text content
            expect(page.get_by_text("HOME", exact=True)).to_be_visible(timeout=60000)
        except Exception as e:
            print("Failed to find HOME")
            page.screenshot(path="verification/failed_load.png")
            raise e

        # Check Greeting
        # Mock data has displayName "IT1 Matthew Wilson" and rank "E-6" (wait, rank in mock is "E-6", title is "IT1")
        # Logic: `${user.rank || ''} ${lastName}`.
        # user.rank in mock is "E-6".
        # user.displayName is "IT1 Matthew Wilson". lastName is "Wilson".
        # So "Welcome, E-6 Wilson".
        # Wait, usually rank is like "IT1". But mock says rank="E-6", title="IT1".
        # Let's check mockProfile.json again.

        print("Taking screenshot...")
        time.sleep(2) # Wait for animations
        page.screenshot(path="verification/dashboard.png")

        browser.close()

if __name__ == "__main__":
    run()
