// =============================================================
// AHS NEXHEALTH PROXY — Full server.js
// Includes: NexHealth routes + Mailbox for SOAP note flow
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

// 1. DOCTOR: Create note → CCGPT remix → save as pending
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
          {
            role: 'system',
            content: 'You are a warm, friendly dental assistant. Translate clinical SOAP notes into simple, kind, parent-friendly language. Use plain English. No clinical jargon. Keep it short — 3 to 5 sentences. End with a warm sign-off from the doctor.'
          },
          {
            role: 'user',
            content: `Translate this SOAP note for ${patient_name || 'the patient'}'s parent:\n\n${soap_text}`
          }
        ]
      },
      {
        headers: {
          'x-compliantchatgpt-key': ccgpt_key,
          'x-openai-key': openai_key,
          'Content-Type': 'application/json'
        }
      }
    );

    const remixed = ccgptResponse.data.content || ccgptResponse.data.choices?.[0]?.message?.content || 'Remix failed';

    const note = {
      id: noteIdCounter++,
      patient_id: parseInt(patient_id),
      patient_name: patient_name || 'Patient',
      original_soap: soap_text,
      remixed_text: remixed,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    noteMailbox.push(note);
    res.json({ success: true, note });
  } catch (err) {
    console.error('Note create error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create note', detail: err.response?.data || err.message });
  }
});

// 2. DOCTOR: List notes pending approval
app.get('/notes/pending', (req, res) => {
  const pending = noteMailbox.filter(n => n.status === 'pending');
  res.json({ count: pending.length, notes: pending });
});

// 3. DOCTOR: Approve a note (sometimes with edits)
app.post('/notes/approve', (req, res) => {
  const { id, edited_text } = req.body;
  const note = noteMailbox.find(n => n.id === parseInt(id));
  if (!note) return res.status(404).json({ error: 'Note not found' });
  if (edited_text) note.remixed_text = edited_text;
  note.status = 'approved';
  note.approved_at = new Date().toISOString();
  res.json({ success: true, note });
});

// 4. PATIENT: Get all approved notes for a patient
app.get('/notes/patient/:id', (req, res) => {
  const patientId = parseInt(req.params.id);
  const approved = noteMailbox
    .filter(n => n.patient_id === patientId && n.status === 'approved')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ count: approved.length, notes: approved });
});

// Wipe mailbox (testing only)
app.post('/notes/wipe', (req, res) => {
  noteMailbox.length = 0;
  noteIdCounter = 1;
  res.json({ success: true, wiped: true });
});

// =============================================================
// START SERVER
// =============================================================
app.listen(PORT, () => {
  console.log(`AHS NexHealth proxy live on port ${PORT}`);
});
