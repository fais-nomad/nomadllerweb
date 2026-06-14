import { createClient } from '@supabase/supabase-js';
import gsap from 'gsap';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Check if agent is logged in
    const agentDataStr = localStorage.getItem('nomadller_agent');
    
    if (!agentDataStr) {
        window.location.href = '/agent-login';
        return;
    }

    const agentData = JSON.parse(agentDataStr);
    
    // Fetch full agent profile to get the ID
    let agentId = null;
    let fullAgentProfile = null;
    try {
        const { data } = await supabase.from('agents').select('*').eq('agent_code', agentData.code).single();
        if (data) {
            fullAgentProfile = data;
            agentId = data.id;
        }
    } catch (e) {
        console.error("Failed to fetch agent profile", e);
    }

    if (!agentId) {
        alert("Agent profile not found. Please log in again.");
        window.location.href = '/agent-login';
        return;
    }

    const welcomeName = document.getElementById('agent-welcome-name');
    if (welcomeName) {
        welcomeName.textContent = `Logged in as: ${agentData.agent_name}`;
    }

    const tbody = document.getElementById('bookings-table-body');
    const loadingSpinner = document.getElementById('loading-spinner');
    const bookingsTable = document.getElementById('bookings-table');
    const noBookingsMsg = document.getElementById('no-bookings-msg');

    let allGuests = [];
    let tripMap = {};

    try {
        // Fetch all guest details for this agent
        const { data: guests, error: guestsError } = await supabase
            .from('guest_details')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false });

        if (guestsError) throw guestsError;
        allGuests = guests || [];

        // Fetch all fixed departures and upcoming trips to map the names
        const { data: fds } = await supabase.from('fixed_departures').select('id, destination, start_date, end_date');
        const { data: uts } = await supabase.from('upcoming_trips').select('id, trip_name, start_date, end_date');

        if (fds) fds.forEach(t => tripMap[t.id] = { name: t.destination, start: t.start_date, end: t.end_date });
        if (uts) uts.forEach(t => tripMap[t.id] = { name: t.trip_name, start: t.start_date, end: t.end_date });

        loadingSpinner.style.display = 'none';

        if (allGuests.length === 0) {
            noBookingsMsg.style.display = 'block';
        } else {
            bookingsTable.style.display = 'table';
            renderBookings();
        }
    } catch (err) {
        console.error("Error loading bookings:", err);
        loadingSpinner.innerHTML = '<p style="color: var(--admin-danger);">Failed to load bookings.</p>';
    }

    function renderBookings() {
        tbody.innerHTML = '';
        allGuests.forEach((guest, index) => {
            const trip = tripMap[guest.trip_id] || { name: 'Unknown Trip', start: '', end: '' };
            let datesStr = 'N/A';
            if (trip.start && trip.end) {
                const s = new Date(trip.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                const e = new Date(trip.end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
                datesStr = `${s} - ${e}`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${guest.name}</strong></td>
                <td style="color: var(--accent);">${trip.name}</td>
                <td>${datesStr}</td>
                <td>${guest.contact_no}</td>
                <td><span class="status-badge">Registered</span></td>
                <td><button class="view-btn view-details" data-index="${index}">Details</button></td>
            `;
            tbody.appendChild(tr);
        });

        // Add animations
        gsap.from('#bookings-table-body tr', {
            y: 10,
            opacity: 0,
            duration: 0.3,
            stagger: 0.05,
            ease: "power2.out"
        });
    }

    // Modal Logic
    const detailsModal = document.getElementById('guest-details-modal');
    const closeDetailsModal = document.getElementById('close-details-modal');
    const detailsContent = document.getElementById('guest-details-content');

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-details')) {
            const index = e.target.getAttribute('data-index');
            const guest = allGuests[index];
            const trip = tripMap[guest.trip_id] || { name: 'Unknown Trip' };

            detailsContent.innerHTML = `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: white; margin-bottom: 0.5rem;"><i class="ph ph-user"></i> Guest Info</h3>
                    <p><strong>Name:</strong> ${guest.name}</p>
                    <p><strong>Contact:</strong> ${guest.contact_no}</p>
                    <p><strong>Emergency Contact:</strong> ${guest.emergency_contact_no || 'N/A'}</p>
                    <p><strong>Blood Group:</strong> ${guest.blood_group || 'N/A'}</p>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: white; margin-bottom: 0.5rem;"><i class="ph ph-identification-card"></i> Passport Info</h3>
                    <p><strong>Name on Passport:</strong> ${guest.passport_name || 'N/A'}</p>
                    <p><strong>Passport No:</strong> ${guest.passport_no || 'N/A'}</p>
                    <p><strong>Expiry:</strong> ${guest.passport_expiry || 'N/A'}</p>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: white; margin-bottom: 0.5rem;"><i class="ph ph-airplane-landing"></i> Flight Info (Arrival)</h3>
                    <p><strong>Flight No:</strong> ${guest.arrival_flight_no || 'N/A'}</p>
                    <p><strong>Date & Time:</strong> ${guest.arrival_arr_date || 'N/A'} ${guest.arrival_arr_time || ''}</p>
                </div>
            `;

            detailsModal.style.display = 'flex';
            gsap.fromTo(detailsModal.querySelector('.modal-content'), 
                { scale: 0.9, opacity: 0 }, 
                { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
            );
        }
    });

    if (closeDetailsModal) {
        closeDetailsModal.addEventListener('click', () => {
            gsap.to(detailsModal.querySelector('.modal-content'), { 
                scale: 0.9, opacity: 0, duration: 0.2, 
                onComplete: () => { detailsModal.style.display = 'none'; } 
            });
        });
    }

    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            gsap.to(detailsModal.querySelector('.modal-content'), { 
                scale: 0.9, opacity: 0, duration: 0.2, 
                onComplete: () => { detailsModal.style.display = 'none'; } 
            });
        }
    });
});
