import { 
  fetchTripMetadata,
  saveTripConfig,
  toggleCheckpoint,
  fetchStudents, 
  updateStudentAttendance 
} from './college-data.js';

const PIN_CODE = '1234';
let currentTrip = null;
let currentStudents = [];
let selectedDayFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupTabs();
  setupPlanEditorForms();
  setupPDFUploader();
  setupRollCallSearch();
  setupExportCSV();
});

// 1. PIN Auth Handling
function setupAuth() {
  const gate = document.getElementById('auth-gate');
  const content = document.getElementById('dashboard-content');
  const form = document.getElementById('form-auth-pin');
  const inputPin = document.getElementById('input-pin');
  const logoutBtn = document.getElementById('btn-logout-pin');

  const isAuth = sessionStorage.getItem('nomad_teacher_auth') === 'true';
  if (isAuth) {
    if (gate) gate.style.display = 'none';
    if (content) content.style.display = 'block';
    loadAllDashboardData();
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (inputPin.value.trim() === PIN_CODE) {
        sessionStorage.setItem('nomad_teacher_auth', 'true');
        if (gate) gate.style.display = 'none';
        if (content) content.style.display = 'block';
        loadAllDashboardData();
      } else {
        alert('Incorrect PIN. Please enter 1234.');
        inputPin.value = '';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('nomad_teacher_auth');
      if (content) content.style.display = 'none';
      if (gate) gate.style.display = 'block';
      if (inputPin) inputPin.value = '';
    });
  }
}

// 2. Tab Navigation
function setupTabs() {
  const tabs = document.querySelectorAll('.ct-tab-btn');
  const contents = document.querySelectorAll('.ct-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.style.display = 'none');

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.style.display = 'block';
    });
  });
}

// 3. Load All Data
async function loadAllDashboardData() {
  currentTrip = await fetchTripMetadata();
  currentStudents = await fetchStudents();

  // Populate header badges
  const badge = document.getElementById('dash-college-badge');
  const title = document.getElementById('dash-trip-title');
  const guide = document.getElementById('current-guide-name');

  if (badge) badge.textContent = currentTrip.college_name || 'College Expedition';
  if (title) title.textContent = currentTrip.trip_title || 'Expedition Command Center';
  if (guide) guide.textContent = currentTrip.nomad_guide || 'Guide Arjun Negi';

  // Render Tab 1: Checkpoints
  renderDayFilterPills();
  renderCheckpointsList();
  updateProgressStats();

  // Render Tab 2: Roll Call
  renderStudentsTable(currentStudents);
  updateRollCallStats(currentStudents);

  // Pre-fill Tab 3: Plan Editor
  prefillPlanEditor(currentTrip);
}

// =========================================================
// TAB 1: GUIDE'S CHECKPOINT TICK SYSTEM
// =========================================================
function renderDayFilterPills() {
  const container = document.getElementById('day-selector-pills');
  const addDaySelect = document.getElementById('add-cp-day');
  if (!container || !currentTrip) return;

  const days = currentTrip.itinerary || [];

  // Populate filter pills
  let pillsHtml = `
    <button class="ct-btn ct-btn-sm ${selectedDayFilter === 'all' ? 'ct-btn-primary' : 'ct-btn-secondary'}" data-day="all">
      All Days (${days.length})
    </button>
  `;

  days.forEach(d => {
    pillsHtml += `
      <button class="ct-btn ct-btn-sm ${selectedDayFilter === String(d.day) ? 'ct-btn-primary' : 'ct-btn-secondary'}" data-day="${d.day}">
        Day ${d.day}
      </button>
    `;
  });
  container.innerHTML = pillsHtml;

  // Populate dropdown in Add Checkpoint form
  if (addDaySelect) {
    addDaySelect.innerHTML = days.map(d => `<option value="${d.day}">Day ${d.day}: ${d.title}</option>`).join('');
  }

  // Filter click listener
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectedDayFilter = btn.getAttribute('data-day');
      renderDayFilterPills();
      renderCheckpointsList();
    });
  });
}

function updateProgressStats() {
  if (!currentTrip || !currentTrip.itinerary) return;

  let totalCheckpoints = 0;
  let completedCheckpoints = 0;

  currentTrip.itinerary.forEach(d => {
    (d.checkpoints || []).forEach(cp => {
      totalCheckpoints++;
      if (cp.is_completed) completedCheckpoints++;
    });
  });

  const percent = totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;

  const elPercent = document.getElementById('progress-percent');
  const elFill = document.getElementById('progress-bar-fill');
  const elCount = document.getElementById('progress-count-text');

  if (elPercent) elPercent.textContent = `${percent}%`;
  if (elFill) elFill.style.width = `${percent}%`;
  if (elCount) elCount.textContent = `${completedCheckpoints} of ${totalCheckpoints} milestones completed`;
}

function renderCheckpointsList() {
  const container = document.getElementById('checkpoints-list-container');
  if (!container || !currentTrip) return;

  const days = currentTrip.itinerary || [];
  let html = '';

  days.forEach(d => {
    if (selectedDayFilter !== 'all' && String(d.day) !== selectedDayFilter) {
      return;
    }

    const checkpoints = d.checkpoints || [];
    html += `
      <div style="margin-top: 1rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
        <h4 style="font-family: var(--ct-font-display); font-size: 1.15rem; color: #ffffff;">
          📅 Day ${d.day}: ${d.title}
        </h4>
        <span class="ct-tag ct-tag-stay">${d.stay || ''}</span>
      </div>
    `;

    if (checkpoints.length === 0) {
      html += `<div style="color: var(--ct-text-muted); font-size: 0.85rem; padding: 0.75rem;">No planned checkpoints added for Day ${d.day} yet.</div>`;
    } else {
      checkpoints.forEach(cp => {
        const isDone = cp.is_completed;
        const timeBadge = isDone && cp.completed_at 
          ? `<span class="ct-checkpoint-meta"><i class="ph-fill ph-check-circle"></i> Completed at ${new Date(cp.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${cp.completed_by || 'Guide'}</span>`
          : '<span style="font-size:0.75rem; color:var(--ct-text-subtle);">⬜ Pending - Tap box to mark complete &amp; notify parents</span>';

        html += `
          <div class="ct-checkpoint-item ${isDone ? 'completed' : ''}" id="card-${cp.id}">
            <div class="ct-checkpoint-left">
              <button 
                type="button" 
                class="ct-checkpoint-check-btn btn-toggle-cp" 
                data-cp-id="${cp.id}" 
                data-done="${isDone ? 'true' : 'false'}"
                title="${isDone ? 'Click to uncheck' : 'Click to tick & notify parents'}"
              >
                <i class="ph-bold ph-check" style="${isDone ? 'color: #042114;' : 'display: none;'}"></i>
              </button>
              <div class="ct-checkpoint-info">
                <h4>
                  <span style="color: var(--ct-accent-cyan);">${cp.time}</span>
                  <span>${cp.title}</span>
                </h4>
                <p>${cp.desc || ''}</p>
                ${timeBadge}
              </div>
            </div>
            <div>
              <span class="ct-status-badge ${isDone ? 'ct-status-present' : 'ct-status-alert'}" style="font-size:0.72rem;">
                ${isDone ? 'Live Synced' : 'Upcoming'}
              </span>
            </div>
          </div>
        `;
      });
    }
  });

  container.innerHTML = html;

  // Attach Checkbox Toggle Click Listeners
  container.querySelectorAll('.btn-toggle-cp').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cpId = btn.getAttribute('data-cp-id');
      const currentlyDone = btn.getAttribute('data-done') === 'true';
      const newStatus = !currentlyDone;
      const author = currentTrip.nomad_guide || 'Guide on Duty';

      btn.disabled = true;
      try {
        currentTrip = await toggleCheckpoint(cpId, newStatus, author);
        renderCheckpointsList();
        updateProgressStats();
        if (newStatus) {
          alert('✅ Milestone marked completed! Parents have been notified on their Live Tracker.');
        }
      } catch (err) {
        console.error('Error toggling milestone:', err);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

// =========================================================
// TAB 2: ROLL CALL & ATTENDANCE
// =========================================================
function updateRollCallStats(students) {
  const total = students.length;
  const present = students.filter(s => s.status === 'Present').length;
  const bus = students.filter(s => s.status === 'On Bus').length;
  const hotel = students.filter(s => s.status === 'In Hotel/Camp').length;

  const elTotal = document.getElementById('stat-total');
  const elPresent = document.getElementById('stat-present');
  const elBus = document.getElementById('stat-bus');
  const elHotel = document.getElementById('stat-hotel');

  if (elTotal) elTotal.textContent = total;
  if (elPresent) elPresent.textContent = present;
  if (elBus) elBus.textContent = bus;
  if (elHotel) elHotel.textContent = hotel;
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('teacher-students-table');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--ct-text-muted);">No students registered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = students.map(s => {
    return `
      <tr>
        <td style="font-weight:700; color:#ffffff;">${s.roll_no}</td>
        <td>
          <div style="font-weight:600; color:#ffffff;">${s.name}</div>
          <div style="font-size:0.75rem; color:var(--ct-text-subtle);">${s.department || ''}</div>
        </td>
        <td>
          <div><i class="ph ph-bus" style="color:var(--ct-accent-cyan);"></i> ${s.bus_no || 'Bus 1'}</div>
          <div style="font-size:0.78rem; color:var(--ct-text-muted);"><i class="ph ph-bed"></i> ${s.room_no || 'Room 101'}</div>
        </td>
        <td>
          <div style="font-size:0.85rem; color:#ffffff;">${s.parent_name || 'Parent'}</div>
          <a href="tel:${s.parent_phone}" style="color:var(--ct-primary); font-size:0.8rem; text-decoration:underline;">
            <i class="ph-fill ph-phone-call"></i> ${s.parent_phone || 'N/A'}
          </a>
        </td>
        <td>
          <select class="ct-form-control ct-attendance-select" data-id="${s.id}" style="padding:0.4rem 0.6rem; font-size:0.8rem; background:#070b14; width:150px;">
            <option value="Present" ${s.status === 'Present' ? 'selected' : ''}>🟢 Present</option>
            <option value="On Bus" ${s.status === 'On Bus' ? 'selected' : ''}>🚌 On Bus</option>
            <option value="In Hotel/Camp" ${s.status === 'In Hotel/Camp' ? 'selected' : ''}>🏨 In Hotel</option>
            <option value="Attention Needed" ${s.status === 'Attention Needed' ? 'selected' : ''}>⚠️ Attention Needed</option>
          </select>
        </td>
        <td>
          <a href="https://wa.me/${(s.parent_phone || '').replace(/[^0-9]/g, '')}?text=Dear%20Parent,%20this%20is%20from%20the%20College%20Expedition%20regarding%20${encodeURIComponent(s.name)}." target="_blank" class="ct-btn ct-btn-secondary ct-btn-sm" style="padding:0.35rem 0.7rem; font-size:0.75rem;">
            <i class="ph-fill ph-whatsapp-logo" style="color:#22c55e;"></i> WhatsApp
          </a>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.ct-attendance-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const newStatus = e.target.value;
      await updateStudentAttendance(id, newStatus);
      const student = currentStudents.find(st => st.id === id);
      if (student) student.status = newStatus;
      updateRollCallStats(currentStudents);
    });
  });
}

function setupRollCallSearch() {
  const searchInput = document.getElementById('search-students-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = currentStudents.filter(s => 
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.roll_no && s.roll_no.toLowerCase().includes(q)) ||
      (s.bus_no && s.bus_no.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
    renderStudentsTable(filtered);
  });
}

function setupExportCSV() {
  const exportBtn = document.getElementById('btn-export-csv');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    if (!currentStudents || currentStudents.length === 0) {
      alert('No students to export.');
      return;
    }

    const headers = ['Roll No', 'Name', 'Department', 'Phone', 'Parent Name', 'Parent Phone', 'Blood Group', 'Coach', 'Room', 'Status'];
    const rows = currentStudents.map(s => [
      `"${s.roll_no || ''}"`,
      `"${s.name || ''}"`,
      `"${s.department || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.parent_name || ''}"`,
      `"${s.parent_phone || ''}"`,
      `"${s.blood_group || ''}"`,
      `"${s.bus_no || ''}"`,
      `"${s.room_no || ''}"`,
      `"${s.status || 'Present'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `college_trip_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// =========================================================
// TAB 3: DYNAMIC TRIP & PLAN EDITOR
// =========================================================
function prefillPlanEditor(trip) {
  if (!trip) return;

  // Master trip details
  document.getElementById('edit-college-name').value = trip.college_name || '';
  document.getElementById('edit-trip-title').value = trip.trip_title || '';
  document.getElementById('edit-destination').value = trip.destination || '';
  document.getElementById('edit-dates').value = trip.dates || '';
  document.getElementById('edit-coaches').value = trip.coaches || '';
  document.getElementById('edit-emergency').value = trip.emergency_helpline || '';
  document.getElementById('edit-faculty').value = `${trip.lead_faculty || ''} (${trip.faculty_phone || ''})`;
  document.getElementById('edit-guide').value = `${trip.nomad_guide || ''} (${trip.nomad_phone || ''})`;

  // Inclusions & Exclusions
  const incEl = document.getElementById('edit-inclusions');
  const excEl = document.getElementById('edit-exclusions');
  if (incEl) incEl.value = (trip.inclusions || []).join('\n');
  if (excEl) excEl.value = (trip.exclusions || []).join('\n');
}

function setupPlanEditorForms() {
  // 1. Save Master Info
  const formMeta = document.getElementById('form-edit-trip-meta');
  if (formMeta) {
    formMeta.addEventListener('submit', async (e) => {
      e.preventDefault();
      const facultyRaw = document.getElementById('edit-faculty').value;
      const guideRaw = document.getElementById('edit-guide').value;

      currentTrip.college_name = document.getElementById('edit-college-name').value.trim();
      currentTrip.trip_title = document.getElementById('edit-trip-title').value.trim();
      currentTrip.destination = document.getElementById('edit-destination').value.trim();
      currentTrip.dates = document.getElementById('edit-dates').value.trim();
      currentTrip.coaches = document.getElementById('edit-coaches').value.trim();
      currentTrip.emergency_helpline = document.getElementById('edit-emergency').value.trim();
      currentTrip.lead_faculty = facultyRaw;
      currentTrip.nomad_guide = guideRaw;

      await saveTripConfig(currentTrip);
      alert('🏛️ Master trip information successfully updated and live across all portals!');
      loadAllDashboardData();
    });
  }

  // 2. Add New Checkpoint Form
  const formAddCp = document.getElementById('form-add-checkpoint');
  if (formAddCp) {
    formAddCp.addEventListener('submit', async (e) => {
      e.preventDefault();
      const targetDay = parseInt(document.getElementById('add-cp-day').value);
      const time = document.getElementById('add-cp-time').value.trim();
      const title = document.getElementById('add-cp-title').value.trim();
      const desc = document.getElementById('add-cp-desc').value.trim();

      const newCp = {
        id: 'cp-' + Date.now(),
        time,
        title,
        desc,
        is_completed: false,
        completed_at: null,
        completed_by: null
      };

      const dayObj = currentTrip.itinerary.find(d => d.day === targetDay);
      if (dayObj) {
        if (!dayObj.checkpoints) dayObj.checkpoints = [];
        dayObj.checkpoints.push(newCp);
        await saveTripConfig(currentTrip);
        formAddCp.reset();
        alert(`➕ New checkpoint added to Day ${targetDay}! You can now tick it off when completed.`);
        loadAllDashboardData();
      }
    });
  }

  // 3. Save Inclusions & Exclusions
  const formIncExc = document.getElementById('form-edit-inc-exc');
  if (formIncExc) {
    formIncExc.addEventListener('submit', async (e) => {
      e.preventDefault();
      const incText = document.getElementById('edit-inclusions').value;
      const excText = document.getElementById('edit-exclusions').value;

      currentTrip.inclusions = incText.split('\n').map(s => s.trim()).filter(Boolean);
      currentTrip.exclusions = excText.split('\n').map(s => s.trim()).filter(Boolean);

      await saveTripConfig(currentTrip);
      alert('🎒 Inclusions and Exclusions saved successfully and live on the student portal!');
    });
  }
}

// =========================================================
// PDF UPLOADER & AI ITINERARY / INCLUSIONS EXTRACTOR
// =========================================================
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

function setupPDFUploader() {
  const fileInput = document.getElementById('input-itinerary-pdf');
  const quickBtn = document.getElementById('btn-quick-upload-pdf');
  const statusBox = document.getElementById('pdf-import-status');
  const statusTitle = document.getElementById('pdf-status-title');
  const statusDesc = document.getElementById('pdf-status-desc');

  if (quickBtn && fileInput) {
    quickBtn.addEventListener('click', () => {
      // Switch to Tab 3 (Plan Editor) so progress is clearly visible
      const planTabBtn = document.querySelector('[data-tab="tab-plan-editor"]');
      if (planTabBtn) planTabBtn.click();
      fileInput.click();
    });
  }

  if (!fileInput) return;

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }

    if (statusBox) statusBox.style.display = 'block';
    if (statusTitle) statusTitle.textContent = `Reading "${file.name}"...`;
    if (statusDesc) statusDesc.textContent = 'Extracting pages & text content from PDF...';

    try {
      const arrayBuffer = await file.arrayBuffer();

      if (typeof window.pdfjsLib === 'undefined') {
        throw new Error('PDF.js library could not be loaded. Please ensure internet access.');
      }

      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `\n--- PAGE ${i} ---\n` + pageText;
      }

      if (statusTitle) statusTitle.textContent = 'Analyzing Itinerary, Checkpoints & Inclusions with AI...';
      if (statusDesc) statusDesc.textContent = `Extracted ${pdf.numPages} pages (${fullText.length} characters). Generating dynamic checkpoints...`;

      // Call AI extraction
      const extractedPlan = await extractItineraryFromTextWithAI(fullText);

      if (extractedPlan) {
        if (extractedPlan.college_name) currentTrip.college_name = extractedPlan.college_name;
        if (extractedPlan.trip_title) currentTrip.trip_title = extractedPlan.trip_title;
        if (extractedPlan.destination) currentTrip.destination = extractedPlan.destination;
        if (extractedPlan.dates) currentTrip.dates = extractedPlan.dates;
        if (extractedPlan.duration) currentTrip.duration = extractedPlan.duration;
        if (extractedPlan.coaches) currentTrip.coaches = extractedPlan.coaches;
        if (extractedPlan.lead_faculty) currentTrip.lead_faculty = extractedPlan.lead_faculty;
        if (extractedPlan.itinerary && extractedPlan.itinerary.length > 0) {
          currentTrip.itinerary = extractedPlan.itinerary;
        }
        if (extractedPlan.inclusions && extractedPlan.inclusions.length > 0) {
          currentTrip.inclusions = extractedPlan.inclusions;
        }
        if (extractedPlan.exclusions && extractedPlan.exclusions.length > 0) {
          currentTrip.exclusions = extractedPlan.exclusions;
        }

        await saveTripConfig(currentTrip);

        if (statusTitle) statusTitle.textContent = '✅ Extraction Complete & Live!';
        if (statusDesc) statusDesc.textContent = `Extracted ${currentTrip.itinerary.length} Days, ${currentTrip.inclusions.length} Inclusions, and ${currentTrip.exclusions.length} Exclusions!`;

        alert(`🎉 PDF Successfully Processed!\n\nExtracted: ${currentTrip.trip_title || 'Expedition'}\nDestination: ${currentTrip.destination}\nDays: ${currentTrip.itinerary.length} Days\nInclusions: ${currentTrip.inclusions.length} items\nExclusions: ${currentTrip.exclusions.length} items\n\nAll checkpoints are now live for Guide Ticking and Parent Tracking!`);

        await loadAllDashboardData();
      }
    } catch (err) {
      console.error('PDF Processing Error:', err);
      alert('Error parsing PDF: ' + (err.message || 'Unknown error') + '\nPlease try again or paste details manually.');
      if (statusBox) statusBox.style.display = 'none';
    } finally {
      fileInput.value = '';
    }
  });
}

// AI Extraction with DeepSeek + Intelligent Regex Fallback
async function extractItineraryFromTextWithAI(text) {
  const prompt = `You are a travel data assistant. Extract the complete college tour / trip structure from the PDF text below and return ONLY a valid JSON object.
Do NOT output markdown code fences, backticks, or extra conversational text. Return pure JSON.

SCHEMA:
{
  "college_name": "College / University Name or empty string",
  "trip_title": "Expedition or Tour Title",
  "destination": "Main Destination (e.g. Manali, Kasol, Wayanad)",
  "duration": "e.g. 5 Nights / 6 Days",
  "dates": "e.g. Nov 12 - Nov 17, 2026 or Dates TBD",
  "coaches": "e.g. Luxury AC Air-Suspension Coaches",
  "lead_faculty": "Faculty in-charge name if mentioned",
  "itinerary": [
    {
      "day": 1,
      "title": "Day 1 Title / Destination",
      "altitude": "e.g. 2,050m or empty",
      "stay": "Resort / Hotel Name",
      "meals": "e.g. Breakfast, Lunch, Dinner",
      "checkpoints": [
        {
          "id": "cp-1-1",
          "time": "06:00 AM",
          "title": "Departure from Campus",
          "desc": "Short details of this checkpoint event",
          "is_completed": false,
          "completed_at": null,
          "completed_by": null
        }
      ]
    }
  ],
  "inclusions": [
    "Inclusion 1",
    "Inclusion 2"
  ],
  "exclusions": [
    "Exclusion 1",
    "Exclusion 2"
  ]
}

PDF TEXT CONTENT:
${text.slice(0, 15000)}
`;

  // 1. Try DeepSeek AI
  if (DEEPSEEK_API_KEY) {
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1
        })
      });

      if (response.ok) {
        const json = await response.json();
        let content = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
        if (content) {
          // Strip any markdown wrapper if returned
          content = content.trim();
          if (content.startsWith('```json')) content = content.slice(7);
          if (content.startsWith('```')) content = content.slice(3);
          if (content.endsWith('```')) content = content.slice(0, -3);
          const parsed = JSON.parse(content.trim());
          if (parsed && parsed.itinerary && parsed.itinerary.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('DeepSeek AI fetch failed or returned non-JSON, using intelligent local parser:', e);
    }
  }

  // 2. Intelligent Resilient Fallback Parser
  return parseItineraryTextFallback(text);
}

// Fallback Regex Parser for PDF Text
function parseItineraryTextFallback(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const days = [];
  const inclusions = [];
  const exclusions = [];
  let currentDay = null;
  let inInclusions = false;
  let inExclusions = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Section toggles
    if (lower.includes('inclusion') || lower.includes('cost includes') || lower.includes('package includes') || lower.includes("what's included")) {
      inInclusions = true;
      inExclusions = false;
      continue;
    }
    if (lower.includes('exclusion') || lower.includes('cost excludes') || lower.includes('package excludes') || lower.includes("what's not included")) {
      inInclusions = false;
      inExclusions = true;
      continue;
    }

    if (inInclusions && !inExclusions) {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.match(/^[0-9]+\./)) {
        inclusions.push(line.replace(/^[•\-*\d.]+\s*/, '').trim());
      } else if (line.length > 8 && line.length < 150) {
        inclusions.push(line);
      }
      continue;
    }

    if (inExclusions) {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.match(/^[0-9]+\./)) {
        exclusions.push(line.replace(/^[•\-*\d.]+\s*/, '').trim());
      } else if (line.length > 8 && line.length < 150) {
        exclusions.push(line);
      }
      continue;
    }

    // Day Detection (Day 1, Day 01, Day 2: Arrival...)
    const dayMatch = line.match(/^Day\s*0?(\d+)[:\s-]*(.*)/i);
    if (dayMatch) {
      const dayNum = parseInt(dayMatch[1]);
      const dayTitle = dayMatch[2].trim() || `Day ${dayNum} Exploration`;
      currentDay = {
        day: dayNum,
        title: dayTitle,
        altitude: '',
        stay: 'Resort / Alpine Camp',
        meals: 'Breakfast • Lunch • Dinner',
        checkpoints: [
          {
            id: `cp-${dayNum}-1`,
            time: '08:00 AM',
            title: 'Morning Briefing & Activities',
            desc: dayTitle,
            is_completed: false,
            completed_at: null,
            completed_by: null
          },
          {
            id: `cp-${dayNum}-2`,
            time: '01:30 PM',
            title: 'Lunch & Afternoon Program',
            desc: 'Scheduled tour activity and meal halt.',
            is_completed: false,
            completed_at: null,
            completed_by: null
          },
          {
            id: `cp-${dayNum}-3`,
            time: '07:30 PM',
            title: 'Evening Debrief & Dinner',
            desc: 'Group roll call and dinner.',
            is_completed: false,
            completed_at: null,
            completed_by: null
          }
        ]
      };
      days.push(currentDay);
    }
  }

  return {
    college_name: 'College Youth Expedition',
    trip_title: 'College Adventure Expedition',
    destination: 'Himalayan Mountain Tour',
    duration: `${days.length || 5} Days`,
    dates: 'Upcoming',
    coaches: 'Luxury AC Coaches',
    lead_faculty: 'Faculty In-Charge',
    itinerary: days.length > 0 ? days : currentTrip.itinerary,
    inclusions: inclusions.length > 0 ? inclusions : currentTrip.inclusions,
    exclusions: exclusions.length > 0 ? exclusions : currentTrip.exclusions
  };
}

