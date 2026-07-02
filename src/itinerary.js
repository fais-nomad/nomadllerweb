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
        let backCoverImage = '/images/nomadller_back_cover.webp';
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
            <div id="action-bar" style="position: fixed; top: 0; left: 0; right: 0; background: rgba(26,26,26,0.97); backdrop-filter: blur(12px); padding: 14px 32px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; color: white; border-bottom: 2px solid #B84500;">
                <div class="brand-text" style="font-family: 'Lora', serif; font-size: 1.3rem; font-weight: 700; letter-spacing: 3px; color: #FFFFFF;">NOMADLLER</div>
                <div class="button-group" style="display: flex; gap: 12px; align-items: center;">
                    <button id="edit-pdf-btn" style="background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.4); color: white; padding: 10px 20px; font-family: 'Source Sans 3', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 1.5px; cursor: pointer; border-radius: 6px; text-transform: uppercase; transition: all 0.3s;">✎ Edit Content</button>
                    <button id="download-pdf-btn" style="background: #B84500; color: white; border: none; padding: 10px 24px; font-family: 'Source Sans 3', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 1.5px; cursor: pointer; border-radius: 6px; text-transform: uppercase;">⬇ Download PDF</button>
                    <button onclick="try { window.close(); } catch(e) {} setTimeout(() => { if(!window.closed) { if(window.history.length > 1) window.history.back(); else window.location.href='/dashboard'; } }, 100);" style="background: transparent; border: 1.5px solid rgba(255,255,255,0.35); color: white; padding: 10px 24px; font-family: 'Source Sans 3', sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 1.5px; cursor: pointer; border-radius: 6px; text-transform: uppercase;">✕ Close</button>
                </div>
            </div>
            
            <div style="margin-top: 60px;"></div> <!-- Spacer -->

            <style>
                /* Web PDF Viewer Document Layout */
                body { background-color: #1A1A1A !important; }
                #pdf-wrapper { 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    padding: 30px 0 80px 0; 
                }
                .page {
                    box-shadow: 0 15px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08) !important;
                    border-radius: 4px;
                }
                @media (max-width: 820px) {
                    body { overflow-x: hidden; background: #121212 !important; }
                    #action-bar { padding: 10px 16px !important; }
                    #action-bar .brand-text { font-size: 1rem !important; }
                    #action-bar button { padding: 7px 12px !important; font-size: 0.72rem !important; }
                    #action-bar .button-group { gap: 8px !important; }
                    #pdf-wrapper { display: block !important; width: 100% !important; max-width: 100vw !important; overflow-x: hidden !important; padding: 20px 0 60px 0 !important; }
                }
            </style>

            <div id="pdf-wrapper">

            <!-- 1. Cover Page -->
            <div class="page cover-page" id="pdf-content-start" style="background-image: url('${coverImage}');">
                <div class="gps-coords">NOMADLLER EXPEDITIONS</div>
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
                <div class="cover-subtitle">${trip.subtitle || trip.difficulty + ' · ' + trip.duration}</div>
            </div>

            <!-- 2. Quote Page -->
            <div class="page quote-page dark-page">
                <div class="gps-coords">NOMADLLER PHILOSOPHY</div>
                <div style="width: 60px; height: 4px; background: #B84500; margin: 0 auto 40px; border-radius: 2px;"></div>
                <h2 class="large-quote">"${tripQuote}"</h2>
                <div style="width: 40px; height: 1px; background: rgba(255,255,255,0.3); margin: 30px auto 20px;"></div>
                <div class="quote-author">Nomadller Expeditions</div>
            </div>
        `;

        // Master Paginator for Continuous Flow using Pixel Height Estimation
        const Paginator = {
            html: '',
            currentPageHtml: '',
            currentHeight: 0,
            // A4 page at 96dpi = 1123px. Minus 80px top padding + 110px bottom padding (footer safe) = 933px usable.
            // We use 860 to leave a small safety margin above the footer.
            maxHeight: 860,
            
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
            
            addSectionHeader(heading, subheading, subtitleColor='var(--orange)') {
                // heading ~48px + subheading ~28px + margin ~20px
                const heightNeeded = (this.currentHeight > 0 ? 30 : 0) + 48 + (subheading ? 28 : 0) + 20;
                
                // Anti-orphan: need at least 280px after header for full content cards
                if (this.currentHeight + heightNeeded + 280 > this.maxHeight && this.currentHeight > 0) {
                    this.closePage();
                }
                const marginTop = this.currentHeight > 0 ? 'margin-top: 32px;' : '';
                this.currentPageHtml += `
                    <div style="${marginTop} border-left: 4px solid #B84500; padding-left: 18px; margin-bottom: 6px;">
                        <h2 class="section-heading">${heading}</h2>
                    </div>
                    ${subheading ? `<div class="section-subheading" style="color: ${subtitleColor}; margin-bottom: 20px;">${subheading}</div>` : ''}
                `;
                this.currentHeight += heightNeeded;
            },

            addDay(dayNum, title, desc, metricsHtml, isHighlight) {
                // title ~36px, each desc line ~26px (1.1rem * 1.8 lh), metrics ~36px, margins ~30px
                const charsPerLine = 70; // approx chars that fit per line at 1.1rem
                const descLines = Math.max(1, Math.ceil((desc || '').length / charsPerLine));
                const descHeight = descLines * 26;
                const metricsHeight = metricsHtml ? (isHighlight ? 60 : 36) : 0;
                const titleHeight = isHighlight ? 44 : 36;
                const marginAndPadding = 36; // day-container margin-bottom + padding
                const heightNeeded = titleHeight + descHeight + metricsHeight + marginAndPadding;

                if (this.currentHeight + heightNeeded > this.maxHeight && this.currentHeight > 0) {
                    this.closePage();
                    this.addSectionHeader('The Journey Continues', '');
                }

                if (isHighlight) {
                    this.currentPageHtml += `
                        <div class="day-container" style="border-bottom: 1.5px solid rgba(184,69,0,0.15); padding-bottom: 28px; margin-bottom: 28px;">
                            <div class="day-number">${String(dayNum).padStart(2, '0')}</div>
                            <div class="day-details">
                                <h3 class="day-title" style="font-size: 1.7rem;">${title}</h3>
                                <p class="day-desc">${desc || ''}</p>
                                <div class="data-grid" style="grid-template-columns: repeat(2, 1fr); margin-top: 16px;">
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
                        // card: h3 ~38px + padding 40px + margin 22px = ~100px overhead
                        const cardOverhead = 100;
                        if (this.currentHeight + cardOverhead >= this.maxHeight && this.currentHeight > 0) {
                            this.closePage();
                        }
                        
                        const availableHeight = this.maxHeight - this.currentHeight - cardOverhead;
                        
                        let chunk = [];
                        let col1Height = 0;
                        let col2Height = 0;

                        for (let i = 0; i < remainingItems.length; i++) {
                            const item = remainingItems[i];
                            const lines = Math.max(1, Math.ceil(item.length / 36));
                            const itemH = lines * 27 + 10;
                            
                            if (col1Height <= col2Height) {
                                col1Height += itemH;
                            } else {
                                col2Height += itemH;
                            }
                            
                            const newMaxH = Math.max(col1Height, col2Height);
                            if (newMaxH > availableHeight && chunk.length >= 2) {
                                break;
                            }
                            chunk.push(item);
                        }

                        if (chunk.length === 0) {
                            if (this.currentHeight > 0) {
                                this.closePage();
                                continue;
                            } else {
                                chunk = remainingItems.slice(0, 2);
                                col1Height = 60;
                                col2Height = 60;
                            }
                        }

                        remainingItems.splice(0, chunk.length);
                        if (chunk.length > 0) {
                            this.currentPageHtml += `
                            <div class="data-card" style="margin-bottom: 22px;">
                                <h3>${card.title}${!isFirstChunk ? ' (Cont.)' : ''}</h3>
                                <ul style="font-size: 1rem; font-family: 'Source Sans 3', sans-serif; line-height: 1.7; padding-left: 20px; column-count: 2; column-gap: 40px;">
                                    ${chunk.map(item => `<li style="margin-bottom: 9px; break-inside: avoid; page-break-inside: avoid; color: #1A1A1A;">${item.trim()}</li>`).join('')}
                                </ul>
                            </div>
                            `;
                            const finalH = Math.max(col1Height, col2Height);
                            this.currentHeight += cardOverhead + finalH;
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
            <div class="page cover-page" style="background-image: linear-gradient(180deg, rgba(20,10,0,0.15) 0%, rgba(20,10,0,0.92) 100%), url('${backCoverImage}'); text-align: center; justify-content: center; align-items: center;">
                <div style="position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 28px; padding: 0 60px;">
                    <div style="width: 50px; height: 3px; background: #B84500; border-radius: 2px;"></div>
                    <h2 style="font-family: 'Lora', serif; font-size: 2.4rem; font-weight: 700; line-height: 1.5; max-width: 540px; color: #FFFFFF; text-align: center;">
                        "Some journeys end at the destination.<br><span style="color: #F4A261;">This one stays with you forever.</span>"
                    </h2>
                    <div style="width: 50px; height: 3px; background: #B84500; border-radius: 2px;"></div>
                    <div style="font-family: 'Source Sans 3', sans-serif; font-size: 0.95rem; font-weight: 600; letter-spacing: 5px; text-transform: uppercase; color: rgba(255,255,255,0.55); margin-top: 12px;">NOMADLLER LUXURY EXPEDITIONS</div>
                </div>
            </div>
            </div> <!-- End of PDF Wrapper -->
        `;

        root.outerHTML = html;

        function applyMobileScale() {
            const pages = document.querySelectorAll('.page');
            const wrapper = document.getElementById('pdf-wrapper');
            if (window.innerWidth <= 820) {
                if (wrapper) wrapper.style.display = 'block';
                const pageWidth = 793.7;
                const scale = Math.min((window.innerWidth - 24) / pageWidth, 1);
                const offsetX = Math.max(0, (window.innerWidth - (pageWidth * scale)) / 2);
                pages.forEach(p => {
                    p.style.transformOrigin = 'top left';
                    p.style.transform = `scale(${scale})`;
                    p.style.marginLeft = `${offsetX}px`;
                    p.style.marginRight = '0px';
                    p.style.marginBottom = `${28 - (1122.5 * (1 - scale))}px`;
                });
            } else {
                if (wrapper) wrapper.style.display = 'flex';
                pages.forEach(p => {
                    p.style.transformOrigin = 'top center';
                    p.style.transform = 'none';
                    p.style.margin = '0 auto 45px auto';
                });
            }
        }
        
        applyMobileScale();
        window.addEventListener('resize', applyMobileScale);

        window.isPdfEditMode = false;
        window.togglePdfEditMode = async function() {
            if (!window.isPdfEditMode) {
                const inputCode = prompt('🔒 Security Verification\\n\\nPlease enter the Admin Access Code to unlock live itinerary editing:');
                if (inputCode === null) return;
                
                const msgBuffer = new TextEncoder().encode(inputCode.trim());
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
                const targetHash = localStorage.getItem('nomadller_edit_access_hash') || 'b3797d6c583d0edef9f6a17bf7f4ba66d105952ceaa59e68abbd6502de6e81e4';
                
                if (hashHex !== targetHash) {
                    alert('❌ Incorrect Access Code. Edit Mode remains locked.');
                    return;
                }
            }
            window.isPdfEditMode = !window.isPdfEditMode;
            const btn = document.getElementById('edit-pdf-btn');
            const wrapper = document.getElementById('pdf-wrapper');
            if (!wrapper) return;

            if (window.isPdfEditMode) {
                window.pdfUndoStack = window.pdfUndoStack || [];
                if (!window.originalPdfSnapshot) {
                    window.originalPdfSnapshot = wrapper.innerHTML;
                }

                window.savePdfSnapshot = function() {
                    const w = document.getElementById('pdf-wrapper');
                    if (!w) return;
                    window.pdfUndoStack.push(w.innerHTML);
                    if (window.pdfUndoStack.length > 30) window.pdfUndoStack.shift();
                };

                window.rebindPdfEditControls = function() {
                    const w = document.getElementById('pdf-wrapper');
                    if (!w) return;
                    const selectors = [
                        '.cover-title', '.cover-subtitle', '.price-item', '.gps-coords',
                        '.brand-badge', '.large-quote', '.quote-author', '.section-heading',
                        '.section-subheading', '.day-number', '.day-title', '.day-desc',
                        '.metric-badge', '.c-metric span', '.data-card h3', '.data-card li', '.page-footer span'
                    ];
                    w.querySelectorAll(selectors.join(', ')).forEach(el => {
                        el.setAttribute('contenteditable', 'true');
                        el.addEventListener('focus', () => {
                            if (typeof window.savePdfSnapshot === 'function') window.savePdfSnapshot();
                        }, { once: false });
                    });

                    const layoutBlocks = w.querySelectorAll('.day-container, .data-card, .cover-title, .large-quote');
                    layoutBlocks.forEach(block => {
                        if (!block.querySelector('.spacing-toolbar')) {
                            block.style.position = 'relative';
                            const toolbar = document.createElement('div');
                            toolbar.className = 'spacing-toolbar';
                            toolbar.setAttribute('contenteditable', 'false');
                            const isCard = block.classList.contains('data-card');
                            toolbar.innerHTML = `
                                <button onclick="window.moveToPrevPage(this)" title="Pull item back up to previous page">⬆ Prev Page</button>
                                <button onclick="window.moveToNextPage(this)" title="Move this item and subsequent items to a new page">⬇ Next Page</button>
                                ${isCard ? '<button onclick="window.splitDataCard(this)" style="background: rgba(230,81,0,0.85);" title="Split this card in half onto the next page">✂ Split Card</button>' : ''}
                                <span style="margin: 0 2px; opacity: 0.7;">|</span>
                                <span>↕ Space</span>
                                <button onclick="window.adjustSpacing(this, -10)" title="Decrease vertical spacing">-</button>
                                <button onclick="window.adjustSpacing(this, +10)" title="Increase vertical spacing">+</button>
                            `;
                            block.appendChild(toolbar);
                        }
                    });
                    if (typeof applyMobileScale === 'function') applyMobileScale();
                };

                window.undoPdfEdit = function() {
                    if (!window.pdfUndoStack || window.pdfUndoStack.length === 0) {
                        alert('Nothing to undo!');
                        return;
                    }
                    const w = document.getElementById('pdf-wrapper');
                    if (!w) return;
                    w.innerHTML = window.pdfUndoStack.pop();
                    window.rebindPdfEditControls();
                };

                window.resetPdfEdit = function() {
                    if (!window.originalPdfSnapshot) return;
                    if (!confirm('Reset all layout spacing and text changes back to original?')) return;
                    window.savePdfSnapshot();
                    const w = document.getElementById('pdf-wrapper');
                    w.innerHTML = window.originalPdfSnapshot;
                    window.rebindPdfEditControls();
                };

                if (btn) {
                    btn.innerHTML = '✅ Done Editing';
                    btn.style.background = '#2E7D32';
                    btn.style.borderColor = '#2E7D32';
                    btn.style.boxShadow = '0 0 15px rgba(46,125,50,0.6)';

                    let buttonGroup = btn.parentElement;
                    if (buttonGroup && !document.getElementById('pdf-undo-btn')) {
                        const undoBtn = document.createElement('button');
                        undoBtn.id = 'pdf-undo-btn';
                        undoBtn.innerHTML = '↩ Undo';
                        undoBtn.title = 'Undo last change (Cmd+Z or Ctrl+Z)';
                        undoBtn.style.cssText = 'background: rgba(255,255,255,0.18); color: white; border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 7px 12px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: 0.2s;';
                        undoBtn.onclick = () => window.undoPdfEdit();

                        const resetBtn = document.createElement('button');
                        resetBtn.id = 'pdf-reset-btn';
                        resetBtn.innerHTML = '🔄 Reset';
                        resetBtn.title = 'Reset all layout and text edits back to original';
                        resetBtn.style.cssText = 'background: rgba(220,53,69,0.25); color: #ff8b8b; border: 1px solid rgba(220,53,69,0.5); border-radius: 4px; padding: 7px 12px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: 0.2s;';
                        resetBtn.onclick = () => window.resetPdfEdit();

                        buttonGroup.insertBefore(undoBtn, btn);
                        buttonGroup.insertBefore(resetBtn, btn);
                    } else if (document.getElementById('pdf-undo-btn')) {
                        document.getElementById('pdf-undo-btn').style.display = 'inline-flex';
                        document.getElementById('pdf-reset-btn').style.display = 'inline-flex';
                    }
                }

                if (!window.undoShortcutAttached) {
                    window.undoShortcutAttached = true;
                    document.addEventListener('keydown', (e) => {
                        if (window.isPdfEditMode && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
                            e.preventDefault();
                            window.undoPdfEdit();
                        }
                    });
                }
                let style = document.getElementById('pdf-edit-mode-style');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'pdf-edit-mode-style';
                    style.innerHTML = `
                        #pdf-wrapper [contenteditable="true"] {
                            transition: outline 0.2s, background 0.2s;
                            border-radius: 4px;
                            white-space: pre-wrap !important;
                        }
                        #pdf-wrapper [contenteditable="true"]:hover,
                        #pdf-wrapper [contenteditable="true"]:focus {
                            outline: 2px dashed #B84500 !important;
                            background: rgba(184, 69, 0, 0.15) !important;
                            cursor: text;
                        }
                        .spacing-toolbar {
                            position: absolute;
                            right: 12px;
                            top: -12px;
                            background: #B84500;
                            color: white;
                            font-family: 'Source Sans 3', sans-serif;
                            font-size: 0.72rem;
                            font-weight: 700;
                            padding: 3px 10px;
                            border-radius: 20px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            z-index: 1000;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                            cursor: default;
                            user-select: none;
                            opacity: 0.2;
                            transform: scale(0.96);
                            transition: opacity 0.2s ease, transform 0.2s ease;
                        }
                        .day-container:hover .spacing-toolbar,
                        .data-card:hover .spacing-toolbar,
                        .cover-title:hover .spacing-toolbar,
                        .large-quote:hover .spacing-toolbar,
                        .spacing-toolbar:hover {
                            opacity: 1;
                            transform: scale(1);
                            z-index: 10000;
                        }
                        .spacing-toolbar button {
                            background: rgba(0,0,0,0.35);
                            border: 1px solid rgba(255,255,255,0.25);
                            color: white;
                            height: 22px;
                            padding: 0 7px;
                            border-radius: 12px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 0.68rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: background 0.2s;
                        }
                        .spacing-toolbar button:hover {
                            background: rgba(0,0,0,0.75);
                        }
                    `;
                    document.head.appendChild(style);
                }

                let toast = document.getElementById('pdf-edit-toast');
                if (!toast) {
                    toast = document.createElement('div');
                    toast.id = 'pdf-edit-toast';
                    toast.style.cssText = 'position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1A1A1A; border: 2px solid #B84500; color: white; padding: 14px 28px; border-radius: 50px; z-index: 10000; font-family: "Source Sans 3", sans-serif; font-size: 0.95rem; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.8); display: flex; align-items: center; gap: 12px;';
                    toast.innerHTML = '<span style="color: #F4A261; font-size: 1.2rem;">✨</span> <span>Edit Mode Active: Click text to edit or use layout handles (↕ Space) to adjust spaces!</span>';
                    document.body.appendChild(toast);
                } else {
                    toast.style.display = 'flex';
                }

                const selectors = [
                    '.cover-title', '.cover-subtitle', '.price-item', '.gps-coords',
                    '.brand-badge', '.large-quote', '.quote-author', '.section-heading',
                    '.section-subheading', '.day-number', '.day-title', '.day-desc',
                    '.metric-badge', '.c-metric span', '.data-card h3', '.data-card li', '.page-footer span'
                ];
                wrapper.querySelectorAll(selectors.join(', ')).forEach(el => {
                    el.setAttribute('contenteditable', 'true');
                });

                window.adjustSpacing = function(btn, delta) {
                    if (typeof window.savePdfSnapshot === 'function') window.savePdfSnapshot();
                    const block = btn.closest('.day-container, .data-card, .cover-title, .large-quote, .section-heading');
                    if (!block) return;
                    let currentMargin = parseInt(window.getComputedStyle(block).marginBottom || '0', 10);
                    if (isNaN(currentMargin)) currentMargin = 20;
                    let newMargin = Math.max(0, currentMargin + delta);
                    block.style.marginBottom = newMargin + 'px';
                };

                window.splitDataCard = function(btn) {
                    if (typeof window.savePdfSnapshot === 'function') window.savePdfSnapshot();
                    const card = btn.closest('.data-card');
                    if (!card) return;
                    const currentPage = card.closest('.page');
                    if (!currentPage) return;
                    
                    const lis = Array.from(card.querySelectorAll('li'));
                    if (lis.length < 2) {
                        alert('This card has less than 2 items, cannot split further!');
                        return;
                    }

                    const h3 = card.querySelector('h3');
                    let baseTitle = h3 ? h3.innerText.replace(/\s*\(Cont\.\)\s*$/i, '') : 'Details';
                    
                    const mid = Math.ceil(lis.length / 2);
                    const firstHalf = lis.slice(0, mid);
                    const secondHalf = lis.slice(mid);

                    const ul = card.querySelector('ul');
                    if (ul) {
                        ul.innerHTML = firstHalf.map(li => li.outerHTML).join('');
                    }

                    const newCard = document.createElement('div');
                    newCard.className = 'data-card';
                    newCard.style.cssText = card.style.cssText || 'margin-bottom: 22px;';
                    newCard.innerHTML = `
                        <h3>${baseTitle} (Cont.)</h3>
                        <ul style="${ul ? ul.style.cssText : 'font-size: 1rem; font-family: Source Sans 3, sans-serif; line-height: 1.7; padding-left: 20px; column-count: 2; column-gap: 40px;'}">
                            ${secondHalf.map(li => li.outerHTML).join('')}
                        </ul>
                    `;

                    let siblingsToMove = [newCard];
                    let curr = card.nextElementSibling;
                    while (curr) {
                        if (!curr.classList.contains('page-footer') && !curr.classList.contains('spacing-toolbar')) {
                            siblingsToMove.push(curr);
                        }
                        curr = curr.nextElementSibling;
                    }

                    const nextPage = currentPage.nextElementSibling;
                    if (nextPage && nextPage.classList.contains('page') && !nextPage.classList.contains('cover-page')) {
                        const nextContent = nextPage.querySelector('.page-content') || nextPage;
                        siblingsToMove.slice().reverse().forEach(el => {
                            nextContent.insertBefore(el, nextContent.firstChild);
                        });
                    } else {
                        const newPage = document.createElement('div');
                        newPage.className = 'page';
                        newPage.style.cssText = currentPage.style.cssText;
                        
                        const newContent = document.createElement('div');
                        newContent.className = 'page-content';
                        
                        const footer = document.createElement('div');
                        footer.className = 'page-footer';
                        footer.innerHTML = '<span>Nomadller Luxury Expeditions</span>';

                        siblingsToMove.forEach(el => newContent.appendChild(el));
                        
                        newPage.appendChild(newContent);
                        newPage.appendChild(footer);

                        currentPage.parentNode.insertBefore(newPage, currentPage.nextElementSibling);
                    }

                    window.rebindPdfEditControls();
                    if (typeof applyMobileScale === 'function') applyMobileScale();
                };

                window.moveToNextPage = function(btn) {
                    if (typeof window.savePdfSnapshot === 'function') window.savePdfSnapshot();
                    const block = btn.closest('.day-container, .data-card, .cover-title, .large-quote, .section-heading');
                    if (!block) return;
                    const currentPage = block.closest('.page');
                    if (!currentPage) return;
                    const currentContent = currentPage.querySelector('.page-content') || currentPage;

                    let siblingsToMove = [];
                    let curr = block;
                    while (curr) {
                        if (!curr.classList.contains('page-footer')) {
                            siblingsToMove.push(curr);
                        }
                        curr = curr.nextElementSibling;
                    }

                    if (siblingsToMove.length === 0) return;

                    const nextPage = currentPage.nextElementSibling;
                    if (nextPage && nextPage.classList.contains('page') && !nextPage.classList.contains('cover-page')) {
                        const nextContent = nextPage.querySelector('.page-content') || nextPage;
                        siblingsToMove.slice().reverse().forEach(el => {
                            nextContent.insertBefore(el, nextContent.firstChild);
                        });
                    } else {
                        const newPage = document.createElement('div');
                        newPage.className = 'page';
                        newPage.style.cssText = currentPage.style.cssText;
                        
                        const newContent = document.createElement('div');
                        newContent.className = 'page-content';
                        
                        const footer = document.createElement('div');
                        footer.className = 'page-footer';
                        footer.innerHTML = '<span>Nomadller Luxury Expeditions</span>';

                        siblingsToMove.forEach(el => newContent.appendChild(el));
                        
                        newPage.appendChild(newContent);
                        newPage.appendChild(footer);

                        currentPage.parentNode.insertBefore(newPage, currentPage.nextElementSibling);
                    }

                    if (currentContent.children.length === 0) {
                        currentPage.remove();
                    }
                    if (typeof applyMobileScale === 'function') applyMobileScale();
                };

                window.moveToPrevPage = function(btn) {
                    if (typeof window.savePdfSnapshot === 'function') window.savePdfSnapshot();
                    const block = btn.closest('.day-container, .data-card, .cover-title, .large-quote, .section-heading');
                    if (!block) return;
                    const currentPage = block.closest('.page');
                    if (!currentPage) return;
                    const prevPage = currentPage.previousElementSibling;
                    if (!prevPage || !prevPage.classList.contains('page') || prevPage.classList.contains('cover-page')) {
                        alert('No previous regular page exists!');
                        return;
                    }
                    const prevContent = prevPage.querySelector('.page-content') || prevPage;
                    prevContent.appendChild(block);

                    const currentContent = currentPage.querySelector('.page-content') || currentPage;
                    if (currentContent.children.length === 0) {
                        currentPage.remove();
                    }
                    if (typeof applyMobileScale === 'function') applyMobileScale();
                };

                window.rebindPdfEditControls();
            } else {
                if (btn) {
                    btn.innerHTML = '✎ Edit Content';
                    btn.style.background = 'rgba(255,255,255,0.12)';
                    btn.style.borderColor = 'rgba(255,255,255,0.4)';
                    btn.style.boxShadow = 'none';
                }
                if (document.getElementById('pdf-undo-btn')) document.getElementById('pdf-undo-btn').style.display = 'none';
                if (document.getElementById('pdf-reset-btn')) document.getElementById('pdf-reset-btn').style.display = 'none';
                const toast = document.getElementById('pdf-edit-toast');
                if (toast) toast.style.display = 'none';
                wrapper.querySelectorAll('[contenteditable]').forEach(el => {
                    el.removeAttribute('contenteditable');
                });
                wrapper.querySelectorAll('.spacing-toolbar').forEach(el => el.remove());
            }
        };

        const editBtn = document.getElementById('edit-pdf-btn');
        if (editBtn) editBtn.addEventListener('click', window.togglePdfEditMode);

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
    const wasEditing = window.isPdfEditMode;
    if (wasEditing && typeof window.togglePdfEditMode === 'function') {
        window.togglePdfEditMode(); // Temporarily disable edit mode so outlines/cursors don't appear in PDF
    }

    const actionBar = document.getElementById('action-bar');
    const toast = document.getElementById('pdf-edit-toast');
    if (actionBar) actionBar.style.display = 'none'; // Hide UI for PDF
    if (toast) toast.style.display = 'none';

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
        if (wasEditing && typeof window.togglePdfEditMode === 'function') {
            window.togglePdfEditMode(); // Restore edit mode after download
        }
        loadingDiv.remove();
    }
}

document.addEventListener('DOMContentLoaded', loadItinerary);
