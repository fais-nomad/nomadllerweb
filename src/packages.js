import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function loadPackagesGrid() {
    const container = document.getElementById('packages-grid-container');
    if (!container) return;

    // Show a loading skeleton/spinner while fetching from Supabase
    container.innerHTML = `
        <div style="width: 100%; text-align: center; padding: 50px 0;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-radius: 50%; border-top-color: var(--accent); animation: spin 1s ease-in-out infinite;"></div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        </div>
    `;

    try {
        const { data: trips, error } = await supabase
            .from('trips')
            .select('id, title, subtitle, duration, difficulty, cost, cover_image_url, highlights, created_at, inclusions, exclusions, itinerary')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        window.allTrips = trips;

        if (!trips || trips.length === 0) {
            container.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-secondary);">No expeditions available at the moment. Please check back later.</p>';
            return;
        }

        let html = '';
        trips.forEach(trip => {
            // Generate list items for highlights
            let highlightsHtml = '';
            if (trip.highlights && Array.isArray(trip.highlights)) {
                highlightsHtml = trip.highlights.map(h => `<li>${h}</li>`).join('');
            }

            const isAnnapurna = trip.title.toLowerCase().includes('annapurna');
            const isValley = trip.title.toLowerCase().includes('valley');
            let viewLink = `/itinerary.html?id=${trip.id}`;
            let dlLink = `/itinerary.html?id=${trip.id}&download=true`;

            if (isAnnapurna) {
                viewLink = '/annapurna_luxury_template.html';
                dlLink = '/annapurna_luxury_template.html?download=true';
            } else if (isValley) {
                viewLink = '/valley_of_flowers_template.html';
                dlLink = '/valley_of_flowers_template.html?download=true';
            }

            const coverParts = (trip.cover_image_url || '').split('|');
            const frontCover = coverParts[0] && coverParts[0].trim() !== '' ? coverParts[0] : '/images/placeholder.jpg';

            html += `
                <div class="package-card reveal">
                    <img src="${frontCover}" class="package-image" alt="${trip.title}" loading="lazy">
                    <div class="package-meta">
                        <span>${trip.duration || 'N/A'}</span>
                        <span>${trip.difficulty || 'N/A'}</span>
                    </div>
                    <h3>${trip.title}</h3>
                    <p>${trip.subtitle || ''}</p>
                    <ul class="package-highlights">
                        ${highlightsHtml}
                    </ul>
                    <div style="margin-top: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: rgba(255,255,255,0.6); font-size: 0.9rem;">Expedition Cost</span>
                            <span style="color: var(--accent); font-size: 1.5rem; font-weight: 700; font-family: 'Playfair Display', serif;">₹${parseFloat(trip.cost).toLocaleString('en-IN')}</span>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 1rem;">
                            <button class="btn btn-primary" style="flex: 1;" onclick="window.showTripDetails('${trip.id}')">VIEW DETAILS</button>
                            <a href="${viewLink}" target="_blank" class="btn" style="flex: 1; border: 1px solid rgba(255,255,255,0.5); background: transparent; color: #fff; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                ITINERARY
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Re-trigger scroll animations for the new elements
        Promise.all([
            import('gsap'),
            import('gsap/ScrollTrigger')
        ]).then(([gsapModule, scrollTriggerModule]) => {
            const gsap = gsapModule.default || gsapModule;
            const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
            
            // Animate the newly injected cards much faster
            gsap.fromTo(container.querySelectorAll('.package-card'), 
                { opacity: 0, y: 20 },
                { 
                    opacity: 1, 
                    y: 0, 
                    stagger: 0.05, 
                    duration: 0.4, 
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: container,
                        start: 'top 95%',
                        toggleActions: 'play none none none'
                    }
                }
            );
            
            ScrollTrigger.refresh();
        });

    } catch (err) {
        console.error('Error fetching packages:', err);
        container.innerHTML = '<p style="text-align:center; width:100%; color:red;">Error loading expeditions. Please refresh the page.</p>';
    }
}

window.showTripDetails = function(tripId) {
    const trip = window.allTrips.find(t => t.id === tripId);
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
        itinerarySummary = tempDays.map(d => `<tr><td>${d.day < 10 ? '0'+d.day : d.day}</td><td>${d.title}</td></tr>`).join('');
    }

    const isAnnapurna = trip.title.toLowerCase().includes('annapurna');
    const isValley = trip.title.toLowerCase().includes('valley');
    let viewLink = `/itinerary.html?id=${trip.id}`;
    if (isAnnapurna) viewLink = '/annapurna_luxury_template.html';
    if (isValley) viewLink = '/valley_of_flowers_template.html';

    modalBody.innerHTML = `
        <h2>🏔️ ${trip.title}: ${trip.duration}</h2>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 20px; font-weight: bold;">
            <span>Price:</span>
            <span style="color: var(--accent);">₹${parseFloat(trip.cost).toLocaleString('en-IN')}</span>
        </div>
        <p>${trip.subtitle || 'A signature Nomadller Expedition.'}</p>
        
        <h3>Daily Overview</h3>
        <table>
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Highlight</th>
                </tr>
            </thead>
            <tbody>
                ${itinerarySummary || '<tr><td colspan="2">Detailed itinerary available in PDF.</td></tr>'}
            </tbody>
        </table>

        <h3>🎒 Package Overview</h3>
        <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px;">
                <h4 style="color: var(--accent-alt);">✅ Inclusions:</h4>
                <ul>${inclusionsHtml || '<li>All standard inclusions as per Nomadller policy</li>'}</ul>
            </div>
            <div style="flex: 1; min-width: 250px;">
                <h4 style="color: var(--accent);">❌ Exclusions:</h4>
                <ul>${exclusionsHtml || '<li>Flights, Visa, Personal expenses</li>'}</ul>
            </div>
        </div>

        <div style="text-align: center; margin-top: 2rem; border-top: 1px solid var(--glass-border); padding-top: 2rem;">
            <a href="${viewLink}" target="_blank" class="pdf-download-btn">📝 View Full Luxury Itinerary</a>
        </div>
    `;

    modal.classList.add('active');
};
