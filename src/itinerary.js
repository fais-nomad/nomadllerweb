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
        if (!trip) throw new Error("Trip not found");

        const coverImage = trip.cover_image_url || '/images/placeholder.jpg';
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
                    <button onclick="window.close()" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 20px; font-family: 'Inter', sans-serif; font-size: 0.8rem; letter-spacing: 2px; cursor: pointer; border-radius: 4px; text-transform: uppercase;">Close</button>
                </div>
            </div>
            
            <div style="margin-top: 60px;"></div> <!-- Spacer -->

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
            let isCurrentPageClimax = false;

            html += `
            <div class="page">
                <div class="page-content">
                    <div class="gps-coords">ITINERARY DETAILS</div>
                    <h2 class="section-heading">The Journey</h2>
            `;

            days.forEach((d, idx) => {
                if (d.is_highlight && !isCurrentPageClimax) {
                    // Start new Climax Page
                    html += `
                        </div>
                        <div class="page-footer"><span>Nomadller Luxury Expeditions</span></div>
                    </div>
                    <div class="page climax-page">
                        <div class="page-content">
                            <div class="gps-coords" style="color: rgba(255,255,255,0.2);">THE CLIMAX</div>
                            <h2 class="section-heading" style="color: white; border-bottom-color: rgba(255,255,255,0.1);">The Climax</h2>
                    `;
                    daysOnPage = 0;
                    isCurrentPageClimax = true;
                } else if (!d.is_highlight && isCurrentPageClimax) {
                    // Return to normal page
                    html += `
                        </div>
                        <div class="page-footer"><span>Nomadller Luxury Expeditions</span></div>
                    </div>
                    <div class="page">
                        <div class="page-content">
                            <div class="gps-coords">ITINERARY DETAILS</div>
                            <h2 class="section-heading">The Descent</h2>
                    `;
                    daysOnPage = 0;
                    isCurrentPageClimax = false;
                } else if (daysOnPage >= 3) {
                    // Standard pagination
                    html += `
                        </div>
                        <div class="page-footer"><span>Nomadller Luxury Expeditions</span></div>
                    </div>
                    <div class="page ${isCurrentPageClimax ? 'climax-page' : ''}">
                        <div class="page-content">
                            <div class="gps-coords" ${isCurrentPageClimax ? 'style="color: rgba(255,255,255,0.2);"' : ''}>ITINERARY DETAILS</div>
                            <h2 class="section-heading" ${isCurrentPageClimax ? 'style="color: white; border-bottom-color: rgba(255,255,255,0.1);"' : ''}>${isCurrentPageClimax ? 'The Climax Continues' : 'The Journey Continues'}</h2>
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
                            return `<div class="c-metric"><span class="t-micro" style="color: rgba(255,255,255,0.7);">${icon}</span><span style="font-size: 1.2rem; font-family: var(--font-display); display: block;">${text}</span></div>`;
                        }).join('');
                    } else {
                        metricsHtml = d.metrics.map(m => `<div class="metric-badge">${m}</div>`).join('');
                    }
                }

                if (d.is_highlight) {
                    html += `
                        <div class="day-container" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 30px;">
                            <div class="day-number" style="color: var(--orange);">${String(d.day || idx+1).padStart(2, '0')}</div>
                            <div class="day-details">
                                <h3 class="day-title" style="color: white; font-size: 2rem;">${d.title || 'Day ' + d.day}</h3>
                                <p class="day-desc" style="color: rgba(255,255,255,0.8);">${d.desc || ''}</p>
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

        // Render Inclusions / Exclusions
        if ((trip.inclusions && trip.inclusions.length > 0) || (trip.exclusions && trip.exclusions.length > 0)) {
            const incList = Array.isArray(trip.inclusions) ? trip.inclusions : trip.inclusions.split('\n');
            const excList = Array.isArray(trip.exclusions) ? trip.exclusions : trip.exclusions.split('\n');
            
            html += `
            <div class="page">
                <div class="page-content">
                    <h2 class="section-heading">Logistics</h2>
                    <div class="section-subheading">Inclusions & Exclusions</div>
                    <div class="data-grid" style="margin-bottom: 20px;">
            `;

            if (incList && incList.length > 0 && incList[0].trim() !== '') {
                html += `
                    <div class="data-card">
                        <h3>Inclusions</h3>
                        <ul style="font-size: 0.8rem;">
                            ${incList.map(item => `<li>${item.trim()}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            if (excList && excList.length > 0 && excList[0].trim() !== '') {
                html += `
                    <div class="data-card">
                        <h3>Exclusions</h3>
                        <ul style="font-size: 0.8rem;">
                            ${excList.map(item => `<li>${item.trim()}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
                <div class="page-footer">
                    <span>Nomadller Luxury Expeditions</span>
                    <span>Page</span>
                </div>
            </div>
            `;
        }

        // 1. Render Policies Page (Health, Cancel, Insurance, Notes)
        const hasHealth = trip.health_and_fitness && trip.health_and_fitness.length > 0;
        const hasCancel = trip.cancellation_policy && trip.cancellation_policy.length > 0;
        const hasInsurance = trip.travel_insurance && trip.travel_insurance.length > 0;
        const hasNotes = trip.important_notes && trip.important_notes.length > 0;

        if (hasHealth || hasCancel || hasInsurance || hasNotes) {
            html += `
            <div class="page">
                <div class="page-content">
                    <h2 class="section-heading">Policies</h2>
                    <div class="section-subheading">ESSENTIAL GUIDELINES</div>
                    <div class="data-grid" style="margin-bottom: 20px;">
            `;

            if (hasHealth) {
                const arr = Array.isArray(trip.health_and_fitness) ? trip.health_and_fitness : trip.health_and_fitness.split('\n');
                html += `
                    <div class="data-card">
                        <h3>Health & Fitness</h3>
                        <ul style="font-size: 0.8rem;">
                            ${arr.map(item => `<li>${item.trim()}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            if (hasCancel) {
                const arr = Array.isArray(trip.cancellation_policy) ? trip.cancellation_policy : trip.cancellation_policy.split('\n');
                html += `
                    <div class="data-card">
                        <h3>Cancellation Policy</h3>
                        <ul style="font-size: 0.8rem;">
                            ${arr.map(item => `<li>${item.trim()}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            if (hasInsurance) {
                const arr = Array.isArray(trip.travel_insurance) ? trip.travel_insurance : trip.travel_insurance.split('\n');
                html += `
                    <div class="data-card">
                        <h3>Insurance</h3>
                        <ul style="font-size: 0.8rem;">
                            ${arr.map(item => `<li>${item.trim()}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            if (hasNotes) {
                const arr = Array.isArray(trip.important_notes) ? trip.important_notes : trip.important_notes.split('\n');
                html += `
                    <div class="data-card">
                        <h3>Important Notes</h3>
                        <ul style="font-size: 0.8rem;">
                            ${arr.map(item => `<li>${item.trim()}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
                <div class="page-footer">
                    <span>Nomadller Luxury Expeditions</span>
                    <span>Page</span>
                </div>
            </div>
            `;
        }

        // 2. Render Agreements Page (Terms, Risk, Remember)
        const hasTerms = trip.terms_and_conditions && trip.terms_and_conditions.length > 0;
        const hasRisk = trip.risk_liabilities && trip.risk_liabilities.length > 0;
        const hasRemember = trip.things_to_remember && trip.things_to_remember.length > 0;

        if (hasTerms || hasRisk || hasRemember) {
            html += `
            <div class="page">
                <div class="page-content">
                    <h2 class="section-heading">Agreements</h2>
                    <div class="section-subheading">TERMS & CONDITIONS</div>
                    <div class="data-grid" style="margin-bottom: 20px;">
            `;

            if (hasTerms) {
                const arr = Array.isArray(trip.terms_and_conditions) ? trip.terms_and_conditions : trip.terms_and_conditions.split('\n');
                html += `
                    <div class="data-card">
                        <h3>Terms & Conditions</h3>
                        <ul style="font-size: 0.8rem;">
                            ${arr.map(item => `<li>${item.trim()}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            if (hasRisk) {
                const arr = Array.isArray(trip.risk_liabilities) ? trip.risk_liabilities : trip.risk_liabilities.split('\n');
                html += `
                    <div class="data-card">
                        <h3>Risk & Liabilities</h3>
                        <ul style="font-size: 0.8rem;">
                            ${arr.map(item => `<li>${item.trim()}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            html += `</div>`; // Close grid for top 2

            // Things to remember spans full width usually or just sits in a card
            if (hasRemember) {
                const arr = Array.isArray(trip.things_to_remember) ? trip.things_to_remember : trip.things_to_remember.split('\n');
                html += `
                    <div class="data-card" style="margin-top: 20px;">
                        <h3>Things to Remember</h3>
                        <ul style="font-size: 0.8rem;">
                            ${arr.map(item => `<li>${item.trim()}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            html += `
                </div>
                <div class="page-footer">
                    <span>Nomadller Luxury Expeditions</span>
                    <span>Page</span>
                </div>
            </div>
            `;
        }

        // Render Things to Carry
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
                html += `
                <div class="page">
                    <div class="page-content">
                        <h2 class="section-heading">Preparation</h2>
                        <div class="section-subheading">Things to Carry</div>
                        <div class="data-grid" style="margin-bottom: 20px;">
                `;

                prepCategories.forEach(cat => {
                    if (cat.items && cat.items.length > 0) {
                        html += `
                        <div class="data-card">
                            <h3>${cat.category || 'Items'}</h3>
                            <ul style="font-size: 0.8rem;">
                                ${cat.items.map(item => `<li>${item.trim()}</li>`).join('')}
                            </ul>
                        </div>
                        `;
                    }
                });

                html += `
                        </div>
                    </div>
                    <div class="page-footer">
                        <span>Nomadller Luxury Expeditions</span>
                        <span>Page</span>
                    </div>
                </div>
                `;
            }
        }

        html += `
            <!-- Final Page -->
            <div class="page cover-page" style="background-image: linear-gradient(180deg, rgba(11,17,32,0.1) 0%, rgba(11,17,32,0.95) 100%), url('${coverImage}'); text-align: center; justify-content: center; align-items: center;">
                <h2 class="t-serif" style="font-size: 2.5rem; font-weight: 400; line-height: 1.4; max-width: 600px; margin-bottom: 40px; color: var(--white);">
                    "Some journeys end at the destination.<br><span style="color: var(--orange);">This one stays with you forever.</span>"
                </h2>
                <div class="brand-badge" style="letter-spacing: 4px; color: rgba(255,255,255,0.4);">NOMADLLER LUXURY EXPEDITIONS</div>
            </div>
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
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const canvas = await html2canvas(page, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            
            if (i > 0) doc.addPage();
            doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }
        
        doc.save('Nomadller_Itinerary.pdf');
    } catch (e) {
        console.error('PDF Generation failed', e);
        alert('Failed to generate PDF. Check console.');
    } finally {
        if (actionBar) actionBar.style.display = 'flex';
        loadingDiv.remove();
    }
}

document.addEventListener('DOMContentLoaded', loadItinerary);
