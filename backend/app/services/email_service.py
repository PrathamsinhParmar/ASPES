import smtplib
import logging
import time
from email.message import EmailMessage
from email.utils import formataddr

from app.config import settings

logger = logging.getLogger("aspes")

def send_faculty_registration_email(
    faculty_email: str,
    faculty_name: str,
    faculty_username: str,
    faculty_password: str,
):
    """
    Sends a welcome email to a newly registered faculty member with login credentials.
    Runs synchronously via BackgroundTasks to avoid blocking the main thread.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
        logger.error(f"Failed to send email to {faculty_email}: SMTP config is incomplete. Host: {settings.SMTP_HOST}, User: {settings.SMTP_USERNAME}")
        return

    timestamp = str(time.time())
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body {{ 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #374151; 
                background-color: #f3f4f6;
                margin: 0;
                padding: 20px 0;
            }}
            .main-container {{ 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #ffffff;
                border-radius: 16px; 
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }}
            .header {{ 
                background: linear-gradient(90deg, #2563eb 0%, #dc2626 33%, #fbbf24 66%, #16a34a 100%); 
                padding: 30px 20px; 
                text-align: center; 
            }}
            .header h2 {{ 
                margin: 0; 
                color: #ffffff; 
                font-size: 22px;
                font-weight: 700;
                letter-spacing: -0.025em;
            }}
            .content {{ 
                padding: 30px 25px; 
            }}
            .greeting {{
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 16px;
            }}
            .description {{
                font-size: 15px;
                color: #4b5563;
                margin-bottom: 20px;
            }}
            .credentials {{ 
                background-color: #f9fafb; 
                padding: 20px; 
                border-radius: 12px; 
                margin: 25px 0; 
                border: 1px solid #e5e7eb;
            }}
            .credential-row {{
                margin-bottom: 12px;
            }}
            .credential-label {{
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                font-weight: 600;
                display: block;
                margin-bottom: 2px;
                font-size: 11px;
            }}
            .credential-value {{
                color: #111827;
                font-weight: 700;
                font-size: 15px;
                word-break: break-all;
            }}
            .alert-box {{
                background-color: #fffaf0;
                border-left: 4px solid #f59e0b;
                padding: 12px 15px;
                margin-bottom: 25px;
                border-radius: 4px;
            }}
            .alert-text {{
                font-size: 13px;
                color: #92400e;
                margin: 0;
            }}
            .btn-container {{
                text-align: center;
                margin: 30px 0 10px;
            }}
            .button {{ 
                display: inline-block; 
                padding: 14px 28px; 
                background-color: #4f46e5; 
                color: #ffffff !important; 
                text-decoration: none; 
                border-radius: 10px; 
                font-weight: 700; 
                font-size: 15px;
            }}
            .footer {{ 
                background-color: #f9fafb;
                padding: 25px 20px; 
                font-size: 12px; 
                color: #9ca3af; 
                text-align: center; 
                border-top: 1px solid #f3f4f6;
            }}
            @media only screen and (max-width: 600px) {{
                body {{ padding: 10px 0; }}
                .main-container {{ border-radius: 0; margin: 0 10px; }}
                .content {{ padding: 25px 15px; }}
                .header {{ padding: 25px 15px; }}
                .header h2 {{ font-size: 18px; }}
                .button {{ width: 80%; padding: 14px 0; }}
            }}
        </style>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f3f4f6; padding: 20px 0; margin: 0;">
        <div class="main-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <div class="header" style="background: linear-gradient(90deg, #2563eb 0%, #dc2626 33%, #fbbf24 66%, #16a34a 100%); padding: 30px 20px; text-align: center;">
                <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.025em;">Welcome to ASPES KPGU</h2>
            </div>
            <div class="content" style="padding: 30px 25px;">
                <p class="greeting" style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 20px;">Dear {faculty_name},</p>
                <p class="description" style="font-size: 15px; color: #4b5563; margin-bottom: 20px;">An administrator has successfully registered your account for the <strong>AI Smart Academic Project Evaluation System (ASPES)</strong>.</p>
                
                <p style="font-size: 15px; color: #4b5563; margin-bottom: 20px;">
                    ASPES is designed to streamline the academic project evaluation process using advanced AI analysis. As a faculty member, you can now oversee project submissions, review AI-generated insights, and provide comprehensive feedback to students.
                </p>

                <p style="font-size: 15px; color: #111827; font-weight: 600; margin-bottom: 10px;">With your new dashboard, you can:</p>
                <ul style="font-size: 14px; color: #4b5563; padding-left: 20px; margin-bottom: 30px;">
                    <li style="margin-bottom: 8px;">Monitor student project submissions in real-time.</li>
                    <li style="margin-bottom: 8px;">Review AI-driven code quality and plagiarism reports.</li>
                    <li style="margin-bottom: 8px;">Assign grades and provide structured academic feedback.</li>
                    <li style="margin-bottom: 8px;">Track overall class performance and project metrics.</li>
                </ul>
                
                <div class="credentials" style="background-color: #f9fafb; padding: 24px; border-radius: 12px; margin: 30px 0; border: 1px solid #e5e7eb;">
                    <div class="credential-row" style="margin-bottom: 12px;">
                        <span class="credential-label" style="color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; display: block; font-size: 11px;">Official Email</span>
                        <span class="credential-value" style="color: #111827; font-weight: 700; font-size: 16px;">{faculty_email}</span>
                    </div>
                    <div class="credential-row" style="margin-bottom: 12px;">
                        <span class="credential-label" style="color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; display: block; font-size: 11px;">Username</span>
                        <span class="credential-value" style="color: #111827; font-weight: 700; font-size: 16px;">{faculty_username}</span>
                    </div>
                    <div class="credential-row">
                        <span class="credential-label" style="color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; display: block; font-size: 11px;">Temporary Password</span>
                        <span class="credential-value" style="color: #111827; font-weight: 700; font-size: 16px;">{faculty_password}</span>
                    </div>
                </div>
                
                <div class="alert-box" style="background-color: #fffaf0; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
                    <p class="alert-text" style="font-size: 13px; color: #92400e; margin: 0; font-style: italic;">
                        <strong>Security Notice:</strong> Please change this temporary password immediately after your first login via the Profile settings to ensure account integrity.
                    </p>
                </div>
                
                <div class="btn-container" style="text-align: center; margin: 40px 0 10px;">
                    <a href="{settings.FRONTEND_URL}" class="button" style="display: inline-block; padding: 14px 32px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px;">Access Dashboard</a>
                </div>
            </div>
            <div class="footer" style="background-color: #f9fafb; padding: 30px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6;">
                <p style="margin-bottom: 8px;">If you did not expect this invitation, please ignore this email or contact support.</p>
                <p style="margin-bottom: 8px;">&copy; 2026 ASPES KPGU System. All rights reserved.</p>
                <p style="font-size: 10px; color: #d1d5db; margin-top: 10px;">Reg ID: {timestamp}</p>
            </div>
        </div>
    </body>
    </html>
    """


    msg = EmailMessage()
    msg['Subject'] = "Welcome to ASPES KPGU - Faculty Account Details"
    msg['From'] = formataddr((settings.FROM_NAME, settings.FROM_EMAIL))
    msg['To'] = faculty_email
    
    msg.set_content(
        f"Dear {faculty_name},\n\nWelcome to ASPES KPGU.\n\n"
        f"An administrator has successfully registered your new Faculty Account.\n"
        f"Username: {faculty_username}\n"
        f"Email: {faculty_email}\n"
        f"Temporary Password: {faculty_password}\n"
        f"Reg ID: {timestamp}\n\n"
        f"Please log in at: {settings.FRONTEND_URL}\n\n"
        f"For security reasons, we strongly recommend changing this password immediately after your first login.\n"
    )
    msg.add_alternative(html_content, subtype='html')

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Welcome email successfully sent to faculty: {faculty_email}")
    except Exception as e:
        logger.error(f"Failed to send faculty registration email to {faculty_email}: {str(e)}")
