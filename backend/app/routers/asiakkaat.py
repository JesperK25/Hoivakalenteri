from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_accessible_asiakas_ids, get_current_user, require_role
from ..database import get_db
from ..models import Asiakas, Role, User
from ..schemas import AsiakasCreate, AsiakasOut, AsiakasUpdate

router = APIRouter(prefix="/asiakkaat", tags=["asiakkaat"])


@router.get("/", response_model=list[AsiakasOut])
def list_asiakkaat(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accessible_ids = get_accessible_asiakas_ids(current_user, db)
    query = db.query(Asiakas)
    if accessible_ids is not None:
        query = query.filter(Asiakas.id.in_(accessible_ids))
    return query.order_by(Asiakas.full_name).all()


@router.get("/{asiakas_id}", response_model=AsiakasOut)
def get_asiakas(
    asiakas_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accessible_ids = get_accessible_asiakas_ids(current_user, db)
    if accessible_ids is not None and asiakas_id not in accessible_ids:
        raise HTTPException(status_code=404, detail="Asiakasta ei löytynyt")
    asiakas = db.query(Asiakas).filter(Asiakas.id == asiakas_id).first()
    if asiakas is None:
        raise HTTPException(status_code=404, detail="Asiakasta ei löytynyt")
    return asiakas


@router.post("/", response_model=AsiakasOut, dependencies=[Depends(require_role(Role.esimies))])
def create_asiakas(payload: AsiakasCreate, db: Session = Depends(get_db)):
    asiakas = Asiakas(**payload.model_dump())
    db.add(asiakas)
    db.commit()
    db.refresh(asiakas)
    return asiakas


@router.patch("/{asiakas_id}", response_model=AsiakasOut, dependencies=[Depends(require_role(Role.esimies))])
def update_asiakas(asiakas_id: int, payload: AsiakasUpdate, db: Session = Depends(get_db)):
    asiakas = db.query(Asiakas).filter(Asiakas.id == asiakas_id).first()
    if asiakas is None:
        raise HTTPException(status_code=404, detail="Asiakasta ei löytynyt")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(asiakas, field, value)
    db.commit()
    db.refresh(asiakas)
    return asiakas
