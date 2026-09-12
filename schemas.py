from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    email: str
    role: str = "member"
    department: str = "CSE"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Notice Schemas ---
class NoticeBase(BaseModel):
    title: str
    content: str
    priority: str = "regular"  # 'urgent' or 'regular'
    department_tag: str = "All Departments"
    expires_at: Optional[datetime] = None

class NoticeCreate(NoticeBase):
    immediate_push: bool = True

class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    department_tag: Optional[str] = None
    expires_at: Optional[datetime] = None

class NoticeResponse(NoticeBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    creator_name: Optional[str] = None
    read_count: int = 0
    total_members: int = 0
    is_read_by_me: bool = False
    my_read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Read Receipts Schemas ---
class ReadReceiptMember(BaseModel):
    user_id: int
    name: str
    email: str
    department: str
    read_at: Optional[datetime] = None

class NoticeReadsAnalytics(BaseModel):
    notice_id: int
    notice_title: str
    total_members: int
    seen_count: int
    unread_count: int
    seen_members: List[ReadReceiptMember]
    unread_members: List[ReadReceiptMember]


# --- Timetable Schemas ---
class TimetableSlotBase(BaseModel):
    day_of_week: str  # 'Monday', 'Tuesday', ...
    start_time: str   # '09:00'
    end_time: str     # '10:00'
    title: str
    department: str
    room: str

class TimetableSlotCreate(TimetableSlotBase):
    pass

class TimetableSlotUpdate(BaseModel):
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    room: Optional[str] = None

class TimetableSlotResponse(TimetableSlotBase):
    id: int
    updated_by: Optional[int] = None
    updater_name: Optional[str] = None

    class Config:
        from_attributes = True
