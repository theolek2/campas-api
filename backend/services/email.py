"""
services/email.py — wysyłanie emaili przez SMTP (Resend lub dev mode).
"""
from config import settings


async def send_email(to: str, subject: str, body: str) -> bool:
    """Wyślij email. W trybie dev (brak SMTP_HOST) wypisuje na konsolę."""
    if not settings.SMTP_HOST:
        print(f"[EMAIL DEV] To: {to}\nSubject: {subject}\n{body}\n---")
        return True
    try:
        import aiosmtplib
        from email.mime.text import MIMEText

        msg = MIMEText(body, "plain", "utf-8")
        msg["From"]    = settings.SMTP_FROM
        msg["To"]      = to
        msg["Subject"] = subject

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            use_tls=settings.SMTP_PORT == 465,
            start_tls=settings.SMTP_PORT == 587,
        )
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {type(e).__name__}: {e}")
        return False


async def send_verification_email(to: str, token: str) -> bool:
    link = f"{settings.FRONTEND_URL}/login?verify={token}"
    return await send_email(
        to=to,
        subject="Zweryfikuj swój email — Campas",
        body=f"Kliknij link aby zweryfikować konto:\n{link}\n\nLink ważny 24 godziny.",
    )


async def send_reset_email(to: str, token: str) -> bool:
    link = f"{settings.FRONTEND_URL}/login?token={token}"
    return await send_email(
        to=to,
        subject="Reset hasła — Campas",
        body=f"Kliknij link aby ustawić nowe hasło:\n{link}\n\nLink ważny 1 godzinę.",
    )
