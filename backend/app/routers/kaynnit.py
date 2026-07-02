from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_accessible_asiakas_ids, get_current_user, require_role
from ..database import get_db
from ..models import Asiakas, AsiakasLinkki, Kaynti, Role, User
from ..schemas import KayntiCreate, KayntiOut, KayntiUpdate

router = APIRouter(prefix="/kaynnit", tags=["kaynnit"])


def _scoped_query(current_user: User, db: Session):
    query = db.query(Kaynti).options(
        joinedload(Kaynti.asiakas),
        joinedload(Kaynti.tyontekija),
        joinedload(Kaynti.poikkeus),
    )
    if current_user.role == Role.esimies:
        return query
    if current_user.role == Role.tyontekija:
        return query.filter(Kaynti.tyontekija_id == current_user.id)
    accessible_ids = get_accessible_asiakas_ids(current_user, db)
    return query.filter(Kaynti.asiakas_id.in_(accessible_ids or set()))


@router.get("/", response_model=list[KayntiOut])
def list_kaynnit(
    start: Optional[date] = None,
    end: Optional[date] = None,
    asiakas_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = _scoped_query(current_user, db)
    if start is not None:
        query = query.filter(Kaynti.date >= start)
    if end is not None:
        query = query.filter(Kaynti.date <= end)
    if asiakas_id is not None:
        query = query.filter(Kaynti.asiakas_id == asiakas_id)
    return query.order_by(Kaynti.date, Kaynti.start_time).all()


@router.get("/{kaynti_id}", response_model=KayntiOut)
def get_kaynti(
    kaynti_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kaynti = _scoped_query(current_user, db).filter(Kaynti.id == kaynti_id).first()
    if kaynti is None:
        raise HTTPException(status_code=404, detail="Käyntiä ei löytynyt")
    return kaynti


@router.post("/", response_model=KayntiOut, dependencies=[Depends(require_role(Role.esimies))])
def create_kaynti(payload: KayntiCreate, db: Session = Depends(get_db)):
    asiakas = db.query(Asiakas).filter(Asiakas.id == payload.asiakas_id).first()
    if asiakas is None:
        raise HTTPException(status_code=400, detail="Asiakasta ei löytynyt")
    if payload.tyontekija_id is not None:
        linked = db.query(AsiakasLinkki).filter(
            AsiakasLinkki.user_id == payload.tyontekija_id,
            AsiakasLinkki.asiakas_id == payload.asiakas_id,
        ).first()
        if linked is None:
            raise HTTPException(status_code=400, detail="Työntekijä ei ole liitetty tähän asiakkaaseen")
    kaynti = Kaynti(**payload.model_dump())
    db.add(kaynti)
    db.commit()
    db.refresh(kaynti)
    return kaynti


@router.patch("/{kaynti_id}", response_model=KayntiOut, dependencies=[Depends(require_role(Role.esimies))])
def update_kaynti(kaynti_id: int, payload: KayntiUpdate, db: Session = Depends(get_db)):
    kaynti = db.query(Kaynti).filter(Kaynti.id == kaynti_id).first()
    if kaynti is None:
        raise HTTPException(status_code=404, detail="Käyntiä ei löytynyt")
    updates = payload.model_dump(exclude_unset=True)
    if "tyontekija_id" in updates and updates["tyontekija_id"] is not None:
        linked = db.query(AsiakasLinkki).filter(
            AsiakasLinkki.user_id == updates["tyontekija_id"],
            AsiakasLinkki.asiakas_id == kaynti.asiakas_id,
        ).first()
        if linked is None:
            raise HTTPException(status_code=400, detail="Työntekijä ei ole liitetty tähän asiakkaaseen")
    for field, value in updates.items():
        setattr(kaynti, field, value)
    db.commit()
    db.refresh(kaynti)
    return kaynti
