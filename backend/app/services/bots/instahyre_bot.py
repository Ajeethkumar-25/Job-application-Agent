from app.services.bots.browser_bot import BrowserBot

class InstahyreBot(BrowserBot):
    def __init__(self, log_callback=None):
        super().__init__(portal_name="Instahyre", log_callback=log_callback)
