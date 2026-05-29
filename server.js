// =============================================================
// 📬 MAILBOX — SOAP Note flow between Doctor app & Patient app
// =============================================================
// Add this BLOCK to server.js, right BEFORE the line:
//   app.listen(PORT, ...)
// =============================================================

// In-memory mailbox (resets if Railway restarts — fine for testing)
const noteMailbox = [];
let noteIdCounter = 1;

// ---------- 1. DOCTOR: Create a note (sends SOAP to CCGPT, saves remix) ----------
app.post('/notes/create', async (req, res) => {
  try {
    const { patient_id, patient_name, soap_text, ccgpt_key, openai_key } = req.body;

    if (!patient_id || !soap_text || !ccgpt_key || !openai_key) {
      return res.status(400).json({ error: 'Missing fields: patient_id, soap_text, ccgpt_key, openai_key required' });
    }

    // Call CompliantChatGPT to remix the SOAP into parent-friendly text
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

// ---------- 2. DOCTOR: List notes pending approval ----------
app.get('/notes/pending', (req, res) => {
  const pending = noteMailbox.filter(n => n.status === 'pending');
  res.json({ count: pending.length, notes: pending });
});

// ---------- 3. DOCTOR: Approve a note (sometimes with edits) ----------
app.post('/notes/approve', (req, res) => {
  const { id, edited_text } = req.body;
  const note = noteMailbox.find(n => n.id === parseInt(id));
  if (!note) return res.status(404).json({ error: 'Note not found' });
  if (edited_text) note.remixed_text = edited_text;
  note.status = 'approved';
  note.approved_at = new Date().toISOString();
  res.json({ success: true, note });
});

// ---------- 4. PATIENT: Get all approved notes for a patient ----------
app.get('/notes/patient/:id', (req, res) => {
  const patientId = parseInt(req.params.id);
  const approved = noteMailbox
    .filter(n => n.patient_id === patientId && n.status === 'approved')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ count: approved.length, notes: approved });
});

// ---------- BONUS: Wipe mailbox (testing only) ----------
app.post('/notes/wipe', (req, res) => {
  noteMailbox.length = 0;
  noteIdCounter = 1;
  res.json({ success: true, wiped: true });
});

// =============================================================
// END MAILBOX
// =============================================================
