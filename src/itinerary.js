import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadItinerary() {
    const root = document.getElementById('itinerary-root');
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const tripId = params.get('id');
    const autoDownload = params.get('download') === 'true';

    if (!tripId) {
        root.innerHTML = '<div style="color:red; text-align:center; padding: 50px;">Error: No trip ID provided.</div>';
        return;
    }

    try {
        const { data: trip, error } = await supabase
            .from('trips')
            .select('*')
            .eq('id', tripId)
            .single();

        if (error) throw error;
        let coverImage = '/images/default-cover.jpg';
        let backCoverImage = '/images/nomadller_back_cover.png';
        if (trip.cover_image_url) {
            const parts = trip.cover_image_url.split('|');
            if (parts[0] && parts[0].trim() !== '') coverImage = parts[0];
            if (parts[1] && parts[1].trim() !== '') backCoverImage = parts[1];
        }
        const costStr = parseFloat(trip.cost).toLocaleString('en-IN');

        let usdStr = '';
        let aedStr = '';
        try {
            const fxRes = await fetch('https://open.er-api.com/v6/latest/INR');
            if (fxRes.ok) {
                const fxData = await fxRes.json();
                if (fxData && fxData.rates) {
                    const usdCost = Math.round(parseFloat(trip.cost) * fxData.rates.USD);
                    const aedCost = Math.round(parseFloat(trip.cost) * fxData.rates.AED);
                    usdStr = usdCost.toLocaleString('en-US');
                    aedStr = aedCost.toLocaleString('en-AE');
                }
            }
        } catch(err) {
            console.error('Failed to fetch fx rates:', err);
        }

            // Find the first quote in the itinerary to use for the main philosophy page
            let tripQuote = "To walk in the mountains is to step into a vibrant canvas, where nature blooms in full glory.";
            if (trip.itinerary) {
                let tempDays = [];
                if (typeof trip.itinerary === 'string') {
                    try { tempDays = JSON.parse(trip.itinerary); } catch(e) {}
                } else if (Array.isArray(trip.itinerary)) {
                    tempDays = trip.itinerary;
                }
                const firstQuoteObj = tempDays.find(d => d.quote && d.quote.trim() !== '');
                if (firstQuoteObj) tripQuote = firstQuoteObj.quote;
            }

            let html = `
            <!-- Action Bar for Web View -->
            <div id="action-bar" style="position: fixed; top: 0; left: 0; right: 0; background: rgba(11,17,32,0.9); backdrop-filter: blur(10px); padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; color: white;">
                <div style="font-family: 'Playfair Display', serif; font-size: 1.2rem;">NOMADLLER</div>
                <div style="display: flex; gap: 15px;">
                    <button id="download-pdf-btn" style="background: var(--orange); color: white; border: none; padding: 8px 20px; font-family: 'Inter', sans-serif; font-size: 0.8rem; letter-spacing: 2px; cursor: pointer; border-radius: 4px; text-transform: uppercase;">Download PDF</button>
                    <button onclick="try { window.close(); } catch(e) {} setTimeout(() => { if(!window.closed) { if(window.history.length > 1) window.history.back(); else window.location.href='/dashboard.html'; } }, 100);" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 20px; font-family: 'Inter', sans-serif; font-size: 0.8rem; letter-spacing: 2px; cursor: pointer; border-radius: 4px; text-transform: uppercase;">Close</button>
                </div>
            </div>
            
            <div style="margin-top: 60px;"></div> <!-- Spacer -->

            <style>
                @media (max-width: 820px) {
                    body {
                        overflow-x: hidden;
                        background: #111;
                    }
                    #pdf-wrapper {
                        transform: scale(calc(100vw / 794));
                        transform-origin: top center;
                        width: 794px;
                        margin: 0 auto;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .page {
                        margin-bottom: 0 !important; /* The scaling handles the gap naturally if they are block elements, wait no, scale leaves gaps. We'll use zoom instead of transform for perfect layout on mobile Safari! */
                    }
                    #pdf-wrapper {
                        zoom: calc(100vw / 794);
                        transform: none;
                    }
                }
            </style>

            <div id="pdf-wrapper">

            <!-- 1. Cover Page -->
            <div class="page cover-page" id="pdf-content-start" style="background-image: url('${coverImage}');">
                <div class="gps-coords">NOMADLLER LUXURY</div>
                <div class="price-card">
                    <div class="price-title">Expedition Cost</div>
                    <div class="price-list">
                        <div class="price-item"><span>INR</span> ₹${costStr}</div>
                        ${usdStr ? `<div class="price-item"><span>USD</span> $${usdStr}</div>` : ''}
                        ${aedStr ? `<div class="price-item"><span>AED</span> د.إ ${aedStr}</div>` : ''}
                    </div>
                </div>
                <div class="brand-badge">NOMADLLER EXPEDITIONS</div>
                <h1 class="cover-title">${trip.title.replace(/ /g, '<br>')}</h1>
                <div class="cover-subtitle">${trip.subtitle || trip.difficulty + ' | ' + trip.duration}</div>
            </div>

            <!-- 2. Quote Page -->
            <div class="page quote-page dark-page">
                <div class="gps-coords">NOMADLLER PHILOSOPHY</div>
                <h2 class="large-quote">“${tripQuote}”</h2>
                <div class="quote-author">Nomadller Expeditions</div>
            </div>
        `;

        // Render Itinerary Days
        if (trip.itinerary) {
            let days = [];
            if (typeof trip.itinerary === 'string') {
                try {
                    days = JSON.parse(trip.itinerary);
                } catch(e) {
                    // Fallback to simple text split by newline
                    const lines = trip.itinerary.split('\n').filter(l => l.trim() !== '');
                    days = lines.map((l, idx) => ({ day: idx + 1, title: 'Day ' + (idx + 1), desc: l }));
                }
            } else if (Array.isArray(trip.itinerary)) {
                days = trip.itinerary;
            }

            let daysOnPage = 0;

            html += `
            <div class="page" id="initial-itinerary-page">
                <div class="page-content">
                    <div class="gps-coords">ITINERARY DETAILS</div>
                    <h2 class="section-heading">The Journey</h2>
            `;

            days.forEach((d, idx) => {
                if (daysOnPage >= 2) {
                    // Standard pagination - max 2 days per page
                    html += `
                        </div>
                        <div class="page-footer"><span>Nomadller Luxury Expeditions</span></div>
                    </div>
                    <div class="page">
                        <div class="page-content">
                            <div class="gps-coords">ITINERARY DETAILS</div>
                            <h2 class="section-heading">The Journey Continues</h2>
                    `;
                    daysOnPage = 0;
                }

                let metricsHtml = '';
                if (d.metrics && Array.isArray(d.metrics)) {
                    if (d.is_highlight) {
                        metricsHtml = d.metrics.map(m => {
                            const parts = m.split(' ');
                            const icon = parts[0];
                            const text = parts.slice(1).join(' ');
                            return `<div class="c-metric"><span class="t-micro" style="color: var(--orange);">${icon}</span><span style="font-size: 1.2rem; font-family: var(--font-display); display: block;">${text}</span></div>`;
                        }).join('');
                    } else {
                        metricsHtml = d.metrics.map(m => `<div class="metric-badge">${m}</div>`).join('');
                    }
                }

                if (d.is_highlight) {
                    html += `
                        <div class="day-container" style="border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 30px;">
                            <div class="day-number" style="color: var(--orange);">${String(d.day || idx+1).padStart(2, '0')}</div>
                            <div class="day-details">
                                <h3 class="day-title" style="font-size: 2rem;">${d.title || 'Day ' + d.day}</h3>
                                <p class="day-desc" style="color: rgba(0,0,0,0.6);">${d.desc || ''}</p>
                                <div class="data-grid" style="grid-template-columns: repeat(2, 1fr); margin-top: 20px;">
                                    ${metricsHtml}
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="day-container">
                            <div class="day-number">${String(d.day || idx+1).padStart(2, '0')}</div>
                            <div class="day-details">
                                <h3 class="day-title">${d.title || 'Day ' + d.day}</h3>
                                <p class="day-desc">${d.desc || ''}</p>
                                <div class="day-metrics">${metricsHtml}</div>
                            </div>
                        </div>
                    `;
                }
                
                daysOnPage++;
            });

            // Close the final open page
            html += `
                </div>
                <div class="page-footer"><span>Nomadller Luxury Expeditions</span></div>
            </div>
            `;
        }

        // Helper to safely chunk lists into pages
        function renderDataCardsIntoPages(sectionHeading, subheading, cards, maxItemsPerPage = 12) {
            let pagesHtml = '';
            let currentItems = 0;
            let currentPageHtml = '';

            const closePage = () => {
                if (currentPageHtml) {
                    pagesHtml += `
                    <div class="page">
                        <div class="page-content">
                            <h2 class="section-heading">${sectionHeading}</h2>
                            <div class="section-subheading">${subheading}</div>
                            <div style="margin-bottom: 20px;">
                                ${currentPageHtml}
                            </div>
                        </div>
                        <div class="page-footer">
                            <span>Nomadller Luxury Expeditions</span>
                        </div>
                    </div>`;
                    currentPageHtml = '';
                    currentItems = 0;
                }
            };

            cards.forEach(card => {
                if (!card.items || card.items.length === 0 || card.items[0].trim() === '') return;
                
                // CRITICAL FIX: If the user typed a massive single paragraph using '•' instead of hitting Enter, 
                // we must manually split it into separate array items so the chunking algorithm can paginate it.
                let normalizedItems = [];
                card.items.forEach(item => {
                    const splitItems = item.split(/[•\n]/).filter(s => s.trim().length > 0);
                    normalizedItems.push(...splitItems);
                });

                let remainingItems = [...normalizedItems];
                let isFirstChunk = true;

                while(remainingItems.length > 0) {
                    let chunk = remainingItems.splice(0, maxItemsPerPage - currentItems);
                    if (chunk.length > 0) {
                        currentPageHtml += `
                        <div class="data-card" style="margin-bottom: 20px;">
                            <h3>${card.title} ${!isFirstChunk ? '(Cont.)' : ''}</h3>
                            <ul style="font-size: 0.8rem; line-height: 1.5; padding-left: 20px; column-count: 2; column-gap: 40px;">
                                ${chunk.map(item => `<li style="margin-bottom: 8px; break-inside: avoid; page-break-inside: avoid;">${item.trim()}</li>`).join('')}
                            </ul>
                        </div>
                        `;
                        currentItems += chunk.length;
                        isFirstChunk = false;
                    }
                    if (currentItems >= maxItemsPerPage) {
                        closePage();
                    }
                }
            });
            closePage();
            return pagesHtml;
        }

        // Render Inclusions / Exclusions
        const logisticsCards = [];
        if (trip.inclusions && trip.inclusions.length > 0) {
            logisticsCards.push({ title: 'Inclusions', items: Array.isArray(trip.inclusions) ? trip.inclusions : trip.inclusions.split('\n') });
        }
        if (trip.exclusions && trip.exclusions.length > 0) {
            logisticsCards.push({ title: 'Exclusions', items: Array.isArray(trip.exclusions) ? trip.exclusions : trip.exclusions.split('\n') });
        }
        html += renderDataCardsIntoPages('Logistics', 'Inclusions & Exclusions', logisticsCards, 12);

        // Render Policies Page (Health, Cancel, Insurance, Notes)
        const policyCards = [];
        if (trip.health_and_fitness && trip.health_and_fitness.length > 0) policyCards.push({ title: 'Health & Fitness', items: Array.isArray(trip.health_and_fitness) ? trip.health_and_fitness : trip.health_and_fitness.split('\n') });
        if (trip.cancellation_policy && trip.cancellation_policy.length > 0) policyCards.push({ title: 'Cancellation Policy', items: Array.isArray(trip.cancellation_policy) ? trip.cancellation_policy : trip.cancellation_policy.split('\n') });
        if (trip.travel_insurance && trip.travel_insurance.length > 0) policyCards.push({ title: 'Insurance', items: Array.isArray(trip.travel_insurance) ? trip.travel_insurance : trip.travel_insurance.split('\n') });
        if (trip.important_notes && trip.important_notes.length > 0) policyCards.push({ title: 'Important Notes', items: Array.isArray(trip.important_notes) ? trip.important_notes : trip.important_notes.split('\n') });
        html += renderDataCardsIntoPages('Policies', 'ESSENTIAL GUIDELINES', policyCards, 12);

        // Render Agreements Page (Terms, Risk, Remember)
        const agreementCards = [];
        if (trip.terms_and_conditions && trip.terms_and_conditions.length > 0) agreementCards.push({ title: 'Terms & Conditions', items: Array.isArray(trip.terms_and_conditions) ? trip.terms_and_conditions : trip.terms_and_conditions.split('\n') });
        if (trip.risk_liabilities && trip.risk_liabilities.length > 0) agreementCards.push({ title: 'Risk & Liabilities', items: Array.isArray(trip.risk_liabilities) ? trip.risk_liabilities : trip.risk_liabilities.split('\n') });
        if (trip.things_to_remember && trip.things_to_remember.length > 0) agreementCards.push({ title: 'Things to Remember', items: Array.isArray(trip.things_to_remember) ? trip.things_to_remember : trip.things_to_remember.split('\n') });
        html += renderDataCardsIntoPages('Agreements', 'TERMS & CONDITIONS', agreementCards, 12);

        if (trip.things_to_carry) {
            let prepCategories = [];
            if (typeof trip.things_to_carry === 'string') {
                try {
                    prepCategories = JSON.parse(trip.things_to_carry);
                } catch(e) {
                    const lines = trip.things_to_carry.split('\n').filter(l => l.trim() !== '');
                    prepCategories = [{ category: "General Items", items: lines }];
                }
            } else if (Array.isArray(trip.things_to_carry)) {
                prepCategories = trip.things_to_carry;
            }

            if (prepCategories && prepCategories.length > 0) {
                const mappedCards = prepCategories.map(cat => ({
                    title: cat.category || 'Items',
                    items: cat.items
                }));
                html += renderDataCardsIntoPages('Preparation', 'Things to Carry', mappedCards, 12);
            }
        }

        html += `
            <!-- Final Page -->
            <div class="page cover-page" style="background-image: linear-gradient(180deg, rgba(11,17,32,0.1) 0%, rgba(11,17,32,0.95) 100%), url('${backCoverImage}'); text-align: center; justify-content: center; align-items: center;">
                <h2 class="t-serif" style="font-size: 2.5rem; font-weight: 400; line-height: 1.4; max-width: 600px; margin-bottom: 40px; color: var(--white);">
                    "Some journeys end at the destination.<br><span style="color: var(--orange);">This one stays with you forever.</span>"
                </h2>
                <div class="brand-badge" style="letter-spacing: 4px; color: rgba(255,255,255,0.4);">NOMADLLER LUXURY EXPEDITIONS</div>
            </div> <!-- End of Brand Badge Container -->
            </div> <!-- End of PDF Wrapper -->
        `;

        root.outerHTML = html;

        document.getElementById('download-pdf-btn').addEventListener('click', generatePDF);

        if (autoDownload) {
            // Wait for images to load before generating PDF
            setTimeout(generatePDF, 1500);
        }

    } catch (err) {
        console.error(err);
        root.innerHTML = '<div style="color:red; text-align:center; padding: 50px;">Failed to load itinerary.</div>';
    }
}

async function generatePDF() {
    const actionBar = document.getElementById('action-bar');
    if (actionBar) actionBar.style.display = 'none'; // Hide UI for PDF

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pages = document.querySelectorAll('.page');
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = 'Generating High-Quality PDF... Please wait.';
    loadingDiv.style.position = 'fixed';
    loadingDiv.style.top = '50%';
    loadingDiv.style.left = '50%';
    loadingDiv.style.transform = 'translate(-50%, -50%)';
    loadingDiv.style.background = 'rgba(0,0,0,0.8)';
    loadingDiv.style.color = 'white';
    loadingDiv.style.padding = '20px 40px';
    loadingDiv.style.borderRadius = '8px';
    loadingDiv.style.zIndex = '10000';
    loadingDiv.style.fontFamily = 'Inter, sans-serif';
    document.body.appendChild(loadingDiv);

    try {
        const opt = {
            margin:       0,
            filename:     'Nomadller_Itinerary.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: window.innerWidth <= 768 ? 1.5 : 2, 
                useCORS: true, 
                allowTaint: true,
                letterRendering: true,
                windowWidth: 794,
                width: 794
            },
            jsPDF:        { unit: 'px', format: [794, 1123], orientation: 'portrait' }
        };

        const pdfWrapper = document.getElementById('pdf-wrapper');
        const originalZoom = pdfWrapper ? pdfWrapper.style.zoom : '';
        if (pdfWrapper) pdfWrapper.style.zoom = '1';

        const container = document.createElement('div');
        pages.forEach(p => {
            const clone = p.cloneNode(true);
            clone.style.margin = '0';
            clone.style.boxShadow = 'none';
            clone.style.borderRadius = '0';
            // Force break after each page except the last one could be handled by css, 
            // but we'll manually feed them to html2pdf for safety.
            container.appendChild(clone);
        });

        // Restore zoom
        if (pdfWrapper) pdfWrapper.style.zoom = originalZoom;

        // Use the robust html2pdf library
        let worker = html2pdf().set(opt).from(container.children[0]).toPdf();
        
        for (let i = 1; i < container.children.length; i++) {
            worker = worker.get('pdf').then(pdf => pdf.addPage()).from(container.children[i]).toContainer().toCanvas().toPdf();
        }
        
        await worker.save();

    } catch (e) {
        console.error('PDF Generation failed', e);
        alert('Failed to generate PDF. Check console.');
    } finally {
        if (actionBar) actionBar.style.display = 'flex';
        loadingDiv.remove();
    }
}

document.addEventListener('DOMContentLoaded', loadItinerary);
