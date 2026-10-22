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
  renderPackingList(trip.packing_list || []);
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
  if (elTitle) elTitle.textContent = trip.trip_title || 'Annual College Expedition';
  if (elDesc) {
    elDesc.textContent = (trip.destination && trip.destination !== 'Expedition Destination')
      ? `${trip.destination}. Comprehensive itinerary, verified safety guidelines, and live tracking for students, faculty, and parents.`
      : 'Comprehensive itinerary, verified safety guidelines, and live tracking for students, faculty, and parents.';
  }
  if (elDates) elDates.textContent = trip.dates || 'Dates Upcoming';
  if (elDuration) elDuration.textContent = trip.duration || '5 Nights / 6 Days';
  if (elHelpline) elHelpline.textContent = trip.emergency_helpline || '+91 62389 98382';
}

// 2. Render Dynamic Itinerary & Checkpoints
function renderItinerary(days) {
  const container = document.getElementById('itinerary-container');
  if (!container) return;

  if (!days || days.length === 0) {
    container.innerHTML = `
      <div class="ct-card" style="text-align: center; padding: 3rem 1.5rem; background: rgba(14, 23, 38, 0.6); border: 1px dashed var(--ct-glass-border); border-radius: var(--ct-radius-md);">
        <i class="ph ph-map-trifold" style="font-size: 3rem; color: var(--ct-primary); margin-bottom: 0.75rem; display: inline-block;"></i>
        <h3 style="font-family: var(--ct-font-display); font-size: 1.35rem; color: #ffffff; margin-bottom: 0.5rem;">
          Expedition Itinerary Under Preparation
        </h3>
        <p style="color: var(--ct-text-muted); font-size: 0.92rem; max-width: 520px; margin: 0 auto 1.25rem;">
          The day-by-day expedition schedule will appear here as soon as it is published by the tour guides &amp; faculty coordinators.
        </p>
        <a href="/teacher-dashboard" class="ct-btn ct-btn-secondary ct-btn-sm" style="display: inline-flex; align-items: center; gap: 0.4rem;">
          <i class="ph ph-sliders"></i> Open Guide Command Center
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = days.map(d => {
    const checkpoints = d.checkpoints || [];
    const checkpointsHtml = checkpoints.map(cp => {
      const isDone = Boolean(cp.is_completed);
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
    if (!inc || inc.length === 0) {
      incList.innerHTML = '<li style="color:var(--ct-text-muted); font-size:0.88rem;">Trip inclusions are being finalized by coordinators.</li>';
    } else {
      incList.innerHTML = inc.map(item => `
        <li>
          <i class="ph-fill ph-check-circle"></i>
          <span>${item}</span>
        </li>
      `).join('');
    }
  }

  if (excList) {
    if (!exc || exc.length === 0) {
      excList.innerHTML = '<li style="color:var(--ct-text-muted); font-size:0.88rem;">Trip exclusions are being finalized by coordinators.</li>';
    } else {
      excList.innerHTML = exc.map(item => `
        <li>
          <i class="ph-fill ph-x-circle"></i>
          <span>${item}</span>
        </li>
      `).join('');
    }
  }
}

// 3.5 Render Dynamic Packing Checklist
function renderPackingList(packing) {
  const container = document.getElementById('packing-checklist-container');
  if (!container) return;

  if (Array.isArray(packing) && packing.length > 0) {
    container.innerHTML = `
      <div class="ct-card">
        <ul class="ct-list-items" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.85rem;">
          ${packing.map(item => `
            <li style="font-size: 0.92rem;">
              <i class="ph-fill ph-check-circle" style="color: var(--ct-accent-cyan);"></i>
              <span>${item}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="ct-card" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
      <div>
        <h3 style="color: var(--ct-accent-cyan); margin-bottom: 0.8rem; font-family: var(--ct-font-display);">
          <i class="ph ph-identification-card"></i> Identity &amp; Documents
        </h3>
        <ul class="ct-list-items">
          <li><i class="ph-fill ph-check" style="color:var(--ct-accent-cyan)"></i> College Identity Card (Mandatory for entry/transport)</li>
          <li><i class="ph-fill ph-check" style="color:var(--ct-accent-cyan)"></i> Government Photo ID (Aadhaar / Voter ID / Passport)</li>
          <li><i class="ph-fill ph-check" style="color:var(--ct-accent-cyan)"></i> Signed Parent Consent Form (if required)</li>
        </ul>
      </div>

      <div>
        <h3 style="color: var(--ct-primary); margin-bottom: 0.8rem; font-family: var(--ct-font-display);">
          <i class="ph ph-t-shirt"></i> Apparel &amp; Footwear
        </h3>
        <ul class="ct-list-items">
          <li><i class="ph-fill ph-check" style="color:var(--ct-primary)"></i> Season-appropriate travel attire &amp; extra change of clothes</li>
          <li><i class="ph-fill ph-check" style="color:var(--ct-primary)"></i> Comfortable walking / sports shoes with good grip</li>
          <li><i class="ph-fill ph-check" style="color:var(--ct-primary)"></i> Lightweight jacket or windcheater</li>
        </ul>
      </div>

      <div>
        <h3 style="color: var(--ct-accent-amber); margin-bottom: 0.8rem; font-family: var(--ct-font-display);">
          <i class="ph ph-first-aid"></i> Health &amp; Personal Essentials
        </h3>
        <ul class="ct-list-items">
          <li><i class="ph-fill ph-check" style="color:var(--ct-accent-amber)"></i> Personal 10,000mAh Power Bank &amp; mobile charger</li>
          <li><i class="ph-fill ph-check" style="color:var(--ct-accent-amber)"></i> Personal prescribed medication &amp; personal toiletries</li>
          <li><i class="ph-fill ph-check" style="color:var(--ct-accent-amber)"></i> Reusable water bottle (stay hydrated)</li>
        </ul>
      </div>
    </div>
  `;
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
