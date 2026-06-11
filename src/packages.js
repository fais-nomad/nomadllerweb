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
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

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

            html += `
                <div class="package-card reveal">
                    <img src="${trip.cover_image_url || '/images/placeholder.jpg'}" class="package-image" alt="${trip.title}" loading="lazy">
                    <div class="package-meta">
                        <span>${trip.duration || 'N/A'}</span>
                        <span>${trip.difficulty || 'N/A'}</span>
                    </div>
                    <h3>${trip.title}</h3>
                    <p>${trip.subtitle || ''}</p>
                    <ul class="package-highlights">
                        ${highlightsHtml}
                    </ul>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                        <span style="color: rgba(255,255,255,0.6); font-size: 0.9rem;">Expedition Cost</span>
                        <span style="color: var(--accent); font-size: 1.5rem; font-weight: 700; font-family: 'Playfair Display', serif;">₹${parseFloat(trip.cost).toLocaleString('en-IN')}</span>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 1rem;">
                        <button class="btn btn-primary" style="flex: 1;" onclick="window.open('${viewLink}', '_blank')">VIEW DETAILS</button>
                        <a href="${dlLink}" class="btn" style="flex: 1; border: 1px solid rgba(255,255,255,0.5); background: transparent; color: #fff; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            ITINERARY
                        </a>
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
