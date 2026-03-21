const express = require('express');
const axios = require('axios');
const cors = require('cors');
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
    const { subdomain, appt } = req.body;
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
app.post('/webhook/jotform', async (req, res) => {
  try {
    console.log('JotForm webhook received:', JSON.stringify(req.body, null, 2));
    const data = req.body;

    // Extract patient info from JotForm submission
    const firstName = data['q3_name3']?.first || data['q3_fullName']?.first || data['firstName'] || '';
    const lastName = data['q3_name3']?.last || data['q3_fullName']?.last || data['lastName'] || '';
    const email = data['q4_email'] || data['email'] || '';
    const phone = data['q5_phoneNumber'] || data['q5_phone'] || data['phone'] || '';
    const dob = data['q6_dateOf'] || data['q6_dob'] || data['dob'] || '';

    console.log('Extracted patient data:', { firstName, lastName, email, phone, dob });

    // Search for existing patient in NexHealth
    if (firstName && lastName) {
      const searchRes = await axios.get(`${BASE_URL}/patients`, {
        headers,
        params: {
          subdomain: SUBDOMAIN,
          location_id: LOCATION_ID,
          name: `${firstName} ${lastName}`
        }
      });

      const patients = searchRes.data?.data?.patients || [];
      let patient = patients.find(p =>
        p.first_name?.toLowerCase() === firstName.toLowerCase() &&
        p.last_name?.toLowerCase() === lastName.toLowerCase()
      );

      if (patient) {
        console.log('Found existing patient:', patient.id);
      } else {
        // Create new patient
        const createRes = await axios.post(
          `${BASE_URL}/patients?subdomain=${SUBDOMAIN}&location_id=${LOCATION_ID}`,
          {
            patient: {
              first_name: firstName,
              last_name: lastName,
              email: email,
              bio: {
                phone_number: phone,
                date_of_birth: dob
              }
            },
            provider: {
              provider_id: 465425250
            }
          },
          { headers: { ...headers, 'Content-Type': 'application/json' } }
        );
        patient = createRes.data?.data?.user;
        console.log('Created new patient:', patient?.id);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('JotForm webhook error:', err.message);
    res.status(200).json({ received: true });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Proxy running'));
