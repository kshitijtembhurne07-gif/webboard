import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_websocket_realtime():
    print("Testing NoticePulse WebSocket Real-time Push Alerting...")

    # 1. Login as Admin
    res = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    assert res.status_code == 200
    admin_token = res.json()["access_token"]

    # 2. Login as Member
    res = client.post("/api/auth/login", json={"email": "member@test.com", "password": "member123"})
    assert res.status_code == 200
    member_token = res.json()["access_token"]

    # 3. Open WebSocket connection as Member
    with client.websocket_connect(f"/ws/notices?token={member_token}") as ws:
        # Initial greeting message
        msg1 = ws.receive_json()
        assert msg1["type"] == "CONNECTED"
        print(f"[OK] WebSocket connected successfully: {msg1['message']}")

        # 4. Admin publishes an urgent notice
        new_notice_payload = {
            "title": "[LIVE WS TEST] Flash Flood Warning & Immediate Campus Shelter",
            "content": "Severe weather alert: All personnel should proceed to indoor corridors. Avoid lower level basements.",
            "priority": "urgent",
            "department_tag": "All Departments",
            "immediate_push": True
        }
        res = client.post(
            "/api/notices",
            json=new_notice_payload,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 201
        created_notice = res.json()
        notice_id = created_notice["id"]
        print(f"[OK] Urgent notice created via POST /api/notices (ID: {notice_id})")

        # 5. Verify Member receives instant URGENT_NOTICE_ALERT via WebSocket
        ws_alert = ws.receive_json()
        assert ws_alert["type"] == "URGENT_NOTICE_ALERT"
        assert ws_alert["priority"] == "urgent"
        assert ws_alert["notice"]["id"] == notice_id
        assert ws_alert["notice"]["title"] == new_notice_payload["title"]
        print("[OK] Real-time URGENT_NOTICE_ALERT received over WebSocket!")

        # 6. Member acknowledges the notice
        res = client.post(
            f"/api/notices/{notice_id}/read",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert res.status_code == 200

        # 7. Verify WebSocket broadcast of NOTICE_READ_RECEIPT
        ws_receipt = ws.receive_json()
        assert ws_receipt["type"] == "NOTICE_READ_RECEIPT"
        assert ws_receipt["notice_id"] == notice_id
        assert ws_receipt["read_count"] >= 1
        print(f"[OK] Real-time NOTICE_READ_RECEIPT broadcast received: {ws_receipt['read_count']} seen")

    print("\nALL WEBSOCKET REAL-TIME BROADCAST TESTS PASSED! SUCCESS")

if __name__ == "__main__":
    test_websocket_realtime()
