import http from 'node:http';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { activityFactors, effortLabels, estimateCalories, validateCalorieInput } from './fitnessMath.js';
import { readDb, updateDb } from './database.js';

const PORT = Number(process.env.PORT || 4174);
const startedAt = Date.now();
const validRoles = new Set(['customer', 'trainer', 'admin']);

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function normalizeRole(role) {
  const value = String(role || 'customer').trim().toLowerCase();
  return validRoles.has(value) ? value : 'customer';
}

function publicProfile(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    goal: user.goal,
    weight: user.weight,
    validated: true
  };
}

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;

  const db = await readDb();
  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;

  return db.users.find((user) => user.id === session.userId) || null;
}

async function requireUser(req, res) {
  const user = await getUser(req);
  if (!user) {
    json(res, 401, { error: "Authentication required." });
    return null;
  }
  return user;
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    return json(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    const db = await readDb();
    return json(res, 200, {
      status: "operational",
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      uptimeTarget: 95,
      trackingTarget: 95,
      database: "file",
      users: db.users.length,
      activities: db.activities.length,
      monitoringEvents: db.monitoringEvents.length
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/register') {
    const payload = await body(req);
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');

    if (!payload.name || !email || password.length < 6) {
      return json(res, 400, { error: "Name, valid email, and 6-character password are required." });
    }

    const result = await updateDb((db) => {
      if (db.users.some((user) => user.email === email)) {
        return { error: "An account already exists for this email." };
      }

      const passwordData = hashPassword(password);
      const user = {
        id: randomBytes(12).toString('hex'),
        name: String(payload.name).trim(),
        email,
        role: normalizeRole(payload.role),
        goal: payload.goal || "Body Recompose",
        weight: Number(payload.weight || 75),
        passwordSalt: passwordData.salt,
        passwordHash: passwordData.hash,
        validated: true,
        createdAt: new Date().toISOString()
      };
      const token = randomBytes(24).toString('hex');
      db.users.push(user);
      db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
      return { token, profile: publicProfile(user) };
    });

    return result.error ? json(res, 409, result) : json(res, 201, result);
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const payload = await body(req);
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');

    const result = await updateDb((db) => {
      const user = db.users.find((item) => item.email === email);
      if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        return { error: "Invalid email or password." };
      }

      const token = randomBytes(24).toString('hex');
      db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
      return { token, profile: publicProfile(user) };
    });

    return result.error ? json(res, 401, result) : json(res, 200, result);
  }

  if (req.method === 'GET' && url.pathname === '/api/me') {
    const user = await requireUser(req, res);
    if (!user) return;
    const db = await readDb();
    return json(res, 200, {
      profile: publicProfile(user),
      activities: db.activities.filter((activity) => activity.userId === user.id).toReversed(),
      alarm: db.alarms.find((alarm) => alarm.userId === user.id) || null,
      uatSignoffs: db.uatSignoffs.filter((signoff) => signoff.userId === user.id).toReversed()
    });
  }

  if (req.method === 'PUT' && url.pathname === '/api/profile') {
    const user = await requireUser(req, res);
    if (!user) return;
    const payload = await body(req);
    const profile = await updateDb((db) => {
      const found = db.users.find((item) => item.id === user.id);
      found.name = String(payload.name || found.name).trim();
      found.email = String(payload.email || found.email).trim().toLowerCase();
      found.role = normalizeRole(payload.role || found.role);
      found.goal = payload.goal || found.goal;
      found.weight = Number(payload.weight || found.weight);
      found.validated = true;
      return publicProfile(found);
    });
    return json(res, 200, { profile });
  }

  if (req.method === 'POST' && url.pathname === '/api/calories') {
    const user = await requireUser(req, res);
    if (!user) return;
    const payload = await body(req);
    const input = { ...payload, weight: payload.weight || user.weight };
    const validation = validateCalorieInput(input);
    return json(res, validation.passed ? 200 : 400, {
      calories: estimateCalories(input),
      validation,
      formula: "Calories = MET x 3.5 x body weight x duration x effort / 200"
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/activities') {
    const user = await requireUser(req, res);
    if (!user) return;
    const payload = await body(req);
    const input = { ...payload, weight: user.weight };
    const validation = validateCalorieInput(input);
    if (!validation.passed) {
      return json(res, 400, { error: "Invalid activity input.", validation });
    }

    const activity = await updateDb((db) => {
      const record = {
        id: randomBytes(12).toString('hex'),
        userId: user.id,
        label: activityFactors[payload.type].label,
        distance: Number(payload.distance),
        duration: Number(payload.duration),
        effort: effortLabels[String(payload.effort)],
        calories: estimateCalories(input),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString()
      };
      db.activities.push(record);
      return record;
    });
    return json(res, 201, { activity });
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/activities/')) {
    const user = await requireUser(req, res);
    if (!user) return;
    const id = url.pathname.split('/').pop();
    await updateDb((db) => {
      db.activities = db.activities.filter((activity) => !(activity.id === id && activity.userId === user.id));
    });
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && url.pathname === '/api/alarms') {
    const user = await requireUser(req, res);
    if (!user) return;
    const payload = await body(req);
    const alarm = await updateDb((db) => {
      db.alarms = db.alarms.filter((item) => item.userId !== user.id);
      const record = {
        id: randomBytes(12).toString('hex'),
        userId: user.id,
        time: payload.time,
        note: payload.note,
        triggered: false,
        createdAt: new Date().toISOString()
      };
      db.alarms.push(record);
      db.monitoringEvents.push({ id: Date.now(), type: "alarm", message: `Reminder set for ${payload.time}`, createdAt: new Date().toISOString() });
      return record;
    });
    return json(res, 201, { alarm });
  }

  if (req.method === 'POST' && url.pathname === '/api/uat-signoff') {
    const user = await requireUser(req, res);
    if (!user) return;
    const payload = await body(req);
    const signoff = await updateDb((db) => {
      const record = {
        id: randomBytes(12).toString('hex'),
        userId: user.id,
        approver: payload.approver || user.name,
        role: payload.role || "IT Department",
        result: payload.result || "Approved",
        notes: payload.notes || "UAT approval granted after validation.",
        createdAt: new Date().toISOString()
      };
      db.uatSignoffs.push(record);
      return record;
    });
    return json(res, 201, { signoff });
  }

  return json(res, 404, { error: "Route not found." });
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    json(res, 500, { error: error.message });
  });
});

server.listen(PORT, () => {
  console.log(`Fitness Tracker API running on http://localhost:${PORT}`);
});
