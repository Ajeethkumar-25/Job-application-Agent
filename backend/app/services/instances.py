from app.services.resume_analyzer import ResumeAnalyzer

# Global analyzer is stateless (no user data) — safe to share
analyzer = ResumeAnalyzer()

# NOTE: Tracker is NOT a global singleton anymore.
# Each user gets their own Tracker(user_id=...) instance created per request.

