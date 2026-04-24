// ── AIRE — AI RECEPTIONIST WEBHOOK ───────────────────────────
// Add these routes to server.js just before the app.listen line
// D-ID calls these when Aire ends a conversation

// In-memory store for latest Aire action (resets on redeploy — demo only)
let aireState = { action: null, name: null, timestamp: null };

// D-ID fires this when patient says "book" / "appointment"
app.post('/avatar/book', (req, res) => {
  const name = req.body?.name || req.body?.patient_name || 'Guest';
  aireState = { action: 'view-booking', name, timestamp: Date.now() };
  console.log(`🦷 Aire → Book: ${name}`);
  res.json({ success: true, action: 'view-booking' });
});

// D-ID fires this when patient says "forms" / "intake"
app.post('/avatar/forms', (req, res) => {
  const name = req.body?.name || req.body?.patient_name || 'Guest';
  aireState = { action: 'view-forms', name, timestamp: Date.now() };
  console.log(`📋 Aire → Forms: ${name}`);
  res.json({ success: true, action: 'view-forms' });
});

// D-ID fires this when patient says "explore" / anything else
app.post('/avatar/explore', (req, res) => {
  const name = req.body?.name || req.body?.patient_name || 'Guest';
  aireState = { action: 'view-home', name, timestamp: Date.now() };
  console.log(`🏠 Aire → Explore: ${name}`);
  res.json({ success: true, action: 'view-home' });
});

// Generic end — fires if D-ID doesn't know which specific one
app.post('/avatar/end', (req, res) => {
  const name = req.body?.name || req.body?.patient_name || 'Guest';
  const intent = req.body?.intent || req.body?.response || '';
  let action = 'view-home';
  const i = intent.toLowerCase();
  if (i.includes('book') || i.includes('appoint') || i.includes('schedul')) action = 'view-booking';
  else if (i.includes('form') || i.includes('intake') || i.includes('fill')) action = 'view-forms';
  aireState = { action, name, timestamp: Date.now() };
  console.log(`🎙️ Aire END → ${action} for ${name}`);
  res.json({ success: true, action });
});

// Patient app polls this every 2 seconds
// Returns action only if it fired in the last 10 seconds (fresh)
app.get('/avatar/status', (req, res) => {
  const fresh = aireState.timestamp && (Date.now() - aireState.timestamp < 10000);
  if (fresh) {
    const payload = { ...aireState };
    aireState = { action: null, name: null, timestamp: null }; // consume it
    res.json({ pending: true, ...payload });
  } else {
    res.json({ pending: false });
  }
});
