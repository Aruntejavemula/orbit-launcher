from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from database import get_db
from models import AppItem
from schemas.app import AppCreate, AppUpdate, AppResponse, ReorderItem
from auth.jwt import get_current_user_id
import uuid

router = APIRouter()


def _active_apps(user_id: str, db: Session):
    return db.query(AppItem).filter(AppItem.user_id == user_id, AppItem.is_deleted == False)  # noqa: E712


def _get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session) -> AppItem:
    app = _active_apps(user_id, db).filter(AppItem.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")
    return app


@router.get("", response_model=List[AppResponse])
def list_apps(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return _active_apps(user_id, db).order_by(AppItem.display_order).limit(200).all()


@router.post("", response_model=AppResponse, status_code=status.HTTP_201_CREATED)
def create_app(body: AppCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    max_order = _active_apps(user_id, db).count()
    data = body.model_dump()
    data["url"] = str(data["url"])
    if data.get("manage_url"):
        data["manage_url"] = str(data["manage_url"])
    app = AppItem(**data, user_id=user_id, display_order=max_order)
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.patch("/{app_id}", response_model=AppResponse)
def update_app(app_id: uuid.UUID, body: AppUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    app = _get_app_or_404(app_id, user_id, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        if field in ("url", "manage_url") and value is not None:
            value = str(value)
        setattr(app, field, value)
    db.commit()
    db.refresh(app)
    return app


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_app(app_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    app = _get_app_or_404(app_id, user_id, db)
    app.is_deleted = True
    app.deleted_at = datetime.now(timezone.utc)
    db.commit()


@router.post("/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_apps(items: List[ReorderItem], user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    for item in items:
        _active_apps(user_id, db).filter(AppItem.id == item.id).update({"display_order": item.order})
    db.commit()


@router.post("/{app_id}/launch", response_model=AppResponse)
def launch_app(app_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    from models import LaunchEvent
    app = _get_app_or_404(app_id, user_id, db)
    app.last_opened_at = datetime.now(timezone.utc)
    event = LaunchEvent(user_id=user_id, app_id=app_id)
    db.add(event)
    db.commit()
    db.refresh(app)
    return app
