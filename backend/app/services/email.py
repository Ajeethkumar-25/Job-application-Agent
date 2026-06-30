import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from app.db.models import SMTPSettings

def send_application_list_email(to_email: str, excel_path: str, apps_list: list, db_settings: SMTPSettings = None) -> bool:
    """
    Sends the user's application tracker list to the specified email address.
    Includes an HTML summary table in the email body and attaches the full Excel sheet.
    """
    if db_settings:
        smtp_host = db_settings.smtp_host
        smtp_port_str = str(db_settings.smtp_port)
        smtp_user = db_settings.smtp_user
        smtp_password = db_settings.smtp_password
        smtp_from = db_settings.smtp_from or smtp_user
    else:
        smtp_host = os.environ.get("SMTP_HOST")
        smtp_port_str = os.environ.get("SMTP_PORT", "587")
        smtp_user = os.environ.get("SMTP_USER")
        smtp_password = os.environ.get("SMTP_PASSWORD")
        smtp_from = os.environ.get("SMTP_FROM", smtp_user)
    
    # Validation of SMTP Configuration
    missing_vars = []
    if not smtp_host:
        missing_vars.append("SMTP_HOST / Host")
    if not smtp_user:
        missing_vars.append("SMTP_USER / Username")
    if not smtp_password:
        missing_vars.append("SMTP_PASSWORD / Password")
        
    if missing_vars:
        if db_settings:
            raise ValueError(
                f"SMTP configuration in database is incomplete. Missing fields: {', '.join(missing_vars)}."
            )
        else:
            raise ValueError(
                f"SMTP configuration in .env is incomplete. Missing variables: {', '.join(missing_vars)}.\n"
                "Please configure your SMTP settings."
            )

        
    try:
        smtp_port = int(smtp_port_str)
    except ValueError:
        smtp_port = 587
        
    # Build Message
    msg = MIMEMultipart()
    msg['From'] = smtp_from
    msg['To'] = to_email
    msg['Subject'] = f"LinkerAI: Your Job Applications List ({datetime.now().strftime('%Y-%m-%d')})"
    
    # Calculate stats
    total_apps = len(apps_list)
    applied_count = len([a for a in apps_list if "Applied" in str(a.get("Application Status", ""))])
    skipped_count = len([a for a in apps_list if any(x in str(a.get("Application Status", "")) for x in ["Skipped", "Reject"])])
    other_count = total_apps - (applied_count + skipped_count)
    
    # Construct HTML Table Rows for top 15 applications
    table_rows = ""
    for app in apps_list[:15]:
        status = app.get("Application Status", "Pending")
        status_style = "padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;"
        
        # Color matching existing UI logic
        if "Applied" in status:
            status_style += "background-color: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.2);"
        elif "Redirect" in status:
            status_style += "background-color: rgba(59, 130, 246, 0.08); color: #3B82F6; border: 1px solid rgba(59, 130, 246, 0.2);"
        elif any(x in status for x in ["Reject", "Skipped"]):
            status_style += "background-color: rgba(239, 68, 68, 0.08); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2);"
        else:
            status_style += "background-color: rgba(79, 70, 229, 0.08); color: #4F46E5; border: 1px solid rgba(79, 70, 229, 0.15);"
            
        job_link = app.get("Job Link", "")
        job_title = app.get("Job Title", "Unknown Title")
        job_title_html = job_title
        if job_link:
            job_title_html = f"<a href='{job_link}' target='_blank' style='color: #4F46E5; text-decoration: none; font-weight: 600;'>{job_title}</a>"
            
        table_rows += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); color: #0F172A; font-weight: bold;">{app.get("Company", "Unknown Company")}</td>
            <td style="padding: 12px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); color: #64748B;">{job_title_html}</td>
            <td style="padding: 12px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); color: #64748B;">{app.get("Source", "LinkedIn")}</td>
            <td style="padding: 12px; border-bottom: 1px solid rgba(15, 23, 42, 0.08);"><span style="{status_style}">{status}</span></td>
            <td style="padding: 12px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); color: #64748B; font-size: 12px;">{app.get("Applied Date", "")}</td>
        </tr>
        """
        
    html_content = f"""
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; line-height: 1.6; margin: 0; padding: 20px; background-color: #F8FAFC;">
        <div style="max-width: 650px; margin: 0 auto; padding: 32px; border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 16px; background-color: #FFFFFF; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);">
            
            <!-- Header -->
            <div style="text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 24px; margin-bottom: 28px;">
                <h1 style="color: #4F46E5; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">LinkerAI Job Tracker</h1>
                <p style="margin: 6px 0 0 0; color: #64748B; font-size: 14px; font-weight: 500;">Your Autonomous Career Search Agent</p>
            </div>
            
            <p style="font-size: 15px; color: #0F172A;">Hello,</p>
            <p style="font-size: 15px; color: #64748B; margin-bottom: 24px;">Your requested job applications tracking report is ready. The complete report is attached as an Excel spreadsheet (`.xlsx`). Below is a summary of your application activities.</p>
            
            <!-- Summary Dashboard Card -->
            <div style="background: rgba(79, 70, 229, 0.03); border: 1px solid rgba(79, 70, 229, 0.1); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin-top: 0; margin-bottom: 16px; color: #0F172A; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Applications Dashboard</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748B;">Total Scanned/Tracked Jobs</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 800; color: #0F172A; font-size: 16px;">{total_apps}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748B;">Status: Applied</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 800; color: #10B981; font-size: 16px;">{applied_count}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748B;">Status: Skipped / Rejected</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 800; color: #EF4444; font-size: 16px;">{skipped_count}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748B;">Other Statuses</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 800; color: #4F46E5; font-size: 16px;">{other_count}</td>
                    </tr>
                </table>
            </div>
    """
    
    if apps_list:
        html_content += f"""
            <!-- Recent Table -->
            <h3 style="color: #0F172A; font-size: 15px; font-weight: 700; margin-top: 32px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Recent Applications</h3>
            <div style="overflow-x: auto; border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 10px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                    <thead>
                        <tr style="background-color: #F8FAFC; border-bottom: 1px solid rgba(15, 23, 42, 0.08);">
                            <th style="padding: 12px; color: #64748B; font-weight: 600;">Company</th>
                            <th style="padding: 12px; color: #64748B; font-weight: 600;">Job Title</th>
                            <th style="padding: 12px; color: #64748B; font-weight: 600;">Source</th>
                            <th style="padding: 12px; color: #64748B; font-weight: 600;">Status</th>
                            <th style="padding: 12px; color: #64748B; font-weight: 600;">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table_rows}
                    </tbody>
                </table>
            </div>
        """
        if total_apps > 15:
            html_content += f"""
            <p style='color: #64748B; font-size: 12px; font-style: italic; text-align: center; margin-top: 12px;'>
                Showing the most recent 15 applications. Please view the attached Excel file to see all {total_apps} records.
            </p>
            """
    else:
        html_content += """
        <p style="text-align: center; color: #64748B; padding: 20px; border: 1px dashed rgba(15, 23, 42, 0.15); border-radius: 10px; font-style: italic;">
            No applications tracked in this dashboard yet.
        </p>
        """
        
    html_content += """
            <!-- Footer -->
            <hr style="border: 0; border-top: 1px solid rgba(15, 23, 42, 0.08); margin: 36px 0 20px 0;" />
            <div style="text-align: center; color: #94A3B8; font-size: 11px;">
                <p style="margin: 0;">This report was compiled and sent by LinkerAI.</p>
                <p style="margin: 4px 0 0 0;">Manage your applications locally at <a href="http://localhost:5173" style="color: #4F46E5; text-decoration: none;">localhost:5173</a>.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(html_content, 'html'))
    
    # Attach the Excel Spreadsheet
    try:
        with open(excel_path, 'rb') as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename={os.path.basename(excel_path)}'
            )
            msg.attach(part)
    except Exception as e:
        raise IOError(f"Could not attach Excel export to email: {e}")
        
    # Connect and Send Email
    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            server.starttls()
            
        try:
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        finally:
            server.quit()
    except smtplib.SMTPAuthenticationError:
        raise RuntimeError(
            "Authentication failed. Please verify your SMTP_USER and SMTP_PASSWORD. "
            "If using Gmail, ensure you are using a 16-character App Password, not your regular password."
        )
    except (smtplib.SMTPConnectError, ConnectionRefusedError):
        raise RuntimeError(
            f"Could not connect to SMTP server at {smtp_host}:{smtp_port}. "
            "Please check host and port settings, and verify your network connection."
        )
    except Exception as e:
        raise RuntimeError(f"SMTP error occurred: {e}")
        
    return True
