import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export function getTripCategory(trip) {
    const text = ((trip.title || '') + ' ' + (trip.subtitle || '') + ' ' + (trip.difficulty || '')).toLowerCase();
    if (text.includes('arctic') || text.includes('russia') || text.includes('malaysia') || text.includes('kyrgyzstan')) {
        return 'international';
    }
    if (text.includes('bali') || text.includes('couple') || text.includes('kerala') || text.includes('munnar') || text.includes('lakshadweep') || text.includes('spiti')) {
        return 'leisure';
    }
    return 'himalayas';
}

function getDifficultyBadge(diff) {
    const d = (diff || '').toLowerCase();
    if (d.includes('easy') || d.includes('leisure') || d.includes('wellness')) {
        return `<span class="gx-badge gx-badge-easy">Easy / Wellness</span>`;
    }
    if (d.includes('hard') || d.includes('difficult') || d.includes('challenging') || d.includes('extreme') || d.includes('expert')) {
        return `<span class="gx-badge gx-badge-hard">Challenging</span>`;
    }
    return `<span class="gx-badge gx-badge-mod">Moderate</span>`;
}

export async function loadPackagesGrid() {
    const container = document.getElementById('packages-grid-container');
    if (!container) return;

    // Show Goxom Skeleton
    container.innerHTML = `
        <div style="width: 100%; text-align: center; padding: 60px 0;">
            <div style="display: inline-block; width: 44px; height: 44px; border: 3px solid rgba(23, 189, 84, 0.2); border-radius: 50%; border-top-color: #17BD54; animation: spin 0.8s linear infinite;"></div>
            <p style="margin-top: 15px; color: #64748b; font-size: 0.95rem; font-weight: 600;">Loading Expeditions...</p>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        </div>
    `;

    try {
        const { data: trips, error } = await supabase
            .from('trips')
            .select('id, title, subtitle, duration, difficulty, cost, cover_image_url, highlights, created_at, inclusions, exclusions, itinerary')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        window.allTrips = trips || [];

        if (!trips || trips.length === 0) {
            container.innerHTML = '<p style="text-align:center; width:100%; padding: 40px; color:#64748b;">No expeditions available at the moment. Please check back later.</p>';
            return;
        }

        // Setup filter tabs
        setupFilterTabs(container, trips);

        // Render cards
        renderCards(container, trips, 'all');

    } catch (err) {
        console.error('Error fetching packages:', err);
        container.innerHTML = `
            <div style="text-align:center; width:100%; padding: 40px; color: #64748b;">
                <p style="color: #ef4444; font-weight: 600; margin-bottom: 8px;">Unable to load expeditions.</p>
                <button onclick="window.loadPackagesGrid()" class="gx-btn gx-btn-primary" style="margin-top: 10px;">Retry Loading</button>
            </div>
        `;
    }
}

function setupFilterTabs(container, trips) {
    const filtersContainer = document.getElementById('package-filters');
    if (!filtersContainer) return;

    const counts = {
        all: trips.length,
        himalayas: trips.filter(t => getTripCategory(t) === 'himalayas').length,
        leisure: trips.filter(t => getTripCategory(t) === 'leisure').length,
        international: trips.filter(t => getTripCategory(t) === 'international').length
    };

    filtersContainer.innerHTML = `
        <button class="gx-filter-pill active" data-cat="all">All Expeditions <span>(${counts.all})</span></button>
        <button class="gx-filter-pill" data-cat="himalayas">🏔️ Himalayan Treks <span>(${counts.himalayas})</span></button>
        <button class="gx-filter-pill" data-cat="leisure">🌴 Tropical & Couples <span>(${counts.leisure})</span></button>
        <button class="gx-filter-pill" data-cat="international">✈️ International & Arctic <span>(${counts.international})</span></button>
    `;

    filtersContainer.querySelectorAll('.gx-filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            filtersContainer.querySelectorAll('.gx-filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.getAttribute('data-cat');
            renderCards(container, window.allTrips || trips, cat);
        });
    });
}

export function renderCards(container, trips, category = 'all') {
    const filteredTrips = category === 'all' 
        ? trips 
        : trips.filter(t => getTripCategory(t) === category);

    if (filteredTrips.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; padding: 50px 20px; color:#64748b; font-size:1.05rem;">No expeditions found in this category.</p>';
        return;
    }

    let html = '';
    filteredTrips.forEach(trip => {
        let highlightsHtml = '';
        if (trip.highlights && Array.isArray(trip.highlights) && trip.highlights.length > 0) {
            highlightsHtml = `
                <ul class="gx-tour-highlights">
                    ${trip.highlights.slice(0, 2).map(h => `
                        <li>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#17BD54" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>${h}</span>
                        </li>
                    `).join('')}
                </ul>
            `;
        }

        const coverParts = (trip.cover_image_url || '').split('|');
        const frontCover = coverParts[0] && coverParts[0].trim() !== '' ? coverParts[0] : '/images/everest.webp';
        const formattedCost = trip.cost ? `₹${parseFloat(trip.cost).toLocaleString('en-IN')}` : 'Custom Pricing';
        const diffBadge = getDifficultyBadge(trip.difficulty);
        const durationText = trip.duration || 'Custom Days';
        const whatsappMsg = encodeURIComponent(`Hi Nomadller! I would like to book or inquire about the "${trip.title}" (${trip.duration || ''}) expedition.`);

        html += `
            <article class="gx-tour-card" data-category="${getTripCategory(trip)}">
                <div class="gx-tour-media">
                    <img src="${frontCover}" alt="${trip.title}" class="gx-tour-img" loading="lazy">
                    <div class="gx-tour-badges">
                        <span class="gx-badge gx-badge-duration">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                            ${durationText}
                        </span>
                        ${diffBadge}
                    </div>
                </div>
                <div class="gx-tour-body">
                    <div class="gx-tour-meta-row">
                        <span class="gx-stars">★★★★★</span>
                        <span class="gx-rating-score">5.0 (Nomadller Verified)</span>
                    </div>
                    <h3 class="gx-tour-title" title="${trip.title}">
                        <a href="javascript:void(0)" onclick="window.showTripDetails('${trip.id}')">${trip.title}</a>
                    </h3>
                    <p class="gx-tour-subtitle">${trip.subtitle || 'Guided High-Altitude & Adventure Circuit'}</p>
                    
                    ${highlightsHtml}

                    <div class="gx-tour-footer">
                        <div class="gx-tour-price-block">
                            <span class="gx-price-label">Per Person</span>
                            <span class="gx-price-val">${formattedCost}</span>
                        </div>
                        <div class="gx-tour-actions">
                            <button class="gx-btn gx-btn-details" onclick="window.showTripDetails('${trip.id}')">
                                Details
                            </button>
                            <a href="https://wa.me/916238998382?text=${whatsappMsg}" target="_blank" rel="noopener noreferrer" class="gx-btn gx-btn-book">
                                Book Now
                            </a>
                        </div>
                    </div>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
}

window.loadPackagesGrid = loadPackagesGrid;

// Modal handler
window.showTripDetails = function(tripId) {
    const trip = (window.allTrips || []).find(t => t.id === tripId);
    if (!trip) return;

    const modalBody = document.getElementById('trip-modal-body');
    const modal = document.getElementById('trip-modal');
    if (!modalBody || !modal) return;

    let inclusionsHtml = (trip.inclusions || []).map(i => `<li>${i}</li>`).join('');
    let exclusionsHtml = (trip.exclusions || []).map(e => `<li>${e}</li>`).join('');

    let itinerarySummary = '';
    if (trip.itinerary) {
        let tempDays = [];
        if (typeof trip.itinerary === 'string') {
            try { tempDays = JSON.parse(trip.itinerary); } catch(e) {}
        } else if (Array.isArray(trip.itinerary)) {
            tempDays = trip.itinerary;
        }
        if (tempDays.length > 0) {
            itinerarySummary = tempDays.map(d => `
                <div class="gx-itin-step">
                    <div class="gx-itin-day-badge">Day ${d.day < 10 ? '0'+d.day : d.day}</div>
                    <div class="gx-itin-info">
                        <h4>${d.title || 'Day ' + d.day}</h4>
                        ${d.desc ? `<p>${d.desc}</p>` : ''}
                    </div>
                </div>
            `).join('');
        }
    }

    const isAnnapurna = (trip.title || '').toLowerCase().includes('annapurna');
    const isValley = (trip.title || '').toLowerCase().includes('valley of flowers');
    let viewLink = `/itinerary?id=${trip.id}`;
    if (isAnnapurna) viewLink = '/annapurna_luxury_template';
    if (isValley) viewLink = '/valley_of_flowers_template';

    const formattedCost = trip.cost ? `₹${parseFloat(trip.cost).toLocaleString('en-IN')}` : 'Custom Pricing';
    const whatsappMsg = encodeURIComponent(`Hi Nomadller! I want to inquire and reserve a slot for the "${trip.title}" (${trip.duration || ''}) expedition.`);

    modalBody.innerHTML = `
        <div class="gx-modal-header">
            <span class="gx-badge gx-badge-duration" style="margin-bottom:10px; display:inline-block;">⏱️ ${trip.duration || 'Flexible Days'}</span>
            <h2>${trip.title}</h2>
            <p>${trip.subtitle || 'Signature Nomadller Expedition'}</p>
            <div class="gx-modal-price-box">
                <div>
                    <span style="font-size:0.75rem; text-transform:uppercase; color:#64748b; font-weight:600;">Expedition Price</span>
                    <div style="font-size:1.6rem; font-weight:800; color:#17BD54;">${formattedCost}</div>
                </div>
                <a href="https://wa.me/916238998382?text=${whatsappMsg}" target="_blank" rel="noopener noreferrer" class="gx-btn gx-btn-primary">
                    Reserve via WhatsApp
                </a>
            </div>
        </div>

        <div class="gx-modal-section">
            <h3>Day-by-Day Itinerary</h3>
            <div class="gx-itin-timeline">
                ${itinerarySummary || '<p style="color:#64748b;">Complete itinerary overview available on PDF inquiry.</p>'}
            </div>
        </div>

        <div class="gx-modal-grid-2">
            <div class="gx-inc-box">
                <h4>✅ What is Included:</h4>
                <ul>
                    ${inclusionsHtml || '<li>All accommodation, certified guides, permits & local logistics</li>'}
                </ul>
            </div>
            <div class="gx-exc-box">
                <h4>❌ What is Excluded:</h4>
                <ul>
                    ${exclusionsHtml || '<li>International/Domestic flights, personal travel insurance, personal expenses</li>'}
                </ul>
            </div>
        </div>

        <div class="gx-modal-actions">
            <a href="${viewLink}" target="_blank" class="gx-btn gx-btn-outline">
                📄 Full Itinerary Document
            </a>
            <a href="https://wa.me/916238998382?text=${whatsappMsg}" target="_blank" rel="noopener noreferrer" class="gx-btn gx-btn-primary">
                Chat with Expedition Leader
            </a>
        </div>
    `;

    modal.classList.add('active');
};
