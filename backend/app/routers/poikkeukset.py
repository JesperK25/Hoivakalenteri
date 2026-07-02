from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import AsiakasLinkki, Kaynti, KayntiStatus, Poikkeus, Role, User
from ..schemas import PoikkeusCreate, PoikkeusOut

router = APIRouter(prefix="/poikkeukset", tags=["poikkeukset"])


def _can_manage_poikkeus(current_user: User, kaynti: Kaynti, db: Session) -> bool:
    if current_user.role == Role.esimies:
        return True
    if current_user.role != Role.omainen:
        return False
    linked = db.query(AsiakasLinkki).filter(
        AsiakasLinkki.user_id == current_user.id,
        AsiakasLinkki.asiakas_id == kaynti.asiakas_id,
    ).first()
    return linked is not None


@router.get("/", response_model=list[PoikkeusOut])
def list_poikkeukset(
    asiakas_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Poikkeus).join(Kaynti)
    if current_user.role == Role.esimies:
        pass
    elif current_user.role == Role.omainen:
        linked_ids = {
            row[0] for row in db.query(AsiakasLinkki.asiakas_id).filter(AsiakasLinkki.user_id == current_user.id)
        }
        query = query.filter(Kaynti.asiakas_id.in_(linked_ids or {-1}))
    else:
        query = query.filter(Kaynti.tyontekija_id == current_user.id)
    if asiakas_id is not None:
        query = query.filter(Kaynti.asiakas_id == asiakas_id)
    return query.order_by(Poikkeus.created_at.desc()).all()


@router.post("/", response_model=PoikkeusOut)
def create_poikkeus(
    payload: PoikkeusCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kaynti = db.query(Kaynti).filter(Kaynti.id == payload.kaynti_id).first()
    if kaynti is None:
        raise HTTPException(status_code=404, detail="Käyntiä ei löytynyt")
    if not _can_manage_poikkeus(current_user, kaynti, db):
        raise HTTPException(status_code=403, detail="Ei oikeuksia merkitä poikkeusta tälle käynnille")
    if kaynti.poikkeus is not None:
        raise HTTPException(status_code=400, detail="Käynnille on jo merkitty poikkeus")
    if payload.syy.value == "muu" and not payload.kuvaus:
        raise HTTPException(status_code=400, detail="Kuvaus vaaditaan kun syy on 'muu'")

    poikkeus = Poikkeus(
        kaynti_id=payload.kaynti_id,
        luonut_kayttaja_id=current_user.id,
        syy=payload.syy,
        kuvaus=payload.kuvaus,
    )
    kaynti.status = KayntiStatus.peruttu
    db.add(poikkeus)
    db.commit()
    db.refresh(poikkeus)
    return poikkeus


@router.delete("/{poikkeus_id}")
def delete_poikkeus(
    poikkeus_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    poikkeus = db.query(Poikkeus).filter(Poikkeus.id == poikkeus_id).first()
    if poikkeus is None:
        raise HTTPException(status_code=404, detail="Poikkeusta ei löytynyt")
    kaynti = db.query(Kaynti).filter(Kaynti.id == poikkeus.kaynti_id).first()

    is_original_reporter = poikkeus.luonut_kayttaja_id == current_user.id
    is_esimies = current_user.role == Role.esimies
    if not (is_original_reporter or is_esimies):
        raise HTTPException(status_code=403, detail="Ei oikeuksia poistaa tätä poikkeusta")

    db.delete(poikkeus)
    if kaynti is not None:
        kaynti.status = KayntiStatus.suunniteltu
    db.commit()
    return {"message": "Poikkeus poistettu"}
