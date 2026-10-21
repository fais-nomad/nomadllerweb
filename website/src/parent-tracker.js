import { 
  fetchLiveUpdates, 
  lookupStudent 
} from './college-data.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadLiveFeed();
  setupStudentSearch();

  // Poll for updates every 30 seconds
  setInterval(loadLiveFeed, 30000);
});

// 1. Render Live Milestones Feed
async function loadLiveFeed() {
  const container = document.getElementById('live-feed-container');
  const countBadge = document.getElementById('updates-count-badge');
  if (!container) return;

  const updates = await fetchLiveUpdates();
  if (countBadge) {
    countBadge.textContent = `${updates.length} Live Milestones Posted`;
  }

  if (updates.length === 0) {
    container.innerHTML = `
      <div class="ct-card" style="text-align: center; color: var(--ct-text-muted);">
        <i class="ph ph-broadcast" style="font-size: 2rem; color: var(--ct-primary); margin-bottom: 0.5rem;"></i>
        <p>No milestone updates posted yet. Faculty will begin broadcasting once travel begins.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = updates.map(u => {
    let typeClass = 'ct-tag-stay';
    let icon = 'ph-map-pin';

    if (u.update_type === 'Departure') {
      typeClass = 'ct-tag-altitude';
      icon = 'ph-bus';
    } else if (u.update_type === 'Meal') {
      typeClass = 'ct-tag-stay';
      icon = 'ph-fork-knife';
    } else if (u.update_type === 'Hotel') {
      typeClass = 'ct-tag-stay';
      icon = 'ph-bed';
    } else if (u.update_type === 'Safety') {
      typeClass = 'ct-tag-altitude';
      icon = 'ph-shield-check';
    }

    const timeAgo = formatTimeAgo(u.created_at);

    return `
      <article class="ct-feed-item">
        <div class="ct-feed-top">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="ct-tag ${typeClass}">
              <i class="ph ${icon}"></i> ${u.update_type || 'Milestone'}
            </span>
            <h3 class="ct-feed-title">${u.title}</h3>
          </div>
          <span class="ct-feed-time">⏱️ ${timeAgo}</span>
        </div>
        <p style="color: var(--ct-text-muted); font-size: 0.95rem; line-height: 1.6;">
          ${u.description}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem;">
          <div class="ct-feed-location">
            <i class="ph-fill ph-map-pin" style="color: var(--ct-primary);"></i>
            <span>${u.location_name || 'En Route'}</span>
          </div>
          <span style="font-size: 0.78rem; color: var(--ct-text-subtle);">
            Broadcast by: <strong>${u.posted_by || 'Faculty Team'}</strong>
          </span>
        </div>
      </article>
    `;
  }).join('');
}

// 2. Student Lookup Logic
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
      alert(`No student found matching "${query}". Please check the Roll Number or Name (e.g., CET-CS-042 or Aditya) or register first on the Student page.`);
      resultCard.classList.remove('visible');
      return;
    }

    // Populate data
    document.getElementById('res-name').textContent = student.name;
    document.getElementById('res-roll').textContent = `Roll No: ${student.roll_no}`;
    document.getElementById('res-bus').textContent = student.bus_no || 'Bus 1';
    document.getElementById('res-room').textContent = student.room_no || 'Resort Room 204';
    document.getElementById('res-dept').textContent = student.department || 'CET Department';
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

// Helper: Relative Time Formatter
function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const now = new Date();
  const past = new Date(dateString);
  const diffMinutes = Math.floor((now - past) / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
