from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import engine, get_db
import app.models as models
import app.schemas as schemas
from fastapi import File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from app.services.ocr import DESKOScannerService

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Visitor Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.auth import get_password_hash, verify_password, create_access_token, get_current_user, require_role
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import app.auth as auth

@app.on_event("startup")
def populate_db():
    db = next(get_db())
    if db.query(models.AccessLevel).count() == 0:
        default_levels = [
            models.AccessLevel(name="Lobby Only", lenel_id="LOBBY_100", description="Access to lobby area"),
            models.AccessLevel(name="Standard Visitor", lenel_id="VISITOR_200", description="Access to meeting rooms"),
            models.AccessLevel(name="VIP", lenel_id="VIP_300", description="Escorted all access"),
        ]
        db.add_all(default_levels)
        db.commit()

    if db.query(models.User).filter(models.User.username == "admin").count() == 0:
        admin_user = models.User(
            username="admin",
            hashed_password=get_password_hash("admin"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()

# Auth Endpoints
@app.post("/api/auth/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# Admin Only - Create Users
@app.post("/api/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_role("admin"))):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    new_user = models.User(
        username=user.username,
        role=user.role,
        hashed_password=get_password_hash(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/users", response_model=List[schemas.User])
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(require_role("admin"))):
    return db.query(models.User).all()

@app.put("/api/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_role("admin"))):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.username:
        # Check if new username is taken by another user
        existing = db.query(models.User).filter(models.User.username == user_update.username, models.User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        db_user.username = user_update.username

    if user_update.role:
        db_user.role = user_update.role

    if user_update.password:
        db_user.hashed_password = get_password_hash(user_update.password)

    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_role("admin"))):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete default admin user")

    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}

@app.get("/api/access-levels", response_model=List[schemas.AccessLevel])
def get_access_levels(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.AccessLevel).all()

# Admin Only - Fetch Access Levels directly from Lenel system
@app.get("/api/admin/lenel-access-levels", response_model=List[Dict])
def fetch_lenel_access_levels(current_user: models.User = Depends(require_role("admin"))):
    from app.services.lenel import LenelDataConduITService
    lenel = LenelDataConduITService()
    return lenel.fetch_all_access_levels()

from typing import Dict, List, Optional

# Admin Only - Save a Lenel Access Level to Local DB
@app.post("/api/admin/access-levels", response_model=schemas.AccessLevel)
def add_access_level(level: schemas.AccessLevelBase, db: Session = Depends(get_db), current_user: models.User = Depends(require_role("admin"))):
    db_level = db.query(models.AccessLevel).filter(models.AccessLevel.lenel_id == level.lenel_id).first()
    if db_level:
        raise HTTPException(status_code=400, detail="Access level already exists")
    new_level = models.AccessLevel(**level.dict())
    db.add(new_level)
    db.commit()
    db.refresh(new_level)
    return new_level

@app.post("/api/scan", response_model=Dict)
async def scan_id(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    """
    Endpoint that simulates DESKO ICON scanning an ID.
    Accepts an image and uses Tesseract OCR to extract fields.
    """
    try:
        content = await file.read()
        ocr_service = DESKOScannerService()
        extracted_data = ocr_service.scan_id(content)
        return {"success": True, "data": extracted_data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/visitors", response_model=schemas.Visitor)
def create_visitor(visitor: schemas.VisitorCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_visitor = models.Visitor(
        name=visitor.name,
        guest_of=visitor.guest_of,
        national_id=visitor.national_id,
        office_branch=visitor.office_branch,
        start_time=visitor.start_time,
        end_time=visitor.end_time,
        address=visitor.address,
        nationality=visitor.nationality,
        car_plate=visitor.car_plate,
        car_model=visitor.car_model,
        purpose_of_visit=visitor.purpose_of_visit,
        passport_id=visitor.passport_id,
        comments=visitor.comments
    )
    db.add(db_visitor)
    db.commit()
    db.refresh(db_visitor)

    # Lenel Integration
    from app.services.lenel import LenelDataConduITService
    lenel_service = LenelDataConduITService()

    try:
        # Create Cardholder
        visitor_data = {
            "name": visitor.name,
            "national_id": visitor.national_id,
        }
        card_id = lenel_service.create_cardholder(visitor_data)
        db_visitor.lenel_card_id = card_id

        # Assign Access Level if selected
        if visitor.selected_access_level_id:
            lenel_service.assign_access_level(card_id, visitor.selected_access_level_id)

        db_visitor.is_synchronized = True
        db.commit()
    except Exception as e:
        # Log failure, maybe a retry queue in a real system
        print(f"Failed to sync with Lenel OnGuard: {e}")

    return db_visitor

@app.get("/api/visitors/history", response_model=Dict)
def get_visitors_history(
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Visitor)

    if search:
        # Search across multiple fields
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Visitor.name.ilike(search_filter)) |
            (models.Visitor.national_id.ilike(search_filter)) |
            (models.Visitor.guest_of.ilike(search_filter)) |
            (models.Visitor.office_branch.ilike(search_filter)) |
            (models.Visitor.car_plate.ilike(search_filter))
        )

    total = query.count()
    visitors = query.order_by(models.Visitor.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": visitors,
        "skip": skip,
        "limit": limit
    }