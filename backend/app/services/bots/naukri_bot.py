import time
import random
from playwright.sync_api import sync_playwright
from app.services.bots.browser_bot import BrowserBot

class NaukriBot(BrowserBot):
    def __init__(self, log_callback=None):
        super().__init__(portal_name="Naukri", log_callback=log_callback)

    def search_jobs(self, title, location="Remote", experience="Any", recency="Any"):
        self.log(f"Starting human-like dynamic search for '{title}' jobs in '{location}' on Naukri...")
        
        jobs = []
        with sync_playwright() as p:
            # Human-like setup to evade basic bot detection
            browser = p.chromium.launch(
                headless=False, # Keeping it visible makes it less likely to be flagged as a bot
                args=["--disable-blink-features=AutomationControlled", "--window-size=1280,800"]
            )
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800},
                device_scale_factor=1,
                has_touch=False,
                is_mobile=False
            )
            
            # Hide webdriver property via JS injection
            context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            page = context.new_page()
            
            try:
                self.log("Navigating to Naukri.com...")
                page.goto("https://www.naukri.com/", wait_until="domcontentloaded", timeout=60000)
                
                # Human delay
                time.sleep(random.uniform(2.1, 4.3))
                
                # Finding the search bar. Naukri uses different classes occasionally.
                self.log("Typing job title with human delays...")
                search_input = page.locator("input[placeholder*='Enter skills']").first
                if not search_input.is_visible():
                     search_input = page.locator(".suggestor-input").first
                     
                search_input.click()
                time.sleep(random.uniform(0.5, 1.2))
                search_input.type(title, delay=random.randint(100, 250)) # Type like a human
                
                time.sleep(random.uniform(1.0, 2.5))
                
                # Finding the location bar
                self.log("Typing location...")
                loc_input = page.locator("input[placeholder*='Enter location']").first
                if loc_input.is_visible():
                    loc_input.click()
                    time.sleep(random.uniform(0.3, 0.8))
                    loc_input.type(location, delay=random.randint(100, 200))
                
                time.sleep(random.uniform(1.0, 2.0))
                
                self.log("Clicking Search...")
                search_btn = page.locator(".qsbSubmit").first
                search_btn.click()
                
                self.log("Waiting for search results...")
                page.wait_for_selector(".srp-jobtuple-wrapper, .jobTuple", timeout=15000)
                
                # Scroll down a bit like a human
                page.mouse.wheel(0, 700)
                time.sleep(random.uniform(1.5, 3.0))
                
                self.log("Extracting real job data from the page...")
                job_elements = page.locator(".srp-jobtuple-wrapper, .jobTuple").all()
                
                for i, el in enumerate(job_elements[:5]): # Get the top 5 organic results
                    try:
                        job_title_el = el.locator(".title, .jobTupleHeader .title").first
                        job_title = job_title_el.inner_text().strip() if job_title_el.count() > 0 else f"{title} Role"
                        
                        company_el = el.locator(".comp-name, .companyInfo .subTitle").first
                        company = company_el.inner_text().strip() if company_el.count() > 0 else "Unknown Company"
                        
                        link = job_title_el.get_attribute("href") if job_title_el.count() > 0 else f"https://www.naukri.com/job/{i}"
                        
                        jobs.append({
                            "title": job_title,
                            "company": company,
                            "link": link,
                            "source": self.portal_name
                        })
                    except Exception as e:
                        # Skip malformed job cards
                        continue
                
                self.log(f"Successfully scraped {len(jobs)} real jobs from Naukri!")
                
            except Exception as e:
                self.log(f"Error during dynamic scraping: {str(e)}")
                # Minimal fallback if the scraper fails or gets CAPTCHA'd so it doesn't crash the UI
                jobs = [
                    {"title": f"Fallback {title}", "company": "Scraping Failed", "link": f"https://naukri.com", "source": self.portal_name}
                ]
            finally:
                time.sleep(2) # Leave browser open briefly to observe
                browser.close()
                
        return jobs
