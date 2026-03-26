from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    username: str
    role: str = "operator"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class VisitorBase(BaseModel):
    name: str
    guest_of: str
    national_id: str
    office_branch: str
    start_time: datetime
    end_time: datetime

    address: Optional[str] = None
    nationality: Optional[str] = None
    car_plate: Optional[str] = None
    car_model: Optional[str] = None
    purpose_of_visit: Optional[str] = None
    passport_id: Optional[str] = None
    comments: Optional[str] = None

    # Receptionist Access Level selection
    selected_access_level_id: Optional[str] = None

class VisitorCreate(VisitorBase):
    pass

class Visitor(VisitorBase):
    id: int
    is_synchronized: bool
    lenel_card_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AccessLevelBase(BaseModel):
    lenel_id: str
    name: str
    description: Optional[str] = None

class AccessLevel(AccessLevelBase):
    id: int

    class Config:
        from_attributes = True