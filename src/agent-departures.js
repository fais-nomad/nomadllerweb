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
        window.location.href = '/agent-login.html';
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
            const link = `${window.location.origin}/guest-form.html?trip_id=${fdId}${agentIdParam}`;
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

            // Helper to bypass Google Drive CORS blocks
            const getSafeImageUrl = (url) => {
                if (!url || url.trim() === '') return '';
                let directUrl = url;
                if (url.includes('drive.google.com/file/d/')) {
                    const match = url.match(/\/d\/(.*?)\//);
                    if (match && match[1]) {
                        directUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                    }
                }
                return `https://wsrv.nl/?url=${encodeURIComponent(directUrl)}`;
            };

            // Populate Cover Page
            const startDate = new Date(fd.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            const endDate = new Date(fd.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            
            document.getElementById('pdf-title').textContent = fd.destination;
            document.getElementById('pdf-dates').textContent = `${startDate} - ${endDate}`;
            document.getElementById('pdf-guest-name-display').textContent = guestName;
            
            // Set Cover Image dynamically
            const coverImgEl = document.getElementById('pdf-cover-bg');
            if (coverImgEl) {
                coverImgEl.crossOrigin = "anonymous";
                if (fd.cover_image_url && fd.cover_image_url.trim() !== '') {
                    coverImgEl.src = getSafeImageUrl(fd.cover_image_url);
                } else {
                    coverImgEl.src = "https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=1600&auto=format&fit=crop";
                }
            }
            
            // Populate Agent Branding
            const logoEl = document.getElementById('pdf-agent-logo');
            const logoWrapper = document.getElementById('pdf-logo-wrapper');
            const companyEl = document.getElementById('pdf-agent-company');
            const contactEl = document.getElementById('pdf-agent-contact');

            if (fullAgentProfile) {
                console.log('[PDF] Agent profile loaded:', fullAgentProfile.company_name, '| Logo URL:', fullAgentProfile.logo_url);
                if (fullAgentProfile.logo_url && logoEl && logoWrapper) {
                    logoEl.crossOrigin = "anonymous";
                    logoEl.src = getSafeImageUrl(fullAgentProfile.logo_url);
                    logoWrapper.style.display = 'flex';
                } else {
                    console.warn('[PDF] No logo_url found in agent profile.');
                }
                companyEl.textContent = fullAgentProfile.company_name || agentData.name;
                
                let contactStr = [];
                if (fullAgentProfile.contact_email) contactStr.push(fullAgentProfile.contact_email);
                if (fullAgentProfile.phone_number) contactStr.push(fullAgentProfile.phone_number);
                contactEl.textContent = contactStr.join(' | ');
            } else {
                companyEl.textContent = agentData.name;
            }

            const companyNameForReplace = fullAgentProfile && fullAgentProfile.company_name ? fullAgentProfile.company_name : agentData.agent_name;
            const replacePlaceholders = (text) => {
                if (!text) return '';
                return text.replace(/\{\s*company\s*name\s*\}/gi, companyNameForReplace);
            };

            let tripHighlights = replacePlaceholders(fd.trip_highlights);
            let detailedItinerary = replacePlaceholders(fd.detailed_itinerary);
            let inclusions = replacePlaceholders(fd.inclusions);
            let exclusions = replacePlaceholders(fd.exclusions);
            let importantNotes = replacePlaceholders(fd.important_notes);
            let thingsToRemember = replacePlaceholders(fd.things_to_remember);
            let termsAndConditions = replacePlaceholders(fd.terms_and_conditions);
            let riskLiabilities = replacePlaceholders(fd.risk_liabilities);
            let healthAndFitness = replacePlaceholders(fd.health_and_fitness);
            let travelInsurance = replacePlaceholders(fd.travel_insurance);
            let cancellationPolicy = replacePlaceholders(fd.cancellation_policy);

            // Populate Details Pages
            const detailsContainer = document.getElementById('pdf-details-pages');
            detailsContainer.innerHTML = ''; // clear previous

            const sections = [
                { title: 'Pricing Summary', content: `Tour Cost: ${sellingRate} per person` },
                { title: 'Trip Highlights', content: tripHighlights },
                { title: 'Detailed Itinerary', content: detailedItinerary },
                { title: 'Inclusions', content: inclusions },
                { title: 'Exclusions', content: exclusions },
                { title: 'Important Notes', content: importantNotes },
                { title: 'Things to Remember', content: thingsToRemember },
                { title: 'Terms and Conditions', content: termsAndConditions },
                { title: 'Risk & Liabilities', content: riskLiabilities },
                { title: 'Health and Fitness', content: healthAndFitness },
                { title: 'Travel Insurance', content: travelInsurance },
                { title: 'Cancellation Policy', content: cancellationPolicy }
            ];

            // Wait for fonts to be ready before paginating so measurements are exact
            await document.fonts.ready;

            const cName = fullAgentProfile && fullAgentProfile.company_name ? fullAgentProfile.company_name : agentData.name;
            let cEmail = fullAgentProfile && fullAgentProfile.contact_email ? fullAgentProfile.contact_email : agentData.email;
            let cPhone = fullAgentProfile && fullAgentProfile.phone_number ? fullAgentProfile.phone_number : '';
            let cAddress = fullAgentProfile && fullAgentProfile.company_address ? fullAgentProfile.company_address : '';
            let cLogo = fullAgentProfile && fullAgentProfile.logo_url ? getSafeImageUrl(fullAgentProfile.logo_url) : '';
            
            let contactStrParts = [];
            if (cEmail) contactStrParts.push(cEmail);
            if (cPhone) contactStrParts.push(cPhone);
            const footerContactInfo = contactStrParts.join(' | ');

            // Setup sandbox for content measurement
            const sandbox = document.createElement('div');
            sandbox.id = 'pdf-sandbox';
            sandbox.style.position = 'fixed';
            sandbox.style.left = '0px';
            sandbox.style.top = '0px';
            sandbox.style.width = '800px';
            sandbox.style.background = '#ffffff';
            sandbox.style.zIndex = '-99999';
            sandbox.style.visibility = 'hidden';
            document.body.appendChild(sandbox);

            let pages = [];
            let currentPage = null;
            let currentContentArea = null;

            const createPageElement = () => {
                const page = document.createElement('div');
                page.className = 'pdf-page';
                page.style.width = '800px';
                page.style.minHeight = '1120px';
                page.style.padding = '90px 60px 100px 60px';
                page.style.boxSizing = 'border-box';
                page.style.position = 'relative';
                // Premium background with subtle gradient
                page.style.background = 'linear-gradient(to bottom, #ffffff 0%, #fcfbf9 100%)';
                page.style.overflow = 'hidden';

                // Subtle mountain watermark to naturally fill and balance empty bottom spaces
                page.innerHTML = `
                    <svg width="100%" height="250" style="position:absolute; bottom:0; left:0; opacity:0.03; pointer-events:none; z-index:0;" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="#1a1a1a" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,229.3C960,213,1056,171,1152,154.7C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                        <path fill="#d4af37" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,213.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                `;

                // Subtle mountain silhouette at bottom
                const mountainBg = document.createElement('div');
                mountainBg.style.position = 'absolute';
                mountainBg.style.bottom = '0';
                mountainBg.style.left = '0';
                mountainBg.style.right = '0';
                mountainBg.style.height = '200px';
                mountainBg.style.opacity = '0.03';
                mountainBg.style.backgroundImage = 'url("https://wsrv.nl/?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544735716-392fe2489ffa")';
                mountainBg.style.backgroundSize = 'cover';
                mountainBg.style.backgroundPosition = 'bottom';
                mountainBg.style.pointerEvents = 'none';
                page.appendChild(mountainBg);

                page.innerHTML += `
                    <!-- Premium Top Header -->
                    <div class="pdf-header" style="position: absolute; top: 0; left: 0; right: 0; height: 60px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center; padding: 0 30px; box-sizing: border-box; border-bottom: 2px solid #d4af37;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            ${cLogo ? `<img crossorigin="anonymous" src="${cLogo}" style="height: 36px; width: auto; object-fit: contain; border-radius: 4px; background: white; padding: 3px;">` : ''}
                            <span style="font-size: 11px; font-weight: 600; color: #d4af37; text-transform: uppercase; letter-spacing: 3px; font-family: 'Inter', sans-serif;">${cName}</span>
                        </div>
                        <span style="font-size: 10px; color: #a0a0a0; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 2px;">Expedition Guide</span>
                    </div>

                    <!-- Content Area -->
                    <div class="pdf-content-area" style="width: 100%; box-sizing: border-box; padding-top: 15px; position: relative; z-index: 2;">
                    </div>

                    <!-- Modern Footer -->
                    <div class="pdf-footer" style="position: absolute; bottom: 40px; left: 50px; right: 50px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(212,175,55,0.3); padding-top: 15px; box-sizing: border-box; z-index: 2;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${cLogo ? `<img crossorigin="anonymous" src="${cLogo}" style="height: 22px; width: auto; object-fit: contain; opacity: 0.7;">` : ''}
                            <span style="font-size: 10px; color: #666; font-family: 'Inter', sans-serif; letter-spacing: 1px; font-weight: 500;">${footerContactInfo}</span>
                        </div>
                        <span class="pdf-page-number" style="font-size: 10px; color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 700; letter-spacing: 1px;">PAGE_NUM</span>
                    </div>
                `;
                return page;
            };

            const createHeaderElement = (title) => {
                const h2 = document.createElement('h2');
                h2.style.color = '#1a1a1a';
                h2.style.marginTop = '0';
                h2.style.marginBottom = '25px';
                h2.style.fontSize = '28px';
                h2.style.borderBottom = '1px solid rgba(212,175,55,0.4)';
                h2.style.paddingBottom = '12px';
                h2.style.display = 'inline-block';
                h2.style.width = '100%';
                h2.style.boxSizing = 'border-box';
                h2.style.fontFamily = "'Playfair Display', serif";
                h2.style.fontWeight = '700';
                h2.style.letterSpacing = '0.5px';
                h2.textContent = title;
                return h2;
            };

            const mountainImgs = [
                'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1506161869811-2eb289ea67e8?q=80&w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1486911278844-a81c5267e227?q=80&w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1531168556467-80aace0d0144?q=80&w=800&auto=format&fit=crop'
            ];

            const createLineElement = (lineText, isItinerary) => {
                const div = document.createElement('div');
                div.className = 'pdf-line';
                div.style.display = 'inline-block';
                div.style.width = '100%';
                div.style.whiteSpace = 'pre-wrap';
                div.style.color = '#333333';
                div.style.fontSize = '14.5px';
                div.style.lineHeight = '1.85';
                div.style.boxSizing = 'border-box';
                div.style.fontFamily = "'Inter', sans-serif";
                div.style.textAlign = 'justify';
                
                let content = lineText || ' ';
                
                if (isItinerary && /^DAY\s*\d+/i.test(lineText.trim())) {
                    const dayMatch = lineText.match(/^DAY\s*(\d+)[\s:\-\–]*(.*)/i);
                    let dayNum = dayMatch ? dayMatch[1] : '';
                    let dayTitle = dayMatch ? dayMatch[2] : lineText.replace(/^DAY\s*\d+[\s:\-\–]*/i, '');
                    const imgUrl = mountainImgs[parseInt(dayNum || '1') % mountainImgs.length];

                    const weathers = ['Clear & Cold', 'Alpine Wind', 'Snow Possible', 'Sub-zero', 'Sunny', 'High Altitude'];
                    const wLabel = weathers[parseInt(dayNum || '1') % weathers.length];
                    const trekTimes = ['5-6 Hours', '4-5 Hours', '6-7 Hours', '7-8 Hours', '3-4 Hours', '8+ Hours'];
                    const tLabel = trekTimes[parseInt(dayNum || '1') % trekTimes.length];
                    const altitudes = ['+450m Gain', '+600m Gain', 'Acclimatization', '+300m Gain', '+800m Gain', '-200m Descent'];
                    const aLabel = altitudes[parseInt(dayNum || '1') % altitudes.length];

                    div.innerHTML = `<div style="margin-top: 25px; margin-bottom: 20px; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 8px 25px rgba(0,0,0,0.04); border: 1px solid rgba(212,175,55,0.15);">
                        <div style="width: 100%; background: #1a1a1a; display: flex; align-items: center; padding: 14px 25px;">
                            <div style="background: #d4af37; color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 2px; margin-right: 18px; padding: 6px 12px; border-radius: 4px; text-transform: uppercase; box-shadow: 0 4px 10px rgba(212,175,55,0.2);">DAY ${dayNum}</div>
                            <h3 style="color: #ffffff; font-family: 'Playfair Display', serif; font-size: 19px; margin: 0; font-weight: 700; letter-spacing: 0.5px;">${dayTitle}</h3>
                        </div>
                        <div style="display: flex; gap: 12px; padding: 14px 25px; background: #fafafa; border-bottom: 2px solid rgba(212,175,55,0.1);">
                            <div style="display: flex; align-items: center; padding: 4px 12px; background: #ffffff; border: 1px solid rgba(212,175,55,0.25); border-radius: 20px;">
                                <img crossorigin="anonymous" src="https://api.iconify.design/ph:mountains-fill.svg?color=%23d4af37" style="width: 14px; height: 14px; margin-right: 6px;">
                                <span style="font-size: 10px; color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${aLabel}</span>
                            </div>
                            <div style="display: flex; align-items: center; padding: 4px 12px; background: #ffffff; border: 1px solid rgba(212,175,55,0.25); border-radius: 20px;">
                                <img crossorigin="anonymous" src="https://api.iconify.design/ph:clock-fill.svg?color=%23d4af37" style="width: 14px; height: 14px; margin-right: 6px;">
                                <span style="font-size: 10px; color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${tLabel}</span>
                            </div>
                            <div style="display: flex; align-items: center; padding: 4px 12px; background: #ffffff; border: 1px solid rgba(212,175,55,0.25); border-radius: 20px;">
                                <img crossorigin="anonymous" src="https://api.iconify.design/ph:sun-fill.svg?color=%23d4af37" style="width: 14px; height: 14px; margin-right: 6px;">
                                <span style="font-size: 10px; color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${wLabel}</span>
                            </div>
                        </div>
                    </div>`;
                } else if (lineText.trim().startsWith('- ') || lineText.trim().startsWith('•')) {
                    // Premium warning/info cards layout for bullets
                    div.innerHTML = `<div style="display: flex; padding-left: 10px; margin-bottom: 10px; background: rgba(212,175,55,0.02); padding: 12px 18px; border-radius: 6px; border-left: 3px solid #d4af37;">
                        <span style="flex: 1; color: #333; font-size: 13.5px; line-height: 1.6; font-weight: 500;">${content.replace(/^[-•]\s*/, '')}</span>
                    </div>`;
                } else if (content.trim() === '') {
                    // Reduce empty space
                    div.style.minHeight = '10px';
                } else {
                    div.style.paddingBottom = '8px';
                    div.textContent = content;
                }
                return div;
            };

            const startNewPage = () => {
                currentPage = createPageElement();
                sandbox.appendChild(currentPage);
                pages.push(currentPage);
                currentContentArea = currentPage.querySelector('.pdf-content-area');
            };

            // Start the first page
            startNewPage();

            sections.forEach(sec => {
                if (!sec.content || sec.content.trim() === '') return;

                const isItinerary = sec.title === 'Detailed Itinerary';
                
                // We'll create blocks of content that should stick together.
                const blocks = [];
                
                // Block 1: The Header (keep it attached to the first content block)
                const header = createHeaderElement(sec.title);
                blocks.push({ type: 'header', el: header, keepWithNext: true });

                const lines = sec.content.split('\n');
                
                let currentDayBlock = null;
                let currentBulletGroup = null;

                lines.forEach((lineText) => {
                    const isNewDay = isItinerary && /^DAY\s*\d+/i.test(lineText.trim());
                    const isBullet = lineText.trim().startsWith('- ') || lineText.trim().startsWith('•');
                    const isEmpty = lineText.trim() === '';

                    if (isNewDay) {
                        if (currentBulletGroup) {
                            blocks.push({ type: 'bullets', el: currentBulletGroup, keepWithNext: false });
                            currentBulletGroup = null;
                        }
                        if (currentDayBlock) {
                            blocks.push({ type: 'day', el: currentDayBlock, keepWithNext: false });
                        }
                        currentDayBlock = document.createElement('div');
                        currentDayBlock.className = 'pdf-day-group';
                        currentDayBlock.appendChild(createLineElement(lineText, isItinerary));
                    } else if (isItinerary && currentDayBlock) {
                        if (!isEmpty) {
                            currentDayBlock.appendChild(createLineElement(lineText, isItinerary));
                        } else {
                            const sp = document.createElement('div');
                            sp.style.height = '10px';
                            currentDayBlock.appendChild(sp);
                        }
                    } else if (isBullet) {
                        if (!currentBulletGroup) {
                            currentBulletGroup = document.createElement('div');
                            currentBulletGroup.className = 'pdf-bullet-group';
                        }
                        currentBulletGroup.appendChild(createLineElement(lineText, isItinerary));
                    } else {
                        if (currentBulletGroup && !isEmpty) {
                            blocks.push({ type: 'bullets', el: currentBulletGroup, keepWithNext: false });
                            currentBulletGroup = null;
                        }
                        if (!isEmpty) {
                            blocks.push({ type: 'text', el: createLineElement(lineText, isItinerary), keepWithNext: false });
                        }
                    }
                });

                if (currentBulletGroup) {
                    blocks.push({ type: 'bullets', el: currentBulletGroup, keepWithNext: false });
                }
                if (currentDayBlock) {
                    blocks.push({ type: 'day', el: currentDayBlock, keepWithNext: false });
                }

                // DEFINITIVE FIX: Defer the header, inject it right before first real content block
                // This guarantees the header NEVER ends up alone on a page.
                const MAX_HEIGHT = 880;
                let deferredHeader = null;

                for (let i = 0; i < blocks.length; i++) {
                    const block = blocks[i];

                    // If it's the section header, defer it — don't place it yet
                    if (block.keepWithNext) {
                        deferredHeader = block.el;
                        continue;
                    }

                    // We have a real content block. First, tentatively place it with the deferred header
                    if (deferredHeader) {
                        currentContentArea.appendChild(deferredHeader);
                        currentContentArea.appendChild(block.el);

                        // If they don't fit AND there's already other content on this page, move both to a new page
                        if (currentContentArea.offsetHeight > MAX_HEIGHT && currentContentArea.children.length > 2) {
                            currentContentArea.removeChild(deferredHeader);
                            currentContentArea.removeChild(block.el);
                            startNewPage();
                            currentContentArea.appendChild(deferredHeader);
                            currentContentArea.appendChild(block.el);
                        }
                        deferredHeader = null;
                    } else {
                        currentContentArea.appendChild(block.el);

                        // If it overflows and is NOT the only block, push to new page
                        if (currentContentArea.offsetHeight > MAX_HEIGHT && currentContentArea.children.length > 1) {
                            currentContentArea.removeChild(block.el);
                            startNewPage();
                            currentContentArea.appendChild(block.el);
                        }
                    }
                }

                const spacer = document.createElement('div');
                spacer.style.height = '25px';
                currentContentArea.appendChild(spacer);
            });

            // Cleanup truly empty pages (belt-and-suspenders safety net)
            pages = pages.filter(p => {
                const area = p.querySelector('.pdf-content-area');
                if (!area) return false;
                // Remove pages where all visible text content is under 30 chars (lone heading or spacer)
                const textContent = area.innerText || area.textContent || '';
                return textContent.trim().length > 30;
            });

            // Create Premium Quick Facts Page
            const quickFactsPage = document.createElement('div');
            quickFactsPage.className = 'pdf-page';
            quickFactsPage.style.width = '800px';
            quickFactsPage.style.minHeight = '1120px';
            quickFactsPage.style.padding = '80px 50px';
            quickFactsPage.style.boxSizing = 'border-box';
            quickFactsPage.style.position = 'relative';
            quickFactsPage.style.background = '#ffffff';
            quickFactsPage.style.overflow = 'hidden';
            quickFactsPage.innerHTML = `
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 60px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center; padding: 0 30px; box-sizing: border-box; border-bottom: 2px solid #d4af37;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        ${cLogo ? `<img crossorigin="anonymous" src="${cLogo}" style="height: 36px; width: auto; max-width: 100px; object-fit: contain; border-radius: 3px; background: white; padding: 2px;">` : ''}
                        <span style="font-size: 11px; font-weight: 600; color: #d4af37; text-transform: uppercase; letter-spacing: 3px; font-family: 'Inter', sans-serif;">${cName}</span>
                    </div>
                    <span style="font-size: 10px; color: #a0a0a0; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 2px;">Expedition Overview</span>
                </div>
                <div style="margin-top: 40px; position: relative; z-index: 2;">
                    <h2 style="font-family: 'Playfair Display', serif; font-size: 32px; color: #1a1a1a; border-bottom: 1px solid rgba(212,175,55,0.4); padding-bottom: 12px; margin-bottom: 35px; font-weight: 700;">Expedition Intelligence</h2>
                    
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 35px;">
                        <div style="width: calc(50% - 10px); box-sizing: border-box; background: #fff; padding: 25px; border-radius: 12px; border: 1px solid rgba(212,175,55,0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.02); margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                <div style="background: rgba(212,175,55,0.1); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                                    <img crossorigin="anonymous" src="https://api.iconify.design/ph:mountains-fill.svg?color=%23d4af37" style="width: 20px; height: 20px;">
                                </div>
                                <h4 style="font-family: 'Inter', sans-serif; font-weight: 700; color: #1a1a1a; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Maximum Altitude</h4>
                            </div>
                            <p style="font-family: 'Playfair Display', serif; font-size: 20px; color: #1a1a1a; margin: 0; font-weight: 600; padding-left: 52px;">5,545 m / 18,192 ft</p>
                        </div>
                        <div style="width: calc(50% - 10px); box-sizing: border-box; background: #fff; padding: 25px; border-radius: 12px; border: 1px solid rgba(212,175,55,0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.02); margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                <div style="background: rgba(212,175,55,0.1); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                                    <img crossorigin="anonymous" src="https://api.iconify.design/ph:chart-line-up-fill.svg?color=%23d4af37" style="width: 20px; height: 20px;">
                                </div>
                                <h4 style="font-family: 'Inter', sans-serif; font-weight: 700; color: #1a1a1a; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Difficulty Level</h4>
                            </div>
                            <p style="font-family: 'Playfair Display', serif; font-size: 20px; color: #1a1a1a; margin: 0; font-weight: 600; padding-left: 52px;">Challenging Expedition</p>
                        </div>
                        <div style="width: calc(50% - 10px); box-sizing: border-box; background: #fff; padding: 25px; border-radius: 12px; border: 1px solid rgba(212,175,55,0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.02); margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                <div style="background: rgba(212,175,55,0.1); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                                    <img crossorigin="anonymous" src="https://api.iconify.design/ph:sun-fill.svg?color=%23d4af37" style="width: 20px; height: 20px;">
                                </div>
                                <h4 style="font-family: 'Inter', sans-serif; font-weight: 700; color: #1a1a1a; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Best Season</h4>
                            </div>
                            <p style="font-family: 'Playfair Display', serif; font-size: 20px; color: #1a1a1a; margin: 0; font-weight: 600; padding-left: 52px;">Mar-May & Sep-Nov</p>
                        </div>
                        <div style="width: calc(50% - 10px); box-sizing: border-box; background: #fff; padding: 25px; border-radius: 12px; border: 1px solid rgba(212,175,55,0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.02); margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                <div style="background: rgba(212,175,55,0.1); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                                    <img crossorigin="anonymous" src="https://api.iconify.design/ph:house-line-fill.svg?color=%23d4af37" style="width: 20px; height: 20px;">
                                </div>
                                <h4 style="font-family: 'Inter', sans-serif; font-weight: 700; color: #1a1a1a; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Accommodation</h4>
                            </div>
                            <p style="font-family: 'Playfair Display', serif; font-size: 20px; color: #1a1a1a; margin: 0; font-weight: 600; padding-left: 52px;">Teahouses / Lodges</p>
                        </div>
                    </div>

                    <h3 style="font-family: 'Playfair Display', serif; font-size: 24px; color: #1a1a1a; margin-bottom: 20px;">Expedition Protocols</h3>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 35px;">
                        <div style="display: flex; background: rgba(212,175,55,0.02); padding: 15px 20px; border-radius: 8px; border-left: 3px solid #d4af37;">
                            <span style="color: #444; font-size: 13.5px; line-height: 1.6; font-family: 'Inter', sans-serif;"><strong style="color: #1a1a1a;">Altitude Acclimatization:</strong> Ascend slowly. Acute Mountain Sickness (AMS) is a serious risk. Hydrate constantly and communicate any symptoms to your guide.</span>
                        </div>
                        <div style="display: flex; background: rgba(212,175,55,0.02); padding: 15px 20px; border-radius: 8px; border-left: 3px solid #d4af37;">
                            <span style="color: #444; font-size: 13.5px; line-height: 1.6; font-family: 'Inter', sans-serif;"><strong style="color: #1a1a1a;">Emergency Protocol:</strong> Helicopter evacuation is available in severe medical emergencies. Your travel insurance must explicitly cover high-altitude evacuation up to 6,000m.</span>
                        </div>
                        <div style="display: flex; background: rgba(212,175,55,0.02); padding: 15px 20px; border-radius: 8px; border-left: 3px solid #d4af37;">
                            <span style="color: #444; font-size: 13.5px; line-height: 1.6; font-family: 'Inter', sans-serif;"><strong style="color: #1a1a1a;">Porter Welfare:</strong> Restrict your duffel bag weight to 15kg (33 lbs) to ensure the ethical treatment and safety of our Himalayan porters.</span>
                        </div>
                    </div>

                    <div style="background: #1a1a1a; color: #fff; padding: 30px; border-radius: 12px; text-align: center; border-bottom: 4px solid #d4af37;">
                        <h4 style="font-family: 'Inter', sans-serif; font-weight: 700; color: #d4af37; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;"><i class="ph-fill ph-shield-check" style="margin-right: 8px; font-size: 18px; vertical-align: bottom;"></i> 24/7 Global Support</h4>
                        <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #ccc; margin: 0; line-height: 1.6;">Our operations team monitors all expeditions in real-time. Lead guides are equipped with satellite communication devices for absolute safety.</p>
                    </div>
                </div>
                <div class="pdf-footer" style="position: absolute; bottom: 40px; left: 50px; right: 50px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(212,175,55,0.3); padding-top: 15px; box-sizing: border-box; z-index: 2;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 10px; color: #666; font-family: 'Inter', sans-serif; letter-spacing: 1px; font-weight: 500;">${footerContactInfo}</span>
                    </div>
                    <span class="pdf-page-number" style="font-size: 10px; color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 700; letter-spacing: 1px;">PAGE 2 OF TOTAL</span>
                </div>
            `;

            // Create Altitude & Map Page
            const mapPage = document.createElement('div');
            mapPage.className = 'pdf-page';
            mapPage.style.width = '800px';
            mapPage.style.minHeight = '1120px';
            mapPage.style.padding = '80px 50px';
            mapPage.style.boxSizing = 'border-box';
            mapPage.style.position = 'relative';
            mapPage.style.background = '#ffffff';
            mapPage.style.overflow = 'hidden';
            mapPage.innerHTML = `
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 60px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center; padding: 0 50px; box-sizing: border-box; border-bottom: 2px solid #d4af37;">
                    <span style="font-size: 11px; font-weight: 600; color: #d4af37; text-transform: uppercase; letter-spacing: 3px; font-family: 'Inter', sans-serif;">${cName}</span>
                    <span style="font-size: 10px; color: #a0a0a0; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 2px;">Route & Altitude</span>
                </div>
                <div style="margin-top: 40px; display: flex; flex-direction: column; gap: 35px; position: relative; z-index: 2;">
                    <div>
                        <h2 style="font-family: 'Playfair Display', serif; font-size: 28px; color: #1a1a1a; border-bottom: 1px solid rgba(212,175,55,0.4); padding-bottom: 12px; margin-bottom: 25px; font-weight: 700;">Expedition Map</h2>
                        <div style="width: 100%; height: 360px; background: #fcfbf9; border-radius: 12px; overflow: hidden; position: relative; border: 1px solid rgba(212,175,55,0.2); box-shadow: 0 8px 25px rgba(0,0,0,0.04);">
                            <img crossorigin="anonymous" src="${(fd.map_image_url && fd.map_image_url.trim() !== '') ? getSafeImageUrl(fd.map_image_url) : 'https://wsrv.nl/?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1524661135-423995f22d0b'}" style="width: 100%; height: 100%; object-fit: cover;">
                            <div style="position: absolute; bottom: 15px; right: 15px; background: rgba(26,26,26,0.85); padding: 8px 20px; border-radius: 30px; border: 1px solid rgba(212,175,55,0.5); backdrop-filter: blur(4px);">
                                <span style="font-family: 'Inter', sans-serif; color: #d4af37; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;"><i class="ph-fill ph-map-pin" style="margin-right: 5px;"></i> Topographical Route</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 style="font-family: 'Playfair Display', serif; font-size: 28px; color: #1a1a1a; border-bottom: 1px solid rgba(212,175,55,0.4); padding-bottom: 12px; margin-bottom: 25px; font-weight: 700;">Altitude Profile</h2>
                        <div style="width: 100%; height: 320px; background: #1a1a1a; border-radius: 12px; overflow: hidden; position: relative; border: 1px solid rgba(212,175,55,0.2); box-shadow: 0 8px 25px rgba(0,0,0,0.04);">
                            <img crossorigin="anonymous" src="${(fd.altitude_image_url && fd.altitude_image_url.trim() !== '') ? getSafeImageUrl(fd.altitude_image_url) : 'https://wsrv.nl/?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1551288049-bebda4e38f71'}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85; mix-blend-mode: luminosity;">
                            <div style="position: absolute; bottom: 15px; right: 15px; background: rgba(26,26,26,0.85); padding: 8px 20px; border-radius: 30px; border: 1px solid rgba(212,175,55,0.5); backdrop-filter: blur(4px);">
                                <span style="font-family: 'Inter', sans-serif; color: #d4af37; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;"><i class="ph-fill ph-trend-up" style="margin-right: 5px;"></i> Elevation Gain Chart</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="pdf-footer" style="position: absolute; bottom: 40px; left: 50px; right: 50px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(212,175,55,0.3); padding-top: 15px; box-sizing: border-box; z-index: 2;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 10px; color: #666; font-family: 'Inter', sans-serif; letter-spacing: 1px; font-weight: 500;">${footerContactInfo}</span>
                    </div>
                    <span class="pdf-page-number" style="font-size: 10px; color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 700; letter-spacing: 1px;">PAGE 3 OF TOTAL</span>
                </div>
            `;

            // Create final page (Cinematic CTA)
            const finalPage = document.createElement('div');
            finalPage.className = 'pdf-page pdf-final';
            finalPage.style.width = '800px';
            finalPage.style.minHeight = '1120px';
            finalPage.style.padding = '0'; // We use full bleed
            finalPage.style.display = 'flex';
            finalPage.style.flexDirection = 'column';
            finalPage.style.justifyContent = 'center';
            finalPage.style.alignItems = 'center';
            finalPage.style.textAlign = 'center';
            finalPage.style.background = '#0a0a0a'; 
            finalPage.style.boxSizing = 'border-box';
            finalPage.style.position = 'relative';

            finalPage.innerHTML = `
                <img crossorigin="anonymous" src="https://wsrv.nl/?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544735716-392fe2489ffa" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.15; filter: grayscale(100%);">
                
                <div style="position: relative; z-index: 2; border: 1px solid rgba(212,175,55,0.3); padding: 80px 60px; width: 85%; background: rgba(10,10,10,0.85); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    <div style="width: 60px; height: 2px; background: #d4af37; margin: 0 auto 30px;"></div>
                    <h2 style="font-size: 46px; color: #ffffff; margin-bottom: 20px; font-family: 'Playfair Display', serif; font-weight: 700; letter-spacing: 1px;">Ready to Explore?</h2>
                    <p style="font-size: 16px; color: #a0a0a0; margin-bottom: 60px; font-family: 'Inter', sans-serif; letter-spacing: 1px; font-weight: 300;">Your Himalayan adventure awaits. Secure your spot today.</p>
                    
                    <div style="background: #ffffff; padding: 35px; border-radius: 16px; margin: 0 auto 50px; max-width: 320px; box-shadow: 0 15px 40px rgba(212,175,55,0.15); display: flex; flex-direction: column; align-items: center;">
                        <img crossorigin="anonymous" src="https://wsrv.nl/?url=${encodeURIComponent('https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(cPhone ? 'https://wa.me/' + cPhone.replace(/\D/g, '') : 'https://nomadller.com'))}" style="width: 160px; height: 160px; margin-bottom: 20px; border-radius: 4px;">
                        <p style="font-size: 15px; color: #1a1a1a; margin: 0; font-family: 'Inter', sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Book Your Expedition</p>
                    </div>

                    <h3 style="color: #d4af37; font-size: 24px; text-transform: uppercase; letter-spacing: 5px; margin-bottom: 30px; font-family: 'Playfair Display', serif; font-weight: 600;">${cName}</h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center; margin-bottom: 30px;">
                        ${cPhone ? `<div style="display: flex; align-items: center; gap: 12px; color: #ffffff; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 300;"><i class="ph-fill ph-phone" style="color: #d4af37; font-size: 20px;"></i> ${cPhone}</div>` : ''}
                        ${cEmail ? `<div style="display: flex; align-items: center; gap: 12px; color: #ffffff; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 300;"><i class="ph-fill ph-envelope" style="color: #d4af37; font-size: 20px;"></i> ${cEmail}</div>` : ''}
                    </div>
                    
                    ${cAddress ? `<p style="font-size: 13px; color: #888; max-width: 80%; margin: 0 auto; line-height: 1.8; font-family: 'Inter', sans-serif; font-weight: 300;">${cAddress}</p>` : ''}
                </div>
            `;

            // Set final page numbers
            const totalPagesCount = pages.length + 4; // cover page + 2 overview pages + inside pages + final page
            pages.forEach((p, idx) => {
                const numEl = p.querySelector('.pdf-page-number');
                if (numEl) {
                    numEl.innerHTML = `PAGE ${idx + 4} OF ${totalPagesCount}`;
                }
            });
            quickFactsPage.innerHTML = quickFactsPage.innerHTML.replace('TOTAL', totalPagesCount);
            mapPage.innerHTML = mapPage.innerHTML.replace('TOTAL', totalPagesCount);

            // Cleanup sandbox// Cleanup sandbox
            sandbox.remove();

            // Gather all physical page elements for iterative rendering
            const allPages = [];
            const coverPage = document.querySelector('.pdf-cover');
            if (coverPage) {
                coverPage.style.width = '800px';
                coverPage.style.height = '1120px';
                allPages.push(coverPage);
            }
            
            // Append all dynamic pages to the DOM so the browser loads their images
            detailsContainer.appendChild(quickFactsPage);
            detailsContainer.appendChild(mapPage);
            pages.forEach(p => detailsContainer.appendChild(p));
            detailsContainer.appendChild(finalPage);

            allPages.push(quickFactsPage);
            allPages.push(mapPage);
            pages.forEach(p => allPages.push(p));
            allPages.push(finalPage);

            // Show element temporarily for rendering
            const templateContainer = document.getElementById('pdf-template-container');
            templateContainer.style.display = 'block';
            templateContainer.style.position = 'absolute';
            templateContainer.style.top = '0px';
            templateContainer.style.left = '-9999px';
            templateContainer.style.zIndex = '-9999';
            templateContainer.style.opacity = '1';
            // CRITICAL FIX: Lock the container to desktop width to prevent mobile layout shifting
            templateContainer.style.width = '800px';

            // CRITICAL FIX: Lock all pages to exact PDF dimensions
            allPages.forEach(p => {
                p.style.width = '800px';
                p.style.height = '1120px';
                p.style.boxSizing = 'border-box';
                p.style.overflow = 'hidden';
            });

            // Wait for all images inside the PDF template to load
            const waitForImages = () => {
                const imgs = templateContainer.querySelectorAll('img');
                const promises = Array.from(imgs).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        // Set a maximum timeout of 3 seconds for any single image to load
                        const timer = setTimeout(() => {
                            console.warn("Image load timeout for", img.src);
                            resolve();
                        }, 3000);
                        
                        img.onload = () => { clearTimeout(timer); resolve(); };
                        img.onerror = () => { clearTimeout(timer); resolve(); };
                    });
                });
                return Promise.all(promises);
            };

            await waitForImages();

            // Give the browser time to finish laying out and painting the DOM elements
            await new Promise(resolve => setTimeout(resolve, 500));

            const opt = {
                margin:       0,
                filename:     `${fd.destination.replace(/ /g, '_')}_Itinerary.pdf`,
                image:        { type: 'jpeg', quality: 0.95 },
                html2canvas:  { 
                    scale: 1.5, 
                    useCORS: true, 
                    logging: false,
                    // CRITICAL FIX: Force html2canvas to render at desktop width to bypass mobile media queries
                    windowWidth: 800,
                    width: 800
                },
                jsPDF:        { unit: 'px', format: [800, 1120], orientation: 'portrait' }
            };

            try {
                // Render the first page
                let worker = html2pdf().set(opt).from(allPages[0]).toPdf();
                
                // Iteratively render the rest of the pages to prevent maximum canvas height crashing
                for (let i = 1; i < allPages.length; i++) {
                    worker = worker.get('pdf').then(pdf => {
                        pdf.addPage();
                    }).from(allPages[i]).toContainer().toCanvas().toPdf();
                }
                
                // Finalize and save
                await worker.save();
            } catch (err) {
                console.error("PDF generation failed:", err);
                alert("Failed to generate PDF. Please try again.");
            }

            templateContainer.style.display = 'none';

            // Reset UI
            btn.innerHTML = '<i class="ph ph-file-pdf" style="margin-right: 0.5rem;"></i> GENERATE & DOWNLOAD';
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
