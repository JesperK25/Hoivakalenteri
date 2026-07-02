import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Date, Time, DateTime,
    Enum, ForeignKey, UniqueConstraint, func,
)
from sqlalchemy.orm import relationship
from .database import Base


class Role(str, enum.Enum):
    omainen = "omainen"
    tyontekija = "tyontekija"
    esimies = "esimies"


class KayntiStatus(str, enum.Enum):
    suunniteltu = "suunniteltu"
    peruttu = "peruttu"
    toteutunut = "toteutunut"


class PoikkeusSyy(str, enum.Enum):
    omainen_hakee = "omainen_hakee"
    asiakas_sairaalassa = "asiakas_sairaalassa"
    muu = "muu"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    linkit = relationship("AsiakasLinkki", back_populates="user", cascade="all, delete-orphan")
    kaynnit = relationship("Kaynti", back_populates="tyontekija", foreign_keys="Kaynti.tyontekija_id")
    poikkeukset = relationship("Poikkeus", back_populates="luonut_kayttaja")


class Asiakas(Base):
    __tablename__ = "asiakkaat"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    linkit = relationship("AsiakasLinkki", back_populates="asiakas", cascade="all, delete-orphan")
    kaynnit = relationship("Kaynti", back_populates="asiakas", cascade="all, delete-orphan")


class AsiakasLinkki(Base):
    __tablename__ = "asiakas_linkit"
    __table_args__ = (UniqueConstraint("user_id", "asiakas_id", name="uq_user_asiakas"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    asiakas_id = Column(Integer, ForeignKey("asiakkaat.id"), nullable=False)

    user = relationship("User", back_populates="linkit")
    asiakas = relationship("Asiakas", back_populates="linkit")


class Kaynti(Base):
    __tablename__ = "kaynnit"

    id = Column(Integer, primary_key=True, index=True)
    asiakas_id = Column(Integer, ForeignKey("asiakkaat.id"), nullable=False)
    tyontekija_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(Enum(KayntiStatus), nullable=False, default=KayntiStatus.suunniteltu)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    asiakas = relationship("Asiakas", back_populates="kaynnit")
    tyontekija = relationship("User", back_populates="kaynnit", foreign_keys=[tyontekija_id])
    poikkeus = relationship("Poikkeus", back_populates="kaynti", uselist=False, cascade="all, delete-orphan")


class Poikkeus(Base):
    __tablename__ = "poikkeukset"

    id = Column(Integer, primary_key=True, index=True)
    kaynti_id = Column(Integer, ForeignKey("kaynnit.id"), unique=True, nullable=False)
    luonut_kayttaja_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    syy = Column(Enum(PoikkeusSyy), nullable=False)
    kuvaus = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    kaynti = relationship("Kaynti", back_populates="poikkeus")
    luonut_kayttaja = relationship("User", back_populates="poikkeukset")
