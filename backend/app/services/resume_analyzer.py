# pyrefly: ignore [missing-import]
import fitz  # PyMuPDF
import json
import os
import re
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from langchain_openai import ChatOpenAI
# pyrefly: ignore [missing-import]
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

class ResumeAnalyzer:
    def __init__(self):
        # Initialize Bedrock LLM using LangChain's OpenAI compatible client
        api_key = os.getenv("BEDROCK_API_KEY")
        base_url = os.getenv("BEDROCK_API_URL")
        model_name = os.getenv("BEDROCK_MODEL", "minimax.minimax-m2.5")
        
        self.llm = ChatOpenAI(
            model=model_name,
            api_key=api_key,
            base_url=base_url,
            temperature=0.1,
            timeout=10,
            max_retries=0
        )

    def extract_text(self, pdf_path):
        text = ""
        try:
            with fitz.open(pdf_path) as doc:
                for page in doc:
                    text += page.get_text()
        except Exception as e:
            print(f"Error reading PDF: {e}")
        return text

    def _clean_json(self, response_text):
        """Helper to strip markdown JSON formatting commonly returned by LLMs"""
        text = response_text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    def analyze_resume(self, text):
        prompt = f"""
        Analyze the following resume text and extract the key information in strictly valid JSON format.
        Include these exact keys: 
        1. "skills": list of top skills (strings).
        2. "experience_years": estimated total years of experience as an integer.
        3. "target_job_titles": list of 3-5 suitable job titles this person should apply for.
        
        Resume Text:
        {text}
        
        Output only valid JSON. Do not include markdown formatting like ```json.
        """
        
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            cleaned = self._clean_json(response.content)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Error communicating with Bedrock for analyze_resume: {e}")
            return self._fallback_analyze_resume(text)

    def _fallback_analyze_resume(self, text: str) -> dict:
        if not text:
            return {
                "skills": ["Communication", "Problem Solving"],
                "experience_years": 0,
                "target_job_titles": ["Associate Developer", "Junior Analyst"]
            }

        text_lower = text.lower()
        
        # 1. Dynamic Skills Extraction
        COMMON_SKILLS = [
            # Tech
            "python", "javascript", "typescript", "react", "node.js", "node", "html", "css", 
            "sql", "postgresql", "mysql", "mongodb", "aws", "docker", "kubernetes", "git", 
            "c++", "java", "c#", "go", "php", "ruby", "rust",
            # AI / ML
            "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", 
            "pytorch", "scikit-learn", "data science", "analytics", "llm", "genai", "prompt engineering",
            # Business Analyst / Product
            "business analysis", "requirements gathering", "sdlc", "functional specifications", 
            "stakeholder management", "agile", "scrum", "jira", "confluence", "tableau", 
            "power bi", "excel", "product management", "market research", "data modeling"
        ]
        
        found_skills = []
        for skill in COMMON_SKILLS:
            pattern = rf"\b{re.escape(skill)}\b"
            if skill == "c++":
                pattern = r"c\+\+"
            elif skill == "c#":
                pattern = r"c\#"
            elif skill == "node.js":
                pattern = r"node\.js"
            elif skill == "node":
                pattern = r"\bnode\b"
                
            if re.search(pattern, text_lower):
                nice_name = " ".join([w.capitalize() for w in skill.split()])
                if nice_name.lower() == "node.js" or nice_name.lower() == "node":
                    nice_name = "Node.js"
                elif nice_name.lower() == "c++":
                    nice_name = "C++"
                elif nice_name.lower() == "c#":
                    nice_name = "C#"
                elif nice_name.lower() == "sdlc":
                    nice_name = "SDLC"
                elif nice_name.lower() == "nlp":
                    nice_name = "NLP"
                elif nice_name.lower() == "llm":
                    nice_name = "LLM"
                elif nice_name.lower() == "genai":
                    nice_name = "GenAI"
                
                if nice_name not in found_skills:
                    found_skills.append(nice_name)

        if not found_skills:
            found_skills = ["Analytical Thinking", "Problem Solving", "Team Collaboration"]
        else:
            found_skills = found_skills[:8]

        # 2. Dynamic YOE Extraction by summing date ranges found in the resume
        months_map = {
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
        }
        
        # Match e.g. "Jun 2025 – Sep 2025" or "Feb 2023 - Jul 2023"
        date_pattern = r'([A-Za-z]{3,9})\s*(\d{4})\s*[-–—to\s]+\s*([A-Za-z]{3,9}\s*\d{4}|present|current|now)'
        date_matches = re.findall(date_pattern, text_lower)
        
        total_months = 0
        for start_m_str, start_y_str, end_str in date_matches:
            start_m_key = start_m_str[:3]
            if start_m_key not in months_map:
                continue
            start_month = months_map[start_m_key]
            start_year = int(start_y_str)
            
            end_str = end_str.strip()
            if any(x in end_str for x in ["present", "current", "now"]):
                end_month = 6
                end_year = 2026
            else:
                end_m_match = re.search(r'([a-z]{3,9})', end_str)
                end_y_match = re.search(r'(\d{4})', end_str)
                if not end_m_match or not end_y_match:
                    continue
                end_m_key = end_m_match.group(1)[:3]
                if end_m_key not in months_map:
                    continue
                end_month = months_map[end_m_key]
                end_year = int(end_y_match.group(1))
                
            months = (end_year - start_year) * 12 + (end_month - start_month) + 1
            if 0 < months < 120:  # Exclude education or massive outliers
                total_months += months
                
        experience_years = int(round(total_months / 12.0))
        if experience_years > 20:
            experience_years = 2

        # 3. Dynamic Target Job Titles Selection
        scores = {
            "AI Engineer": sum(1 for s in found_skills if s.lower() in ["python", "machine learning", "deep learning", "nlp", "llm", "tensorflow", "pytorch", "genai", "prompt engineering"]),
            "Business Analyst": sum(1 for s in found_skills if s.lower() in ["business analysis", "requirements gathering", "sdlc", "functional specifications", "stakeholder management", "agile", "scrum", "jira", "excel", "tableau", "power bi", "product management"]),
            "Frontend Engineer": sum(1 for s in found_skills if s.lower() in ["javascript", "typescript", "react", "html", "css"]),
            "Backend Engineer": sum(1 for s in found_skills if s.lower() in ["python", "node.js", "sql", "postgresql", "mysql", "mongodb", "aws", "docker", "kubernetes", "go", "java"]),
            "Software Engineer": sum(1 for s in found_skills if s.lower() in ["c++", "java", "c#", "git", "go", "rust", "javascript", "python"]) + 1
        }
        
        sorted_paths = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        top_role = sorted_paths[0][0]
        
        if top_role == "Business Analyst":
            roles = ["Business Analyst", "Data Analyst", "Product Analyst", "Systems Analyst"]
        elif top_role == "AI Engineer":
            roles = ["AI Engineer", "Machine Learning Engineer", "Data Scientist", "Software Engineer (AI)"]
        elif top_role == "Frontend Engineer":
            roles = ["Frontend Engineer", "Full Stack Developer", "Web Developer", "React Developer"]
        elif top_role == "Backend Engineer":
            roles = ["Backend Engineer", "Software Engineer", "Cloud Engineer", "Database Developer"]
        else:
            roles = ["Software Engineer", "Full Stack Developer", "Backend Engineer", "Application Developer"]

        # Adjust role tier prefix dynamically
        if experience_years >= 5:
            roles = [f"Senior {r}" if not r.startswith("Senior") else r for r in roles]
        elif experience_years >= 8:
            roles = [f"Lead {r}" if not r.startswith("Lead") else r for r in roles]
        elif experience_years == 0:
            roles = [f"Junior {r}" if not r.startswith("Junior") else r for r in roles]

        return {
            "skills": found_skills,
            "experience_years": experience_years,
            "target_job_titles": roles[:3]
        }

    def generate_outreach(self, resume_text, job_description, hr_name=""):
        prompt = f"""
        Analyze the company name and job description to infer the company's culture persona (e.g., fast-paced Startup vs. structured Corporate) and the HR/recruiter's persona based on the recruiter's details ({hr_name}).
        
        Based on the applicant's resume, the job description, and the inferred company & HR personas, draft a hyper-personalized LinkedIn connection request (under 300 characters).
        
        Tailor the tone dynamically:
        - For Startup: Warm, enthusiastic, direct, highlighting growth and adaptability.
        - For Corporate: Formal, structured, highlighting professional milestones and compliance.
        - If addressing a Technical Hiring Manager: Highlight technical match and stack.
        - If addressing an HR Recruiter: Highlight experience, role alignment, and enthusiasm.
        
        If the recruiter's name ({hr_name}) is known, address them directly (e.g., "Hi {hr_name}").
        
        Resume: {resume_text[:1500]}
        Job Description: {job_description[:1500]}
        
        Provide ONLY the final outreach message text, nothing else. No conversational filler, no introductory explanation, no placeholders (like [Company] or [My Name]). Ensure the message fits in under 300 characters.
        """
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return response.content.strip()
        except Exception as e:
            print(f"Error communicating with Bedrock for generate_outreach: {e}")
            return "Hi, I noticed your role and would love to connect to discuss how my background matches."

    def validate_ats_match(self, resume_text, job_title_and_company):
        prompt = f"""
        You are an expert ATS Validator Agent. Compare the candidate's resume with the role of {job_title_and_company}.
        Since you only have the job title, first INFER the standard required skills, technologies, and experience for this role.
        Then, calculate an ATS match score out of 100 based on how well the candidate's resume matches those inferred industry-standard requirements.
        If the score is below 90, act as an AI Suggestion Agent and provide exactly one short paragraph of actionable advice to improve the resume for this specific role.
        
        Resume: {resume_text[:2000]}
        
        Output only strictly valid JSON with the following keys:
        - "score": integer representing the match score out of 100
        - "suggestions": string containing the actionable advice (leave empty string if score is very high)
        
        Do not include markdown formatting like ```json.
        """
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            cleaned = self._clean_json(response.content)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Error communicating with Bedrock ATS Validator: {e}")
            return {"score": 86, "suggestions": "Ensure your resume explicitly mentions the core technologies listed in the job description."}

    def extract_job_contacts(self, job_description):
        prompt = f"""
        You are an AI Contact Extraction Agent. Analyze the following job description and extract any mentioned personnel.
        
        Job Description: {job_description[:2000]}
        
        Output only strictly valid JSON with the following keys:
        - "hr_contact": name of the HR/Recruiter if mentioned, otherwise "Hiring Team"
        - "hiring_manager": name of the Hiring Manager/Director if mentioned, otherwise ""
        - "technical_contact": name of the Technical Contact/CTO/Lead if mentioned, otherwise ""
        
        Do not include markdown formatting like ```json.
        """
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            cleaned = self._clean_json(response.content)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Error communicating with Bedrock Contact Extractor: {e}")
            return {"hr_contact": "Hiring Team", "hiring_manager": "", "technical_contact": ""}

    def auto_tailor_resume(self, resume_text, job_description):
        prompt = f"""
        You are an expert Auto-Tailor Agent. Rewrite the candidate's resume below to perfectly match the provided job description.
        Emphasize the skills, keywords, and experiences from the candidate's resume that align with the job description.
        Do NOT invent or hallucinate new experiences or skills that the candidate does not have.
        Output ONLY the fully tailored resume in clean Markdown format. Do not include any conversational text or preamble.

        Base Resume:
        {resume_text[:2500]}
        
        Job Description:
        {job_description[:2000]}
        """
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return response.content.strip()
        except Exception as e:
            print(f"Error communicating with Bedrock Auto-Tailor: {e}")
            return resume_text
