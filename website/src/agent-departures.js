import { generateItineraryPDF } from './pdf-generator.js';
import { createClient } from '@supabase/supabase-js';
import gsap from 'gsap';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

document.addEventListener('DOMContentLoaded', async () => {
    // Check if agent is logged in
    const agentDataStr = localStorage.getItem('nomadller_agent');
    
    if (!agentDataStr) {
        window.location.href = '/agent-login';
        return;
    }

    const agentData = JSON.parse(agentDataStr);
    
    // Fetch full agent profile
    let fullAgentProfile = null;
    try {
        const { data } = await supabase.from('agents').select('*').eq('agent_code', agentData.code).single();
        if (data) fullAgentProfile = data;
    } catch (e) {
        console.error("Failed to fetch agent profile", e);
    }

    const welcomeName = document.getElementById('agent-welcome-name');
    if (welcomeName) {
        welcomeName.textContent = `Logged in as: ${agentData.agent_name}`;
    }

    const departuresContainer = document.getElementById('departures-container');
    const loadingSpinner = document.getElementById('loading-spinner');

    try {
        const { data: fds, error } = await supabase
            .from('fixed_departures')
            .select('*')
            .order('start_date', { ascending: true });

        if (error) throw error;

        loadingSpinner.style.display = 'none';
        departuresContainer.style.display = 'grid';

        if (fds && fds.length > 0) {
            window.fdMap = {};
            fds.forEach((fd, index) => {
                window.fdMap[fd.id] = fd;
                const statusClass = `status-${fd.status.split(' ')[0]}`; // Available -> status-Available, Sold Out -> status-Sold
                const startDate = new Date(fd.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                const endDate = new Date(fd.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

                const card = document.createElement('div');
                card.className = 'departure-card';
                card.style.cursor = 'pointer';
                card.setAttribute('data-id', fd.id);
                card.style.opacity = '0';
                card.innerHTML = `
                    <div class="departure-header">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <h3 class="departure-title">${fd.destination}</h3>
                            <span class="departure-status ${statusClass}">${fd.status}</span>
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="ph ph-calendar-blank"></i> ${startDate} - ${endDate}
                        </div>
                    </div>
                    <div class="departure-body">

                        <div class="info-row" style="border-bottom: none; align-items: center; margin-bottom: 0;">
                            <span class="info-label">B2B Net Rate</span>
                            <span class="info-value price-highlight">${fd.b2b_price}</span>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-outline btn-full pdf-trigger-btn" data-id="${fd.id}" data-destination="${fd.destination}" data-max-price="${fd.max_selling_price || ''}" style="background: transparent; border: 1px solid var(--admin-border);"><i class="ph ph-download"></i> PDF</button>
                            <button class="btn btn-primary btn-full book-trigger-btn" data-id="${fd.id}" data-destination="${fd.destination}"><i class="ph ph-link"></i> BOOK</button>
                        </div>
                    </div>
                `;
                departuresContainer.appendChild(card);

                // Animate in
                gsap.to(card, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "power2.out",
                    startAt: { y: 20 }
                });
            });
        } else {
            departuresContainer.style.display = 'block';
            departuresContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No fixed departures currently available.</p>';
        }

    } catch (err) {
        console.error('Error loading fixed departures:', err);
        loadingSpinner.innerHTML = '<p style="color: var(--admin-danger);">Failed to load departures. Please try again.</p>';
    }

    // --- PDF MODAL LOGIC ---
    const pdfModal = document.getElementById('pdf-modal');
    const closePdfModal = document.getElementById('close-pdf-modal');
    const pdfForm = document.getElementById('pdf-generate-form');

    // Event delegation for dynamically generated PDF buttons
    document.addEventListener('click', (e) => {
        const pdfBtn = e.target.closest('.pdf-trigger-btn');
        if (pdfBtn) {
            const maxPrice = pdfBtn.getAttribute('data-max-price');
            document.getElementById('pdf-fd-id').value = pdfBtn.getAttribute('data-id');
            document.getElementById('pdf-selling-rate').value = maxPrice || '';
            document.getElementById('pdf-guest-name').value = ''; // clear previous

            pdfModal.style.display = 'flex';
            gsap.fromTo(pdfModal.querySelector('.modal-content'), 
                { y: 50, opacity: 0 }, 
                { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
            );
        }

        const bookBtn = e.target.closest('.book-trigger-btn');
        if (bookBtn) {
            const fdId = bookBtn.getAttribute('data-id');
            const destination = bookBtn.getAttribute('data-destination');
            const linkText = document.getElementById('book-link-text');
            const bookModal = document.getElementById('book-modal');
            const sendWaBtn = document.getElementById('send-wa-btn');
            
            // Generate the link using current origin
            // Append agent_id if agent is logged in
            const agentIdParam = fullAgentProfile && fullAgentProfile.id ? `&agent_id=${fullAgentProfile.id}` : '';
            const link = `${window.location.origin}/guest-form?trip_id=${fdId}${agentIdParam}`;
            linkText.textContent = link;

            // Store trip name for WhatsApp message
            if (sendWaBtn) {
                sendWaBtn.setAttribute('data-trip', destination);
            }

            bookModal.style.display = 'flex';
            gsap.fromTo(bookModal.querySelector('.modal-content'), 
                { scale: 0.9, opacity: 0 }, 
                { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
            );
        }
    });

    if (closePdfModal) {
        closePdfModal.addEventListener('click', () => {
            gsap.to(pdfModal.querySelector('.modal-content'), { 
                y: 50, opacity: 0, duration: 0.3, 
                onComplete: () => { pdfModal.style.display = 'none'; } 
            });
        });
    }

    // --- BOOK MODAL LOGIC ---
    const bookModal = document.getElementById('book-modal');
    const closeBookModal = document.getElementById('close-book-modal');
    const copyBookLinkBtn = document.getElementById('copy-book-link-btn');
    const sendWaBtn = document.getElementById('send-wa-btn');

    if (closeBookModal) {
        closeBookModal.addEventListener('click', () => {
            gsap.to(bookModal.querySelector('.modal-content'), { 
                scale: 0.9, opacity: 0, duration: 0.2, 
                onComplete: () => { bookModal.style.display = 'none'; } 
            });
        });
    }

    if (copyBookLinkBtn) {
        copyBookLinkBtn.addEventListener('click', () => {
            const link = document.getElementById('book-link-text').textContent;
            navigator.clipboard.writeText(link).then(() => {
                const originalText = copyBookLinkBtn.innerHTML;
                copyBookLinkBtn.innerHTML = '<i class="ph ph-check" style="margin-right: 0.5rem;"></i> COPIED!';
                copyBookLinkBtn.style.background = 'var(--admin-success)';
                setTimeout(() => {
                    copyBookLinkBtn.innerHTML = originalText;
                    copyBookLinkBtn.style.background = '';
                }, 2000);
            });
        });
    }

    if (sendWaBtn) {
        sendWaBtn.addEventListener('click', () => {
            const link = document.getElementById('book-link-text').textContent;
            const tripName = sendWaBtn.getAttribute('data-trip');
            const countryCode = document.getElementById('wa-country-code').value;
            let phone = document.getElementById('wa-phone-number').value.replace(/\D/g, ''); // strip non-digits

            if (!phone) {
                alert("Please enter a WhatsApp number.");
                return;
            }

            const companyName = fullAgentProfile && fullAgentProfile.company_name ? fullAgentProfile.company_name : agentData.agent_name;
            const message = `Hello! Please click the link below to securely register for your upcoming trip to *${tripName}*. You can also upload your flight tickets here to automatically generate your pickup/drop schedule:\n\n${link}\n\nThank you,\n${companyName}`;
            
            const waUrl = `https://wa.me/${countryCode}${phone}?text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank');
        });
    }

    if (pdfForm) {
        pdfForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('generate-pdf-btn');
            btn.textContent = 'GENERATING PDF...';
            btn.disabled = true;

            const guestName = document.getElementById('pdf-guest-name').value;
            const sellingRate = document.getElementById('pdf-selling-rate').value;
            const fdId = document.getElementById('pdf-fd-id').value;
            const fd = window.fdMap[fdId];

            if (!fd) {
                alert("Departure data not found.");
                btn.textContent = 'GENERATE & DOWNLOAD';
                btn.disabled = false;
                return;
            }

            try {
                await generateItineraryPDF(fd, guestName, sellingRate, fullAgentProfile, agentData);
            } catch (err) {
                console.error('PDF failed:', err);
            }
            btn.disabled = false;

            // Close modal after generation
            gsap.to(pdfModal.querySelector('.modal-content'), { 
                y: 50, opacity: 0, duration: 0.3, 
                onComplete: () => { pdfModal.style.display = 'none'; } 
            });
        });
    }

    // --- DETAILS MODAL LOGIC ---
    const detailsModal = document.getElementById('details-modal');
    const closeDetailsModal = document.getElementById('close-details-modal');
    
    document.addEventListener('click', (e) => {
        // If they click on a button, don't open the card details
        if (e.target.closest('button') || e.target.closest('a.btn')) return;

        const card = e.target.closest('.departure-card');
        if (card && detailsModal) {
            const id = card.getAttribute('data-id');
            const fd = window.fdMap[id];
            if (fd) {
                document.getElementById('details-title').textContent = fd.destination;
                
                let contentHtml = '';

                // Add Max Selling Rate at the top
                if (fd.max_selling_price) {
                    contentHtml += `
                        <div style="background: rgba(46, 196, 182, 0.1); border: 1px solid rgba(46, 196, 182, 0.3); border-radius: 10px; padding: 1.2rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="color: white; margin: 0 0 0.2rem 0; font-size: 1.1rem;">Recommended Selling Rate</h3>
                                <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">The suggested max retail price for your clients.</p>
                            </div>
                            <div style="color: var(--admin-success); font-size: 1.4rem; font-weight: 700;">
                                ${fd.max_selling_price}
                            </div>
                        </div>
                    `;
                }
                
                const sections = [
                    { title: 'Trip Highlights', content: fd.trip_highlights, icon: 'ph-star' },
                    { title: 'Detailed Itinerary', content: fd.detailed_itinerary, icon: 'ph-map-trifold' },
                    { title: 'Inclusions', content: fd.inclusions, icon: 'ph-check-circle' },
                    { title: 'Exclusions', content: fd.exclusions, icon: 'ph-x-circle' },
                    { title: 'Important Notes', content: fd.important_notes, icon: 'ph-warning-circle' },
                    { title: 'Things to Remember', content: fd.things_to_remember, icon: 'ph-brain' },
                    { title: 'Terms and Conditions', content: fd.terms_and_conditions, icon: 'ph-file-text' },
                    { title: 'Risk & Liabilities', content: fd.risk_liabilities, icon: 'ph-shield-warning' },
                    { title: 'Health and Fitness', content: fd.health_and_fitness, icon: 'ph-heartbeat' },
                    { title: 'Travel Insurance', content: fd.travel_insurance, icon: 'ph-umbrella' },
                    { title: 'Cancellation Policy', content: fd.cancellation_policy, icon: 'ph-calendar-x' }
                ];

                contentHtml += '<div style="display: flex; flex-direction: column; gap: 1.5rem;">';
                sections.forEach(sec => {
                    if (sec.content && sec.content.trim() !== '') {
                        contentHtml += `
                            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 1.5rem;">
                                <h3 style="color: var(--accent); margin-top: 0; margin-bottom: 1rem; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="ph ${sec.icon}"></i> ${sec.title}
                                </h3>
                                <div style="white-space: pre-wrap; font-size: 0.95rem; color: #d1d1d1; line-height: 1.7;">${sec.content}</div>
                            </div>
                        `;
                    }
                });
                contentHtml += '</div>';

                if (contentHtml === '') {
                    contentHtml = '<p>No additional details provided for this trip.</p>';
                }

                document.getElementById('details-content').innerHTML = contentHtml;

                detailsModal.style.display = 'flex';
                gsap.fromTo(detailsModal.querySelector('.modal-content'), 
                    { y: 50, opacity: 0 }, 
                    { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
                );
            }
        }
    });

    if (closeDetailsModal) {
        closeDetailsModal.addEventListener('click', () => {
            gsap.to(detailsModal.querySelector('.modal-content'), { 
                y: 50, opacity: 0, duration: 0.3, 
                onComplete: () => { detailsModal.style.display = 'none'; } 
            });
        });
    }

});
