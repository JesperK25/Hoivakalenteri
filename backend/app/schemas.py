from datetime import date, time, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from .models import Role, KayntiStatus, PoikkeusSyy


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Role
    phone: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: Role
    phone: Optional[str] = None
    is_active: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role


class AsiakasCreate(BaseModel):
    full_name: str
    address: Optional[str] = None
    birth_date: Optional[date] = None
    notes: Optional[str] = None


class AsiakasUpdate(BaseModel):
    full_name: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    notes: Optional[str] = None


class AsiakasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    address: Optional[str] = None
    birth_date: Optional[date] = None
    notes: Optional[str] = None


class AsiakasLinkkiCreate(BaseModel):
    asiakas_id: int


class AsiakasLinkkiOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    asiakas_id: int


class KayntiCreate(BaseModel):
    asiakas_id: int
    tyontekija_id: Optional[int] = None
    date: date
    start_time: time
    end_time: time
    notes: Optional[str] = None


class KayntiUpdate(BaseModel):
    tyontekija_id: Optional[int] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[KayntiStatus] = None
    notes: Optional[str] = None


class PoikkeusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kaynti_id: int
    luonut_kayttaja_id: int
    syy: PoikkeusSyy
    kuvaus: Optional[str] = None
    created_at: datetime


class KayntiOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asiakas_id: int
    tyontekija_id: Optional[int] = None
    date: date
    start_time: time
    end_time: time
    status: KayntiStatus
    notes: Optional[str] = None
    asiakas: AsiakasOut
    tyontekija: Optional[UserOut] = None
    poikkeus: Optional[PoikkeusOut] = None


class PoikkeusCreate(BaseModel):
    kaynti_id: int
    syy: PoikkeusSyy
    kuvaus: Optional[str] = None
