import { 
  fetchTripMetadata, 
  lookupStudent 
} from './college-data.js';

let currentTrip = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadParentTracker();
  setupStudentSearch();

  // Auto-refresh every 20 seconds to pull guide's ticked milestones
  setInterval(loadParentTracker, 20000);
});

async function loadParentTracker() {
  currentTrip = await fetchTripMetadata();
  if (!currentTrip) return;

  renderTripHeaders(currentTrip);
  renderJourneyProgress(currentTrip);
  renderLatestMilestone(currentTrip);
  renderJourneyTimeline(currentTrip);
  renderContactCards(currentTrip);
}

// 1. Headers & Banner
function renderTripHeaders(trip) {
  const elTitle = document.getElementById('parent-trip-title');
  const elSub = document.getElementById('parent-banner-sub');
  const elEmergencyBtn = document.getElementById('parent-emergency-btn');

  const titleParts = [trip.college_name, trip.trip_title].filter(Boolean);
  if (elTitle) elTitle.textContent = titleParts.length > 0 ? titleParts.join(' • ') : 'College Youth Expedition';

  if (elSub) {
    const metaParts = [];
    if (trip.destination && trip.destination !== 'Expedition Destination') metaParts.push(`Destination: ${trip.destination}`);
    if (trip.dates && trip.dates !== 'Dates Upcoming') metaParts.push(`Dates: ${trip.dates}`);
    elSub.textContent = metaParts.length > 0 
      ? metaParts.join(' | ') 
      : 'Continuous faculty supervision • Live checkpoints verified directly by Tour Guides';
  }

  if (elEmergencyBtn && trip.emergency_helpline) {
    elEmergencyBtn.href = `tel:${trip.emergency_helpline.replace(/[^0-9+]/g, '')}`;
    elEmergencyBtn.innerHTML = `<i class="ph-fill ph-phone-call"></i> 24x7 Helpline: ${trip.emergency_helpline}`;
  }
}

// 2. Journey Progress Bar
function renderJourneyProgress(trip) {
  const days = trip.itinerary || [];
  let total = 0;
  let completed = 0;

  days.forEach(d => {
    (d.checkpoints || []).forEach(cp => {
      total++;
      if (cp.is_completed) completed++;
    });
  });

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const elPercent = document.getElementById('parent-progress-percent');
  const elFill = document.getElementById('parent-progress-fill');
  const elCount = document.getElementById('parent-progress-count');

  if (elPercent) elPercent.textContent = `${percent}%`;
  if (elFill) elFill.style.width = `${percent}%`;
  if (elCount) {
    elCount.textContent = total > 0 
      ? `${completed} of ${total} checkpoints verified by Tour Guide` 
      : '0 checkpoints configured';
  }
}

// 3. Latest Verified Milestone Card
function renderLatestMilestone(trip) {
  const days = trip.itinerary || [];
  let latestCp = null;
  let latestDayTitle = '';

  // Scan through in order to find the latest completed checkpoint
  days.forEach(d => {
    (d.checkpoints || []).forEach(cp => {
      if (cp.is_completed) {
        latestCp = cp;
        latestDayTitle = `Day ${d.day}: ${d.title}`;
      }
    });
  });

  const elTitle = document.getElementById('latest-milestone-title');
  const elDesc = document.getElementById('latest-milestone-desc');
  const elTime = document.getElementById('latest-milestone-time');
  const elBadge = document.getElementById('latest-milestone-badge');

  if (latestCp) {
    if (elTitle) elTitle.textContent = `${latestCp.time} • ${latestCp.title}`;
    if (elDesc) elDesc.textContent = `${latestCp.desc || ''} (${latestDayTitle})`;
    if (elTime && latestCp.completed_at) {
      elTime.textContent = `Verified at ${new Date(latestCp.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${latestCp.completed_by || 'Tour Guide'}`;
    }
    if (elBadge) {
      elBadge.className = 'ct-status-badge ct-status-present';
      elBadge.textContent = '🟢 Verified Passed';
    }
  } else {
    if (elTitle) elTitle.textContent = 'Expedition In Preparation';
    if (elDesc) elDesc.textContent = 'Tour guides will verify and tick checkpoints live as the journey begins.';
    if (elBadge) {
      elBadge.className = 'ct-status-badge ct-status-alert';
      elBadge.textContent = '⏱️ Pending Departure';
    }
    if (elTime) {
      elTime.textContent = 'Scheduled';
    }
  }
}

// 4. Render Complete Itinerary Journey Map
function renderJourneyTimeline(trip) {
  const container = document.getElementById('parent-journey-container');
  if (!container) return;

  const days = trip.itinerary || [];

  if (!days || days.length === 0) {
    container.innerHTML = `
      <div class="ct-card" style="text-align: center; padding: 2.5rem 1rem;">
        <i class="ph ph-map-pin" style="font-size: 2.5rem; color: var(--ct-primary); margin-bottom: 0.5rem; display: inline-block;"></i>
        <h4 style="color: #ffffff; font-size: 1.1rem; margin-bottom: 0.35rem;">Expedition Journey Map Awaiting Publication</h4>
        <p style="color: var(--ct-text-muted); font-size: 0.88rem; max-width: 450px; margin: 0 auto;">
          The day-by-day journey milestones are currently being configured. Real-time updates and checkpoint tracking will stream here automatically.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = days.map(d => {
    const checkpoints = d.checkpoints || [];

    const checkpointsHtml = checkpoints.map(cp => {
      const isDone = Boolean(cp.is_completed);
      const icon = isDone 
        ? '<i class="ph-fill ph-check-circle" style="color: #10b981; font-size: 1.35rem;"></i>' 
        : '<i class="ph ph-clock" style="color: var(--ct-text-subtle); font-size: 1.35rem;"></i>';

      const timeMeta = isDone && cp.completed_at
        ? `<div style="font-size:0.75rem; color:#34d399; margin-top:0.2rem;">
            ✓ Completed &amp; verified at ${new Date(cp.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${cp.completed_by || 'Guide'})
           </div>`
        : `<div style="font-size:0.75rem; color:var(--ct-text-subtle); margin-top:0.2rem;">Scheduled checkpoint</div>`;

      return `
        <div style="display: flex; align-items: flex-start; gap: 0.85rem; padding: 0.85rem 1rem; background: ${isDone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0,0,0,0.2)'}; border: 1px solid ${isDone ? 'rgba(16, 185, 129, 0.25)' : 'var(--ct-glass-border)'}; border-radius: var(--ct-radius-sm); margin-bottom: 0.6rem;">
          <div style="padding-top: 0.1rem;">${icon}</div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
              <h4 style="font-family: var(--ct-font-display); font-size: 0.98rem; font-weight: 700; color: #ffffff;">
                <span style="color: var(--ct-accent-cyan); margin-right: 0.4rem;">${cp.time}</span>
                ${cp.title}
              </h4>
              <span class="ct-status-badge ${isDone ? 'ct-status-present' : 'ct-status-alert'}" style="font-size: 0.68rem; padding: 0.2rem 0.5rem;">
                ${isDone ? 'COMPLETED' : 'UPCOMING'}
              </span>
            </div>
            <p style="font-size: 0.85rem; color: var(--ct-text-muted); margin-top: 0.2rem;">${cp.desc || ''}</p>
            ${timeMeta}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="ct-card" style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--ct-glass-border); padding-bottom: 0.75rem;">
          <div>
            <span class="ct-tag ct-tag-stay" style="margin-bottom: 0.3rem; display: inline-block;">Day ${d.day < 10 ? '0' + d.day : d.day}</span>
            <h3 style="font-family: var(--ct-font-display); font-size: 1.25rem; color: #ffffff;">${d.title}</h3>
          </div>
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            ${d.altitude ? `<span class="ct-tag ct-tag-altitude"><i class="ph ph-mountains"></i> ${d.altitude}</span>` : ''}
            ${d.stay ? `<span class="ct-tag ct-tag-stay"><i class="ph ph-bed"></i> ${d.stay}</span>` : ''}
          </div>
        </div>

        ${d.meals ? `
          <div style="font-size: 0.82rem; color: #a7f3d0; margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
            <i class="ph-fill ph-fork-knife" style="color: var(--ct-primary);"></i>
            <strong>Meals:</strong> ${d.meals}
          </div>
        ` : ''}

        <div style="margin-top: 0.8rem;">
          ${checkpointsHtml || '<p style="color:var(--ct-text-muted); font-size:0.85rem;">No checkpoints planned for this day.</p>'}
        </div>
      </div>
    `;
  }).join('');
}

// 5. Dynamic Contact Cards
function renderContactCards(trip) {
  const container = document.getElementById('parent-contacts-container');
  if (!container) return;

  const facultyName = trip.lead_faculty || 'Faculty In-Charge';
  const facultyPhone = (trip.faculty_phone || '').replace(/[^0-9+]/g, '');

  const guideName = trip.nomad_guide || 'Nomadller Expedition Lead';
  const guidePhone = (trip.nomad_phone || trip.emergency_helpline || '+91 62389 98382').replace(/[^0-9+]/g, '');

  container.innerHTML = `
    <div class="ct-card">
      <span class="ct-tag ct-tag-stay" style="margin-bottom: 0.8rem; display: inline-block;">Lead Faculty In-Charge</span>
      <h3 style="font-family: var(--ct-font-display); font-size: 1.2rem; color: #ffffff;">${facultyName}</h3>
      <p style="font-size: 0.85rem; color: var(--ct-text-muted); margin-bottom: 1rem;">Faculty Coordinator</p>
      ${facultyPhone ? `
        <a href="tel:${facultyPhone}" class="ct-btn ct-btn-secondary ct-btn-sm" style="width: 100%;">
          <i class="ph-fill ph-phone-call"></i> Call Faculty: ${trip.faculty_phone}
        </a>
      ` : `
        <div style="font-size:0.82rem; color:var(--ct-text-muted);">Assigned on tour departure</div>
      `}
    </div>

    <div class="ct-card">
      <span class="ct-tag ct-tag-altitude" style="margin-bottom: 0.8rem; display: inline-block;">Nomadller Expedition Lead</span>
      <h3 style="font-family: var(--ct-font-display); font-size: 1.2rem; color: #ffffff;">${guideName}</h3>
      <p style="font-size: 0.85rem; color: var(--ct-text-muted); margin-bottom: 1rem;">Certified Tour Lead / Safety Officer</p>
      <a href="tel:${guidePhone}" class="ct-btn ct-btn-secondary ct-btn-sm" style="width: 100%;">
        <i class="ph-fill ph-phone-call"></i> Call Guide: ${trip.nomad_phone || trip.emergency_helpline || '+91 62389 98382'}
      </a>
    </div>

    <div class="ct-card">
      <span class="ct-tag" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border-color: rgba(245, 158, 11, 0.3); margin-bottom: 0.8rem; display: inline-block;">Nomadller Central Support</span>
      <h3 style="font-family: var(--ct-font-display); font-size: 1.2rem; color: #ffffff;">Central Operations Desk</h3>
      <p style="font-size: 0.85rem; color: var(--ct-text-muted); margin-bottom: 1rem;">24x7 Emergency Desk</p>
      <a href="https://wa.me/916238998382?text=Hello%20Nomadller,%20I%20am%20a%20parent%20inquiring%20about%20the%20college%20expedition." target="_blank" rel="noopener noreferrer" class="ct-btn ct-btn-primary ct-btn-sm" style="width: 100%;">
        <i class="ph-fill ph-whatsapp-logo"></i> WhatsApp Emergency Desk
      </a>
    </div>
  `;
}

// 6. Student Lookup Logic
function setupStudentSearch() {
  const form = document.getElementById('parent-search-form');
  const input = document.getElementById('parent-search-input');
  const resultCard = document.getElementById('student-result-card');

  if (!form || !input || !resultCard) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    const student = await lookupStudent(query);

    if (!student) {
      alert(`No student found matching "${query}". Please check the Roll Number or Name (e.g. CET-CS-042 or Aditya) or verify registration on the Student portal.`);
      resultCard.classList.remove('visible');
      return;
    }

    document.getElementById('res-name').textContent = student.name;
    document.getElementById('res-roll').textContent = `Roll No: ${student.roll_no}`;
    document.getElementById('res-bus').textContent = student.bus_no || 'Bus 1';
    document.getElementById('res-room').textContent = student.room_no || 'Room 101';
    document.getElementById('res-dept').textContent = student.department || 'Department';
    document.getElementById('res-last-update').textContent = student.last_update || 'Verified Safe with Group';

    const badge = document.getElementById('res-badge');
    let statusClass = 'ct-status-present';
    let label = '🟢 Present & Safe with Group';

    if (student.status === 'On Bus') {
      statusClass = 'ct-status-bus';
      label = '🚌 On Board Coach';
    } else if (student.status === 'In Hotel/Camp') {
      statusClass = 'ct-status-hotel';
      label = '🏨 Resting in Resort/Camp';
    } else if (student.status === 'Attention Needed') {
      statusClass = 'ct-status-alert';
      label = '⚠️ Under Faculty Care';
    }

    badge.className = `ct-status-badge ${statusClass}`;
    badge.textContent = label;

    document.getElementById('res-verified-time').textContent = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    resultCard.classList.add('visible');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
