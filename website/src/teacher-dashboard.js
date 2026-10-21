import { 
  fetchStudents, 
  updateStudentAttendance, 
  postLiveUpdate 
} from './college-data.js';

const PIN_CODE = '1234';
let currentStudents = [];

document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupBroadcastForm();
  setupSearchFilter();
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
    loadTeacherData();
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (inputPin.value.trim() === PIN_CODE) {
        sessionStorage.setItem('nomad_teacher_auth', 'true');
        if (gate) gate.style.display = 'none';
        if (content) content.style.display = 'block';
        loadTeacherData();
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

// 2. Load Dashboard Data & Stats
async function loadTeacherData() {
  currentStudents = await fetchStudents();
  renderStats(currentStudents);
  renderStudentsTable(currentStudents);
}

function renderStats(students) {
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

// 3. Render Attendance Table
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
          <div style="font-size:0.85rem; color:#ffffff;">${s.parent_name || 'Guardian'}</div>
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
          <a href="https://wa.me/${(s.parent_phone || '').replace(/[^0-9]/g, '')}?text=Dear%20Parent,%20this%20is%20from%20the%20CET%20College%20Expedition%20regarding%20${encodeURIComponent(s.name)}." target="_blank" class="ct-btn ct-btn-secondary ct-btn-sm" style="padding:0.35rem 0.7rem; font-size:0.75rem;">
            <i class="ph-fill ph-whatsapp-logo" style="color:#22c55e;"></i> WhatsApp
          </a>
        </td>
      </tr>
    `;
  }).join('');

  // Attach live status switcher listeners
  document.querySelectorAll('.ct-attendance-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const newStatus = e.target.value;
      await updateStudentAttendance(id, newStatus);
      const student = currentStudents.find(st => st.id === id);
      if (student) student.status = newStatus;
      renderStats(currentStudents);
    });
  });
}

// 4. Search Filter
function setupSearchFilter() {
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

// 5. Broadcast Live Milestone to Parents Form
function setupBroadcastForm() {
  const form = document.getElementById('form-broadcast-update');
  const scrollBtn = document.getElementById('btn-broadcast-modal');

  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      const section = document.getElementById('broadcast-section');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-submit-broadcast');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Broadcasting...';
      }

      const updateData = {
        title: document.getElementById('bc-title').value.trim(),
        location_name: document.getElementById('bc-location').value.trim(),
        update_type: document.getElementById('bc-type').value,
        posted_by: document.getElementById('bc-posted-by').value.trim(),
        description: document.getElementById('bc-desc').value.trim()
      };

      try {
        await postLiveUpdate(updateData);
        form.reset();
        alert('📡 Live Milestone successfully broadcasted to parents! It is now live on the Parent Tracker.');
      } catch (err) {
        console.error('Broadcast failed:', err);
        alert('Could not broadcast milestone. Please try again.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="ph-fill ph-paper-plane-tilt"></i> Broadcast to Parents Now';
        }
      }
    });
  }
}

// 6. Export Roster to CSV
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
