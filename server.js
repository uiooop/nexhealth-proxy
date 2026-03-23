const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const NEXHEALTH_API_KEY = process.env.NEXHEALTH_API_KEY;
const BASE_URL = 'https://nexhealth.info';
const SUBDOMAIN = 'ram-demo-practice';
const LOCATION_ID = '343995';
const headers = {
  'Authorization': NEXHEALTH_API_KEY,
  'Accept': 'application/vnd.Nexhealth+json;version=2'
};

app.get('/locations', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/locations`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

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

app.get('/patients/:id/documents', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/patients/${req.params.id}/documents`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

app.post('/patients/:id/documents', async (req, res) => {
  try {
    const response = await axios.post(`${BASE_URL}/patients/${req.params.id}/documents`, req.body, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      params: req.query
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

app.get('/providers', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/providers`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

app.get('/operatories', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/operatories`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

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

app.get('/appointment_slots', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/appointment_slots`, { headers, params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

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

// ── JOTFORM WEBHOOK ──
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
          provider: { provider_id: 465425250 }
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

app.listen(process.env.PORT || 3000, () => console.log('Proxy running'));
