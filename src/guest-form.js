import gsap from 'gsap';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    gsap.fromTo('.guest-container', 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );

    // Get trip_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('trip_id');

    if (!tripId) {
        alert("Invalid Link. No Trip ID found.");
        return;
    }

    const agentId = urlParams.get('agent_id');
    if (agentId) {
        fetchAgentBranding();
    }

    async function fetchAgentBranding() {
        try {
            const { data } = await supabase.from('agents').select('company_name').eq('id', agentId).maybeSingle();
            if (data && data.company_name) {
                const brandName = data.company_name.toUpperCase();
                document.getElementById('brand-logo').textContent = brandName;
                document.title = `${data.company_name} | Guest Registration`;
            }
        } catch (e) {
            console.error("Failed to load agent branding", e);
        }
    }

    // Fetch Trip Details for Header
    async function fetchTripDetails() {
        try {
            let { data, error } = await supabase
                .from('upcoming_trips')
                .select('*')
                .eq('id', tripId)
                .maybeSingle(); // Use maybeSingle to prevent error if not found
                
            if (!data) {
                // Fallback to fixed_departures
                const { data: fdData, error: fdError } = await supabase
                    .from('fixed_departures')
                    .select('*')
                    .eq('id', tripId)
                    .maybeSingle();
                if (fdError) throw fdError;
                data = fdData;
                if (data) {
                    // Map destination to trip_name for consistent rendering
                    data.trip_name = data.destination;
                }
            }

            if (error && error.code !== 'PGRST116') throw error;
            
            if (data) {
                document.getElementById('display-trip-name').textContent = data.trip_name;
                const options = { day: '2-digit', month: 'short', year: 'numeric' };
                const start = new Date(data.start_date).toLocaleDateString('en-GB', options);
                const end = new Date(data.end_date).toLocaleDateString('en-GB', options);
                document.getElementById('display-trip-dates').textContent = `${start} — ${end}`;
            } else {
                console.error("Trip not found in database.");
            }
        } catch (err) {
            console.error("Error fetching trip header:", err);
        }
    }
    fetchTripDetails();

    // Toggle Itinerary
    const btnViewItinerary = document.getElementById('btn-view-itinerary');
    const itineraryPanel = document.getElementById('itinerary-panel');
    if (btnViewItinerary && itineraryPanel) {
        btnViewItinerary.addEventListener('click', () => {
            if (itineraryPanel.style.display === 'none') {
                itineraryPanel.style.display = 'block';
                btnViewItinerary.innerHTML = '<i class="ph ph-caret-up" style="vertical-align: middle; margin-right: 0.5rem;"></i> CLOSE ITINERARY';
                gsap.from(itineraryPanel, { opacity: 0, y: -20, duration: 0.4, ease: "power2.out" });
            } else {
                itineraryPanel.style.display = 'none';
                btnViewItinerary.innerHTML = '<i class="ph ph-map-trifold" style="vertical-align: middle; margin-right: 0.5rem;"></i> VIEW ITINERARY';
            }
        });
    }

    // PDF Upload and Parse Logic
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('ticket-upload');
    const loadingOverlay = document.getElementById('ai-loading');

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type === "application/pdf") {
                await processPDF(file, false);
            } else {
                alert("Please upload a valid PDF ticket.");
            }
        }
    });

    const returnBtn = document.getElementById('upload-return-btn');
    const returnFileInput = document.getElementById('return-ticket-upload');

    if (returnBtn && returnFileInput) {
        returnBtn.addEventListener('click', () => returnFileInput.click());
        returnFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                if (file.type === "application/pdf") {
                    await processPDF(file, true);
                } else {
                    alert("Please upload a valid PDF ticket.");
                }
            }
        });
    }

    async function processPDF(file, isReturn = false) {
        loadingOverlay.style.display = 'flex';
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            // Call DeepSeek API
            await callDeepSeekAI(fullText, isReturn);

        } catch (error) {
            console.error("PDF Processing Error:", error);
            alert("Error reading PDF. Please fill in the details manually.");
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }

    async function callDeepSeekAI(text, isReturn = false) {
        const prompt = `
You are a professional travel data assistant. Extract flight details from the ticket text and return ONLY a valid JSON object.

${isReturn ? 'NOTE: This is specifically a RETURN TICKET. Focus on extracting the journey back to the origin and place it in the "departure" fields.' : ''}

RULES:
1. Distinguish between the "Arrival journey" (trip to destination) and "Departure journey" (return trip).
2. For CONNECTION FLIGHTS (multiple legs for one journey):
   - Combine them into a single entry.
   - departure_place = origin of first leg.
   - arrival_place = final destination of last leg.
   - flight_no = list all flight numbers (e.g., "6E 2706, 6E 1153").
   - dep_date/time = when the first leg starts.
   - arr_date/time = when the last leg arrives at the final destination.
3. Only use the "departure" fields in the JSON if there is a clear return journey (usually on a different date).
4. Format Dates as YYYY-MM-DD and Times as HH:MM.
5. If a field is missing, leave it as an empty string.

Expected JSON Structure:
{
  "arrival_flight_no": "",
  "arrival_dep_place": "",
  "arrival_arr_place": "",
  "arrival_dep_date": "",
  "arrival_arr_date": "",
  "arrival_dep_time": "",
  "arrival_arr_time": "",
  "departure_flight_no": "",
  "departure_dep_place": "",
  "departure_arr_place": "",
  "departure_dep_date": "",
  "departure_arr_date": "",
  "departure_dep_time": "",
  "departure_arr_time": ""
}

Ticket Text:
${text}
`;

        try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1
                })
            });

            const data = await response.json();
            const content = data.choices[0].message.content;
            
            // Extract JSON from markdown if present
            let jsonStr = content;
            if (content.includes('```json')) {
                jsonStr = content.split('```json')[1].split('```')[0];
            } else if (content.includes('```')) {
                jsonStr = content.split('```')[1].split('```')[0];
            }

            const flightData = JSON.parse(jsonStr.trim());
            
            // Auto-fill form
            if (!isReturn) {
                if (flightData.arrival_flight_no) document.getElementById('arr_flight_no').value = flightData.arrival_flight_no;
                if (flightData.arrival_dep_place) document.getElementById('arr_dep_place').value = flightData.arrival_dep_place;
                if (flightData.arrival_arr_place) document.getElementById('arr_arr_place').value = flightData.arrival_arr_place;
                if (flightData.arrival_dep_date) document.getElementById('arr_dep_date').value = flightData.arrival_dep_date;
                if (flightData.arrival_arr_date) document.getElementById('arr_arr_date').value = flightData.arrival_arr_date;
                if (flightData.arrival_dep_time) document.getElementById('arr_dep_time').value = flightData.arrival_dep_time;
                if (flightData.arrival_arr_time) document.getElementById('arr_arr_time').value = flightData.arrival_arr_time;
            }

            // If it's a return ticket, or a round-trip ticket uploaded at once
            if (isReturn || flightData.departure_flight_no) {
                if (flightData.departure_flight_no) document.getElementById('dep_flight_no').value = flightData.departure_flight_no;
                if (flightData.departure_dep_place) document.getElementById('dep_dep_place').value = flightData.departure_dep_place;
                if (flightData.departure_arr_place) document.getElementById('dep_arr_place').value = flightData.departure_arr_place;
                if (flightData.departure_dep_date) document.getElementById('dep_dep_date').value = flightData.departure_dep_date;
                if (flightData.departure_arr_date) document.getElementById('dep_arr_date').value = flightData.departure_arr_date;
                if (flightData.departure_dep_time) document.getElementById('dep_dep_time').value = flightData.departure_dep_time;
                if (flightData.departure_arr_time) document.getElementById('dep_arr_time').value = flightData.departure_arr_time;
            }

            alert("Ticket successfully parsed and fields auto-filled!");

        } catch (error) {
            console.error("AI Parsing Error:", error);
            alert("Could not extract flight details automatically. Please enter them manually.");
        }
    }

    // Form Submission
    const form = document.getElementById('guest-registration-form');
    const submitBtn = document.getElementById('submit-registration');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!tripId) {
            alert("Trip ID is missing. Cannot submit.");
            return;
        }

        submitBtn.textContent = 'SUBMITTING...';
        submitBtn.disabled = true;

        const urlParams = new URLSearchParams(window.location.search);
        const agentId = urlParams.get('agent_id');

        const payload = {
            trip_id: tripId,
            agent_id: agentId || null,
            name: document.getElementById('g_name').value,
            contact_no: document.getElementById('g_contact').value,
            emergency_contact_no: document.getElementById('g_emergency').value,
            blood_group: document.getElementById('g_blood').value,
            passport_name: document.getElementById('p_name').value,
            passport_no: document.getElementById('p_no').value,
            passport_expiry: document.getElementById('p_expiry').value,
            
            arrival_flight_no: document.getElementById('arr_flight_no').value || null,
            arrival_dep_place: document.getElementById('arr_dep_place').value || null,
            arrival_arr_place: document.getElementById('arr_arr_place').value || null,
            arrival_dep_date: document.getElementById('arr_dep_date').value || null,
            arrival_arr_date: document.getElementById('arr_arr_date').value || null,
            arrival_dep_time: document.getElementById('arr_dep_time').value || null,
            arrival_arr_time: document.getElementById('arr_arr_time').value || null,

            departure_flight_no: document.getElementById('dep_flight_no').value || null,
            departure_dep_place: document.getElementById('dep_dep_place').value || null,
            departure_arr_place: document.getElementById('dep_arr_place').value || null,
            departure_dep_date: document.getElementById('dep_dep_date').value || null,
            departure_arr_date: document.getElementById('dep_arr_date').value || null,
            departure_dep_time: document.getElementById('dep_dep_time').value || null,
            departure_arr_time: document.getElementById('dep_arr_time').value || null
        };

        try {
            const { error } = await supabase
                .from('guest_details')
                .insert([payload]);

            if (error) throw error;

            // Show success
            form.style.display = 'none';
            document.getElementById('success-msg').style.display = 'block';

        } catch (error) {
            console.error("Submission Error:", error);
            alert("Error submitting details. Please try again.");
            submitBtn.textContent = 'SUBMIT REGISTRATION';
            submitBtn.disabled = false;
        }
    });

    // Terms & Conditions Logic
    const termsCheckbox = document.getElementById('terms-checkbox');
    const viewTermsLink = document.getElementById('view-terms-link');
    const viewRefundLink = document.getElementById('view-refund-link');
    const termsModal = document.getElementById('terms-modal');
    const closeTermsModal = document.getElementById('close-terms-modal');
    const acceptTermsBtn = document.getElementById('accept-terms-btn');

    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', () => {
            if (termsCheckbox.checked) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            } else {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
        });
    }

    const openTermsModalFunc = (e) => {
        if (e) e.preventDefault();
        termsModal.style.display = 'flex';
        gsap.from('#terms-modal > div', { scale: 0.9, opacity: 0, duration: 0.3, ease: "back.out(1.7)" });
    };

    if (viewTermsLink) viewTermsLink.addEventListener('click', openTermsModalFunc);
    if (viewRefundLink) viewRefundLink.addEventListener('click', openTermsModalFunc);

    const closeTermsModalFunc = () => {
        termsModal.style.display = 'none';
    };

    if (closeTermsModal) closeTermsModal.addEventListener('click', closeTermsModalFunc);
    if (acceptTermsBtn) acceptTermsBtn.addEventListener('click', closeTermsModalFunc);
    
    if (termsModal) {
        termsModal.addEventListener('click', (e) => {
            if (e.target === termsModal) closeTermsModalFunc();
        });
    }
});
