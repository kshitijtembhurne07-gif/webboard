import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_flow():
    print("Testing NoticePulse API...")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] Health check passed")

    # 2. Test accounts endpoint
    res = client.get("/api/auth/test-accounts")
    assert res.status_code == 200
    accounts = res.json()
    assert len(accounts) >= 10, f"Expected at least 10 accounts, got {len(accounts)}"
    print(f"[OK] Found {len(accounts)} seeded accounts")

    # 3. Login as Admin
    res = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_data = res.json()
    admin_token = admin_data["access_token"]
    assert admin_data["user"]["role"] == "admin"
    print("[OK] Admin login verified")

    # 4. Login as Member
    res = client.post("/api/auth/login", json={"email": "member@test.com", "password": "member123"})
    assert res.status_code == 200, f"Member login failed: {res.text}"
    member_data = res.json()
    member_token = member_data["access_token"]
    assert member_data["user"]["role"] == "member"
    print("[OK] Member login verified")

    # 5. Fetch Notices with Member token
    headers_member = {"Authorization": f"Bearer {member_token}"}
    res = client.get("/api/notices", headers=headers_member)
    assert res.status_code == 200
    notices = res.json()
    assert len(notices) >= 8, f"Expected at least 8 notices, got {len(notices)}"
    urgent_count = sum(1 for n in notices if n["priority"] == "urgent")
    print(f"[OK] Fetched {len(notices)} notices ({urgent_count} urgent)")

    # 6. Mark a notice as read
    first_notice = notices[0]
    res = client.post(f"/api/notices/{first_notice['id']}/read", headers=headers_member)
    assert res.status_code == 200
    assert res.json()["status"] == "acknowledged"
    print(f"[OK] Acknowledged notice {first_notice['id']}")

    # 7. Admin read receipts analytics
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    res = client.get(f"/api/notices/{first_notice['id']}/reads", headers=headers_admin)
    assert res.status_code == 200
    analytics = res.json()
    assert analytics["seen_count"] > 0
    print(f"[OK] Admin analytics verified: {analytics['seen_count']} seen / {analytics['total_members']} total")

    # 8. Fetch timetable
    res = client.get("/api/timetable?day_of_week=Monday")
    assert res.status_code == 200
    slots = res.json()
    assert len(slots) >= 6, f"Expected 6 slots on Monday, got {len(slots)}"
    print(f"[OK] Timetable verified: {len(slots)} slots for Monday")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY! SUCCESS")

if __name__ == "__main__":
    test_full_flow()
