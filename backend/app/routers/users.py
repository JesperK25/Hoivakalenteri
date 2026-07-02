from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_password_hash, require_role
from ..database import get_db
from ..models import Asiakas, AsiakasLinkki, Role, User
from ..schemas import AsiakasLinkkiCreate, AsiakasLinkkiOut, AsiakasOut, UserCreate, UserOut, UserUpdate

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(require_role(Role.esimies))],
)


@router.get("/", response_model=list[UserOut])
def list_users(
    role: Optional[Role] = None,
    asiakas_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role is not None:
        query = query.filter(User.role == role)
    if asiakas_id is not None:
        query = query.join(AsiakasLinkki, AsiakasLinkki.user_id == User.id).filter(
            AsiakasLinkki.asiakas_id == asiakas_id
        )
    return query.order_by(User.full_name).all()


@router.post("/", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first() is not None:
        raise HTTPException(status_code=400, detail="Sähköposti on jo käytössä")
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Käyttäjää ei löytynyt")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}/links", response_model=list[AsiakasOut])
def list_links(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Asiakas)
        .join(AsiakasLinkki, AsiakasLinkki.asiakas_id == Asiakas.id)
        .filter(AsiakasLinkki.user_id == user_id)
        .order_by(Asiakas.full_name)
        .all()
    )


@router.post("/{user_id}/links", response_model=AsiakasLinkkiOut)
def create_link(user_id: int, payload: AsiakasLinkkiCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Käyttäjää ei löytynyt")
    existing = db.query(AsiakasLinkki).filter(
        AsiakasLinkki.user_id == user_id,
        AsiakasLinkki.asiakas_id == payload.asiakas_id,
    ).first()
    if existing is not None:
        return existing
    link = AsiakasLinkki(user_id=user_id, asiakas_id=payload.asiakas_id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.delete("/{user_id}/links/{asiakas_id}")
def delete_link(user_id: int, asiakas_id: int, db: Session = Depends(get_db)):
    link = db.query(AsiakasLinkki).filter(
        AsiakasLinkki.user_id == user_id,
        AsiakasLinkki.asiakas_id == asiakas_id,
    ).first()
    if link is None:
        raise HTTPException(status_code=404, detail="Linkkiä ei löytynyt")
    db.delete(link)
    db.commit()
    return {"message": "Linkki poistettu"}
