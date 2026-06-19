from app.services.bots.browser_bot import BrowserBot

class UnstopBot(BrowserBot):
    def __init__(self, log_callback=None):
        super().__init__(portal_name="Unstop", log_callback=log_callback)
