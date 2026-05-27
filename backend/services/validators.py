"""
services/validators.py — polskie walidatory dla Pydantic.
Użycie w schema: field_validator / Annotated.
"""
import re
from datetime import date, datetime


# ── PESEL ──────────────────────────────────────────────────────────────────────

_PESEL_RE = re.compile(r"^\d{11}$")
_PESEL_WEIGHTS = (1, 3, 7, 9, 1, 3, 7, 9, 1, 3, 1)


def validate_pesel(raw: str) -> str:
    """Sprawdza format i sumę kontrolną PESEL. Zwraca wyczyszczony PESEL."""
    pesel = raw.strip()
    if not _PESEL_RE.match(pesel):
        raise ValueError("PESEL musi składać się z dokładnie 11 cyfr")
    digits = [int(c) for c in pesel]
    checksum = sum(w * d for w, d in zip(_PESEL_WEIGHTS, digits)) % 10
    if checksum != 0:
        raise ValueError("Nieprawidłowy PESEL — suma kontrolna się nie zgadza")
    return pesel


def extract_birth_date_from_pesel(pesel: str) -> date:
    """Wyciąga datę urodzenia z numeru PESEL. Podnosi ValueError jeśli nieprawidłowy."""
    digits = [int(c) for c in pesel]
    year = 1900 + digits[0] * 10 + digits[1]
    month = digits[2] * 10 + digits[3]
    day = digits[4] * 10 + digits[5]
    # Obsługa stuleci zakodowanych w miesiącu
    century_offsets = {80: 1800, 0: 1900, 20: 2000, 40: 2100, 60: 2200}
    for offset, base_year in century_offsets.items():
        if month > offset and month <= offset + 12:
            year = base_year + digits[0] * 10 + digits[1]
            month -= offset
            break
    return date(year, month, day)


# ── PL phone ───────────────────────────────────────────────────────────────────

_PL_PHONE_RE = re.compile(r"^(?:\+?48)?\s?(\d{3}\s?\d{3}\s?\d{3})$")


def validate_pl_phone(raw: str | None) -> str | None:
    """Waliduje polski numer telefonu. Akceptuje 9 cyfr, opcjonalnie +48 prefix.
    Zwraca wyczyszczony string (tylko cyfry) lub None."""
    if raw is None or not raw.strip():
        return None
    digits = re.sub(r"[^\d]", "", raw)
    if len(digits) == 11 and digits.startswith("48"):
        digits = digits[2:]
    if len(digits) != 9:
        raise ValueError("Numer telefonu musi mieć 9 cyfr (opcjonalnie +48)")
    return digits


# ── PL postal code ─────────────────────────────────────────────────────────────

_PL_POSTAL_RE = re.compile(r"^\d{2}-\d{3}$")


def validate_pl_postal_code(raw: str) -> str:
    """Waliduje polski kod pocztowy w formacie XX-XXX."""
    code = raw.strip()
    if not _PL_POSTAL_RE.match(code):
        raise ValueError("Kod pocztowy musi być w formacie XX-XXX (np. 00-001)")
    return code


# ── Polish name ────────────────────────────────────────────────────────────────

# Polskie litery: ĄĆĘŁŃÓŚŹŻ ąćęłńóśźż
_PL_NAME_RE = re.compile(r"^[a-zA-Z\u0104\u0106\u0118\u0141\u0143\u00D3\u015A\u0179\u017B\u0105\u0107\u0119\u0142\u0144\u00F3\u015B\u017A\u017C \-]+$")


def validate_pl_name(raw: str, field_name: str = "Imię/nazwisko") -> str:
    """Waliduje polskie imię/nazwisko."""
    name = raw.strip()
    if not name:
        raise ValueError(f"{field_name} nie może być puste")
    if len(name) > 100:
        raise ValueError(f"{field_name} może mieć maksymalnie 100 znaków")
    if not _PL_NAME_RE.match(name):
        raise ValueError(f"{field_name} może zawierać tylko litery, spacje i myślniki")
    return name


# ── Time HH:MM ─────────────────────────────────────────────────────────────────

_TIME_RE = re.compile(r"^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$")


def validate_time_hh_mm(raw: str | None) -> str | None:
    """Waliduje format HH:MM (00:00 - 23:59)."""
    if raw is None or not raw.strip():
        return None
    t = raw.strip()
    if not _TIME_RE.match(t):
        raise ValueError("Godzina musi być w formacie HH:MM (np. 14:30)")
    return t


def validate_time_range(start: str | None, end: str | None):
    """Sprawdza czy end > start w formacie HH:MM. Ignoruje jeśli któryś jest None."""
    if start and end and start >= end:
        raise ValueError("Godzina końca musi być późniejsza niż godzina początku")


# ── Date ───────────────────────────────────────────────────────────────────────

def validate_not_future(d: date | None) -> date | None:
    """Sprawdza czy data nie jest w przyszłości."""
    if d is None:
        return None
    if d > date.today():
        raise ValueError("Data nie może być w przyszłości")
    if d.year < 1900:
        raise ValueError("Data nie może być wcześniejsza niż rok 1900")
    return d


# ── Password complexity ────────────────────────────────────────────────────────

def validate_password(raw: str) -> str | None:
    """Pełna walidacja hasła: 10 znaków, 1 specjalny, 1 wielka, 1 mała, 1 cyfra."""
    if len(raw) < 10:
        return "Hasło musi mieć co najmniej 10 znaków"
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/`~]", raw):
        return "Hasło musi zawierać znak specjalny (!@#$%^&...)"
    if not re.search(r"[A-Z]", raw):
        return "Hasło musi zawierać co najmniej 1 wielką literę"
    if not re.search(r"[a-z]", raw):
        return "Hasło musi zawierać co najmniej 1 małą literę"
    if not re.search(r"\d", raw):
        return "Hasło musi zawierać co najmniej 1 cyfrę"
    return None


# ── Field validators do użycia z Pydantic Annotated / field_validator ──────────

def pl_phone_validator(v: str | None) -> str | None:
    return validate_pl_phone(v)


def pl_pesel_validator(v: str | None) -> str | None:
    if v is None or not v.strip():
        return None
    return validate_pesel(v)


def pl_name_validator(v: str, info) -> str:
    field = info.field_name.replace("_", " ").title() if hasattr(info, 'field_name') else "Imię/nazwisko"
    return validate_pl_name(v, field)
