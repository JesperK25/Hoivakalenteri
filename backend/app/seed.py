"""Luo demokäyttäjät, asiakkaat ja käynnit paikallista kehitystä ja demoa varten.

Aja: python -m app.seed
"""
from datetime import date, time, timedelta

from .auth import get_password_hash
from .database import Base, SessionLocal, engine
from .models import Asiakas, AsiakasLinkki, Kaynti, Role, User

Base.metadata.create_all(bind=engine)

DEMO_PASSWORD = "demo1234"


def seed():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Kanta sisältää jo dataa, ohitetaan seedaus.")
            return

        esimies = User(
            email="esimies@hoivakalenteri.fi",
            hashed_password=get_password_hash(DEMO_PASSWORD),
            full_name="Elina Esimies",
            role=Role.esimies,
        )
        tyontekija1 = User(
            email="tyontekija1@hoivakalenteri.fi",
            hashed_password=get_password_hash(DEMO_PASSWORD),
            full_name="Timo Työntekijä",
            role=Role.tyontekija,
        )
        tyontekija2 = User(
            email="tyontekija2@hoivakalenteri.fi",
            hashed_password=get_password_hash(DEMO_PASSWORD),
            full_name="Terhi Työntekijä",
            role=Role.tyontekija,
        )
        omainen1 = User(
            email="omainen1@hoivakalenteri.fi",
            hashed_password=get_password_hash(DEMO_PASSWORD),
            full_name="Olli Omainen",
            role=Role.omainen,
        )
        omainen2 = User(
            email="omainen2@hoivakalenteri.fi",
            hashed_password=get_password_hash(DEMO_PASSWORD),
            full_name="Oona Omainen",
            role=Role.omainen,
        )
        db.add_all([esimies, tyontekija1, tyontekija2, omainen1, omainen2])
        db.flush()

        asiakas1 = Asiakas(full_name="Aino Asiakas", address="Kotikatu 1, Seinäjoki", notes="Avain naapurilla")
        asiakas2 = Asiakas(full_name="Antti Asiakas", address="Mäntytie 5, Seinäjoki")
        db.add_all([asiakas1, asiakas2])
        db.flush()

        db.add_all([
            AsiakasLinkki(user_id=omainen1.id, asiakas_id=asiakas1.id),
            AsiakasLinkki(user_id=omainen2.id, asiakas_id=asiakas2.id),
            AsiakasLinkki(user_id=tyontekija1.id, asiakas_id=asiakas1.id),
            AsiakasLinkki(user_id=tyontekija1.id, asiakas_id=asiakas2.id),
            AsiakasLinkki(user_id=tyontekija2.id, asiakas_id=asiakas1.id),
        ])

        today = date.today()
        visit_slots = [
            (asiakas1.id, tyontekija1.id, time(9, 0), time(9, 45)),
            (asiakas2.id, tyontekija2.id, time(11, 0), time(11, 30)),
        ]
        for day_offset in range(-3, 11):
            visit_date = today + timedelta(days=day_offset)
            for asiakas_id, tyontekija_id, start_time, end_time in visit_slots:
                db.add(Kaynti(
                    asiakas_id=asiakas_id,
                    tyontekija_id=tyontekija_id,
                    date=visit_date,
                    start_time=start_time,
                    end_time=end_time,
                ))

        db.commit()
        print("Seedaus valmis. Demokäyttäjät (salasana kaikille: demo1234):")
        print("  esimies@hoivakalenteri.fi")
        print("  tyontekija1@hoivakalenteri.fi / tyontekija2@hoivakalenteri.fi")
        print("  omainen1@hoivakalenteri.fi / omainen2@hoivakalenteri.fi")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
