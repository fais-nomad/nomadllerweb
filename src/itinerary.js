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
                <div class="brand-text" style="font-family: 'Playfair Display', serif; font-size: 1.2rem;">NOMADLLER</div>
                <div class="button-group" style="display: flex; gap: 15px;">
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
                    #action-bar {
                        padding: 10px 15px !important;
                    }
                    #action-bar .brand-text {
                        font-size: 0.9rem !important;
                    }
                    #action-bar button {
                        padding: 6px 12px !important;
                        font-size: 0.65rem !important;
                        letter-spacing: 1px !important;
                    }
                    #action-bar .button-group {
                        gap: 8px !important;
                    }
                    #pdf-wrapper {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        width: 100vw;
                        overflow: hidden;
                    }
                    /* Scale is handled via JS for mobile since CSS scale() cannot accept vw units */
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

        // Master Paginator for Continuous Flow using Pixel Height Estimation
        const Paginator = {
            html: '',
            currentPageHtml: '',
            currentHeight: 0,
            maxHeight: 900, // Physical usable height in pixels for A4 page (1123 - 80 padding - 100 footer - buffer)
            
            closePage() {
                if (this.currentPageHtml) {
                    this.html += `
                    <div class="page">
                        <div class="page-content">
                            ${this.currentPageHtml}
                        </div>
                        <div class="page-footer"><span>Nomadller Luxury Expeditions</span></div>
                    </div>`;
                    this.currentPageHtml = '';
                    this.currentHeight = 0;
                }
            },
            
            addSectionHeader(heading, subheading, subtitleColor='rgba(0,0,0,0.5)') {
                const heightNeeded = (this.currentHeight > 0 ? 40 : 0) + 65 + (subheading ? 40 : 0); // h2 + subheading + margins
                
                // Anti-orphan logic: require at least 250px of extra space for content to follow the header
                if (this.currentHeight + heightNeeded + 250 > this.maxHeight && this.currentHeight > 0) {
                    this.closePage();
                }
                const marginTop = this.currentHeight > 0 ? 'margin-top: 40px;' : '';
                this.currentPageHtml += `
                    <h2 class="section-heading" style="${marginTop}">${heading}</h2>
                    ${subheading ? `<div class="section-subheading" style="color: ${subtitleColor}; margin-bottom: 20px;">${subheading}</div>` : ''}
                `;
                this.currentHeight += (this.currentHeight === 0 ? (65 + (subheading ? 40 : 0)) : heightNeeded);
            },

            addDay(dayNum, title, desc, metricsHtml, isHighlight) {
                const descHeight = Math.ceil((desc || '').length / 80) * 20; // 20px per line
                const metricsHeight = metricsHtml ? (isHighlight ? 70 : 40) : 0;
                const baseHeight = isHighlight ? 150 : 120; // titles, paddings (30px), margins (50px)
                const heightNeeded = baseHeight + descHeight + metricsHeight;

                if (this.currentHeight + heightNeeded > this.maxHeight && this.currentHeight > 0) {
                    this.closePage();
                    this.addSectionHeader('The Journey Continues', '');
                }

                if (isHighlight) {
                    this.currentPageHtml += `
                        <div class="day-container" style="border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 30px;">
                            <div class="day-number" style="color: var(--orange);">${String(dayNum).padStart(2, '0')}</div>
                            <div class="day-details">
                                <h3 class="day-title" style="font-size: 2rem;">${title}</h3>
                                <p class="day-desc" style="color: rgba(0,0,0,0.6);">${desc || ''}</p>
                                <div class="data-grid" style="grid-template-columns: repeat(2, 1fr); margin-top: 20px;">
                                    ${metricsHtml}
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    this.currentPageHtml += `
                        <div class="day-container">
                            <div class="day-number">${String(dayNum).padStart(2, '0')}</div>
                            <div class="day-details">
                                <h3 class="day-title">${title}</h3>
                                <p class="day-desc">${desc || ''}</p>
                                <div class="day-metrics">${metricsHtml}</div>
                            </div>
                        </div>
                    `;
                }
                this.currentHeight += heightNeeded;
            },

            addCards(cards) {
                cards.forEach(card => {
                    if (!card.items || card.items.length === 0 || card.items[0].trim() === '') return;
                    
                    let normalizedItems = [];
                    card.items.forEach(item => {
                        const splitItems = item.split(/[•\n]/).filter(s => s.trim().length > 0);
                        normalizedItems.push(...splitItems);
                    });

                    let remainingItems = [...normalizedItems];
                    let isFirstChunk = true;

                    while(remainingItems.length > 0) {
                        const cardOverhead = 130; // padding: 30px (top+bottom=60), margin-bottom: 20, h3+margins: 50
                        if (this.currentHeight + cardOverhead >= this.maxHeight && this.currentHeight > 0) {
                            this.closePage();
                        }
                        
                        const availableHeight = this.maxHeight - this.currentHeight - cardOverhead;
                        // each row in 2 columns takes ~35px (font + line-height + margin-bottom: 12px)
                        const maxRows = Math.floor(availableHeight / 35);
                        let maxItemsForChunk = maxRows * 2;
                        
                        if (maxItemsForChunk <= 0) {
                            this.closePage();
                            continue;
                        }

                        let chunk = remainingItems.splice(0, maxItemsForChunk);
                        if (chunk.length > 0) {
                            this.currentPageHtml += `
                            <div class="data-card" style="margin-bottom: 20px;">
                                <h3>${card.title} ${!isFirstChunk ? '(Cont.)' : ''}</h3>
                                <ul style="font-size: 0.8rem; line-height: 1.5; padding-left: 20px; column-count: 2; column-gap: 40px;">
                                    ${chunk.map(item => `<li style="margin-bottom: 8px; break-inside: avoid; page-break-inside: avoid;">${item.trim()}</li>`).join('')}
                                </ul>
                            </div>
                            `;
                            const rowsUsed = Math.ceil(chunk.length / 2);
                            this.currentHeight += cardOverhead + (rowsUsed * 35);
                            isFirstChunk = false;
                        }
                        if (this.currentHeight >= this.maxHeight) {
                            this.closePage();
                        }
                    }
                });
            }
        };

        // Render Itinerary Days
        if (trip.itinerary) {
            let days = [];
            if (typeof trip.itinerary === 'string') {
                try {
                    days = JSON.parse(trip.itinerary);
                } catch(e) {
                    const lines = trip.itinerary.split('\n').filter(l => l.trim() !== '');
                    days = lines.map((l, idx) => ({ day: idx + 1, title: 'Day ' + (idx + 1), desc: l }));
                }
            } else if (Array.isArray(trip.itinerary)) {
                days = trip.itinerary;
            }

            Paginator.addSectionHeader('The Journey', 'ITINERARY DETAILS');
            days.forEach((d, idx) => {
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
                Paginator.addDay(d.day || idx+1, d.title, d.desc, metricsHtml, d.is_highlight);
            });
        }

        // Render Inclusions / Exclusions
        const logisticsCards = [];
        if (trip.inclusions && trip.inclusions.length > 0) {
            logisticsCards.push({ title: 'Inclusions', items: Array.isArray(trip.inclusions) ? trip.inclusions : trip.inclusions.split('\n') });
        }
        if (trip.exclusions && trip.exclusions.length > 0) {
            logisticsCards.push({ title: 'Exclusions', items: Array.isArray(trip.exclusions) ? trip.exclusions : trip.exclusions.split('\n') });
        }
        if (logisticsCards.length > 0) {
            Paginator.addSectionHeader('Logistics', 'INCLUSIONS & EXCLUSIONS', 'var(--orange)');
            Paginator.addCards(logisticsCards);
        }

        // Render Policies Page (Health, Cancel, Insurance, Notes)
        const policyCards = [];
        if (trip.health_and_fitness && trip.health_and_fitness.length > 0) policyCards.push({ title: 'Health & Fitness', items: Array.isArray(trip.health_and_fitness) ? trip.health_and_fitness : trip.health_and_fitness.split('\n') });
        if (trip.cancellation_policy && trip.cancellation_policy.length > 0) policyCards.push({ title: 'Cancellation Policy', items: Array.isArray(trip.cancellation_policy) ? trip.cancellation_policy : trip.cancellation_policy.split('\n') });
        if (trip.travel_insurance && trip.travel_insurance.length > 0) policyCards.push({ title: 'Insurance', items: Array.isArray(trip.travel_insurance) ? trip.travel_insurance : trip.travel_insurance.split('\n') });
        if (trip.important_notes && trip.important_notes.length > 0) policyCards.push({ title: 'Important Notes', items: Array.isArray(trip.important_notes) ? trip.important_notes : trip.important_notes.split('\n') });
        if (policyCards.length > 0) {
            Paginator.addSectionHeader('Policies', 'ESSENTIAL GUIDELINES', 'var(--orange)');
            Paginator.addCards(policyCards);
        }

        // Render Agreements Page (Terms, Risk, Remember)
        const agreementCards = [];
        if (trip.terms_and_conditions && trip.terms_and_conditions.length > 0) agreementCards.push({ title: 'Terms & Conditions', items: Array.isArray(trip.terms_and_conditions) ? trip.terms_and_conditions : trip.terms_and_conditions.split('\n') });
        if (trip.risk_liabilities && trip.risk_liabilities.length > 0) agreementCards.push({ title: 'Risk & Liabilities', items: Array.isArray(trip.risk_liabilities) ? trip.risk_liabilities : trip.risk_liabilities.split('\n') });
        if (trip.things_to_remember && trip.things_to_remember.length > 0) agreementCards.push({ title: 'Things to Remember', items: Array.isArray(trip.things_to_remember) ? trip.things_to_remember : trip.things_to_remember.split('\n') });
        if (agreementCards.length > 0) {
            Paginator.addSectionHeader('Agreements', 'TERMS & CONDITIONS', 'var(--orange)');
            Paginator.addCards(agreementCards);
        }

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
                Paginator.addSectionHeader('Preparation', 'THINGS TO CARRY', 'var(--orange)');
                Paginator.addCards(mappedCards);
            }
        }

        Paginator.closePage();
        html += Paginator.html;

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

        function applyMobileScale() {
            if (window.innerWidth <= 820) {
                const scale = window.innerWidth / 794;
                const pages = document.querySelectorAll('.page');
                pages.forEach(p => {
                    p.style.transform = `scale(${scale})`;
                    p.style.transformOrigin = 'top left';
                    p.style.marginBottom = `-${1123 * (1 - scale)}px`;
                });
            } else {
                const pages = document.querySelectorAll('.page');
                pages.forEach(p => {
                    p.style.transform = 'none';
                    p.style.marginBottom = '0px';
                });
            }
        }
        
        applyMobileScale();
        window.addEventListener('resize', applyMobileScale);

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
            clone.style.transform = 'none';
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
