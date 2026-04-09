from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="operator")  # "admin" or "operator"
    is_active = Column(Boolean, default=True)


class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(Integer, primary_key=True, index=True)

    # Mandatory Fields
    name = Column(String, index=True, nullable=False)
    guest_of = Column(String, index=True, nullable=False)
    national_id = Column(String, index=True, nullable=False)
    office_branch = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    # Optional Fields
    address = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    nationality = Column(String, nullable=True)
    car_plate = Column(String, nullable=True)
    car_model = Column(String, nullable=True)
    purpose_of_visit = Column(String, nullable=True)
    passport_id = Column(String, nullable=True)
    comments = Column(String, nullable=True)

    # Lenel Integration State
    is_synchronized = Column(Boolean, default=False)
    lenel_card_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AccessLevel(Base):
    __tablename__ = "access_levels"

    id = Column(Integer, primary_key=True, index=True)
    lenel_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

class PreApprovalRequest(Base):
    __tablename__ = "pre_approvals"

    id = Column(Integer, primary_key=True, index=True)
    employee_username = Column(String, index=True, nullable=False)
    status = Column(String, index=True, default="pending")  # pending, approved, rejected

    national_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    id_image_filename = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CardPool(Base):
    __tablename__ = "card_pool"

    id = Column(Integer, primary_key=True, index=True)
    card_number = Column(String, unique=True, index=True, nullable=False)
    is_used = Column(Boolean, default=False)
