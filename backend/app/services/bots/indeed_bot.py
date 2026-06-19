from app.services.bots.browser_bot import BrowserBot

class IndeedBot(BrowserBot):
    def __init__(self, log_callback=None):
        super().__init__(portal_name="Indeed", log_callback=log_callback)
