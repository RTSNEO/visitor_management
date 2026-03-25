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

@app.get("/api/access-levels", response_model=List[schemas.AccessLevel])
def get_access_levels(db: Session = Depends(get_db)):
    return db.query(models.AccessLevel).all()

@app.post("/api/scan", response_model=Dict)
async def scan_id(file: UploadFile = File(...)):
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
def create_visitor(visitor: schemas.VisitorCreate, db: Session = Depends(get_db)):
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