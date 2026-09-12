from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_user, get_current_admin, get_optional_current_user
from websocket_manager import ws_manager

router = APIRouter(prefix="/api/notices", tags=["notices"])

def notice_to_dict(notice: models.Notice, current_user: Optional[models.User], total_members: int) -> dict:
    # Read status
    read_entries = notice.reads
    read_count = len(read_entries)
    
    is_read = False
    my_read_at = None
    if current_user:
        for r in read_entries:
            if r.user_id == current_user.id:
                is_read = True
                my_read_at = r.read_at
                break

    return {
        "id": notice.id,
        "title": notice.title,
        "content": notice.content,
        "priority": notice.priority,
        "department_tag": notice.department_tag,
        "created_by": notice.created_by,
        "creator_name": notice.creator.name if notice.creator else "System Admin",
        "created_at": notice.created_at,
        "expires_at": notice.expires_at,
        "read_count": read_count,
        "total_members": total_members,
        "is_read_by_me": is_read,
        "my_read_at": my_read_at
    }

@router.get("", response_model=List[schemas.NoticeResponse])
def get_notices(
    priority: Optional[str] = Query(None, description="Filter by 'urgent' or 'regular'"),
    department: Optional[str] = Query(None, description="Filter by department"),
    search: Optional[str] = Query(None, description="Search keyword in title or content"),
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Notice)

    if priority:
        query = query.filter(models.Notice.priority == priority.lower())
    if department and department.lower() != "all" and department.lower() != "all departments":
        query = query.filter(
            (models.Notice.department_tag == department) | 
            (models.Notice.department_tag == "All Departments")
        )
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.Notice.title.ilike(search_pattern)) | 
            (models.Notice.content.ilike(search_pattern))
        )

    # Order: urgent first, then newest
    notices = query.order_by(
        models.Notice.priority.desc(),
        models.Notice.created_at.desc()
    ).all()

    total_members = db.query(models.User).filter(models.User.role == "member").count()

    return [notice_to_dict(n, current_user, total_members) for n in notices]


@router.post("", response_model=schemas.NoticeResponse, status_code=status.HTTP_201_CREATED)
async def create_notice(
    notice_in: schemas.NoticeCreate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    new_notice = models.Notice(
        title=notice_in.title,
        content=notice_in.content,
        priority=notice_in.priority.lower(),
        department_tag=notice_in.department_tag,
        expires_at=notice_in.expires_at,
        created_by=current_admin.id,
        created_at=datetime.utcnow()
    )
    db.add(new_notice)
    db.commit()
    db.refresh(new_notice)

    total_members = db.query(models.User).filter(models.User.role == "member").count()
    resp = notice_to_dict(new_notice, current_admin, total_members)
    
    # WebSocket Real-Time Broadcast
    serialized_notice = {
        "id": resp["id"],
        "title": resp["title"],
        "content": resp["content"],
        "priority": resp["priority"],
        "department_tag": resp["department_tag"],
        "created_by": resp["created_by"],
        "creator_name": resp["creator_name"],
        "created_at": resp["created_at"].isoformat() if resp["created_at"] else None,
        "expires_at": resp["expires_at"].isoformat() if resp["expires_at"] else None,
        "read_count": 0,
        "total_members": total_members,
        "is_read_by_me": False
    }

    if new_notice.priority == "urgent" and notice_in.immediate_push:
        await ws_manager.broadcast_urgent(serialized_notice)
    else:
        await ws_manager.broadcast_notice_update(serialized_notice, "NEW_NOTICE")

    return resp


@router.put("/{notice_id}", response_model=schemas.NoticeResponse)
async def update_notice(
    notice_id: int,
    notice_in: schemas.NoticeUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    if notice_in.title is not None:
        notice.title = notice_in.title
    if notice_in.content is not None:
        notice.content = notice_in.content
    if notice_in.priority is not None:
        notice.priority = notice_in.priority.lower()
    if notice_in.department_tag is not None:
        notice.department_tag = notice_in.department_tag
    if notice_in.expires_at is not None:
        notice.expires_at = notice_in.expires_at

    db.commit()
    db.refresh(notice)

    total_members = db.query(models.User).filter(models.User.role == "member").count()
    resp = notice_to_dict(notice, current_admin, total_members)
    
    # Broadcast notice edit update
    serialized_notice = {
        "id": resp["id"],
        "title": resp["title"],
        "content": resp["content"],
        "priority": resp["priority"],
        "department_tag": resp["department_tag"],
        "creator_name": resp["creator_name"],
        "created_at": resp["created_at"].isoformat() if resp["created_at"] else None,
        "expires_at": resp["expires_at"].isoformat() if resp["expires_at"] else None,
        "read_count": resp["read_count"],
        "total_members": total_members
    }
    await ws_manager.broadcast_notice_update(serialized_notice, "NOTICE_UPDATED")

    return resp


@router.delete("/{notice_id}")
async def delete_notice(
    notice_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    db.delete(notice)
    db.commit()

    # Broadcast notice deletion
    await ws_manager.broadcast({
        "type": "NOTICE_DELETED",
        "notice_id": notice_id
    })

    return {"status": "deleted", "notice_id": notice_id}


@router.post("/{notice_id}/read")
async def mark_notice_as_read(
    notice_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    existing_read = db.query(models.NoticeRead).filter(
        models.NoticeRead.notice_id == notice_id,
        models.NoticeRead.user_id == current_user.id
    ).first()

    now = datetime.utcnow()
    if not existing_read:
        new_read = models.NoticeRead(
            notice_id=notice_id,
            user_id=current_user.id,
            read_at=now
        )
        db.add(new_read)
        db.commit()
    else:
        now = existing_read.read_at

    # Calculate updated read counts
    total_members = db.query(models.User).filter(models.User.role == "member").count()
    read_count = db.query(models.NoticeRead).filter(models.NoticeRead.notice_id == notice_id).count()

    # Broadcast live read receipt update to connected admins
    await ws_manager.broadcast_read_receipt(
        notice_id=notice_id,
        read_count=read_count,
        total_members=total_members,
        user_name=current_user.name,
        department=current_user.department
    )

    return {
        "status": "acknowledged",
        "notice_id": notice_id,
        "user_id": current_user.id,
        "read_at": now.isoformat()
    }


@router.get("/{notice_id}/reads", response_model=schemas.NoticeReadsAnalytics)
def get_notice_read_analytics(
    notice_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    # Get all members
    members = db.query(models.User).filter(models.User.role == "member").all()
    total_members = len(members)

    # Get all reads for this notice
    reads = db.query(models.NoticeRead).filter(models.NoticeRead.notice_id == notice_id).all()
    read_map = {r.user_id: r.read_at for r in reads}

    seen_members: List[schemas.ReadReceiptMember] = []
    unread_members: List[schemas.ReadReceiptMember] = []

    for m in members:
        if m.id in read_map:
            seen_members.append(schemas.ReadReceiptMember(
                user_id=m.id,
                name=m.name,
                email=m.email,
                department=m.department,
                read_at=read_map[m.id]
            ))
        else:
            unread_members.append(schemas.ReadReceiptMember(
                user_id=m.id,
                name=m.name,
                email=m.email,
                department=m.department,
                read_at=None
            ))

    # Sort seen by most recent read_at desc
    seen_members.sort(key=lambda x: x.read_at if x.read_at else datetime.min, reverse=True)

    return schemas.NoticeReadsAnalytics(
        notice_id=notice.id,
        notice_title=notice.title,
        total_members=total_members,
        seen_count=len(seen_members),
        unread_count=len(unread_members),
        seen_members=seen_members,
        unread_members=unread_members
    )
