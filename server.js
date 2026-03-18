const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const NEXHEALTH_API_KEY = process.env.NEXHEALTH_API_KEY;
const BASE_URL = 'https://nexhealth.info';

const headers = {
  'Authorization': NEXHEALTH_API_KEY,
  'Accept': 'application/vnd.Nexhealth+json;version=2'
};

// Get locations
app.get('/locations', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/locations`, {
      headers,
      params: req.query
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// Get patients
app.get('/patients', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/patients`, {
      headers,
      params: req.query
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// Get appointment slots
app.get('/appointment_slots', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/appointment_slots`, {
      headers,
      params: req.query
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

// Book appointment
app.post('/appointments', async (req, res) => {
  try {
    const response = await axios.post(`${BASE_URL}/appointments`, req.body, { headers });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed' });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Proxy running'));
