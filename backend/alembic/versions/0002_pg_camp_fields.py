"""Expand camps table — all meta fields + app state JSONB

Revision ID: 0002_pg_camp_fields
Revises: 0001_pg
Create Date: 2026-06-03

Przenosi całe camp_meta z profiles do kolumn w camps.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0002_pg_camp_fields"
down_revision: Union[str, None] = "0001_pg"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Dane obozu (z meta) ─────────────────────────────────────────────────
    op.add_column("camps", sa.Column("kierownik",          sa.String(255), nullable=True))
    op.add_column("camps", sa.Column("miejsce",            sa.String(500), nullable=True))
    op.add_column("camps", sa.Column("termin",             sa.String(255), nullable=True))
    op.add_column("camps", sa.Column("tel_kierownik",      sa.String(20), nullable=True))
    op.add_column("camps", sa.Column("email",              sa.String(255), nullable=True))
    op.add_column("camps", sa.Column("powiat",             sa.String(100), nullable=True))
    op.add_column("camps", sa.Column("gmina",              sa.String(100), nullable=True))
    op.add_column("camps", sa.Column("wojewodztwo",        sa.String(100), nullable=True))
    op.add_column("camps", sa.Column("hufiec",             sa.String(255), nullable=True))
    op.add_column("camps", sa.Column("typ_obozu",          sa.String(100), nullable=True))
    op.add_column("camps", sa.Column("nadlesnictwo",       sa.String(255), nullable=True))
    op.add_column("camps", sa.Column("lesnictwo",          sa.String(255), nullable=True))
    op.add_column("camps", sa.Column("oddzial_lesny",      sa.String(255), nullable=True))
    op.add_column("camps", sa.Column("bezp_adres",         sa.String(500), nullable=True))
    op.add_column("camps", sa.Column("bezp_budynek",       sa.String(255), nullable=True))
    op.add_column("camps", sa.Column("bezp_miejscowosc",   sa.String(255), nullable=True))
    op.add_column("camps", sa.Column("lekarz",             sa.String(255), nullable=True))
    op.add_column("camps", sa.Column("szpital",            sa.String(500), nullable=True))
    op.add_column("camps", sa.Column("tel_szpital",        sa.String(20), nullable=True))
    op.add_column("camps", sa.Column("przychodnia",        sa.String(500), nullable=True))
    op.add_column("camps", sa.Column("tel_przychodnia",    sa.String(20), nullable=True))
    op.add_column("camps", sa.Column("psp",                sa.String(500), nullable=True))
    op.add_column("camps", sa.Column("psp_tel",            sa.String(20), nullable=True))
    op.add_column("camps", sa.Column("policja",            sa.String(500), nullable=True))
    op.add_column("camps", sa.Column("policja_tel",        sa.String(20), nullable=True))
    op.add_column("camps", sa.Column("komendant_tel",      sa.String(20), nullable=True))
    op.add_column("camps", sa.Column("tel_zastepca",       sa.String(20), nullable=True))
    op.add_column("camps", sa.Column("nr_zgloszenia",      sa.String(100), nullable=True))
    op.add_column("camps", sa.Column("data_zgloszenia",    sa.String(100), nullable=True))
    op.add_column("camps", sa.Column("uwagi",              sa.Text, nullable=True))
    op.add_column("camps", sa.Column("schronienie",        sa.String(500), nullable=True))
    op.add_column("camps", sa.Column("kontakt1",           sa.String(500), nullable=True))
    op.add_column("camps", sa.Column("kontakt2",           sa.String(500), nullable=True))
    op.add_column("camps", sa.Column("tel_kontakt1",       sa.String(20), nullable=True))
    op.add_column("camps", sa.Column("tel_kontakt2",       sa.String(20), nullable=True))
    op.add_column("camps", sa.Column("uczestnicy",         sa.Integer, nullable=True))
    op.add_column("camps", sa.Column("liczba_kadry",       sa.Integer, nullable=True))
    op.add_column("camps", sa.Column("wiek",               sa.String(50), nullable=True))

    # ── JSONB — zagnieżdżone dane z meta ────────────────────────────────────
    op.add_column("camps", sa.Column("coords",             JSONB, nullable=True))
    op.add_column("camps", sa.Column("wychowawcy",         JSONB, nullable=True))
    op.add_column("camps", sa.Column("nr_dzialki",         JSONB, nullable=True))

    # ── JSONB — stan aplikacji ──────────────────────────────────────────────
    op.add_column("camps", sa.Column("days_json",          JSONB, nullable=True))
    op.add_column("camps", sa.Column("activities_json",    JSONB, nullable=True))
    op.add_column("camps", sa.Column("template_json",      JSONB, nullable=True))
    op.add_column("camps", sa.Column("activity_log_json",  JSONB, nullable=True))
    op.add_column("camps", sa.Column("meal_template_json", JSONB, nullable=True))
    op.add_column("camps", sa.Column("meal_activities_json", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("camps", "meal_activities_json")
    op.drop_column("camps", "meal_template_json")
    op.drop_column("camps", "activity_log_json")
    op.drop_column("camps", "template_json")
    op.drop_column("camps", "activities_json")
    op.drop_column("camps", "days_json")
    op.drop_column("camps", "nr_dzialki")
    op.drop_column("camps", "wychowawcy")
    op.drop_column("camps", "coords")
    op.drop_column("camps", "wiek")
    op.drop_column("camps", "liczba_kadry")
    op.drop_column("camps", "uczestnicy")
    op.drop_column("camps", "tel_kontakt2")
    op.drop_column("camps", "tel_kontakt1")
    op.drop_column("camps", "kontakt2")
    op.drop_column("camps", "kontakt1")
    op.drop_column("camps", "schronienie")
    op.drop_column("camps", "uwagi")
    op.drop_column("camps", "data_zgloszenia")
    op.drop_column("camps", "nr_zgloszenia")
    op.drop_column("camps", "tel_zastepca")
    op.drop_column("camps", "komendant_tel")
    op.drop_column("camps", "policja_tel")
    op.drop_column("camps", "policja")
    op.drop_column("camps", "psp_tel")
    op.drop_column("camps", "psp")
    op.drop_column("camps", "tel_przychodnia")
    op.drop_column("camps", "przychodnia")
    op.drop_column("camps", "tel_szpital")
    op.drop_column("camps", "szpital")
    op.drop_column("camps", "lekarz")
    op.drop_column("camps", "bezp_miejscowosc")
    op.drop_column("camps", "bezp_budynek")
    op.drop_column("camps", "bezp_adres")
    op.drop_column("camps", "oddzial_lesny")
    op.drop_column("camps", "lesnictwo")
    op.drop_column("camps", "nadlesnictwo")
    op.drop_column("camps", "typ_obozu")
    op.drop_column("camps", "hufiec")
    op.drop_column("camps", "wojewodztwo")
    op.drop_column("camps", "gmina")
    op.drop_column("camps", "powiat")
    op.drop_column("camps", "email")
    op.drop_column("camps", "tel_kierownik")
    op.drop_column("camps", "termin")
    op.drop_column("camps", "miejsce")
    op.drop_column("camps", "kierownik")
