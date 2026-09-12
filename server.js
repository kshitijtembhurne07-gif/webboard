import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(express.json());

// --- IN-MEMORY DATABASE WITH REALISTIC PRE-SEEDED DATA ---
const users = [
  { id: 1, name: "Dr. Sarah Jenkins", email: "admin@test.com", password: "admin123", role: "admin", department: "Admin" },
  { id: 2, name: "Alex Rivera", email: "member@test.com", password: "member123", role: "member", department: "CSE" },
  { id: 3, name: "Priya Patel", email: "priya.patel@test.com", password: "member123", role: "member", department: "IT" },
  { id: 4, name: "Marcus Chen", email: "marcus.chen@test.com", password: "member123", role: "member", department: "CSE" },
  { id: 5, name: "Elena Rostova", email: "elena.rostova@test.com", password: "member123", role: "member", department: "Exams" },
  { id: 6, name: "Devon Brooks", email: "devon.brooks@test.com", password: "member123", role: "member", department: "Mechanical" },
  { id: 7, name: "Aisha Khan", email: "aisha.khan@test.com", password: "member123", role: "member", department: "IT" },
  { id: 8, name: "Lucas Silva", email: "lucas.silva@test.com", password: "member123", role: "member", department: "CSE" },
  { id: 9, name: "Zack Taylor", email: "zack.taylor@test.com", password: "member123", role: "member", department: "Exams" },
  { id: 10, name: "Sophia Martinez", email: "sophia.martinez@test.com", password: "member123", role: "member", department: "Admin" }
];

const now = new Date();

let notices = [
  {
    id: 1,
    title: "[CAMPUS DRILL] Mandatory Fire Evacuation & Building Clearance at 2:00 PM Today",
    content: "All students, staff, and faculty in Tech Blocks A, B, and C must immediately evacuate to the Central Lawn assembly area upon acoustic alarm sounding at 2:00 PM sharp. Elevators will be disabled. Department floor wardens will verify rosters.",
    priority: "urgent",
    department_tag: "All Departments",
    created_by: 1,
    creator_name: "Dr. Sarah Jenkins",
    created_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
    expires_at: new Date(now.getTime() + 6 * 3600000).toISOString()
  },
  {
    id: 2,
    title: "[URGENT DEADLINE] Final Midterm Hall Ticket & Elective Discrepancy Verification",
    content: "All registered undergraduate students must log into the Examination Portal to confirm their assigned examination seats, course codes, and elective papers. Report to Room 102 before 5:00 PM today.",
    priority: "urgent",
    department_tag: "Exams",
    created_by: 1,
    creator_name: "Dr. Sarah Jenkins",
    created_at: new Date(now.getTime() - 4 * 3600000).toISOString(),
    expires_at: new Date(now.getTime() + 5 * 3600000).toISOString()
  },
  {
    id: 3,
    title: "Urgent: CSE Cloud Computing Server Node Maintenance & Downtime Tonight",
    content: "High-performance cluster nodes 04 through 12 will undergo emergency kernel security updates tonight between 11:00 PM and 3:00 AM UTC. Please save all research code in JupyterLab workspaces.",
    priority: "urgent",
    department_tag: "CSE",
    created_by: 1,
    creator_name: "Dr. Sarah Jenkins",
    created_at: new Date(now.getTime() - 1 * 3600000).toISOString(),
    expires_at: new Date(now.getTime() + 15 * 3600000).toISOString()
  },
  {
    id: 4,
    title: "Call for Papers & Prototypes: 12th Annual Tech Symposium 'HackPulse 2026'",
    content: "The Department of Computer Science invites research papers and project submissions for HackPulse 2026. Tracks include Generative AI, Privacy-Preserving Systems, and Embedded IoT. Top 3 projects win grants.",
    priority: "regular",
    department_tag: "CSE",
    created_by: 1,
    creator_name: "Dr. Sarah Jenkins",
    created_at: new Date(now.getTime() - 24 * 3600000).toISOString(),
    expires_at: new Date(now.getTime() + 14 * 24 * 3600000).toISOString()
  },
  {
    id: 5,
    title: "Campus High-Speed Wi-Fi 6 Infrastructure Upgrade Scheduled This Saturday",
    content: "The IT Network Team is deploying enterprise-grade Wi-Fi 6 access points across the Engineering Quadrangle. Brief connectivity drops expected between 2:00 AM and 6:00 AM on Saturday.",
    priority: "regular",
    department_tag: "IT",
    created_by: 1,
    creator_name: "Dr. Sarah Jenkins",
    created_at: new Date(now.getTime() - 48 * 3600000).toISOString(),
    expires_at: new Date(now.getTime() + 7 * 24 * 3600000).toISOString()
  },
  {
    id: 6,
    title: "Central Library Extended Reading Room Hours for Midterm Revision",
    content: "Starting this Monday, the Central Library 2nd and 3rd-floor study carrels will remain open 24/7. High-speed power strips, silent study pods, and night cafeteria services will be accessible.",
    priority: "regular",
    department_tag: "All Departments",
    created_by: 1,
    creator_name: "Dr. Sarah Jenkins",
    created_at: new Date(now.getTime() - 56 * 3600000).toISOString(),
    expires_at: new Date(now.getTime() + 20 * 24 * 3600000).toISOString()
  },
  {
    id: 7,
    title: "Fall Placement Drive & Technical Mock Interview Registration Open",
    content: "Pre-final and final-year students are invited to register for mock technical whiteboard interviews and resume reviews with industry alumni from Google, Microsoft, and Nvidia.",
    priority: "regular",
    department_tag: "IT",
    created_by: 1,
    creator_name: "Dr. Sarah Jenkins",
    created_at: new Date(now.getTime() - 72 * 3600000).toISOString(),
    expires_at: new Date(now.getTime() + 10 * 24 * 3600000).toISOString()
  },
  {
    id: 8,
    title: "Academic Council & Department Faculty Advisory Committee Rescheduled",
    content: "The monthly curriculum steering committee meeting has been moved to Friday 3:30 PM in Senate Hall Room 402. Department representatives are requested to bring finalized syllabus proposals.",
    priority: "regular",
    department_tag: "Admin",
    created_by: 1,
    creator_name: "Dr. Sarah Jenkins",
    created_at: new Date(now.getTime() - 96 * 3600000).toISOString(),
    expires_at: new Date(now.getTime() + 12 * 24 * 3600000).toISOString()
  }
];

let noticeReads = [
  { notice_id: 1, user_id: 2, read_at: new Date(now.getTime() - 100 * 60000).toISOString() },
  { notice_id: 1, user_id: 3, read_at: new Date(now.getTime() - 90 * 60000).toISOString() },
  { notice_id: 1, user_id: 4, read_at: new Date(now.getTime() - 80 * 60000).toISOString() },
  { notice_id: 1, user_id: 5, read_at: new Date(now.getTime() - 70 * 60000).toISOString() },
  { notice_id: 1, user_id: 7, read_at: new Date(now.getTime() - 60 * 60000).toISOString() },
  { notice_id: 1, user_id: 8, read_at: new Date(now.getTime() - 50 * 60000).toISOString() },
  { notice_id: 1, user_id: 6, read_at: new Date(now.getTime() - 40 * 60000).toISOString() },
  
  { notice_id: 2, user_id: 2, read_at: new Date(now.getTime() - 200 * 60000).toISOString() },
  { notice_id: 2, user_id: 5, read_at: new Date(now.getTime() - 180 * 60000).toISOString() },
  { notice_id: 2, user_id: 9, read_at: new Date(now.getTime() - 150 * 60000).toISOString() },
  { notice_id: 2, user_id: 10, read_at: new Date(now.getTime() - 120 * 60000).toISOString() },
  { notice_id: 2, user_id: 4, read_at: new Date(now.getTime() - 90 * 60000).toISOString() },

  { notice_id: 3, user_id: 2, read_at: new Date(now.getTime() - 35 * 60000).toISOString() },
  { notice_id: 3, user_id: 4, read_at: new Date(now.getTime() - 25 * 60000).toISOString() },
  { notice_id: 3, user_id: 8, read_at: new Date(now.getTime() - 15 * 60000).toISOString() },
  { notice_id: 3, user_id: 6, read_at: new Date(now.getTime() - 5 * 60000).toISOString() }
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const slotTemplates = [
  { start: "09:00", end: "10:00", title: "CS301: Data Structures & Algorithms", department: "CSE", room: "Hall 302" },
  { start: "10:15", end: "11:15", title: "IT204: Cloud Architecture & Microservices", department: "IT", room: "Lab B - Cloud Suite" },
  { start: "11:30", end: "12:30", title: "CS405: Distributed Systems & Consensus", department: "CSE", room: "Seminar Room 1" },
  { start: "13:30", end: "14:30", title: "EX101: Quantitative Reasoning & Aptitude", department: "Exams", room: "Auditorium Main" },
  { start: "14:45", end: "15:45", title: "CS408: Deep Learning & Neural Networks", department: "CSE", room: "AI Research Lab 4" },
  { start: "16:00", end: "17:00", title: "IT309: Full Stack Engineering Capstone", department: "IT", room: "Innovation Hub 2" }
];

let timetableSlots = [];
let slotIdCounter = 1;
for (const day of days) {
  for (const s of slotTemplates) {
    timetableSlots.push({
      id: slotIdCounter++,
      day_of_week: day,
      start_time: s.start,
      end_time: s.end,
      title: s.title,
      department: s.department,
      room: s.room,
      updated_by: 1,
      updater_name: "Dr. Sarah Jenkins"
    });
  }
}

// --- WEBSOCKET REAL-TIME BROADCASTER ---
const connectedClients = new Set();

function broadcast(message) {
  const json = JSON.stringify(message);
  for (const ws of connectedClients) {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(json); } catch (e) {}
    }
  }
}

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);
  if (pathname === '/ws/notices' || pathname.startsWith('/ws')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  ws.send(JSON.stringify({
    type: "CONNECTED",
    message: "Connected to NoticePulse Real-time Push Alert Stream",
    active_clients: connectedClients.size
  }));

  ws.on('message', (msg) => {
    if (msg.toString() === 'ping') {
      ws.send('pong');
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
  });
});

// Helper auth token parser
function getUserFromToken(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.replace('Bearer ', '');
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    return users.find(u => u.id === decoded.sub) || null;
  } catch (e) {
    return null;
  }
}

// --- API ROUTES ---
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", active_ws_clients: connectedClients.size });
});

app.get('/api/auth/test-accounts', (req, res) => {
  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    default_password: u.password
  })));
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
  if (!user || user.password !== password) {
    return res.status(401).json({ detail: "Invalid email or password" });
  }
  const token = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, role: user.role })).toString('base64');
  res.json({
    access_token: token,
    token_type: "bearer",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ detail: "Unauthorized" });
  res.json(user);
});

// Notices
app.get('/api/notices', (req, res) => {
  const user = getUserFromToken(req);
  const { priority, department, search } = req.query;
  const totalMembers = users.filter(u => u.role === 'member').length;

  let list = notices.map(n => {
    const reads = noticeReads.filter(r => r.notice_id === n.id);
    const myRead = user ? reads.find(r => r.user_id === user.id) : null;
    return {
      ...n,
      read_count: reads.length,
      total_members: totalMembers,
      is_read_by_me: !!myRead,
      my_read_at: myRead ? myRead.read_at : null
    };
  });

  if (priority) {
    list = list.filter(n => n.priority.toLowerCase() === priority.toLowerCase());
  }
  if (department && department.toLowerCase() !== 'all' && department.toLowerCase() !== 'all departments') {
    list = list.filter(n => n.department_tag === department || n.department_tag === 'All Departments');
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }

  // Sort urgent first, then newest
  list.sort((a, b) => {
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  res.json(list);
});

app.post('/api/notices', (req, res) => {
  const user = getUserFromToken(req) || users[0];
  const { title, content, priority, department_tag, expires_at, immediate_push } = req.body;
  
  const totalMembers = users.filter(u => u.role === 'member').length;
  const newNotice = {
    id: notices.length > 0 ? Math.max(...notices.map(n => n.id)) + 1 : 1,
    title,
    content,
    priority: priority || "regular",
    department_tag: department_tag || "All Departments",
    created_by: user.id,
    creator_name: user.name,
    created_at: new Date().toISOString(),
    expires_at: expires_at || null,
    read_count: 0,
    total_members: totalMembers,
    is_read_by_me: false,
    my_read_at: null
  };

  notices.unshift(newNotice);

  if (newNotice.priority === 'urgent' && immediate_push !== false) {
    broadcast({
      type: "URGENT_NOTICE_ALERT",
      priority: "urgent",
      timestamp: newNotice.created_at,
      notice: newNotice
    });
  } else {
    broadcast({
      type: "NEW_NOTICE",
      notice: newNotice
    });
  }

  res.status(201).json(newNotice);
});

app.put('/api/notices/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = notices.findIndex(n => n.id === id);
  if (index === -1) return res.status(404).json({ detail: "Notice not found" });

  const updated = { ...notices[index], ...req.body };
  notices[index] = updated;

  broadcast({ type: "NOTICE_UPDATED", notice: updated });
  res.json(updated);
});

app.delete('/api/notices/:id', (req, res) => {
  const id = parseInt(req.params.id);
  notices = notices.filter(n => n.id !== id);
  noticeReads = noticeReads.filter(r => r.notice_id !== id);

  broadcast({ type: "NOTICE_DELETED", notice_id: id });
  res.json({ status: "deleted", notice_id: id });
});

app.post('/api/notices/:id/read', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ detail: "Unauthorized" });

  const noticeId = parseInt(req.params.id);
  let existing = noticeReads.find(r => r.notice_id === noticeId && r.user_id === user.id);
  const nowStr = new Date().toISOString();

  if (!existing) {
    noticeReads.push({ notice_id: noticeId, user_id: user.id, read_at: nowStr });
  }

  const readCount = noticeReads.filter(r => r.notice_id === noticeId).length;
  const totalMembers = users.filter(u => u.role === 'member').length;

  broadcast({
    type: "NOTICE_READ_RECEIPT",
    notice_id: noticeId,
    read_count: readCount,
    total_members: totalMembers,
    reader: { name: user.name, department: user.department }
  });

  res.json({ status: "acknowledged", notice_id: noticeId, read_at: existing ? existing.read_at : nowStr });
});

app.get('/api/notices/:id/reads', (req, res) => {
  const noticeId = parseInt(req.params.id);
  const notice = notices.find(n => n.id === noticeId);
  if (!notice) return res.status(404).json({ detail: "Notice not found" });

  const members = users.filter(u => u.role === 'member');
  const reads = noticeReads.filter(r => r.notice_id === noticeId);
  const readMap = new Map(reads.map(r => [r.user_id, r.read_at]));

  const seen = [];
  const unread = [];

  for (const m of members) {
    if (readMap.has(m.id)) {
      seen.push({ user_id: m.id, name: m.name, email: m.email, department: m.department, read_at: readMap.get(m.id) });
    } else {
      unread.push({ user_id: m.id, name: m.name, email: m.email, department: m.department, read_at: null });
    }
  }

  seen.sort((a, b) => new Date(b.read_at) - new Date(a.read_at));

  res.json({
    notice_id: noticeId,
    notice_title: notice.title,
    total_members: members.length,
    seen_count: seen.length,
    unread_count: unread.length,
    seen_members: seen,
    unread_members: unread
  });
});

// Timetable
app.get('/api/timetable', (req, res) => {
  const { day_of_week, department } = req.query;
  let list = [...timetableSlots];

  if (day_of_week && day_of_week.toLowerCase() !== 'all') {
    list = list.filter(s => s.day_of_week.toLowerCase() === day_of_week.toLowerCase());
  }
  if (department && department.toLowerCase() !== 'all' && department.toLowerCase() !== 'all departments') {
    list = list.filter(s => s.department === department || s.department === 'All Departments');
  }

  list.sort((a, b) => a.start_time.localeCompare(b.start_time));
  res.json(list);
});

app.post('/api/timetable', (req, res) => {
  const user = getUserFromToken(req) || users[0];
  const newSlot = {
    id: slotIdCounter++,
    ...req.body,
    updated_by: user.id,
    updater_name: user.name
  };
  timetableSlots.push(newSlot);
  broadcast({ type: "TIMETABLE_UPDATED", action: "created", slot: newSlot });
  res.status(201).json(newSlot);
});

app.put('/api/timetable/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = timetableSlots.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ detail: "Slot not found" });

  const updated = { ...timetableSlots[index], ...req.body };
  timetableSlots[index] = updated;
  broadcast({ type: "TIMETABLE_UPDATED", action: "updated", slot: updated });
  res.json(updated);
});

app.delete('/api/timetable/:id', (req, res) => {
  const id = parseInt(req.params.id);
  timetableSlots = timetableSlots.filter(s => s.id !== id);
  broadcast({ type: "TIMETABLE_UPDATED", action: "deleted", slot_id: id });
  res.json({ status: "deleted", slot_id: id });
});

// --- SERVE STATIC REACT BUILD ---
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`NoticePulse Server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket endpoint active on ws://0.0.0.0:${PORT}/ws/notices`);
});
