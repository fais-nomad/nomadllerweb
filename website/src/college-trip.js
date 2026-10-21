import { 
  fetchTripMetadata, 
  fetchStudents, 
  registerStudent 
} from './college-data.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initTripPage();
  setupModalHandlers();
});

async function initTripPage() {
  const trip = await fetchTripMetadata();
  renderHeroMetadata(trip);
  renderItinerary(trip.itinerary || []);
  renderInclusionsExclusions(trip.inclusions || [], trip.exclusions || []);
  await loadStudentsTable();
}

// 1. Dynamic Hero Metadata
function renderHeroMetadata(trip) {
  const elCollege = document.getElementById('hero-college-name');
  const elTitle = document.getElementById('hero-trip-title');
  const elDesc = document.getElementById('hero-trip-desc');
  const elDates = document.getElementById('hero-trip-dates');
  const elDuration = document.getElementById('hero-trip-duration');
  const elHelpline = document.getElementById('hero-trip-helpline');

  if (elCollege) elCollege.textContent = trip.college_name || 'College Youth Expedition';
  if (elTitle) elTitle.textContent = trip.trip_title || 'Himalayan Adventure';
  if (elDesc) elDesc.textContent = `${trip.destination}. Comprehensive itinerary, verified safety guidelines, and live tracking for students, faculty, and parents.`;
  if (elDates) elDates.textContent = trip.dates || 'Upcoming';
  if (elDuration) elDuration.textContent = trip.duration || '5 Nights / 6 Days';
  if (elHelpline) elHelpline.textContent = trip.emergency_helpline || '+91 62389 98382';
}

// 2. Render Dynamic Itinerary & Checkpoints
function renderItinerary(days) {
  const container = document.getElementById('itinerary-container');
  if (!container) return;

  if (!days || days.length === 0) {
    container.innerHTML = '<p style="color:var(--ct-text-muted);">Itinerary details are being finalized.</p>';
    return;
  }

  container.innerHTML = days.map(d => {
    const checkpoints = d.checkpoints || [];
    const checkpointsHtml = checkpoints.map(cp => {
      const isDone = cp.is_completed;
      const statusIcon = isDone 
        ? '<i class="ph-fill ph-check-circle" style="color:#10b981;"></i>' 
        : '<i class="ph ph-circle" style="color:var(--ct-text-subtle);"></i>';
      
      const verifiedTag = isDone && cp.completed_at
        ? `<span style="color:#34d399; font-size:0.75rem; margin-left:0.5rem;">(Verified at ${new Date(cp.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>`
        : '';

      return `
        <li>
          <strong>${cp.time}</strong>
          <span>
            ${statusIcon} ${cp.title} ${verifiedTag}
            ${cp.desc ? `<div style="font-size:0.8rem; color:var(--ct-text-subtle); margin-top:2px;">${cp.desc}</div>` : ''}
          </span>
        </li>
      `;
    }).join('');

    return `
      <article class="ct-day-card">
        <div class="ct-day-badge">
          DAY <span>${d.day < 10 ? '0' + d.day : d.day}</span>
        </div>
        <div class="ct-day-content">
          <div class="ct-day-header">
            <h3 class="ct-day-title">${d.title}</h3>
            <div class="ct-day-tags">
              ${d.altitude ? `<span class="ct-tag ct-tag-altitude"><i class="ph ph-mountains"></i> ${d.altitude}</span>` : ''}
              ${d.stay ? `<span class="ct-tag ct-tag-stay"><i class="ph ph-bed"></i> ${d.stay}</span>` : ''}
            </div>
          </div>
          ${d.meals ? `
            <div style="font-size: 0.85rem; color: #a7f3d0; margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
              <i class="ph-fill ph-fork-knife" style="color: var(--ct-primary);"></i>
              <strong>Meals:</strong> ${d.meals}
            </div>
          ` : ''}
          <ul class="ct-day-events">
            ${checkpointsHtml || '<li>No checkpoints planned yet for this day.</li>'}
          </ul>
        </div>
      </article>
    `;
  }).join('');
}

// 3. Render Inclusions & Exclusions
function renderInclusionsExclusions(inc, exc) {
  const incList = document.getElementById('inclusions-list');
  const excList = document.getElementById('exclusions-list');

  if (incList) {
    incList.innerHTML = inc.map(item => `
      <li>
        <i class="ph-fill ph-check-circle"></i>
        <span>${item}</span>
      </li>
    `).join('');
  }

  if (excList) {
    excList.innerHTML = exc.map(item => `
      <li>
        <i class="ph-fill ph-x-circle"></i>
        <span>${item}</span>
      </li>
    `).join('');
  }
}

// 4. Load Registered Students Roster
async function loadStudentsTable() {
  const tbody = document.getElementById('students-table-body');
  const badge = document.getElementById('student-count-badge');
  if (!tbody) return;

  const students = await fetchStudents();
  if (badge) {
    badge.textContent = `${students.length} Registered Students`;
  }

  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--ct-text-muted);">No students registered yet. Be the first to join!</td></tr>';
    return;
  }

  tbody.innerHTML = students.map(s => {
    let statusClass = 'ct-status-present';
    if (s.status === 'On Bus') statusClass = 'ct-status-bus';
    if (s.status === 'In Hotel/Camp') statusClass = 'ct-status-hotel';
    if (s.status === 'Attention Needed') statusClass = 'ct-status-alert';

    return `
      <tr>
        <td style="font-weight:700; color:#ffffff;">${s.roll_no}</td>
        <td>${s.name}</td>
        <td>${s.department || 'N/A'}</td>
        <td>${s.bus_no || 'Bus 1'}</td>
        <td>${s.room_no || 'TBD'}</td>
        <td>
          <span class="ct-status-badge ${statusClass}">
            <i class="ph-fill ph-circle"></i> ${s.status || 'Present'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// 5. Modal Handlers
function setupModalHandlers() {
  const modal = document.getElementById('student-modal');
  const openBtn = document.getElementById('btn-open-student-modal');
  const closeBtn = document.getElementById('btn-close-modal');
  const cancelBtn = document.getElementById('btn-cancel-modal');
  const form = document.getElementById('form-add-student');

  if (!modal) return;

  const openModal = () => modal.classList.add('open');
  const closeModal = () => modal.classList.remove('open');

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-submit-student');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Registering...';
      }

      const studentData = {
        name: document.getElementById('std-name').value.trim(),
        roll_no: document.getElementById('std-roll').value.trim().toUpperCase(),
        department: document.getElementById('std-dept').value.trim(),
        phone: document.getElementById('std-phone').value.trim(),
        parent_name: document.getElementById('std-parent-name').value.trim(),
        parent_phone: document.getElementById('std-parent-phone').value.trim(),
        blood_group: document.getElementById('std-blood').value,
        food_preference: document.getElementById('std-food').value,
        notes: document.getElementById('std-notes').value.trim(),
        bus_no: 'Bus ' + (Math.random() > 0.5 ? '1' : '2'),
        room_no: 'Room ' + (200 + Math.floor(Math.random() * 15))
      };

      try {
        await registerStudent(studentData);
        form.reset();
        closeModal();
        alert(`🎉 Registration Successful! ${studentData.name} has been added to the College Trip Roster.`);
        await loadStudentsTable();
      } catch (err) {
        console.error('Registration failed:', err);
        alert('Could not save registration. Please try again.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="ph-fill ph-check"></i> Register Now';
        }
      }
    });
  }
}
