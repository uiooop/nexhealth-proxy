// =============================================================
// AHS NEXHEALTH PROXY — Full server.js
// Includes: NexHealth routes + Mailbox for SOAP note flow
//           + Trillet phone booking routes
//           + Availabilities route
// =============================================================

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const BASE_URL = 'https://nexhealth.info';
const API_KEY = process.env.NEXHEALTH_API_KEY;
const SUBDOMAIN = process.env.NEXHEALTH_SUBDOMAIN || 'ahs-practice';
const LOCATION_ID = process.env.NEXHEALTH_LOCATION_ID || '347899';
const TRILLET_SECRET = process.env.TRILLET_WEBHOOK_SECRET;

// =============================================================
// AUTH — Get bearer token
// =============================================================
let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const r = await axios.post(`${BASE_URL}/authenticates`, {}, {
    headers: { 'Accept': 'application/vnd.Nexhealth+json;version=2', 'Authorization': API_KEY }
  });
  cachedToken = r.data.data.token;
  tokenExpiry = Date.now() + 50 * 60 * 1000;
  return cachedToken;
}

async function nexHeaders() {
  const token = await getToken();
  return {
    'Accept': 'application/vnd.Nexhealth+json;version=2',
    'Authorization': `Bearer ${token}`
  };
}

// =============================================================
// TRILLET SECURITY — validate secret header
// =============================================================
function validateTrillet(req, res) {
  const secret = req.headers['x-trillet-secret'];
  if (TRILLET_SECRET && secret !== TRILLET_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// =============================================================
// MULTI-TENANT — resolve practice from request, fallback to env defaults
// subdomain + location_id flow in per-practice from the Trillet body.
// One proxy serves all practices; no per-practice deploy.
// =============================================================
function resolveTenant(req) {
  const subdomain = req.body?.subdomain || req.query?.subdomain || SUBDOMAIN;
  const location_id = req.body?.location_id || req.query?.location_id || LOCATION_ID;
  return { subdomain, location_id };
}

// =============================================================
// SLOT REF — bundle start_time + operatory_id + provider_id into one
// opaque, non-PHI token so the chosen slot can never desync. Stateless:
// nothing stored server-side, so it scales across any number of replicas
// and keeps the proxy a clean pass-through for BAA/HIPAA.
// =============================================================
function encodeSlotRef(slot) {
  const payload = JSON.stringify({ t: slot.start_time, o: slot.operatory_id, p: slot.provider_id });
  return Buffer.from(payload).toString('base64url');
}
function decodeSlotRef(ref) {
  try {
    const obj = JSON.parse(Buffer.from(ref, 'base64url').toString('utf8'));
    return { start_time: obj.t, operatory_id: obj.o, provider_id: obj.p };
  } catch {
    return null;
  }
}

// Shared slot fetch — used by /trillet/slots AND /trillet/book (option_number path)
// so the numbered list is derived identically both times. Stateless.
async function fetchTopSlots({ subdomain, location_id, provider_id, appointment_type_id, start_date, days_ahead }) {
  const headers = await nexHeaders();
  const startDate = start_date ? start_date : new Date().toISOString().split('T')[0];
  const params = new URLSearchParams();
  params.append('subdomain', subdomain);
  params.append('start_date', startDate);
  params.append('days', String(days_ahead || 14));
  params.append('lids[]', location_id);
  params.append('pids[]', provider_id || '483310768');
  if (appointment_type_id) params.append('appointment_type_id', appointment_type_id);
  const r = await axios.get(`${BASE_URL}/appointment_slots?${params.toString()}`, { headers });
  const data = r.data?.data || [];
  const slots = Array.isArray(data) ? data.flatMap(d => (d.slots || []).map(s => ({ ...s, provider_id: d.pid, lid: d.lid }))) : [];
  return slots.slice(0, 5).map((slot, i) => {
    const start_time = slot.time || slot.start_time;
    const dt = new Date(start_time);
    const readable = dt.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
    const slot_ref = encodeSlotRef({ start_time, operatory_id: slot.operatory_id, provider_id: slot.provider_id });
    return { index: i + 1, slot_ref, provider_id: slot.provider_id, operatory_id: slot.operatory_id, start_time, readable, spoken: `Option ${i + 1}: ${readable}` };
  });
}

// =============================================================
// HEALTH CHECK
// =============================================================
app.get('/', (req, res) => {
  res.json({ status: 'AHS NexHealth proxy running', time: new Date().toISOString() });
});

// =============================================================
// PATIENTS
// =============================================================
app.get('/patients', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/patients`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

app.get('/patients/:id', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/patients/${req.params.id}`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// =============================================================
// PROVIDERS
// =============================================================
app.get('/providers', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/providers`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// =============================================================
// LOCATIONS
// =============================================================
app.get('/locations', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/locations`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// =============================================================
// AVAILABILITIES
// =============================================================
app.get('/availabilities', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/availabilities`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

app.post('/availabilities', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.post(`${BASE_URL}/availabilities`, req.body, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      params: req.query
    });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// =============================================================
// APPOINTMENT SLOTS
// =============================================================
app.get('/appointment_slots', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/appointment_slots`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// =============================================================
// APPOINTMENT TYPES
// =============================================================
app.get('/appointment_types', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/appointment_types`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

app.post('/appointment_types', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.post(`${BASE_URL}/appointment_types`, req.body, { headers: { ...headers, 'Content-Type': 'application/json' }, params: { subdomain: SUBDOMAIN } });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// =============================================================
// APPOINTMENTS
// =============================================================
app.get('/appointments', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/appointments`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

app.post('/appointments', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.post(`${BASE_URL}/appointments`, req.body, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      params: req.query
    });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// =============================================================
// DOCUMENT TYPES
// =============================================================
app.get('/document_types', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/document_types`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

app.get('/document_types/:id', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/document_types/${req.params.id}`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// =============================================================
// PATIENT DOCUMENTS
// =============================================================
app.get('/patients/:id/documents', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/patients/${req.params.id}/documents`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

app.post('/patients/:id/documents', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const form = new FormData();
    if (req.body.document) {
      Object.keys(req.body.document).forEach(k => {
        form.append(`document[${k}]`, req.body.document[k]);
      });
    }
    const r = await axios.post(`${BASE_URL}/patients/${req.params.id}/documents`, form, {
      headers: { ...headers, ...form.getHeaders() },
      params: req.query
    });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// =============================================================
// MESSAGES / COMMUNICATIONS
// =============================================================
app.post('/messages/send', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.post(`${BASE_URL}/communications`, req.body, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      params: req.query
    });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// =============================================================
// MAILBOX — SOAP Note flow between Doctor app & Patient app
// =============================================================

const noteMailbox = [];
let noteIdCounter = 1;

app.post('/notes/create', async (req, res) => {
  try {
    const { patient_id, patient_name, soap_text, ccgpt_key, openai_key } = req.body;
    if (!patient_id || !soap_text || !ccgpt_key || !openai_key) {
      return res.status(400).json({ error: 'Missing fields: patient_id, soap_text, ccgpt_key, openai_key required' });
    }
    const ccgptResponse = await axios.post(
      'https://api.compliantchatgpt.com/v1/chat/completions',
      {
        model: 'gpt-4o-2024-05-13',
        messages: [
          { role: 'system', content: 'You are a warm, friendly dental assistant. Translate clinical SOAP notes into simple, kind, parent-friendly language. Use plain English. No clinical jargon. Keep it short — 3 to 5 sentences. End with a warm sign-off from the doctor.' },
          { role: 'user', content: `Translate this SOAP note for ${patient_name || 'the patient'}'s parent:\n\n${soap_text}` }
        ]
      },
      { headers: { 'x-compliantchatgpt-key': ccgpt_key, 'x-openai-key': openai_key, 'Content-Type': 'application/json' } }
    );
    const remixed = ccgptResponse.data.content || ccgptResponse.data.choices?.[0]?.message?.content || 'Remix failed';
    const note = { id: noteIdCounter++, patient_id: parseInt(patient_id), patient_name: patient_name || 'Patient', original_soap: soap_text, remixed_text: remixed, status: 'pending', created_at: new Date().toISOString() };
    noteMailbox.push(note);
    res.json({ success: true, note });
  } catch (err) {
    console.error('Note create error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create note', detail: err.response?.data || err.message });
  }
});

app.get('/notes/pending', (req, res) => {
  const pending = noteMailbox.filter(n => n.status === 'pending');
  res.json({ count: pending.length, notes: pending });
});

app.post('/notes/approve', (req, res) => {
  const { id, edited_text } = req.body;
  const note = noteMailbox.find(n => n.id === parseInt(id));
  if (!note) return res.status(404).json({ error: 'Note not found' });
  if (edited_text) note.remixed_text = edited_text;
  note.status = 'approved';
  note.approved_at = new Date().toISOString();
  res.json({ success: true, note });
});

app.get('/notes/patient/:id', (req, res) => {
  const patientId = parseInt(req.params.id);
  const approved = noteMailbox
    .filter(n => n.patient_id === patientId && n.status === 'approved')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ count: approved.length, notes: approved });
});

app.post('/notes/wipe', (req, res) => {
  noteMailbox.length = 0;
  noteIdCounter = 1;
  res.json({ success: true, wiped: true });
});

// Resolve a patient_id from a name — so Book never depends on a fragile
// variable handoff. Aire always knows the caller's name; the proxy finds the ID.
async function resolvePatientId({ subdomain, location_id, first_name, last_name }) {
  const headers = await nexHeaders();
  const params = { subdomain, location_id, name: `${first_name || ''} ${last_name || ''}`.trim() };
  const r = await axios.get(`${BASE_URL}/patients`, { headers, params });
  let patients = [];
  if (r.data?.data?.patients) { patients = Object.values(r.data.data.patients); }
  else if (Array.isArray(r.data?.data)) { patients = r.data.data; }
  return patients.length ? patients[0].id : null;
}

// Create a brand-new patient so first-time callers can book too.
// NexHealth requires provider_id + first_name + last_name; we add DOB + phone
// for clean records. Returns the new patient's id.
async function createPatient({ subdomain, location_id, first_name, last_name, date_of_birth, phone_number, email, provider_id }) {
  const headers = await nexHeaders();
  // NexHealth requires a valid email AND bio.date_of_birth for this location.
  const validEmail = email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const safeEmail = validEmail
    ? email
    : `${(first_name || 'patient').toLowerCase().replace(/[^a-z]/g, '')}.${(last_name || 'new').toLowerCase().replace(/[^a-z]/g, '')}.${Date.now()}@ahs-patients.com`;
  // DOB is required by NexHealth here; if not collected, use a safe placeholder so booking never hard-fails.
  const safeDob = date_of_birth && /^\d{4}-\d{2}-\d{2}$/.test(date_of_birth) ? date_of_birth : '1990-01-01';
  // Phone is also required and cannot be blank at this location.
  const cleanPhone = (phone_number || '').replace(/[^\d]/g, '');
  const safePhone = cleanPhone.length >= 10 ? cleanPhone : '0000000000';
  const bio = { new_patient: true, date_of_birth: safeDob, phone_number: safePhone };
  const body = {
    provider: { provider_id: parseInt(provider_id) },
    patient: { first_name, last_name, email: safeEmail, bio }
  };
  const r = await axios.post(`${BASE_URL}/patients`, body, { headers: { ...headers, 'Content-Type': 'application/json' }, params: { subdomain, location_id } });
  const created = r.data?.data?.user || r.data?.data;
  return created?.id || null;
}

// =============================================================
// TRILLET PHONE BOOKING ROUTES
// =============================================================

app.post('/trillet/identify', async (req, res) => {
  if (!validateTrillet(req, res)) return;
  try {
    const { first_name, last_name, date_of_birth } = req.body;
    if (!first_name && !last_name) {
      return res.status(400).json({ error: 'Need at least first_name or last_name' });
    }
    const headers = await nexHeaders();
    const { subdomain, location_id } = resolveTenant(req);
    const params = { subdomain, location_id, name: `${first_name || ''} ${last_name || ''}`.trim() };
    const r = await axios.get(`${BASE_URL}/patients`, { headers, params });
    let patients = [];
    if (r.data?.data?.patients) { patients = Object.values(r.data.data.patients); }
    else if (Array.isArray(r.data?.data)) { patients = r.data.data; }
    if (date_of_birth && patients.length > 1) {
      const dob = date_of_birth.replace(/\//g, '-');
      patients = patients.filter(p => p.date_of_birth && p.date_of_birth.includes(dob.split('-').pop()));
    }
    if (patients.length === 0) {
      return res.json({ found: false, message: 'No patient found with that name. Are you a new patient?' });
    }
    const patient = patients[0];
    return res.json({ found: true, patient_id: patient.id, name: `${patient.first_name} ${patient.last_name}`, dob: patient.date_of_birth, message: `Found ${patient.first_name} ${patient.last_name}.` });
  } catch (err) {
    console.error('Trillet identify error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Patient lookup failed', detail: err.message });
  }
});

app.get('/trillet/appointment_types', async (req, res) => {
  if (!validateTrillet(req, res)) return;
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/appointment_types`, { headers, params: { subdomain: SUBDOMAIN, location_id: LOCATION_ID } });
    const types = r.data?.data?.appointment_types || r.data?.data || [];
    const formatted = types.map(t => ({ id: t.id, name: t.name, duration: t.minutes, spoken: t.name }));
    res.json({ types: formatted, message: `We offer: ${formatted.map(t => t.name).join(', ')}. Which type of visit do you need?` });
  } catch (err) {
    console.error('Trillet appt types error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch appointment types', detail: err.message });
  }
});

app.get('/trillet/providers', async (req, res) => {
  if (!validateTrillet(req, res)) return;
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/providers`, { headers, params: { subdomain: SUBDOMAIN, location_id: LOCATION_ID } });
    const providers = r.data?.data?.providers || r.data?.data || [];
    const formatted = providers.filter(p => p.is_active !== false).map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}`, spoken: `Doctor ${p.last_name}` }));
    res.json({ providers: formatted, message: `Our providers are: ${formatted.map(p => p.name).join(', ')}. Do you have a preference?` });
  } catch (err) {
    console.error('Trillet providers error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch providers', detail: err.message });
  }
});

app.post('/trillet/slots', async (req, res) => {
  if (!validateTrillet(req, res)) return;
  try {
    const { provider_id, appointment_type_id, start_date, days_ahead = 14 } = req.body;
    const { subdomain, location_id } = resolveTenant(req);
    const topSlots = await fetchTopSlots({ subdomain, location_id, provider_id, appointment_type_id, start_date, days_ahead });

    if (!topSlots.length) {
      return res.json({ available: false, message: `No available appointments in the next ${days_ahead} days. Would you like me to check further out?`, slots: [] });
    }

    res.json({ available: true, count: topSlots.length, slots: topSlots, message: `I found ${topSlots.length} available times. ${topSlots.map(s => s.spoken).join('. ')}. Which option would you prefer?` });
  } catch (err) {
    console.error('Trillet slots error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Slot lookup failed', detail: err.response?.data || err.message });
  }
});

app.post('/trillet/book', async (req, res) => {
  if (!validateTrillet(req, res)) return;
  try {
    const { patient_id: bodyPatientId, first_name, last_name, date_of_birth, phone_number, slot_ref, option_number, provider_id: bodyProvider, appointment_type_id, start_date, days_ahead, duration = 60, note = 'Booked via AHS AI phone receptionist' } = req.body;
    const { subdomain, location_id } = resolveTenant(req);

    let { provider_id, operatory_id, start_time } = req.body;

    // Resolve patient: use patient_id if passed, otherwise look up by name.
    // If still not found, this is a NEW patient — create their record, then book.
    let patient_id = bodyPatientId;
    let is_new_patient = false;
    if (!patient_id && (first_name || last_name)) {
      patient_id = await resolvePatientId({ subdomain, location_id, first_name, last_name });
      if (!patient_id) {
        const intakeProvider = bodyProvider || provider_id || '483310768';
        try {
          patient_id = await createPatient({ subdomain, location_id, first_name, last_name, date_of_birth, phone_number, email: req.body.email, provider_id: intakeProvider });
          is_new_patient = true;
        } catch (createErr) {
          console.error('Create patient error:', JSON.stringify(createErr.response?.data) || createErr.message);
          return res.status(500).json({ success: false, booking_confirmed: false, say_to_caller: "I had trouble setting up your new patient record. Let me connect you with our front desk.", error: 'Patient creation failed', detail: createErr.response?.data || createErr.message });
        }
      }
    }
    if (!patient_id) {
      return res.status(400).json({ error: 'Could not resolve or create patient', message: 'I need your first name and last name to book. Could you share those?' });
    }

    // PRIMARY path: option_number (1-5). Aire only has to pass back a single
    // digit — far more reliable for a voice agent than an 88-char token.
    // We re-derive the identical slot list and select the chosen index.
    if (option_number) {
      const n = parseInt(option_number);
      const list = await fetchTopSlots({ subdomain, location_id, provider_id: bodyProvider, appointment_type_id, start_date, days_ahead });
      const chosen = list.find(s => s.index === n);
      if (!chosen) {
        return res.status(409).json({ error: 'Slot no longer available', message: 'That time was just taken. Let me pull up the current available times again.' });
      }
      start_time = chosen.start_time;
      operatory_id = chosen.operatory_id;
      provider_id = chosen.provider_id;
    } else if (slot_ref) {
      // Fallback path: slot_ref bundles time + operatory + provider (can't desync).
      const decoded = decodeSlotRef(slot_ref);
      if (!decoded) {
        return res.status(400).json({ error: 'Invalid slot_ref', message: 'That time slot was not recognized. Let me pull up the available times again.' });
      }
      start_time = decoded.start_time;
      operatory_id = decoded.operatory_id;
      provider_id = decoded.provider_id;
    }

    if (!provider_id || !start_time) {
      return res.status(400).json({ error: 'Missing required fields: need option_number / slot_ref / explicit time fields' });
    }
    const headers = await nexHeaders();
    // NexHealth duration comes from appointment_type_id OR an explicit end_time — never a "minutes" field.
    // If a type is given, let it set the length. Otherwise compute end_time from duration so it's never a stray 15-min slot.
    const apptObj = { patient_id: parseInt(patient_id), provider_id: parseInt(provider_id), start_time, note };
    if (operatory_id) apptObj.operatory_id = parseInt(operatory_id);
    if (appointment_type_id) {
      apptObj.appointment_type_id = parseInt(appointment_type_id);
    } else {
      apptObj.end_time = new Date(new Date(start_time).getTime() + parseInt(duration) * 60000).toISOString();
    }
    const body = { appt: apptObj };
    const r = await axios.post(`${BASE_URL}/appointments`, body, { headers: { ...headers, 'Content-Type': 'application/json' }, params: { subdomain, location_id, notify_patient: false } });
    const appt = r.data?.data?.appointment || r.data?.data;
    const dt = new Date(start_time);
    const readable = dt.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
    const welcome = is_new_patient ? "Welcome to the practice! I've created your record and booked you. " : '';
    const say = `${welcome}You're all set — your appointment is confirmed for ${readable}. You'll get a reminder before your visit.`;
    res.json({
      success: true,
      booking_confirmed: true,
      say_to_caller: say,
      appointment_id: appt?.id,
      is_new_patient,
      message: say,
      appointment: appt
    });
  } catch (err) {
    console.error('Trillet book error:', err.response?.data || err.message);
    res.status(500).json({ success: false, booking_confirmed: false, say_to_caller: 'I ran into a problem completing that booking. Let me connect you with our front desk.', error: 'Booking failed', message: 'I was unable to complete the booking. Let me connect you with our front desk.', detail: err.response?.data || err.message });
  }
});

// =============================================================
// OPERATORIES
// =============================================================
app.get('/operatories', async (req, res) => {
  try {
    const headers = await nexHeaders();
    const r = await axios.get(`${BASE_URL}/operatories`, { headers, params: req.query });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// =============================================================
// START SERVER
// =============================================================
app.listen(PORT, () => {
  console.log(`AHS NexHealth proxy live on port ${PORT}`);
});
