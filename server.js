const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const upload = multer();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const NEXHEALTH_API_KEY = process.env.NEXHEALTH_API_KEY;
const BASE_URL = 'https://nexhealth.info';
const SUBDOMAIN = 'ahs-practice';
const LOCATION_ID = '347899';
const headers = {
  'Authorization': NEXHEALTH_API_KEY,
  'Accept': 'application/vnd.Nexhealth+json;version=2'
};

// ── LOCATIONS ─────────────────────────────────────────────────
app.get('/locations', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/locations`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── PATIENTS ──────────────────────────────────────────────────
app.get('/patients', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/patients`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

app.post('/patients', async (req, res) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/patients?subdomain=${req.query.subdomain}&location_id=${req.query.location_id}`,
      req.body,
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── SINGLE PATIENT ────────────────────────────────────────────
app.get('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/patients/${id}`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── PATIENT DOCUMENTS ─────────────────────────────────────────
app.get('/patients/:id/documents', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/patients/${req.params.id}/documents`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// FIXED: now properly forwards multipart/form-data with file uploads
app.post('/patients/:id/documents', upload.single('file'), async (req, res) => {
  try {
    const form = new FormData();
    if (req.file) {
      form.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
    }
    if (req.body.document_type_id) {
      form.append('document_type_id', req.body.document_type_id);
    }
    const response = await axios.post(
      `${BASE_URL}/patients/${req.params.id}/documents`,
      form,
      {
        headers: { ...headers, ...form.getHeaders() },
        params: req.query,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── DOCUMENT TYPES ────────────────────────────────────────────
app.get('/document_types', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/document_types`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

app.get('/document_types/:id', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/document_types/${req.params.id}`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── PATIENT INSURANCE COVERAGES ───────────────────────────────
app.get('/patients/:id/insurance_coverages', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/patients/${id}/insurance_coverages`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── PATIENT ALERTS ────────────────────────────────────────────
app.get('/patients/:id/alerts', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/patients/${id}/alerts`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

app.post('/patients/:id/alerts', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.post(`${BASE_URL}/patients/${id}/alerts`, req.body, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      params: req.query
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

app.patch('/patients/:id/alerts/:alertId', async (req, res) => {
  try {
    const { id, alertId } = req.params;
    const response = await axios.patch(`${BASE_URL}/patients/${id}/alerts/${alertId}`, req.body, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      params: req.query
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── PROVIDERS ─────────────────────────────────────────────────
app.get('/providers', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/providers`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── OPERATORIES ───────────────────────────────────────────────
app.get('/operatories', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/operatories`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── APPOINTMENT TYPES ─────────────────────────────────────────
app.get('/appointment_types', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/appointment_types`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

app.post('/appointment_types', async (req, res) => {
  try {
    const response = await axios.post(`${BASE_URL}/appointment_types`, req.body, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      params: req.query
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── APPOINTMENT SLOTS ─────────────────────────────────────────
app.get('/appointment_slots', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/appointment_slots`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── AVAILABILITIES ────────────────────────────────────────────
app.get('/availabilities', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/availabilities`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

app.post('/availabilities', async (req, res) => {
  try {
    const response = await axios.post(`${BASE_URL}/availabilities`, req.body, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      params: req.query
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── APPOINTMENTS ──────────────────────────────────────────────
app.get('/appointments', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/appointments`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

app.post('/appointments', async (req, res) => {
  try {
    const subdomain = req.query.subdomain || req.body.subdomain;
    const appt = req.body.appt;
    const response = await axios.post(
      `${BASE_URL}/appointments?subdomain=${subdomain}&location_id=${appt.location_id}`,
      { appt },
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── PAYMENTS ──────────────────────────────────────────────────
app.get('/payments', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/payments`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── GUARANTOR BALANCES (FIXED: uses guarantor_id in path) ─────
app.get('/guarantor_balances', async (req, res) => {
  try {
    const { subdomain, guarantor_id, location_id } = req.query;
    const url = guarantor_id
      ? `${BASE_URL}/guarantor_balances/${guarantor_id}`
      : `${BASE_URL}/guarantor_balances`;
    const response = await axios.get(url, {
      headers,
      params: guarantor_id ? { subdomain } : { subdomain, location_id }
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── PROCEDURES ────────────────────────────────────────────────
app.get('/procedures', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/procedures`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── SYNC STATUS ───────────────────────────────────────────────
app.get('/sync_status', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/sync_status`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// ── MESSAGE RELAY ─────────────────────────────────────────────
app.post('/messages/send', async (req, res) => {
  try {
    const { patient_name, patient_id, message } = req.body;
    console.log(`📨 MESSAGE FROM PATIENT: ${patient_name} (ID: ${patient_id})`);
    console.log(`   Message: ${message}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    res.json({ success: true, message: 'Message received' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── JOTFORM WEBHOOK ───────────────────────────────────────────
app.post('/webhook/jotform', upload.none(), async (req, res) => {
  try {
    const raw = JSON.parse(req.body.rawRequest || '{}');
    const firstName = raw.q4_patientname?.first || '';
    const lastName = raw.q4_patientname?.last || '';
    const email = raw.q8_email || '';
    const phone = raw.q10_phone?.full || '';
    const month = raw.q5_birthdate?.month || '';
    const day = raw.q5_birthdate?.day || '';
    const year = raw.q5_birthdate?.year || '';
    const dob = year && month && day ? `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}` : '';
    const address = raw.q11_address?.addr_line1 || '';
    const city = raw.q12_citystate?.city || '';
    const state = raw.q12_citystate?.state || '';
    const zip = raw.q12_citystate?.postal || '';

    console.log('JotForm patient:', { firstName, lastName, email, phone, dob });

    if (!firstName || !lastName) {
      console.log('Missing name — skipping');
      return res.status(200).json({ received: true });
    }

    const searchRes = await axios.get(`${BASE_URL}/patients`, {
      headers,
      params: { subdomain: SUBDOMAIN, location_id: LOCATION_ID, name: `${firstName} ${lastName}` }
    });
    const patients = searchRes.data?.data?.patients || [];
    const existing = patients.find(p =>
      p.first_name?.toLowerCase() === firstName.toLowerCase() &&
      p.last_name?.toLowerCase() === lastName.toLowerCase()
    );

    if (existing) {
      console.log('Patient already exists:', existing.id);
    } else {
      const createRes = await axios.post(
        `${BASE_URL}/patients?subdomain=${SUBDOMAIN}&location_id=${LOCATION_ID}`,
        {
          patient: {
            first_name: firstName,
            last_name: lastName,
            email: email,
            bio: {
              phone_number: phone,
              date_of_birth: dob,
              address_line_1: address,
              city: city,
              state: state,
              zip_code: zip
            }
          },
          provider: { provider_id: 483310768 }
        },
        { headers: { ...headers, 'Content-Type': 'application/json' } }
      );
      console.log('Created patient:', createRes.data?.data?.user?.id);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(200).json({ received: true });
  }
});

// ============================================================================
// ║                                                                          ║
// ║         JOTFORM VOICE AI ↔ NEXHEALTH BOOKING BRIDGE — Phase 1            ║
// ║                                                                          ║
// ║   Three routes the Jotform "Send API Request" tool calls during a live   ║
// ║   conversation: lookup_patient → find_slots → book_appointment.          ║
// ║                                                                          ║
// ============================================================================

const JF_SUBDOMAIN   = process.env.JF_SUBDOMAIN   || 'ahs-practice';
const JF_LOCATION_ID = process.env.JF_LOCATION_ID || '347899';

const JF_PROVIDERS = {
  doc1:        '483310768',
  doc2:        '483310770',
  '483310768': '483310768',
  '483310770': '483310770',
};

const JF_DEFAULT_MINUTES = 60;
const JF_SECRET = process.env.JF_SECRET || null;

function jfAuth(req, res, next) {
  if (!JF_SECRET) return next();
  if (req.get('x-jf-secret') !== JF_SECRET) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
}

function jfLog(route, payload) {
  console.log(`[JF ${new Date().toISOString()}] ${route}:`, JSON.stringify(payload));
}

function normalizePhone(p) {
  return String(p || '').replace(/\D/g, '');
}

function resolveProviderId(input) {
  if (!input) return null;
  const key = String(input).toLowerCase().trim();
  return JF_PROVIDERS[key] || JF_PROVIDERS[input] || null;
}

function minutesApart(isoA, isoB) {
  return Math.abs(new Date(isoA) - new Date(isoB)) / 60000;
}

// ── /jf/lookup-patient ────────────────────────────────────────
app.post('/jf/lookup-patient', jfAuth, async (req, res) => {
  jfLog('lookup-patient IN', req.body);
  try {
    const { first_name, last_name, phone, dob, email } = req.body || {};
    if (!first_name || !last_name || !phone || !dob) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: first_name, last_name, phone, dob'
      });
    }

    const phoneDigits = normalizePhone(phone);
    const dobNorm = String(dob).slice(0, 10);

    const searchResp = await axios.get(`${BASE_URL}/patients`, {
      headers,
      params: {
        subdomain: JF_SUBDOMAIN,
        location_id: JF_LOCATION_ID,
        name: `${first_name} ${last_name}`,
        per_page: 50
      }
    });

    const patients = searchResp.data?.data?.patients || [];

    const match = patients.find(p => {
      const bioPhones = [
        normalizePhone(p?.bio?.cell_phone_number),
        normalizePhone(p?.bio?.phone_number),
        normalizePhone(p?.bio?.home_phone_number),
      ].filter(Boolean);
      const pDob = String(p?.bio?.date_of_birth || '').slice(0, 10);
      return bioPhones.includes(phoneDigits) && pDob === dobNorm;
    });

    if (match) {
      jfLog('lookup-patient FOUND', { id: match.id });
      return res.json({
        ok: true,
        patient_id: match.id,
        created: false,
        name: `${match.first_name} ${match.last_name}`
      });
    }

    const createResp = await axios.post(
      `${BASE_URL}/patients?subdomain=${JF_SUBDOMAIN}&location_id=${JF_LOCATION_ID}`,
      {
        provider: { provider_id: parseInt(JF_PROVIDERS.doc1, 10) },
        patient: {
          first_name,
          last_name,
          email: email || `${phoneDigits}@noemail.local`,
          bio: {
            date_of_birth: dobNorm,
            phone_number: phoneDigits,
            cell_phone_number: phoneDigits,
            new_patient: true
          }
        }
      },
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );

    const newId = createResp.data?.data?.user?.id || createResp.data?.data?.id;
    jfLog('lookup-patient CREATED', { id: newId });
    return res.json({
      ok: true,
      patient_id: newId,
      created: true,
      name: `${first_name} ${last_name}`
    });
  } catch (err) {
    jfLog('lookup-patient ERROR', err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      ok: false,
      error: err.response?.data?.error || err.message || 'lookup failed'
    });
  }
});

// ── /jf/find-slots ────────────────────────────────────────────
app.post('/jf/find-slots', jfAuth, async (req, res) => {
  jfLog('find-slots IN', req.body);
  try {
    const { doctor, preferred_datetime, days_window = 14 } = req.body || {};
    const providerId = resolveProviderId(doctor);
    if (!providerId) {
      return res.status(400).json({
        ok: false,
        error: `Unknown doctor "${doctor}". Use doc1 or doc2.`
      });
    }

    const preferred = preferred_datetime ? new Date(preferred_datetime) : new Date();
    if (isNaN(preferred)) {
      return res.status(400).json({
        ok: false,
        error: 'preferred_datetime must be ISO 8601 (e.g. 2026-06-02T14:00:00-04:00)'
      });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startDate = (preferred < tomorrow ? tomorrow : preferred)
      .toISOString().slice(0, 10);

    const slotsResp = await axios.get(`${BASE_URL}/appointment_slots`, {
      headers,
      params: {
        subdomain: JF_SUBDOMAIN,
        'lids[]': JF_LOCATION_ID,
        'pids[]': providerId,
        start_date: startDate,
        days: days_window,
        slot_length: JF_DEFAULT_MINUTES
      }
    });

    const groups = slotsResp.data?.data || [];
    const allSlots = [];
    for (const group of groups) {
      for (const s of (group.slots || [])) {
        allSlots.push({
          time: s.time,
          operatory_id: s.operatory_id,
          provider_id: s.provider_id
        });
      }
    }

    if (allSlots.length === 0) {
      return res.json({
        ok: true,
        slots: [],
        message: `No openings found for the next ${days_window} days.`
      });
    }

    allSlots.sort((a, b) =>
      minutesApart(a.time, preferred.toISOString()) -
      minutesApart(b.time, preferred.toISOString())
    );

    const top3 = allSlots.slice(0, 3).map(s => ({
      ...s,
      pretty: new Date(s.time).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
      })
    }));

    jfLog('find-slots OUT', { count: top3.length, first: top3[0]?.time });
    return res.json({
      ok: true,
      provider_id: providerId,
      slots: top3,
      message: `Nearest options: ${top3.map(s => s.pretty).join(' | ')}`
    });
  } catch (err) {
    jfLog('find-slots ERROR', err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      ok: false,
      error: err.response?.data?.error || err.message || 'slot lookup failed'
    });
  }
});

// ── /jf/book-appointment ──────────────────────────────────────
app.post('/jf/book-appointment', jfAuth, async (req, res) => {
  jfLog('book-appointment IN', req.body);
  try {
    const {
      patient_id,
      provider_id,
      operatory_id,
      start_time,
      note,
      notify_patient = false
    } = req.body || {};

    if (!patient_id || !provider_id || !start_time) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required: patient_id, provider_id, start_time'
      });
    }

    const apptBody = {
      appt: {
        patient_id: parseInt(patient_id, 10),
        provider_id: parseInt(provider_id, 10),
        start_time,
        note: note || 'Booked via Claraion voice AI'
      }
    };
    if (operatory_id) apptBody.appt.operatory_id = parseInt(operatory_id, 10);

    const bookResp = await axios.post(
      `${BASE_URL}/appointments?subdomain=${JF_SUBDOMAIN}` +
        `&location_id=${JF_LOCATION_ID}&notify_patient=${notify_patient}`,
      apptBody,
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );

    const apptId = bookResp.data?.data?.appt?.id ||
                   bookResp.data?.data?.id;

    const pretty = new Date(start_time).toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    });

    jfLog('book-appointment OK', { id: apptId });
    return res.json({
      ok: true,
      appointment_id: apptId,
      confirmation: `You're booked for ${pretty}. We'll see you then!`
    });
  } catch (err) {
    jfLog('book-appointment ERROR', err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      ok: false,
      error: err.response?.data?.error || err.message || 'booking failed'
    });
  }
});

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/jf/health', (req, res) => {
  res.json({
    ok: true,
    bridge: 'Jotform ↔ NexHealth',
    secret_required: !!JF_SECRET,
    subdomain: JF_SUBDOMAIN,
    location_id: JF_LOCATION_ID,
    providers: Object.keys(JF_PROVIDERS).filter(k => k.startsWith('doc')),
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// END JOTFORM BRIDGE
// ============================================================================

app.listen(process.env.PORT || 3000, () => console.log('Proxy running'));
