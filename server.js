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
    const params = { subdomain: SUBDOMAIN, location_id: LOCATION_ID, name: `${first_name || ''} ${last_name || ''}`.trim() };
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
    const headers = await nexHeaders();
    const startDate = start_date ? start_date : new Date().toISOString().split('T')[0];

    const params = new URLSearchParams();
    params.append('subdomain', SUBDOMAIN);
    params.append('start_date', startDate);
    params.append('days', days_ahead.toString());
    params.append('lids[]', LOCATION_ID);
    params.append('pids[]', provider_id || '483310768');
    if (appointment_type_id) params.append('appointment_type_id', appointment_type_id);

    const r = await axios.get(`${BASE_URL}/appointment_slots?${params.toString()}`, { headers });
    const data = r.data?.data || [];
    const slots = Array.isArray(data) ? data.flatMap(d => (d.slots || []).map(s => ({ ...s, provider_id: d.pid, lid: d.lid }))) : [];

    if (!slots.length) {
      return res.json({ available: false, message: `No available appointments in the next ${days_ahead} days. Would you like me to check further out?`, slots: [] });
    }

    const topSlots = slots.slice(0, 5).map((slot, i) => {
      const dt = new Date(slot.time || slot.start_time);
      const readable = dt.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
      return { index: i + 1, provider_id: slot.provider_id, operatory_id: slot.operatory_id, start_time: slot.time || slot.start_time, readable, spoken: `Option ${i + 1}: ${readable}` };
    });

    res.json({ available: true, count: topSlots.length, slots: topSlots, message: `I found ${topSlots.length} available times. ${topSlots.map(s => s.spoken).join('. ')}. Which option would you prefer?` });
  } catch (err) {
    console.error('Trillet slots error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Slot lookup failed', detail: err.response?.data || err.message });
  }
});

app.post('/trillet/book', async (req, res) => {
  if (!validateTrillet(req, res)) return;
  try {
    const { patient_id, provider_id, operatory_id, start_time, appointment_type_id, duration = 60, note = 'Booked via AHS AI phone receptionist' } = req.body;
    if (!patient_id || !provider_id || !start_time) {
      return res.status(400).json({ error: 'Missing required fields: patient_id, provider_id, start_time' });
    }
    const headers = await nexHeaders();
    const body = { appointment: { patient_id: parseInt(patient_id), provider_id: parseInt(provider_id), start_time, minutes: parseInt(duration), note, ...(operatory_id && { operatory_id: parseInt(operatory_id) }), ...(appointment_type_id && { appointment_type_id: parseInt(appointment_type_id) }) } };
    const r = await axios.post(`${BASE_URL}/appointments`, body, { headers: { ...headers, 'Content-Type': 'application/json' }, params: { subdomain: SUBDOMAIN, location_id: LOCATION_ID } });
    const appt = r.data?.data?.appointment || r.data?.data;
    const dt = new Date(start_time);
    const readable = dt.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
    res.json({ success: true, appointment_id: appt?.id, message: `Your appointment is confirmed for ${readable}. You will receive a reminder before your visit. Is there anything else I can help you with?`, appointment: appt });
  } catch (err) {
    console.error('Trillet book error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Booking failed', message: 'I was unable to complete the booking. Let me connect you with our front desk.', detail: err.response?.data || err.message });
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
