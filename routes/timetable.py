from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_admin
from websocket_manager import ws_manager

router = APIRouter(prefix="/api/timetable", tags=["timetable"])

def slot_to_response(slot: models.TimetableSlot) -> dict:
    return {
        "id": slot.id,
        "day_of_week": slot.day_of_week,
        "start_time": slot.start_time,
        "end_time": slot.end_time,
        "title": slot.title,
        "department": slot.department,
        "room": slot.room,
        "updated_by": slot.updated_by,
        "updater_name": slot.updater.name if slot.updater else "Admin"
    }

@router.get("", response_model=List[schemas.TimetableSlotResponse])
def get_timetable_slots(
    day_of_week: Optional[str] = Query(None, description="Filter by day (e.g., 'Monday', 'Tuesday')"),
    department: Optional[str] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db)
):
    query = db.query(models.TimetableSlot)

    if day_of_week and day_of_week.lower() != "all":
        query = query.filter(models.TimetableSlot.day_of_week.ilike(day_of_week))
    
    if department and department.lower() != "all" and department.lower() != "all departments":
        query = query.filter(
            (models.TimetableSlot.department == department) |
            (models.TimetableSlot.department == "All Departments")
        )

    slots = query.order_by(models.TimetableSlot.start_time.asc()).all()
    return [slot_to_response(s) for s in slots]


@router.post("", response_model=schemas.TimetableSlotResponse, status_code=status.HTTP_201_CREATED)
async def create_timetable_slot(
    slot_in: schemas.TimetableSlotCreate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    new_slot = models.TimetableSlot(
        day_of_week=slot_in.day_of_week.capitalize(),
        start_time=slot_in.start_time,
        end_time=slot_in.end_time,
        title=slot_in.title,
        department=slot_in.department,
        room=slot_in.room,
        updated_by=current_admin.id
    )
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)

    resp = slot_to_response(new_slot)
    await ws_manager.broadcast({
        "type": "TIMETABLE_UPDATED",
        "action": "created",
        "slot": resp
    })

    return resp


@router.put("/{slot_id}", response_model=schemas.TimetableSlotResponse)
async def update_timetable_slot(
    slot_id: int,
    slot_in: schemas.TimetableSlotUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    slot = db.query(models.TimetableSlot).filter(models.TimetableSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Timetable slot not found")

    if slot_in.day_of_week is not None:
        slot.day_of_week = slot_in.day_of_week.capitalize()
    if slot_in.start_time is not None:
        slot.start_time = slot_in.start_time
    if slot_in.end_time is not None:
        slot.end_time = slot_in.end_time
    if slot_in.title is not None:
        slot.title = slot_in.title
    if slot_in.department is not None:
        slot.department = slot_in.department
    if slot_in.room is not None:
        slot.room = slot_in.room

    slot.updated_by = current_admin.id
    db.commit()
    db.refresh(slot)

    resp = slot_to_response(slot)
    await ws_manager.broadcast({
        "type": "TIMETABLE_UPDATED",
        "action": "updated",
        "slot": resp
    })

    return resp


@router.delete("/{slot_id}")
async def delete_timetable_slot(
    slot_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    slot = db.query(models.TimetableSlot).filter(models.TimetableSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Timetable slot not found")

    db.delete(slot)
    db.commit()

    await ws_manager.broadcast({
        "type": "TIMETABLE_UPDATED",
        "action": "deleted",
        "slot_id": slot_id
    })

    return {"status": "deleted", "slot_id": slot_id}
