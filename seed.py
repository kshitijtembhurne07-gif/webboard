from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models
from auth import hash_password

def seed_database(db: Session):
    # Check if database already has users
    if db.query(models.User).count() > 0:
        print("Database already seeded. Skipping seed process.")
        return

    print("Seeding NoticePulse database with realistic accounts, notices, and timetable...")

    # 1. Create Users
    default_password = hash_password("member123")
    admin_password = hash_password("admin123")

    users_data = [
        {"name": "Dr. Sarah Jenkins", "email": "admin@test.com", "password": admin_password, "role": "admin", "department": "Admin"},
        {"name": "Alex Rivera", "email": "member@test.com", "password": default_password, "role": "member", "department": "CSE"},
        {"name": "Priya Patel", "email": "priya.patel@test.com", "password": default_password, "role": "member", "department": "IT"},
        {"name": "Marcus Chen", "email": "marcus.chen@test.com", "password": default_password, "role": "member", "department": "CSE"},
        {"name": "Elena Rostova", "email": "elena.rostova@test.com", "password": default_password, "role": "member", "department": "Exams"},
        {"name": "Devon Brooks", "email": "devon.brooks@test.com", "password": default_password, "role": "member", "department": "Mechanical"},
        {"name": "Aisha Khan", "email": "aisha.khan@test.com", "password": default_password, "role": "member", "department": "IT"},
        {"name": "Lucas Silva", "email": "lucas.silva@test.com", "password": default_password, "role": "member", "department": "CSE"},
        {"name": "Zack Taylor", "email": "zack.taylor@test.com", "password": default_password, "role": "member", "department": "Exams"},
        {"name": "Sophia Martinez", "email": "sophia.martinez@test.com", "password": default_password, "role": "member", "department": "Admin"},
    ]

    created_users = []
    for u in users_data:
        user = models.User(
            name=u["name"],
            email=u["email"],
            password_hash=u["password"],
            role=u["role"],
            department=u["department"]
        )
        db.add(user)
        created_users.append(user)

    db.commit()
    for u in created_users:
        db.refresh(u)

    admin_user = created_users[0]
    member_users = [u for u in created_users if u.role == "member"]

    # 2. Create Notices
    now = datetime.utcnow()

    notices_data = [
        # --- 3 Urgent Notices ---
        {
            "title": "[CAMPUS DRILL] Mandatory Fire Evacuation & Building Clearance at 2:00 PM Today",
            "content": "All students, staff, and faculty in Tech Blocks A, B, and C must immediately evacuate to the Central Lawn assembly area upon acoustic alarm sounding at 2:00 PM sharp. Elevators will be disabled. Department floor wardens will verify rosters. Please do not re-enter buildings until 'All Clear' is signaled.",
            "priority": "urgent",
            "department_tag": "All Departments",
            "created_by": admin_user.id,
            "created_at": now - timedelta(hours=2, minutes=15),
            "expires_at": now + timedelta(hours=6)
        },
        {
            "title": "[URGENT DEADLINE] Final Midterm Hall Ticket & Elective Discrepancy Verification",
            "content": "All registered undergraduate students must log into the Examination Portal to confirm their assigned examination seats, course codes, and elective papers. Any discrepancy must be reported to Room 102 (Controller of Examinations) before 5:00 PM today.",
            "priority": "urgent",
            "department_tag": "Exams",
            "created_by": admin_user.id,
            "created_at": now - timedelta(hours=4, minutes=30),
            "expires_at": now + timedelta(hours=5)
        },
        {
            "title": "Urgent: CSE Cloud Computing Server Node Maintenance & Downtime Tonight",
            "content": "High-performance cluster nodes 04 through 12 will undergo emergency kernel security updates tonight between 11:00 PM and 3:00 AM UTC. Active containerized jobs will be suspended. Please ensure all unsaved research code in JupyterLab workspaces is saved to Git.",
            "priority": "urgent",
            "department_tag": "CSE",
            "created_by": admin_user.id,
            "created_at": now - timedelta(hours=1, minutes=10),
            "expires_at": now + timedelta(hours=15)
        },
        # --- 5 Regular Notices ---
        {
            "title": "Call for Papers & Prototypes: 12th Annual Tech Symposium 'HackPulse 2026'",
            "content": "The Department of Computer Science invites research papers and project submissions for the upcoming HackPulse 2026 Symposium. Tracks include Generative AI, Privacy-Preserving Systems, and Embedded IoT. Top 3 projects win grant sponsorships.",
            "priority": "regular",
            "department_tag": "CSE",
            "created_by": admin_user.id,
            "created_at": now - timedelta(days=1, hours=3),
            "expires_at": now + timedelta(days=14)
        },
        {
            "title": "Campus High-Speed Wi-Fi 6 Infrastructure Upgrade Scheduled This Saturday",
            "content": "The IT Network Team is deploying enterprise-grade Wi-Fi 6 access points across the Engineering Quadrangle. Brief connectivity drops are expected between 2:00 AM and 6:00 AM on Saturday. Wired ethernet connections will remain unaffected.",
            "priority": "regular",
            "department_tag": "IT",
            "created_by": admin_user.id,
            "created_at": now - timedelta(days=2),
            "expires_at": now + timedelta(days=7)
        },
        {
            "title": "Central Library Extended Reading Room Hours for Midterm Revision",
            "content": "Starting this Monday, the Central Library 2nd and 3rd-floor study carrels will remain open 24/7. High-speed power strips, silent study pods, and night cafeteria services will be accessible. Student ID card tap required after 10:00 PM.",
            "priority": "regular",
            "department_tag": "All Departments",
            "created_by": admin_user.id,
            "created_at": now - timedelta(days=2, hours=8),
            "expires_at": now + timedelta(days=20)
        },
        {
            "title": "Fall Placement Drive & Technical Mock Interview Registration Open",
            "content": "Pre-final and final-year students are invited to register for mock technical whiteboard interviews and resume reviews with industry alumni from Google, Microsoft, and Nvidia. Session bookings open on the Career Portal this Thursday at 10:00 AM.",
            "priority": "regular",
            "department_tag": "IT",
            "created_by": admin_user.id,
            "created_at": now - timedelta(days=3),
            "expires_at": now + timedelta(days=10)
        },
        {
            "title": "Academic Council & Department Faculty Advisory Committee Rescheduled",
            "content": "The monthly curriculum steering committee meeting has been moved to Friday 3:30 PM in Senate Hall Room 402. Department representatives are requested to submit finalized elective syllabus modifications.",
            "priority": "regular",
            "department_tag": "Admin",
            "created_by": admin_user.id,
            "created_at": now - timedelta(days=4),
            "expires_at": now + timedelta(days=12)
        }
    ]

    created_notices = []
    for n in notices_data:
        notice = models.Notice(
            title=n["title"],
            content=n["content"],
            priority=n["priority"],
            department_tag=n["department_tag"],
            created_by=n["created_by"],
            created_at=n["created_at"],
            expires_at=n["expires_at"]
        )
        db.add(notice)
        created_notices.append(notice)

    db.commit()
    for n in created_notices:
        db.refresh(n)

    # 3. Seed Realistic Read Receipts
    # Urgent Notice 1 (Fire Drill): Seen by 7 members
    drill_readers = [member_users[0], member_users[1], member_users[2], member_users[3], member_users[5], member_users[6], member_users[7]]
    for idx, user in enumerate(drill_readers):
        db.add(models.NoticeRead(
            notice_id=created_notices[0].id,
            user_id=user.id,
            read_at=now - timedelta(hours=1, minutes=45 - idx * 10)
        ))

    # Urgent Notice 2 (Exams): Seen by 6 members
    exam_readers = [member_users[0], member_users[3], member_users[7], member_users[8], member_users[2], member_users[4]]
    for idx, user in enumerate(exam_readers):
        db.add(models.NoticeRead(
            notice_id=created_notices[1].id,
            user_id=user.id,
            read_at=now - timedelta(hours=3, minutes=30 - idx * 15)
        ))

    # Urgent Notice 3 (CSE Cluster): Seen by 4 members
    cluster_readers = [member_users[0], member_users[2], member_users[6], member_users[4]]
    for idx, user in enumerate(cluster_readers):
        db.add(models.NoticeRead(
            notice_id=created_notices[2].id,
            user_id=user.id,
            read_at=now - timedelta(minutes=40 - idx * 8)
        ))

    # Regular Notice 1: Seen by 5 members
    for idx, user in enumerate(member_users[:5]):
        db.add(models.NoticeRead(
            notice_id=created_notices[3].id,
            user_id=user.id,
            read_at=now - timedelta(days=1, minutes=idx * 20)
        ))

    # Regular Notice 2: Seen by 3 members
    for idx, user in enumerate(member_users[1:4]):
        db.add(models.NoticeRead(
            notice_id=created_notices[4].id,
            user_id=user.id,
            read_at=now - timedelta(days=1, hours=10 - idx)
        ))

    # 4. Seed Full Week Timetable Slots (Monday - Friday)
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    
    # Schedule templates for realistic class days
    slots_per_day = [
        {"start": "09:00", "end": "10:00", "title": "CS301: Data Structures & Algorithms", "department": "CSE", "room": "Hall 302"},
        {"start": "10:15", "end": "11:15", "title": "IT204: Cloud Architecture & Microservices", "department": "IT", "room": "Lab B - Cloud Suite"},
        {"start": "11:30", "end": "12:30", "title": "CS405: Distributed Systems & Consensus", "department": "CSE", "room": "Seminar Room 1"},
        {"start": "13:30", "end": "14:30", "title": "EX101: Quantitative Reasoning & Aptitude", "department": "Exams", "room": "Auditorium Main"},
        {"start": "14:45", "end": "15:45", "title": "CS408: Deep Learning & Neural Networks", "department": "CSE", "room": "AI Research Lab 4"},
        {"start": "16:00", "end": "17:00", "title": "IT309: Full Stack Engineering Capstone", "department": "IT", "room": "Innovation Hub 2"}
    ]

    for day in days:
        for slot in slots_per_day:
            db.add(models.TimetableSlot(
                day_of_week=day,
                start_time=slot["start"],
                end_time=slot["end"],
                title=slot["title"],
                department=slot["department"],
                room=slot["room"],
                updated_by=admin_user.id
            ))

    db.commit()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    from database import engine, Base, SessionLocal
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
