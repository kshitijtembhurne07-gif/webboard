from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="member")  # 'admin' or 'member'
    department = Column(String(50), nullable=False, default="CSE") # 'CSE', 'IT', 'Exams', 'Admin', 'Mechanical'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    notices_created = relationship("Notice", back_populates="creator", foreign_keys="Notice.created_by")
    reads = relationship("NoticeRead", back_populates="user", cascade="all, delete-orphan")


class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False, default="regular")  # 'urgent' or 'regular'
    department_tag = Column(String(50), nullable=False, default="All Departments") # 'All Departments', 'CSE', 'IT', 'Exams', 'Admin'
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    creator = relationship("User", back_populates="notices_created", foreign_keys=[created_by])
    reads = relationship("NoticeRead", back_populates="notice", cascade="all, delete-orphan")


class NoticeRead(Base):
    __tablename__ = "notice_reads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    notice_id = Column(Integer, ForeignKey("notices.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("notice_id", "user_id", name="uq_notice_user_read"),
    )

    notice = relationship("Notice", back_populates="reads")
    user = relationship("User", back_populates="reads")


class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    day_of_week = Column(String(20), nullable=False)  # 'Monday', 'Tuesday', etc.
    start_time = Column(String(10), nullable=False)   # '09:00'
    end_time = Column(String(10), nullable=False)     # '10:00'
    title = Column(String(150), nullable=False)
    department = Column(String(50), nullable=False)   # 'CSE', 'IT', 'All Departments'
    room = Column(String(50), nullable=False)         # 'Lab 301', 'Auditorium', 'Hall B'
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    updater = relationship("User", foreign_keys=[updated_by])
