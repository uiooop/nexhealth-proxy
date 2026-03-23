// ============================================================
// DROP THIS INTO YOUR server.js IN THE nexhealth-proxy REPO
// RIGHT AFTER YOUR EXISTING ROUTES (before app.listen)
// ============================================================
// GitHub: uiooop/nexhealth-proxy
// File: server.js
// ============================================================

// ── INSURANCE COVERAGES ──────────────────────────────────────
app.get('/patients/:id/insurance_coverages', async (req, res) => {
  try {
    const token = await getToken();
    const { id } = req.params;
    const { subdomain, location_id } = req.query;
    const response = await axios.get(
      `https://nexhealth.info/patients/${id}/insurance_coverages`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.Nexhealth+json;version=2'
        },
        params: { subdomain, location_id }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Insurance error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// ── SINGLE PATIENT (for balance) ─────────────────────────────
app.get('/patients/:id', async (req, res) => {
  try {
    const token = await getToken();
    const { id } = req.params;
    const { subdomain, location_id } = req.query;
    const response = await axios.get(
      `https://nexhealth.info/patients/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.Nexhealth+json;version=2'
        },
        params: { subdomain, location_id }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Patient by ID error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// ── PAYMENTS ─────────────────────────────────────────────────
app.get('/payments', async (req, res) => {
  try {
    const token = await getToken();
    const { subdomain, location_id, patient_id, per_page = 10, page = 1 } = req.query;
    const response = await axios.get(
      `https://nexhealth.info/payments`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.Nexhealth+json;version=2'
        },
        params: { subdomain, location_id, patient_id, per_page, page }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Payments error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// ── PATIENT ALERTS — GET (read progress %) ───────────────────
app.get('/patients/:id/alerts', async (req, res) => {
  try {
    const token = await getToken();
    const { id } = req.params;
    const { subdomain, location_id } = req.query;
    const response = await axios.get(
      `https://nexhealth.info/patients/${id}/alerts`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.Nexhealth+json;version=2'
        },
        params: { subdomain, location_id }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Alerts GET error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// ── PATIENT ALERTS — POST (create progress %) ────────────────
app.post('/patients/:id/alerts', async (req, res) => {
  try {
    const token = await getToken();
    const { id } = req.params;
    const { subdomain, location_id } = req.query;
    const response = await axios.post(
      `https://nexhealth.info/patients/${id}/alerts`,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.Nexhealth+json;version=2',
          'Content-Type': 'application/json'
        },
        params: { subdomain, location_id }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Alerts POST error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// ── PATIENT ALERTS — PATCH (update progress %) ───────────────
app.patch('/patients/:id/alerts/:alertId', async (req, res) => {
  try {
    const token = await getToken();
    const { id, alertId } = req.params;
    const { subdomain, location_id } = req.query;
    const response = await axios.patch(
      `https://nexhealth.info/patients/${id}/alerts/${alertId}`,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.Nexhealth+json;version=2',
          'Content-Type': 'application/json'
        },
        params: { subdomain, location_id }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Alerts PATCH error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// ── PROCEDURES (treatment history) ───────────────────────────
app.get('/procedures', async (req, res) => {
  try {
    const token = await getToken();
    const { subdomain, location_id, patient_id, per_page = 10, page = 1 } = req.query;
    const response = await axios.get(
      `https://nexhealth.info/procedures`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.Nexhealth+json;version=2'
        },
        params: { subdomain, location_id, patient_id, per_page, page }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Procedures error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// ── SYNC STATUS (health check) ────────────────────────────────
app.get('/sync_status', async (req, res) => {
  try {
    const token = await getToken();
    const { subdomain } = req.query;
    const response = await axios.get(
      `https://nexhealth.info/sync_status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.Nexhealth+json;version=2'
        },
        params: { subdomain }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Sync status error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// ── MESSAGE RELAY (forwards patient msg to practice email/SMS) ─
// Requires: PRACTICE_EMAIL env var set in Railway
app.post('/messages/send', async (req, res) => {
  try {
    const { patient_name, patient_id, message } = req.body;
    // Log to Railway console (visible in Railway logs)
    console.log(`📨 MESSAGE FROM PATIENT: ${patient_name} (ID: ${patient_id})`);
    console.log(`   Message: ${message}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    // TODO: Add Twilio/SendGrid here when ready for real SMS/email
    // For now returns success so app flow works
    res.json({ success: true, message: 'Message received' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// END OF NEW ROUTES
// ============================================================
