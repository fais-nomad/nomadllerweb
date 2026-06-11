import gsap from 'gsap';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

window.liveRates = { INR: 0.625, USD: 0.0075 }; // Fallbacks
async function fetchExchangeRates() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/NPR');
        const data = await response.json();
        if (data && data.rates) {
            window.liveRates.INR = data.rates.INR;
            window.liveRates.USD = data.rates.USD;
        }
    } catch(err) {
        console.error('Exchange rates failed:', err);
    }
}
fetchExchangeRates();

document.addEventListener('DOMContentLoaded', async () => {
    // Reveal animations for dashboard
    if (window.innerWidth > 1024) {
        gsap.fromTo('.sidebar', 
            { x: -100, opacity: 0 }, 
            { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        );
    }
    
    gsap.fromTo('.topbar', 
        { y: -30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" }
    );

    gsap.fromTo('.trip-form', 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, delay: 0.4, ease: "power3.out" }
    );

    gsap.fromTo('.recent-orders', 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, delay: 0.6, ease: "power3.out" }
    );

    // Logout logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            gsap.to('body', {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    window.location.href = '/admin.html';
                }
            });
        });
    }

    // Mobile Sidebar Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        const closeBtn = document.getElementById('sidebar-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && 
                sidebar.classList.contains('active') && 
                !sidebar.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });

        // Close sidebar when clicking a nav item on mobile
        const navItems = sidebar.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }

    // Load initial trips from Supabase
    const tripsTableBody = document.getElementById('trips-table-body');
    if (tripsTableBody) {
        const { data: trips, error } = await supabase
            .from('upcoming_trips')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error fetching trips:', error);
        } else if (trips && trips.length > 0) {
            tripsTableBody.innerHTML = ''; // Clear default
            trips.forEach(trip => {
                const tr = document.createElement('tr');
                tr.className = 'trip-row';
                tr.setAttribute('data-id', trip.id);
                tr.setAttribute('data-name', trip.trip_name);
                tr.style.cursor = 'pointer';
                tr.innerHTML = `
                    <td><strong>${trip.trip_name}</strong></td>
                    <td>${trip.start_date} to ${trip.end_date}</td>
                    <td>${trip.guide_name}</td>
                    <td>${trip.guide_contact}</td>
                    <td><span class="badge confirmed">ACTIVE LINK</span></td>
                    <td>
                        <div class="actions-cell">
                            <button class="action-btn edit-trip-btn" title="Edit Trip"><i class="ph ph-pencil-simple"></i></button>
                            <button class="action-btn delete-trip-btn" title="Delete Trip"><i class="ph ph-trash"></i></button>
                        </div>
                    </td>
                `;
                tripsTableBody.appendChild(tr);
            });
        }
    }

    // Add Trip Form Logic
    const addTripForm = document.getElementById('add-trip-form');
    const generateBtn = document.getElementById('generate-btn');
    const linkContainer = document.getElementById('link-container');
    const generatedLinkInput = document.getElementById('generatedLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');

    if (addTripForm) {
        addTripForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            generateBtn.textContent = 'GENERATING...';
            generateBtn.disabled = true;

            // Get form values
            const tripName = document.getElementById('tripName').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const guideName = document.getElementById('guideName').value;
            const guideContact = document.getElementById('guideContact').value;

            try {
                // Insert into Supabase
                const { data, error } = await supabase
                    .from('upcoming_trips')
                    .insert([
                        { 
                            trip_name: tripName, 
                            start_date: startDate, 
                            end_date: endDate, 
                            guide_name: guideName, 
                            guide_contact: guideContact 
                        }
                    ])
                    .select();

                if (error) throw error;

                const newTrip = data[0];

                // Generate Link
                const guestLink = `${window.location.origin}/guest-form.html?trip_id=${newTrip.id}`;
                generatedLinkInput.value = guestLink;
                linkContainer.style.display = 'block';

                gsap.fromTo(linkContainer, 
                    { opacity: 0, y: 10 }, 
                    { opacity: 1, y: 0, duration: 0.5 }
                );

                // Add to table
                const newRow = document.createElement('tr');
                newRow.className = 'trip-row';
                newRow.setAttribute('data-id', newTrip.id);
                newRow.setAttribute('data-name', tripName);
                newRow.style.cursor = 'pointer';
                newRow.innerHTML = `
                    <td><strong>${tripName}</strong></td>
                    <td>${startDate} to ${endDate}</td>
                    <td>${guideName}</td>
                    <td>${guideContact}</td>
                    <td><span class="badge pending">JUST ADDED</span></td>
                    <td>
                        <div class="actions-cell">
                            <button class="action-btn edit-trip-btn" title="Edit Trip"><i class="ph ph-pencil-simple"></i></button>
                            <button class="action-btn delete-trip-btn" title="Delete Trip"><i class="ph ph-trash"></i></button>
                        </div>
                    </td>
                `;

                tripsTableBody.prepend(newRow);
                
                gsap.fromTo(newRow, 
                    { opacity: 0, backgroundColor: 'rgba(255, 107, 53, 0.3)' },
                    { opacity: 1, backgroundColor: 'transparent', duration: 1 }
                );

            } catch (error) {
                console.error("Error adding trip:", error);
                alert("Error adding trip. Please make sure the Supabase table exists.");
            } finally {
                generateBtn.textContent = 'CREATE TRIP & GENERATE GUEST LINK';
                generateBtn.disabled = false;
            }
        });

        // Copy link functionality
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                generatedLinkInput.select();
                document.execCommand('copy');
                copyLinkBtn.innerHTML = '<i class="ph ph-check"></i> Copied';
                setTimeout(() => {
                    copyLinkBtn.innerHTML = '<i class="ph ph-copy"></i> Copy';
                }, 2000);
            });
        }
    }

    // Modal Logic
    const guestModal = document.getElementById('guest-modal');
    const closeModal = document.getElementById('close-modal');
    const modalGuestsContainer = document.getElementById('modal-guests-container');
    const modalTripName = document.getElementById('modal-trip-name');
    const modalCopyLink = document.getElementById('modal-copy-link');
    const btnDownloadFlight = document.getElementById('download-flight-data');
    const btnDownloadPassport = document.getElementById('download-passport-data');

    // Edit Guest Modal Elements
    const editGuestModal = document.getElementById('edit-guest-modal');
    const closeEditModal = document.getElementById('close-edit-modal');
    const editGuestForm = document.getElementById('edit-guest-form');

    // Edit Trip Modal Elements
    const editTripModal = document.getElementById('edit-trip-modal');
    const closeEditTripModal = document.getElementById('close-edit-trip-modal');
    const editTripForm = document.getElementById('edit-trip-form');

    // Travel Planner Elements
    const plannerModal = document.getElementById('planner-modal');
    const closePlannerModal = document.getElementById('close-planner-modal');
    const planPickupsBtn = document.getElementById('plan-pickups-btn');
    const planDropsBtn = document.getElementById('plan-drops-btn');
    const plannerContent = document.getElementById('planner-content');
    const downloadPlannerBtn = document.getElementById('download-planner-sheet');
    const plannerModalTitle = document.getElementById('planner-modal-title');
    const plannerModalNote = document.getElementById('planner-modal-note');

    let currentTripGuests = [];
    let currentTripNameStr = '';
    let lastCalculatedPlan = []; // To store groups for PDF export
    let currentPlanType = 'pickup'; // 'pickup' or 'drop'

    if (btnDownloadFlight) {
        btnDownloadFlight.addEventListener('click', () => {
            if (!currentTripGuests || currentTripGuests.length === 0) {
                alert("No guest data available to download.");
                return;
            }
            if (!window.jspdf) {
                alert("PDF library is still loading, please try again in a moment.");
                return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');
            
            doc.setFontSize(16);
            doc.text(`Flight Data - ${currentTripNameStr}`, 14, 20);
            
            const tableData = currentTripGuests.map(g => [
                g.name || '',
                g.arrival_flight_no || '',
                `${g.arrival_dep_place ? g.arrival_dep_place + '\n' : ''}${g.arrival_dep_date || ''}\n${g.arrival_dep_time || ''}`,
                `${g.arrival_arr_place ? g.arrival_arr_place + '\n' : ''}${g.arrival_arr_date || ''}\n${g.arrival_arr_time || ''}`,
                g.departure_flight_no || '',
                `${g.departure_dep_place ? g.departure_dep_place + '\n' : ''}${g.departure_dep_date || ''}\n${g.departure_dep_time || ''}`,
                `${g.departure_arr_place ? g.departure_arr_place + '\n' : ''}${g.departure_arr_date || ''}\n${g.departure_arr_time || ''}`
            ]);

            doc.autoTable({
                startY: 30,
                head: [['Guest Name', 'Arr Flight', 'Arr Dep', 'Arr Arr', 'Dep Flight', 'Dep Dep', 'Dep Arr']],
                body: tableData,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [46, 196, 182] },
                columnStyles: {
                    2: { fontStyle: 'bold' },
                    3: { fontStyle: 'bold' },
                    5: { fontStyle: 'bold' },
                    6: { fontStyle: 'bold' }
                }
            });
            
            doc.save(`${currentTripNameStr.replace(/\s+/g, '_')}_Flight_Data.pdf`);
        });
    }

    if (btnDownloadPassport) {
        btnDownloadPassport.addEventListener('click', () => {
            if (!currentTripGuests || currentTripGuests.length === 0) {
                alert("No guest data available to download.");
                return;
            }
            if (!window.jspdf) {
                alert("PDF library is still loading, please try again in a moment.");
                return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(16);
            doc.text(`Passport Data - ${currentTripNameStr}`, 14, 20);
            
            const tableData = currentTripGuests.map(g => [
                g.name || '',
                g.passport_name || '',
                g.passport_no || '',
                g.passport_expiry || ''
            ]);

            doc.autoTable({
                startY: 30,
                head: [['Guest Name', 'Passport Name', 'Passport No', 'Expiry Date']],
                body: tableData,
                styles: { fontSize: 10 },
                headStyles: { fillColor: [255, 107, 53] }
            });
            
            doc.save(`${currentTripNameStr.replace(/\s+/g, '_')}_Passport_Data.pdf`);
        });
    }

    if (closeEditModal) {
        closeEditModal.addEventListener('click', () => {
            editGuestModal.style.display = 'none';
        });
    }

    if (closeEditTripModal) {
        closeEditTripModal.addEventListener('click', () => {
            editTripModal.style.display = 'none';
        });
    }

    if (closePlannerModal) {
        closePlannerModal.addEventListener('click', () => {
            plannerModal.style.display = 'none';
        });
    }

    if (planPickupsBtn) {
        planPickupsBtn.addEventListener('click', () => {
            generateTravelPlan('pickup');
        });
    }

    if (planDropsBtn) {
        planDropsBtn.addEventListener('click', () => {
            generateTravelPlan('drop');
        });
    }

    if (downloadPlannerBtn) {
        downloadPlannerBtn.addEventListener('click', () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const title = currentPlanType === 'pickup' ? "AIRPORT PICKUP SCHEDULE" : "AIRPORT DROP SCHEDULE";
            
            doc.setFontSize(22);
            doc.setTextColor(255, 107, 53); // Accent color
            doc.text(title, 14, 22);
            
            doc.setFontSize(12);
            doc.setTextColor(80);
            doc.text(`TRIP: ${currentTripNameStr.toUpperCase()}`, 14, 32);
            doc.text(`REPORT GENERATED: ${new Date().toLocaleString()}`, 14, 38);
            
            let currentY = 50;

            lastCalculatedPlan.forEach(day => {
                doc.setFontSize(14);
                doc.setTextColor(0);
                doc.setFont(undefined, 'bold');
                doc.text(day.date, 14, currentY);
                currentY += 5;

                day.groups.forEach((group, i) => {
                    const latestTime = group[group.length - 1].time;
                    const earliestTime = group[0].time;
                    const groupLabel = currentPlanType === 'pickup' ? `Wait for: ${latestTime}` : `Earliest: ${earliestTime}`;

                    const tableData = group.map(g => [
                        g.name,
                        g.time,
                        g.flight || 'N/A',
                        g.contact
                    ]);

                    doc.autoTable({
                        startY: currentY,
                        head: [[`Group #${i + 1} (${groupLabel})`, 'Time', 'Flight', 'Contact']],
                        body: tableData,
                        theme: 'striped',
                        headStyles: { fillColor: [255, 107, 53] },
                        margin: { left: 14, right: 14 },
                        styles: { fontSize: 9 }
                    });

                    currentY = doc.lastAutoTable.finalY + 15;
                    if (currentY > 260) { doc.addPage(); currentY = 20; }
                });
                
                currentY += 10;
            });

            doc.save(`${currentTripNameStr.replace(/\s+/g, '_')}_${currentPlanType}_Schedule.pdf`);
        });
    }

    if (editGuestForm) {
        editGuestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const guestId = document.getElementById('edit-guest-id').value;
            const saveBtn = document.getElementById('save-guest-edits-btn');
            
            saveBtn.textContent = 'SAVING...';
            saveBtn.disabled = true;

            const updatedData = {
                name: document.getElementById('edit-g-name').value,
                contact_no: document.getElementById('edit-g-contact').value,
                emergency_contact_no: document.getElementById('edit-g-emergency').value || null,
                blood_group: document.getElementById('edit-g-blood').value || null,
                
                passport_name: document.getElementById('edit-p-name').value || null,
                passport_no: document.getElementById('edit-p-no').value || null,
                passport_expiry: document.getElementById('edit-p-expiry').value || null,
                
                arrival_flight_no: document.getElementById('edit-arr-flight-no').value || null,
                arrival_dep_place: document.getElementById('edit-arr-dep-place').value || null,
                arrival_arr_place: document.getElementById('edit-arr-arr-place').value || null,
                arrival_dep_date: document.getElementById('edit-arr-dep-date').value || null,
                arrival_arr_date: document.getElementById('edit-arr-arr-date').value || null,
                arrival_dep_time: document.getElementById('edit-arr-dep-time').value || null,
                arrival_arr_time: document.getElementById('edit-arr-arr-time').value || null,
                
                departure_flight_no: document.getElementById('edit-dep-flight-no').value || null,
                departure_dep_place: document.getElementById('edit-dep-dep-place').value || null,
                departure_arr_place: document.getElementById('edit-dep-arr-place').value || null,
                departure_dep_date: document.getElementById('edit-dep-dep-date').value || null,
                departure_arr_date: document.getElementById('edit-dep-arr-date').value || null,
                departure_dep_time: document.getElementById('edit-dep-dep-time').value || null,
                departure_arr_time: document.getElementById('edit-dep-arr-time').value || null
            };

            try {
                const { error } = await supabase
                    .from('guest_details')
                    .update(updatedData)
                    .eq('id', guestId);

                if (error) throw error;

                alert('Guest details updated successfully!');
                editGuestModal.style.display = 'none';
                
                // Find and click the active trip row to refresh the guest modal
                const activeTripId = modalCopyLink.getAttribute('data-id');
                const row = document.querySelector(`.trip-row[data-id="${activeTripId}"]`);
                if (row) row.click();

            } catch (err) {
                console.error('Update error:', err);
                alert('Error updating guest details');
            } finally {
                saveBtn.textContent = 'SAVE CHANGES';
                saveBtn.disabled = false;
            }
        });
    }

    if (editTripForm) {
        editTripForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tripId = document.getElementById('edit-trip-id').value;
            const saveBtn = document.getElementById('save-trip-edits-btn');
            
            saveBtn.textContent = 'UPDATING...';
            saveBtn.disabled = true;

            const updatedData = {
                trip_name: document.getElementById('edit-trip-name').value,
                start_date: document.getElementById('edit-trip-start').value,
                end_date: document.getElementById('edit-trip-end').value,
                guide_name: document.getElementById('edit-trip-guide').value,
                guide_contact: document.getElementById('edit-trip-contact').value
            };

            try {
                const { error } = await supabase
                    .from('upcoming_trips')
                    .update(updatedData)
                    .eq('id', tripId);

                if (error) throw error;

                alert('Trip details updated successfully!');
                editTripModal.style.display = 'none';
                
                // Refresh the page or update the row
                window.location.reload(); 

            } catch (err) {
                console.error('Update error:', err);
                alert('Error updating trip details');
            } finally {
                saveBtn.textContent = 'UPDATE TRIP DETAILS';
                saveBtn.disabled = false;
            }
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            guestModal.style.display = 'none';
        });
    }

    if (modalCopyLink) {
        modalCopyLink.addEventListener('click', () => {
            const tripId = modalCopyLink.getAttribute('data-id');
            if (tripId) {
                const guestLink = `${window.location.origin}/guest-form.html?trip_id=${tripId}`;
                const tempInput = document.createElement('input');
                tempInput.value = guestLink;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);

                modalCopyLink.innerHTML = '<i class="ph ph-check"></i> Copied';
                setTimeout(() => {
                    modalCopyLink.innerHTML = '<i class="ph ph-copy"></i> Copy Guest Link';
                }, 2000);
            }
        });
    }

    if (tripsTableBody) {
        tripsTableBody.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.edit-trip-btn');
            const deleteBtn = e.target.closest('.delete-trip-btn');
            const row = e.target.closest('.trip-row');

            if (deleteBtn && row) {
                e.stopPropagation();
                const tripId = row.getAttribute('data-id');
                const tripName = row.getAttribute('data-name');
                
                if (confirm(`Are you sure you want to delete the trip "${tripName}"? This will also delete ALL registered guests for this trip.`)) {
                    try {
                        const { error } = await supabase
                            .from('upcoming_trips')
                            .delete()
                            .eq('id', tripId);
                        
                        if (error) throw error;
                        
                        row.remove();
                        alert('Trip deleted successfully');
                    } catch (err) {
                        console.error('Delete error:', err);
                        alert('Error deleting trip');
                    }
                }
                return;
            }

            if (editBtn && row) {
                e.stopPropagation();
                const tripId = row.getAttribute('data-id');
                
                try {
                    const { data: trip, error } = await supabase
                        .from('upcoming_trips')
                        .select('*')
                        .eq('id', tripId)
                        .single();
                    
                    if (error) throw error;

                    if (trip) {
                        document.getElementById('edit-trip-id').value = trip.id;
                        document.getElementById('edit-trip-name').value = trip.trip_name;
                        document.getElementById('edit-trip-start').value = trip.start_date;
                        document.getElementById('edit-trip-end').value = trip.end_date;
                        document.getElementById('edit-trip-guide').value = trip.guide_name;
                        document.getElementById('edit-trip-contact').value = trip.guide_contact;
                        
                        editTripModal.style.display = 'flex';
                    }
                } catch (err) {
                    console.error('Fetch error:', err);
                    alert('Error fetching trip details');
                }
                return;
            }

            if (row) {
                const tripId = row.getAttribute('data-id');
                const tripName = row.getAttribute('data-name');
                
                modalTripName.textContent = tripName;
                if (modalCopyLink) modalCopyLink.setAttribute('data-id', tripId);
                
                modalGuestsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Loading guests...</p>';
                guestModal.style.display = 'flex';

                try {
                    const { data: guests, error } = await supabase
                        .from('guest_details')
                        .select('*')
                        .eq('trip_id', tripId);
                    
                    if (error) throw error;

                    currentTripGuests = guests || [];
                    currentTripNameStr = tripName || 'Trip';

                    if (!guests || guests.length === 0) {
                        modalGuestsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No guests registered for this trip yet.</p>';
                        return;
                    }

                    let html = '';
                    guests.forEach((g, index) => {
                        html += `
                        <div class="guest-card" style="background: rgba(0,0,0,0.3); border: 1px solid var(--admin-border); border-radius: 10px; margin-bottom: 1rem; overflow: hidden;">
                            <!-- Header (Always visible) -->
                            <div class="guest-card-header" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: rgba(255,255,255,0.02);">
                                <div>
                                    <h3 style="color: white; margin: 0; font-size: 1.1rem;">Guest ${index + 1}: ${g.name}</h3>
                                    <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;"><i class="ph ph-phone" style="vertical-align: middle; margin-right: 0.3rem;"></i>${g.contact_no}</p>
                                </div>
                                <i class="ph ph-caret-down" style="color: white; font-size: 1.2rem; transition: transform 0.3s;"></i>
                            </div>
                            
                            <!-- Body (Hidden by default) -->
                            <div class="guest-card-body" style="padding: 1.5rem; border-top: 1px solid var(--admin-border); display: none;">
                                <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                                    <div>
                                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Emergency</p>
                                        <p style="margin: 0.2rem 0; color: white;">${g.emergency_contact_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Blood Group</p>
                                        <p style="margin: 0.2rem 0; color: white;">${g.blood_group || 'N/A'}</p>
                                    </div>
                                    <div></div>
                                    
                                    <div style="grid-column: 1 / -1; margin-top: 0.5rem;">
                                        <strong style="color: var(--accent);">Passport Details</strong>
                                    </div>
                                    <div>
                                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Name</p>
                                        <p style="margin: 0.2rem 0; color: white;">${g.passport_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Number</p>
                                        <p style="margin: 0.2rem 0; color: white;">${g.passport_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Expiry</p>
                                        <p style="margin: 0.2rem 0; color: white;">${g.passport_expiry || 'N/A'}</p>
                                    </div>

                                    <div style="grid-column: 1 / -1; margin-top: 0.5rem;">
                                        <strong style="color: var(--admin-primary);">Flight Details</strong>
                                    </div>
                                    <div style="grid-column: 1 / -1;">
                                        <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
                                            <thead>
                                                <tr style="border-bottom: 1px solid var(--admin-border);">
                                                    <th style="text-align: left; padding: 0.5rem; color: var(--text-secondary); font-size: 0.8rem;">Type</th>
                                                    <th style="text-align: left; padding: 0.5rem; color: var(--text-secondary); font-size: 0.8rem;">Flight No</th>
                                                    <th style="text-align: left; padding: 0.5rem; color: var(--text-secondary); font-size: 0.8rem;">Departure</th>
                                                    <th style="text-align: left; padding: 0.5rem; color: var(--text-secondary); font-size: 0.8rem;">Arrival</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr style="border-bottom: 1px solid var(--admin-border);">
                                                    <td style="padding: 0.5rem; color: white;">Arrival</td>
                                                    <td style="padding: 0.5rem; color: white;">${g.arrival_flight_no || '-'}</td>
                                                    <td style="padding: 0.5rem; color: white;">${g.arrival_dep_place ? `<strong style="color:var(--admin-primary);">${g.arrival_dep_place}</strong><br>` : ''}${g.arrival_dep_date || ''} <span style="color: var(--text-secondary); font-size: 0.9em;">${g.arrival_dep_time || ''}</span></td>
                                                    <td style="padding: 0.5rem; color: white;">${g.arrival_arr_place ? `<strong style="color:var(--admin-primary);">${g.arrival_arr_place}</strong><br>` : ''}${g.arrival_arr_date || ''} <span style="color: var(--text-secondary); font-size: 0.9em;">${g.arrival_arr_time || ''}</span></td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 0.5rem; color: white;">Departure</td>
                                                    <td style="padding: 0.5rem; color: white;">${g.departure_flight_no || '-'}</td>
                                                    <td style="padding: 0.5rem; color: white;">${g.departure_dep_place ? `<strong style="color:var(--admin-primary);">${g.departure_dep_place}</strong><br>` : ''}${g.departure_dep_date || ''} <span style="color: var(--text-secondary); font-size: 0.9em;">${g.departure_dep_time || ''}</span></td>
                                                    <td style="padding: 0.5rem; color: white;">${g.departure_arr_place ? `<strong style="color:var(--admin-primary);">${g.departure_arr_place}</strong><br>` : ''}${g.departure_arr_date || ''} <span style="color: var(--text-secondary); font-size: 0.9em;">${g.departure_arr_time || ''}</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style="grid-column: 1 / -1; display: flex; gap: 1rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--admin-border);">
                                        <button class="edit-guest-btn" data-id="${g.id}" style="flex: 1; padding: 0.8rem; background: var(--admin-primary); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;"><i class="ph ph-pencil-simple"></i> Edit Details</button>
                                        <button class="delete-guest-btn" data-id="${g.id}" style="padding: 0.8rem; background: #ff4d4d; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;"><i class="ph ph-trash"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        `;
                    });

                    modalGuestsContainer.innerHTML = html;

                    // Add click listeners for accordion
                    const headers = modalGuestsContainer.querySelectorAll('.guest-card-header');
                    headers.forEach(header => {
                        header.addEventListener('click', () => {
                            const body = header.nextElementSibling;
                            const icon = header.querySelector('i.ph-caret-down');
                            if (body.style.display === 'none') {
                                body.style.display = 'block';
                                if(icon) icon.style.transform = 'rotate(180deg)';
                            } else {
                                body.style.display = 'none';
                                if(icon) icon.style.transform = 'rotate(0deg)';
                            }
                        });
                    });

                    // Add click listeners for Edit and Delete buttons
                    modalGuestsContainer.querySelectorAll('.delete-guest-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            const guestId = btn.getAttribute('data-id');
                            if (confirm('Are you sure you want to delete this guest registration?')) {
                                try {
                                    const { error } = await supabase
                                        .from('guest_details')
                                        .delete()
                                        .eq('id', guestId);
                                    
                                    if (error) throw error;
                                    
                                    alert('Guest deleted successfully');
                                    // Refresh guest list - trigger the row click again
                                    row.click();
                                } catch (err) {
                                    console.error('Delete error:', err);
                                    alert('Error deleting guest');
                                }
                            }
                        });
                    });

                    modalGuestsContainer.querySelectorAll('.edit-guest-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const guestId = btn.getAttribute('data-id');
                            const guest = currentTripGuests.find(g => g.id === guestId);
                            
                            if (guest) {
                                // Fill the edit form
                                document.getElementById('edit-guest-id').value = guest.id;
                                document.getElementById('edit-g-name').value = guest.name || '';
                                document.getElementById('edit-g-contact').value = guest.contact_no || '';
                                document.getElementById('edit-g-emergency').value = guest.emergency_contact_no || '';
                                document.getElementById('edit-g-blood').value = guest.blood_group || '';
                                
                                document.getElementById('edit-p-name').value = guest.passport_name || '';
                                document.getElementById('edit-p-no').value = guest.passport_no || '';
                                document.getElementById('edit-p-expiry').value = guest.passport_expiry || '';
                                
                                document.getElementById('edit-arr-flight-no').value = guest.arrival_flight_no || '';
                                document.getElementById('edit-arr-dep-place').value = guest.arrival_dep_place || '';
                                document.getElementById('edit-arr-arr-place').value = guest.arrival_arr_place || '';
                                document.getElementById('edit-arr-dep-date').value = guest.arrival_dep_date || '';
                                document.getElementById('edit-arr-arr-date').value = guest.arrival_arr_date || '';
                                document.getElementById('edit-arr-dep-time').value = guest.arrival_dep_time || '';
                                document.getElementById('edit-arr-arr-time').value = guest.arrival_arr_time || '';
                                
                                document.getElementById('edit-dep-flight-no').value = guest.departure_flight_no || '';
                                document.getElementById('edit-dep-dep-place').value = guest.departure_dep_place || '';
                                document.getElementById('edit-dep-arr-place').value = guest.departure_arr_place || '';
                                document.getElementById('edit-dep-dep-date').value = guest.departure_dep_date || '';
                                document.getElementById('edit-dep-arr-date').value = guest.departure_arr_date || '';
                                document.getElementById('edit-dep-dep-time').value = guest.departure_dep_time || '';
                                document.getElementById('edit-dep-arr-time').value = guest.departure_arr_time || '';
                                
                                editGuestModal.style.display = 'flex';
                            }
                        });
                    });

                } catch (error) {
                    console.error('Error fetching guests:', error);
                    modalGuestsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Error loading guests.</p>';
                }
            }
        });
    }

    function generateTravelPlan(type) {
        if (!currentTripGuests || currentTripGuests.length === 0) {
            alert('No guests registered for this trip.');
            return;
        }

        currentPlanType = type;
        plannerModalTitle.textContent = type === 'pickup' ? 'AI Airport Pickup Planner' : 'AI Airport Drop Planner';
        plannerModalNote.textContent = type === 'pickup' ? 
            'Guests landing within 30 minutes of each other are grouped together.' : 
            'Guests departing within 30 minutes of each other are grouped together.';

        // 1. Filter and normalize data
        const travelers = currentTripGuests.filter(g => {
            if (type === 'pickup') return g.arrival_arr_date && g.arrival_arr_time;
            return g.departure_dep_date && g.departure_dep_time;
        }).map(g => ({
            id: g.id,
            name: g.name,
            date: type === 'pickup' ? g.arrival_arr_date : g.departure_dep_date,
            time: type === 'pickup' ? g.arrival_arr_time : g.departure_dep_time,
            flight: type === 'pickup' ? g.arrival_flight_no : g.departure_flight_no,
            contact: g.contact_no
        }));
        
        if (travelers.length === 0) {
            plannerContent.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">No guests have ${type} flight details yet.</p>`;
            plannerModal.style.display = 'flex';
            return;
        }

        // 2. Sort by date and then time
        travelers.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
        });

        // 3. Group by date first
        const groupedByDate = {};
        travelers.forEach(g => {
            if (!groupedByDate[g.date]) groupedByDate[g.date] = [];
            groupedByDate[g.date].push(g);
        });

        let html = '';
        lastCalculatedPlan = [];

        for (const date in groupedByDate) {
            const options = { day: '2-digit', month: 'short', year: 'numeric' };
            const dateStr = new Date(date).toLocaleDateString('en-GB', options);
            html += `<h3 style="color: var(--accent); margin: 1.5rem 0 1rem 0; font-size: 1rem; border-bottom: 1px solid var(--admin-border); padding-bottom: 0.5rem;">${dateStr}</h3>`;
            
            const dayTravelers = groupedByDate[date];
            const dayGroups = [];
            let currentGroup = [];

            dayTravelers.forEach((g, index) => {
                if (currentGroup.length === 0) {
                    currentGroup.push(g);
                } else {
                    const firstInGroup = currentGroup[0];
                    const time1 = new Date(`1970-01-01T${firstInGroup.time}`);
                    const time2 = new Date(`1970-01-01T${g.time}`);
                    const diffInMins = (time2 - time1) / (1000 * 60);

                    if (diffInMins <= 30) {
                        currentGroup.push(g);
                    } else {
                        dayGroups.push(currentGroup);
                        currentGroup = [g];
                    }
                }

                if (index === dayTravelers.length - 1) {
                    dayGroups.push(currentGroup);
                }
            });

            lastCalculatedPlan.push({ date: dateStr, groups: dayGroups });

            dayGroups.forEach((group, i) => {
                const latestTime = group[group.length - 1].time;
                const earliestTime = group[0].time;
                const groupLabel = type === 'pickup' ? `Wait for: ${latestTime}` : `Earliest: ${earliestTime}`;
                
                html += `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--admin-border); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                        <strong style="color: white; font-size: 0.9rem;">${type === 'pickup' ? 'Pickup' : 'Drop'} Group #${i + 1}</strong>
                        <span style="background: ${type === 'pickup' ? 'var(--admin-primary)' : 'var(--accent)'}; color: white; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">${groupLabel}</span>
                    </div>
                    <ul style="margin: 0; padding-left: 1.2rem; color: var(--text-secondary); font-size: 0.85rem;">
                        ${group.map(g => `<li style="margin-bottom: 0.4rem;"><strong style="color: white;">${g.name}</strong> (${type === 'pickup' ? 'Landing' : 'Departure'}: ${g.time}) - Flight: ${g.flight || 'N/A'}</li>`).join('')}
                    </ul>
                </div>
                `;
            });
        }

        plannerContent.innerHTML = html;
        plannerModal.style.display = 'flex';
    }

    // --- PACKAGES / EXPEDITIONS LOGIC ---
    const packagesTableBody = document.getElementById('packages-table-body');
    const addPackageForm = document.getElementById('add-package-form');
    const createPkgBtn = document.getElementById('create-pkg-btn');

    async function loadPackages() {
        if (!packagesTableBody) return;
        try {
            const { data: trips, error } = await supabase
                .from('trips')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            window.currentLoadedTrips = trips;
            
            packagesTableBody.innerHTML = '';
            if (trips && trips.length > 0) {
                trips.forEach(trip => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${trip.title}</strong></td>
                        <td>${trip.duration}</td>
                        <td>${trip.difficulty}</td>
                        <td style="color: var(--admin-success); font-weight: bold;">₹${trip.cost}</td>
                        <td>
                            <div class="actions-cell">
                                <button class="action-btn edit-pkg-btn" data-id="${trip.id}" title="Edit Package"><i class="ph ph-pencil-simple"></i></button>
                                <button class="action-btn delete-pkg-btn" data-id="${trip.id}" title="Delete Package"><i class="ph ph-trash"></i></button>
                            </div>
                        </td>
                    `;
                    packagesTableBody.appendChild(tr);
                });

                // Add delete listeners
                document.querySelectorAll('.delete-pkg-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const tripId = e.target.closest('.delete-pkg-btn').getAttribute('data-id');
                        if (confirm('Are you sure you want to delete this trip from the website?')) {
                            try {
                                const { error } = await supabase.from('trips').delete().eq('id', tripId);
                                if (error) throw error;
                                loadPackages();
                            } catch (err) {
                                console.error('Error deleting trip:', err);
                                alert('Error deleting trip');
                            }
                        }
                    });
                });

                // Add edit listeners
                document.querySelectorAll('.edit-pkg-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const tripId = e.target.closest('.edit-pkg-btn').getAttribute('data-id');
                        const trip = window.currentLoadedTrips.find(t => t.id == tripId);
                        if (trip) {
                            window.currentEditPkgId = trip.id;
                            
                            document.getElementById('pkgTitle').value = trip.title || '';
                            document.getElementById('pkgSubtitle').value = trip.subtitle || '';
                            document.getElementById('pkgDuration').value = trip.duration || '';
                            document.getElementById('pkgDifficulty').value = trip.difficulty || '';
                            document.getElementById('pkgCost').value = trip.cost || '';
                            document.getElementById('pkgCoverImage').value = trip.cover_image_url || '';
                            
                            document.getElementById('pkgHighlights').value = trip.highlights ? (Array.isArray(trip.highlights) ? trip.highlights.join(', ') : trip.highlights) : '';
                            
                            let initItin = [];
                            if (trip.itinerary) {
                                if (typeof trip.itinerary === 'string') {
                                    try { initItin = JSON.parse(trip.itinerary); } catch(e){}
                                } else if (Array.isArray(trip.itinerary)) {
                                    initItin = trip.itinerary;
                                }
                            }
                            window.currentItineraryDays = [...initItin];
                            if (window.syncItineraryBuilder) window.syncItineraryBuilder();
                            document.getElementById('pkgInclusions').value = trip.inclusions ? (Array.isArray(trip.inclusions) ? trip.inclusions.join(', ') : trip.inclusions) : '';
                            document.getElementById('pkgExclusions').value = trip.exclusions ? (Array.isArray(trip.exclusions) ? trip.exclusions.join(', ') : trip.exclusions) : '';
                            document.getElementById('pkgCancellationPolicy').value = trip.cancellation_policy ? (Array.isArray(trip.cancellation_policy) ? trip.cancellation_policy.join(', ') : trip.cancellation_policy) : '';
                            document.getElementById('pkgTerms').value = trip.terms_and_conditions ? (Array.isArray(trip.terms_and_conditions) ? trip.terms_and_conditions.join(', ') : trip.terms_and_conditions) : '';
                            document.getElementById('pkgHealth').value = trip.health_and_fitness ? (Array.isArray(trip.health_and_fitness) ? trip.health_and_fitness.join(', ') : trip.health_and_fitness) : '';
                            document.getElementById('pkgInsurance').value = trip.travel_insurance ? (Array.isArray(trip.travel_insurance) ? trip.travel_insurance.join(', ') : trip.travel_insurance) : '';
                            document.getElementById('pkgNotes').value = trip.important_notes ? (Array.isArray(trip.important_notes) ? trip.important_notes.join(', ') : trip.important_notes) : '';
                            document.getElementById('pkgRisk').value = trip.risk_liabilities ? (Array.isArray(trip.risk_liabilities) ? trip.risk_liabilities.join(', ') : trip.risk_liabilities) : '';
                            document.getElementById('pkgRemember').value = trip.things_to_remember ? (Array.isArray(trip.things_to_remember) ? trip.things_to_remember.join(', ') : trip.things_to_remember) : '';
                            
                            let initCarry = [];
                            if (trip.things_to_carry) {
                                if (typeof trip.things_to_carry === 'string') {
                                    try { initCarry = JSON.parse(trip.things_to_carry); } catch(e){}
                                } else if (Array.isArray(trip.things_to_carry)) {
                                    initCarry = trip.things_to_carry;
                                }
                            }
                            window.currentCarryCategories = [...initCarry];
                            if (window.syncCarryBuilder) window.syncCarryBuilder();
                            
                            document.getElementById('create-pkg-btn').textContent = 'UPDATE PACKAGE';
                            document.getElementById('add-package-form').scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                });
            } else {
                packagesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No trips published yet.</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
        }
    }

    if (addPackageForm) {
        addPackageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('pkgTitle').value;
            const subtitle = document.getElementById('pkgSubtitle').value;
            const duration = document.getElementById('pkgDuration').value;
            const difficulty = document.getElementById('pkgDifficulty').value;
            const cost = document.getElementById('pkgCost').value;
            const cover_image_url = document.getElementById('pkgCoverImage').value;
            const highlightsRaw = document.getElementById('pkgHighlights').value;
            const itineraryRaw = document.getElementById('pkgItinerary')?.value || '';
            const inclusionsRaw = document.getElementById('pkgInclusions')?.value || '';
            const exclusionsRaw = document.getElementById('pkgExclusions')?.value || '';
            const cancelPolicyRaw = document.getElementById('pkgCancellationPolicy')?.value || '';
            const termsRaw = document.getElementById('pkgTerms')?.value || '';
            const healthRaw = document.getElementById('pkgHealth')?.value || '';
            const insuranceRaw = document.getElementById('pkgInsurance')?.value || '';
            const notesRaw = document.getElementById('pkgNotes')?.value || '';
            const riskRaw = document.getElementById('pkgRisk')?.value || '';
            const rememberRaw = document.getElementById('pkgRemember')?.value || '';
            const thingsToCarryRaw = document.getElementById('pkgThingsToCarry')?.value || '';
            
            const highlights = highlightsRaw.split(',').map(h => h.trim()).filter(h => h !== '');
            const inclusions = inclusionsRaw.split(',').map(h => h.trim()).filter(h => h !== '');
            const exclusions = exclusionsRaw.split(',').map(h => h.trim()).filter(h => h !== '');
            const cancellation_policy = cancelPolicyRaw.split(',').map(h => h.trim()).filter(h => h !== '');
            const terms_and_conditions = termsRaw.split(',').map(h => h.trim()).filter(h => h !== '');
            const health_and_fitness = healthRaw.split(',').map(h => h.trim()).filter(h => h !== '');
            const travel_insurance = insuranceRaw.split(',').map(h => h.trim()).filter(h => h !== '');
            const important_notes = notesRaw.split(',').map(h => h.trim()).filter(h => h !== '');
            const risk_liabilities = riskRaw.split(',').map(h => h.trim()).filter(h => h !== '');
            const things_to_remember = rememberRaw.split(',').map(h => h.trim()).filter(h => h !== '');
            
            // Try parsing json for itinerary and things to carry
            let itinerary = [];
            try {
                if (itineraryRaw.trim().startsWith('[')) itinerary = JSON.parse(itineraryRaw);
                else itinerary = itineraryRaw;
            } catch (e) { itinerary = itineraryRaw; }

            let things_to_carry = [];
            try {
                if (thingsToCarryRaw.trim().startsWith('[')) things_to_carry = JSON.parse(thingsToCarryRaw);
                else things_to_carry = thingsToCarryRaw;
            } catch (e) { things_to_carry = thingsToCarryRaw; }

            createPkgBtn.textContent = 'PUBLISHING...';
            createPkgBtn.disabled = true;

            try {
                // Check if editing or creating
                let error;
                const payload = { 
                    title, 
                    subtitle,
                    duration,
                    difficulty,
                    cost,
                    cover_image_url,
                    highlights,
                    itinerary,
                    inclusions,
                    exclusions,
                    cancellation_policy,
                    terms_and_conditions,
                    health_and_fitness,
                    travel_insurance,
                    important_notes,
                    risk_liabilities,
                    things_to_remember,
                    things_to_carry
                };

                if (window.currentEditPkgId) {
                    const res = await supabase
                        .from('trips')
                        .update(payload)
                        .eq('id', window.currentEditPkgId);
                    error = res.error;
                } else {
                    const res = await supabase
                        .from('trips')
                        .insert([payload]);
                    error = res.error;
                }

                if (error) throw error;
                
                // Clear edit mode
                const wasEditing = !!window.currentEditPkgId;
                window.currentEditPkgId = null;
                createPkgBtn.textContent = 'PUBLISH PACKAGE';
                addPackageForm.reset();
                window.currentItineraryDays = [];
                if (window.syncItineraryBuilder) window.syncItineraryBuilder();
                window.currentCarryCategories = [];
                if (window.syncCarryBuilder) window.syncCarryBuilder();
                alert(wasEditing ? 'Package updated successfully!' : 'Package published successfully!');
                loadPackages();
            } catch (err) {
                console.error('Error saving package:', err);
                alert('Failed to save package. See console.');
                createPkgBtn.textContent = window.currentEditPkgId ? 'UPDATE PACKAGE' : 'PUBLISH PACKAGE';
                createPkgBtn.disabled = false;
            }
        });
    }

    // --- AGENTS MANAGEMENT LOGIC ---
    
    const navTrips = document.getElementById('nav-trips');
    const navPackages = document.getElementById('nav-packages');
    const navAgents = document.getElementById('nav-agents');
    const navFixedDepartures = document.getElementById('nav-fixed-departures');
    const navCloudData = document.getElementById('nav-cloud-data');
    const navCosting = document.getElementById('nav-costing');

    const viewTrips = document.getElementById('trips-view-section');
    const viewPackages = document.getElementById('packages-view-section');
    const viewAgents = document.getElementById('agents-view-section');
    const viewFD = document.getElementById('fixed-departures-view-section');
    const viewCloud = document.getElementById('cloud-data-view-section');
    const viewCosting = document.getElementById('costing-view');
    const mainDashboardTitle = document.getElementById('main-dashboard-title');

    function hideAllViews() {
        if (viewTrips) viewTrips.style.display = 'none';
        if (viewPackages) viewPackages.style.display = 'none';
        if (viewAgents) viewAgents.style.display = 'none';
        if (viewFD) viewFD.style.display = 'none';
        if (viewCloud) viewCloud.style.display = 'none';
        if (viewCosting) viewCosting.style.display = 'none';

        if (navTrips) navTrips.classList.remove('active');
        if (navPackages) navPackages.classList.remove('active');
        if (navAgents) navAgents.classList.remove('active');
        if (navFixedDepartures) navFixedDepartures.classList.remove('active');
        if (navCloudData) navCloudData.classList.remove('active');
        if (navCosting) navCosting.classList.remove('active');
    }

    if (navTrips) {
        navTrips.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllViews();
            if (viewTrips) viewTrips.style.display = 'block';
            navTrips.classList.add('active');
            if (mainDashboardTitle) mainDashboardTitle.textContent = 'Upcoming Trips Management';
        });
    }

    if (navPackages) {
        navPackages.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllViews();
            if (viewPackages) viewPackages.style.display = 'block';
            navPackages.classList.add('active');
            if (mainDashboardTitle) mainDashboardTitle.textContent = 'Website Packages & Expeditions';
            loadPackages();
        });
    }

    if (navAgents) {
        navAgents.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllViews();
            if (viewAgents) viewAgents.style.display = 'block';
            navAgents.classList.add('active');
            if (mainDashboardTitle) mainDashboardTitle.textContent = 'Agents Management';
            loadAgents();
        });
    }

    if (navFixedDepartures) {
        navFixedDepartures.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllViews();
            if (viewFD) viewFD.style.display = 'block';
            navFixedDepartures.classList.add('active');
            if (mainDashboardTitle) mainDashboardTitle.textContent = 'Fixed Departures Management';
            loadFixedDepartures();
        });
    }

    if (navCloudData) {
        navCloudData.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllViews();
            if (viewCloud) {
                viewCloud.style.display = 'block';
                document.getElementById('cloud-master-list').style.display = 'block';
                document.getElementById('cloud-detail-view').style.display = 'none';
            }
            navCloudData.classList.add('active');
            if (mainDashboardTitle) mainDashboardTitle.textContent = 'Cloud Data Treks';
            loadCloudTreks();
        });
    }

    if (navCosting) {
        navCosting.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllViews();
            if (viewCosting) viewCosting.style.display = 'block';
            navCosting.classList.add('active');
            document.getElementById('costing-master-view').style.display = 'block';
            document.getElementById('costing-detail-view').style.display = 'none';
            if (mainDashboardTitle) mainDashboardTitle.textContent = 'Trek Costing Calculator';
            loadCostingTreks();
        });
    }

    // Load Agents
    const agentsTableBody = document.getElementById('agents-table-body');
    async function loadAgents() {
        if (!agentsTableBody) return;
        try {
            const { data: agents, error } = await supabase
                .from('agents')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            agentsTableBody.innerHTML = '';
            if (agents && agents.length > 0) {
                agents.forEach(agent => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${agent.agent_name}</strong></td>
                        <td style="font-family: monospace; font-size: 1.1rem; color: var(--admin-success);">${agent.agent_code}</td>
                        <td>${new Date(agent.created_at).toLocaleDateString()}</td>
                        <td>
                            <div class="actions-cell">
                                <button class="action-btn send-agent-wa-btn" data-code="${agent.agent_code}" data-name="${agent.agent_name}" title="Send via WhatsApp" style="color: #25D366; border-color: #25D366;"><i class="ph ph-whatsapp-logo"></i></button>
                                <button class="action-btn delete-agent-btn" data-id="${agent.id}" title="Delete Agent"><i class="ph ph-trash"></i></button>
                            </div>
                        </td>
                    `;
                    agentsTableBody.appendChild(tr);
                });

                // Add WA listeners
                document.querySelectorAll('.send-agent-wa-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const target = e.target.closest('.send-agent-wa-btn');
                        const code = target.getAttribute('data-code');
                        const name = target.getAttribute('data-name');
                        
                        // We need to call the modal opening function. 
                        // Since openWaModal is defined globally or lower in the script, we can just call it.
                        // However, wait, openWaModal is defined lower in the script inside a block or global?
                        // Let's just dispatch an event or directly define it globally to be safe, 
                        // or just get the inputs directly here:
                        const waAgentModal = document.getElementById('wa-agent-modal');
                        const waAgentCodeInput = document.getElementById('wa-agent-code');
                        const waAgentNameInput = document.getElementById('wa-agent-name');
                        
                        waAgentCodeInput.value = code;
                        waAgentNameInput.value = name;
                        waAgentModal.style.display = 'flex';
                        gsap.fromTo(waAgentModal.querySelector('.modal-content'), 
                            { y: 50, opacity: 0 }, 
                            { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }
                        );
                    });
                });

                // Add delete listeners
                document.querySelectorAll('.delete-agent-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const agentId = e.target.closest('.delete-agent-btn').getAttribute('data-id');
                        if (confirm('Are you sure you want to delete this agent?')) {
                            try {
                                const { error } = await supabase.from('agents').delete().eq('id', agentId);
                                if (error) throw error;
                                loadAgents();
                            } catch (err) {
                                console.error('Error deleting agent:', err);
                                alert('Error deleting agent');
                            }
                        }
                    });
                });
            } else {
                agentsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No agents found</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
        }
    }

    // Add Agent Form
    const addAgentForm = document.getElementById('add-agent-form');
    const generateAgentBtn = document.getElementById('generate-agent-btn');
    const agentLinkContainer = document.getElementById('agent-link-container');
    const generatedAgentCodeInput = document.getElementById('generatedAgentCode');
    const copyAgentCodeBtn = document.getElementById('copyAgentCodeBtn');

    if (addAgentForm) {
        addAgentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const agentName = document.getElementById('agentName').value;
            if (!agentName) return;

            generateAgentBtn.textContent = 'GENERATING...';
            generateAgentBtn.disabled = true;

            // Generate a random 6-character alphanumeric code
            const agentCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            try {
                const { error } = await supabase
                    .from('agents')
                    .insert([{ agent_name: agentName, agent_code: agentCode }]);

                if (error) throw error;

                generatedAgentCodeInput.value = agentCode;
                agentLinkContainer.style.display = 'block';
                
                loadAgents();
                document.getElementById('agentName').value = '';
            } catch (err) {
                console.error('Error creating agent:', err);
                alert('Error creating agent code. Check console for details.');
            } finally {
                generateAgentBtn.textContent = 'GENERATE AGENT CODE';
                generateAgentBtn.disabled = false;
            }
        });

        if (copyAgentCodeBtn) {
            copyAgentCodeBtn.addEventListener('click', () => {
                generatedAgentCodeInput.select();
                document.execCommand('copy');
                copyAgentCodeBtn.innerHTML = '<i class="ph ph-check"></i> Copied';
                setTimeout(() => {
                    copyAgentCodeBtn.innerHTML = '<i class="ph ph-copy"></i> Copy';
                }, 2000);
            });
        }

        // WA Modal Logic
        const waAgentModal = document.getElementById('wa-agent-modal');
        const closeWaAgentModal = document.getElementById('close-wa-agent-modal');
        const waAgentForm = document.getElementById('wa-agent-form');
        const waAgentCodeInput = document.getElementById('wa-agent-code');
        const waAgentNameInput = document.getElementById('wa-agent-name');

        const openWaModal = (code, name) => {
            waAgentCodeInput.value = code;
            waAgentNameInput.value = name;
            waAgentModal.style.display = 'flex';
            gsap.fromTo(waAgentModal.querySelector('.modal-content'), 
                { y: 50, opacity: 0 }, 
                { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }
            );
        };

        if (closeWaAgentModal) {
            closeWaAgentModal.addEventListener('click', () => {
                gsap.to(waAgentModal.querySelector('.modal-content'), { 
                    y: 50, opacity: 0, duration: 0.2, 
                    onComplete: () => { waAgentModal.style.display = 'none'; } 
                });
            });
        }

        if (waAgentForm) {
            waAgentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const code = waAgentCodeInput.value;
                const name = waAgentNameInput.value || 'Agent';
                const country = document.getElementById('wa-country-code').value;
                const phone = document.getElementById('wa-phone-number').value;
                
                const loginUrl = `https://www.nomadller.com/agent-login`;
                const text = `Hello ${name},\n\nThank you so much for collaborating with us! We are thrilled to have you onboard.\n\n*Agent Portal Access:*\n- Link: ${loginUrl}\n- Access Code: *${code}*\n\n*How to use the portal:*\n\n- *Dashboard:* View details of all Fixed Departures. You can also download customized PDF itineraries automatically branded with your own company name.\n\n- *Bookings Tab:* Manage all your client bookings easily. To book, click the button and type your guest's WhatsApp number (Note: This number is strictly confidential and is not saved anywhere in Nomadller's database). Send the generated link directly to your guest.\n\n- *Custom Costing:* (Coming soon!)\n\n- *Training & Support:* If your team has any sales-related doubts or needs a detailed explanation class for our itineraries, we are happy to arrange a Google Meet session for you!\n\n- *Marketing Materials:* If you need any type of marketing materials to promote the trips, feel free to ask! Contact Dhanish at +91 81291 63766.\n\nLet us know if you need any assistance!\n\nWarm regards,\nNomadller Team`;
                
                window.open(`https://wa.me/${country}${phone}?text=${encodeURIComponent(text)}`, '_blank');
                
                // Close modal
                gsap.to(waAgentModal.querySelector('.modal-content'), { 
                    y: 50, opacity: 0, duration: 0.2, 
                    onComplete: () => { waAgentModal.style.display = 'none'; } 
                });
                waAgentForm.reset();
            });
        }

        const sendAgentWaBtn = document.getElementById('sendAgentWaBtn');
        if (sendAgentWaBtn) {
            sendAgentWaBtn.addEventListener('click', () => {
                const code = generatedAgentCodeInput.value;
                const name = document.getElementById('agentName').value || 'Agent';
                openWaModal(code, name);
            });
        }
    }

    // --- CURRENCY CONVERTER LOGIC ---
    let usdToInrRate = 83.5; // Fallback rate
    async function fetchExchangeRate() {
        try {
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await response.json();
            if (data && data.rates && data.rates.INR) {
                usdToInrRate = data.rates.INR;
            }
        } catch (err) {
            console.error('Failed to fetch exchange rate, using fallback.', err);
        }
    }
    fetchExchangeRate();

    function setupCurrencyConverter(inputId, spanId) {
        const input = document.getElementById(inputId);
        const span = document.getElementById(spanId);
        if (input && span) {
            input.addEventListener('input', (e) => {
                const usdVal = parseFloat(e.target.value);
                if (!isNaN(usdVal) && usdVal > 0) {
                    const inrVal = (usdVal * usdToInrRate).toLocaleString('en-IN', { maximumFractionDigits: 0 });
                    span.textContent = `≈ ₹${inrVal}`;
                } else {
                    span.textContent = '≈ ₹0';
                }
            });
        }
    }
    
    setupCurrencyConverter('fdPrice', 'fdPriceInr');
    setupCurrencyConverter('fdMaxSellingPrice', 'fdMaxSellingPriceInr');

    // --- FIXED DEPARTURES LOGIC ---
    const fdTableBody = document.getElementById('fixed-departures-table-body');
    async function loadFixedDepartures() {
        if (!fdTableBody) return;
        try {
            const { data: fds, error } = await supabase
                .from('fixed_departures')
                .select('*')
                .order('start_date', { ascending: true });
                
            if (error) throw error;
            
            fdTableBody.innerHTML = '';
            if (fds && fds.length > 0) {
                window.fdsData = fds;

                const copySelect = document.getElementById('copy-fd-add-select');
                if (copySelect) {
                    copySelect.innerHTML = '<option value="" disabled selected>Copy data from...</option>';
                    fds.forEach(fd => {
                        const dateStr = new Date(fd.start_date).toLocaleDateString();
                        copySelect.innerHTML += `<option value="${fd.id}">${fd.destination} (${dateStr})</option>`;
                    });
                }

                fds.forEach(fd => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${fd.destination}</strong></td>
                        <td>${new Date(fd.start_date).toLocaleDateString()} - ${new Date(fd.end_date).toLocaleDateString()}</td>
                        <td>${fd.available_slots} / ${fd.total_slots}</td>
                        <td style="color: var(--admin-success); font-weight: bold;">${fd.b2b_price}</td>
                        <td>
                            <span style="padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; background: ${fd.status === 'Available' ? 'rgba(46, 196, 182, 0.2)' : fd.status === 'Sold Out' ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255,255,255,0.1)'}; color: ${fd.status === 'Available' ? 'var(--admin-success)' : fd.status === 'Sold Out' ? 'var(--admin-danger)' : 'white'};">
                                ${fd.status}
                            </span>
                        </td>
                        <td>
                            <div class="actions-cell">
                                <button class="action-btn edit-fd-btn" data-id="${fd.id}" title="Edit Departure"><i class="ph ph-pencil"></i></button>
                                <button class="action-btn delete-fd-btn" data-id="${fd.id}" title="Delete Departure"><i class="ph ph-trash"></i></button>
                            </div>
                        </td>
                    `;
                    fdTableBody.appendChild(tr);
                });

                document.querySelectorAll('.edit-fd-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const fdId = e.target.closest('.edit-fd-btn').getAttribute('data-id');
                        const fd = window.fdsData.find(f => f.id === fdId);
                        if (!fd) return;

                        // Populate form
                        document.getElementById('edit-fd-id').value = fd.id;
                        document.getElementById('edit-fd-destination').value = fd.destination || '';
                        document.getElementById('edit-fd-start').value = fd.start_date || '';
                        document.getElementById('edit-fd-end').value = fd.end_date || '';
                        document.getElementById('edit-fd-slots').value = fd.total_slots || '';
                        document.getElementById('edit-fd-status').value = fd.status || 'Available';
                        
                        // Parse USD prices from strings like "$1500"
                        const parseUsd = str => str ? parseFloat(str.replace('$', '').replace(',', '')) : '';
                        document.getElementById('edit-fd-b2b').value = parseUsd(fd.b2b_price);
                        document.getElementById('edit-fd-max').value = parseUsd(fd.max_selling_price);

                        document.getElementById('edit-fd-cover-url').value = fd.cover_image_url || '';
                        document.getElementById('edit-fd-map-url').value = fd.map_image_url || '';
                        document.getElementById('edit-fd-altitude-url').value = fd.altitude_image_url || '';
                        
                        document.getElementById('edit-fd-highlights').value = fd.trip_highlights || '';
                        document.getElementById('edit-fd-itinerary').value = fd.detailed_itinerary || '';
                        document.getElementById('edit-fd-inclusions').value = fd.inclusions || '';
                        document.getElementById('edit-fd-exclusions').value = fd.exclusions || '';
                        document.getElementById('edit-fd-notes').value = fd.important_notes || '';
                        document.getElementById('edit-fd-remember').value = fd.things_to_remember || '';
                        document.getElementById('edit-fd-terms').value = fd.terms_and_conditions || '';
                        document.getElementById('edit-fd-risk').value = fd.risk_liabilities || '';
                        document.getElementById('edit-fd-health').value = fd.health_and_fitness || '';
                        document.getElementById('edit-fd-insurance').value = fd.travel_insurance || '';
                        document.getElementById('edit-fd-cancellation').value = fd.cancellation_policy || '';

                        document.getElementById('edit-fd-modal').style.display = 'flex';
                    });
                });

                document.querySelectorAll('.delete-fd-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const fdId = e.target.closest('.delete-fd-btn').getAttribute('data-id');
                        if (confirm('Are you sure you want to delete this Fixed Departure?')) {
                            try {
                                const { error } = await supabase.from('fixed_departures').delete().eq('id', fdId);
                                if (error) throw error;
                                loadFixedDepartures();
                            } catch (err) {
                                console.error('Error deleting fixed departure:', err);
                                alert('Error deleting fixed departure');
                            }
                        }
                    });
                });
            } else {
                fdTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No fixed departures found</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching fixed departures:', error);
        }
    }

    const copyFdAddBtn = document.getElementById('copy-fd-add-btn');
    if (copyFdAddBtn) {
        copyFdAddBtn.addEventListener('click', () => {
            const fdId = document.getElementById('copy-fd-add-select').value;
            if (!fdId) {
                alert('Please select a fixed departure to copy from.');
                return;
            }
            const fd = window.fdsData?.find(f => f.id === fdId);
            if (!fd) return;

            // Fill the add form fields
            document.getElementById('fdDestination').value = fd.destination || '';
            document.getElementById('fdTotalSlots').value = fd.total_slots || '';
            
            const parseUsd = str => str ? parseFloat(str.replace('$', '').replace(',', '')) : '';
            document.getElementById('fdPrice').value = parseUsd(fd.b2b_price) || '';
            document.getElementById('fdMaxSellingPrice').value = parseUsd(fd.max_selling_price) || '';
            
            document.getElementById('fdStatus').value = fd.status || 'Available';
            
            document.getElementById('fdCoverImage').value = fd.cover_image_url || '';
            document.getElementById('fdMapImage').value = fd.map_image_url || '';
            document.getElementById('fdAltitudeImage').value = fd.altitude_image_url || '';
            
            document.getElementById('fdHighlights').value = fd.trip_highlights || '';
            document.getElementById('fdItinerary').value = fd.detailed_itinerary || '';
            document.getElementById('fdInclusions').value = fd.inclusions || '';
            document.getElementById('fdExclusions').value = fd.exclusions || '';
            document.getElementById('fdImportantNotes').value = fd.important_notes || '';
            document.getElementById('fdThingsToRemember').value = fd.things_to_remember || '';
            document.getElementById('fdTerms').value = fd.terms_and_conditions || '';
            document.getElementById('fdRisk').value = fd.risk_liabilities || '';
            document.getElementById('fdHealth').value = fd.health_and_fitness || '';
            document.getElementById('fdInsurance').value = fd.travel_insurance || '';
            document.getElementById('fdCancellation').value = fd.cancellation_policy || '';
            
            // Trigger input events to update the currency converter spans
            document.getElementById('fdPrice').dispatchEvent(new Event('input'));
            document.getElementById('fdMaxSellingPrice').dispatchEvent(new Event('input'));

            alert('Data copied successfully! Please set the Start Date and End Date manually.');
        });
    }

    const addFdForm = document.getElementById('add-fixed-departure-form');
    if (addFdForm) {
        addFdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('create-fd-btn');
            
            const b2bUsd = parseFloat(document.getElementById('fdPrice').value) || 0;
            const maxUsd = parseFloat(document.getElementById('fdMaxSellingPrice').value) || 0;
            
            const b2bInr = (b2bUsd * usdToInrRate).toLocaleString('en-IN', { maximumFractionDigits: 0 });
            const maxInr = (maxUsd * usdToInrRate).toLocaleString('en-IN', { maximumFractionDigits: 0 });

            const fdData = {
                destination: document.getElementById('fdDestination').value,
                start_date: document.getElementById('fdStartDate').value,
                end_date: document.getElementById('fdEndDate').value,
                total_slots: parseInt(document.getElementById('fdTotalSlots').value),
                available_slots: parseInt(document.getElementById('fdTotalSlots').value),
                b2b_price: `$${b2bUsd}`,
                b2b_price_inr: `₹${b2bInr}`,
                max_selling_price: `$${maxUsd}`,
                max_selling_price_inr: `₹${maxInr}`,
                status: document.getElementById('fdStatus').value,
                trip_highlights: document.getElementById('fdHighlights').value,
                detailed_itinerary: document.getElementById('fdItinerary').value,
                cover_image_url: document.getElementById('fdCoverImage').value || null,
                map_image_url: document.getElementById('fdMapImage').value || null,
                altitude_image_url: document.getElementById('fdAltitudeImage').value || null,
                inclusions: document.getElementById('fdInclusions').value,
                exclusions: document.getElementById('fdExclusions').value,
                important_notes: document.getElementById('fdImportantNotes').value,
                things_to_remember: document.getElementById('fdThingsToRemember').value,
                terms_and_conditions: document.getElementById('fdTerms').value,
                risk_liabilities: document.getElementById('fdRisk').value,
                health_and_fitness: document.getElementById('fdHealth').value,
                travel_insurance: document.getElementById('fdInsurance').value,
                cancellation_policy: document.getElementById('fdCancellation').value
            };

            btn.textContent = 'CREATING...';
            btn.disabled = true;

            try {
                const { error } = await supabase.from('fixed_departures').insert([fdData]);
                if (error) throw error;
                
                const addToUpcoming = document.getElementById('fdAddToUpcoming')?.checked;
                if (addToUpcoming) {
                    const upcomingData = {
                        trip_name: fdData.destination,
                        start_date: fdData.start_date,
                        end_date: fdData.end_date,
                        guide_name: 'TBA',
                        guide_contact: 'TBA'
                    };
                    const { error: upcError } = await supabase.from('upcoming_trips').insert([upcomingData]);
                    if (upcError) {
                        console.error('Error adding to upcoming trips:', upcError);
                    } else {
                        // Refresh upcoming trips list if we have a function for it, though loadTrips might be the one
                        if (typeof loadTrips === 'function') loadTrips();
                    }
                }

                addFdForm.reset();
                loadFixedDepartures();
            } catch (err) {
                console.error('Error creating fixed departure:', err);
                alert('Error creating fixed departure');
            } finally {
                btn.textContent = 'CREATE DEPARTURE';
                btn.disabled = false;
            }
        });
    }
    const editFdModal = document.getElementById('edit-fd-modal');
    const closeEditFdModal = document.getElementById('close-edit-fd-modal');
    const editFdForm = document.getElementById('edit-fd-form');

    if (closeEditFdModal) {
        closeEditFdModal.addEventListener('click', () => {
            editFdModal.style.display = 'none';
        });
    }

    if (editFdForm) {
        editFdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('save-fd-edits-btn');
            const fdId = document.getElementById('edit-fd-id').value;
            
            const b2bUsd = parseFloat(document.getElementById('edit-fd-b2b').value) || 0;
            const maxUsd = parseFloat(document.getElementById('edit-fd-max').value) || 0;
            
            const b2bInr = (b2bUsd * usdToInrRate).toLocaleString('en-IN', { maximumFractionDigits: 0 });
            const maxInr = (maxUsd * usdToInrRate).toLocaleString('en-IN', { maximumFractionDigits: 0 });

            const updatedFdData = {
                destination: document.getElementById('edit-fd-destination').value,
                start_date: document.getElementById('edit-fd-start').value,
                end_date: document.getElementById('edit-fd-end').value,
                total_slots: parseInt(document.getElementById('edit-fd-slots').value),
                b2b_price: `$${b2bUsd}`,
                b2b_price_inr: `₹${b2bInr}`,
                max_selling_price: `$${maxUsd}`,
                max_selling_price_inr: `₹${maxInr}`,
                status: document.getElementById('edit-fd-status').value,
                trip_highlights: document.getElementById('edit-fd-highlights').value,
                detailed_itinerary: document.getElementById('edit-fd-itinerary').value,
                cover_image_url: document.getElementById('edit-fd-cover-url').value || null,
                map_image_url: document.getElementById('edit-fd-map-url').value || null,
                altitude_image_url: document.getElementById('edit-fd-altitude-url').value || null,
                inclusions: document.getElementById('edit-fd-inclusions').value,
                exclusions: document.getElementById('edit-fd-exclusions').value,
                important_notes: document.getElementById('edit-fd-notes').value,
                things_to_remember: document.getElementById('edit-fd-remember').value,
                terms_and_conditions: document.getElementById('edit-fd-terms').value,
                risk_liabilities: document.getElementById('edit-fd-risk').value,
                health_and_fitness: document.getElementById('edit-fd-health').value,
                travel_insurance: document.getElementById('edit-fd-insurance').value,
                cancellation_policy: document.getElementById('edit-fd-cancellation').value
            };

            btn.textContent = 'UPDATING...';
            btn.disabled = true;

            try {
                const { error } = await supabase.from('fixed_departures').update(updatedFdData).eq('id', fdId);
                if (error) throw error;

                editFdModal.style.display = 'none';
                loadFixedDepartures();
            } catch (err) {
                console.error('Error updating fixed departure:', err);
                alert('Error updating fixed departure');
            } finally {
                btn.textContent = 'UPDATE DEPARTURE';
                btn.disabled = false;
            }
        });
    }
});

// --- CLOUD DATA TREKS LOGIC ---
window.cloudDataCache = {
    hotels: {}, transport: {}, transfers: {}, permits: {}, trails: {}, guides: {}, porters: {}, lunches: {}
};

window.openCopyModal = (id) => {
    document.getElementById('copy-fd-id').value = id;
    document.getElementById('copy-fd-modal').style.display = 'flex';
};

document.getElementById('copy-data-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sourceId = document.getElementById('copy-fd-id').value;
    const newDate = document.getElementById('copy-fd-date').value;
    const btn = e.target.querySelector('button');
    btn.textContent = 'COPYING...';
    btn.disabled = true;
    try {
        const { data: source, error: fetchErr } = await supabase.from('fixed_departures').select('*').eq('id', sourceId).single();
        if (fetchErr) throw fetchErr;
        const { id, created_at, ...newData } = source;
        newData.start_date = newDate;
        const { error: insErr } = await supabase.from('fixed_departures').insert([newData]);
        if (insErr) throw insErr;
        document.getElementById('copy-fd-modal').style.display = 'none';
        loadFixedDepartures();
    } catch (err) {
        console.error(err);
        alert('Error copying departure');
    } finally {
        btn.textContent = 'COPY DEPARTURE';
        btn.disabled = false;
    }
});

// --- COPY TREK DATA LOGIC ---
window.openCopyDataModal = async (type) => {
    const currentTrekId = document.getElementById('cloudTrekId').value;
    if (!currentTrekId) return;

    document.getElementById('copy-source-type').value = type;
    const titleMap = {
        transfers: 'Transfers', permits: 'Permits', trails: 'Trail Accommodations',
        guides: 'Guides', porters: 'Porters', lunches: 'Lunches'
    };
    document.getElementById('copy-modal-title').textContent = `Copy ${titleMap[type]} from Trek`;
    
    const select = document.getElementById('copy-target-trek');
    select.innerHTML = '<option value="" disabled selected>Loading...</option>';
    document.getElementById('copy-data-modal').style.display = 'flex';

    try {
        const { data, error } = await supabase.from('trek_destinations').select('*').order('name');
        if (error) throw error;
        select.innerHTML = '<option value="" disabled selected>Select source trek</option>';
        data.forEach(t => {
            if (t.id !== currentTrekId) {
                select.innerHTML += `<option value="${t.id}">${t.name}</option>`;
            }
        });
    } catch (err) {
        console.error(err);
        select.innerHTML = '<option value="" disabled>Error loading treks</option>';
    }
};

document.getElementById('copy-data-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-confirm-copy');
    btn.textContent = 'COPYING...';
    btn.disabled = true;

    try {
        const sourceType = document.getElementById('copy-source-type').value;
        const selectedSourceTrekId = document.getElementById('copy-target-trek').value;
        const currentTargetTrekId = document.getElementById('cloudTrekId').value;

        const tableMap = {
            transfers: 'trek_transfers', permits: 'trek_permits', trails: 'trek_trail_accommodations',
            guides: 'trek_guides', porters: 'trek_porters', lunches: 'trek_lunches'
        };
        const tableName = tableMap[sourceType];

        const { data: items, error: fetchErr } = await supabase.from(tableName).select('*').eq('trek_id', selectedSourceTrekId);
        if (fetchErr) throw fetchErr;

        if (!items || items.length === 0) {
            alert('No items to copy in this section.');
            document.getElementById('copy-data-modal').style.display = 'none';
            return;
        }

        const payloads = items.map(item => {
            const newItem = { ...item };
            delete newItem.id;
            delete newItem.created_at;
            newItem.trek_id = currentTargetTrekId;
            return newItem;
        });

        const { error: insertErr } = await supabase.from(tableName).insert(payloads);
        if (insertErr) throw insertErr;

        alert('Data copied successfully!');
        document.getElementById('copy-data-modal').style.display = 'none';
    } catch (err) {
        console.error(err);
        alert('Error copying data');
    } finally {
        btn.textContent = 'COPY DATA';
        btn.disabled = false;
    }
});

// --- COSTING CALCULATOR LOGIC ---
let costingCache = {};

async function loadCostingTreks() {
    const container = document.getElementById('costing-treks-container');
    if (!container) return;

    try {
        const { data, error } = await supabase.from('trek_destinations').select('*').order('created_at');
        if (error) throw error;

        container.innerHTML = '';
        data.forEach(trek => {
            const card = document.createElement('div');
            card.className = 'trek-card';
            card.style.cssText = `
                background: rgba(0,0,0,0.5); 
                border: 1px solid var(--admin-border); 
                padding: 1.5rem; 
                border-radius: 10px; 
                cursor: pointer; 
                transition: transform 0.2s, background 0.2s;
                text-align: center;
            `;
            card.innerHTML = `<h3 style="color: white; margin: 0;">${trek.name}</h3>`;
            
            card.addEventListener('mouseenter', () => { card.style.background = 'rgba(255, 107, 53, 0.1)'; card.style.transform = 'translateY(-2px)'; });
            card.addEventListener('mouseleave', () => { card.style.background = 'rgba(0,0,0,0.5)'; card.style.transform = 'translateY(0)'; });
            
            card.addEventListener('click', () => {
                openCostingDetail(trek);
            });

            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading costing treks:', err);
        container.innerHTML = '<p style="color: red;">Error loading treks.</p>';
    }
}

document.getElementById('btn-back-costing')?.addEventListener('click', () => {
    document.getElementById('costing-detail-view').style.display = 'none';
    document.getElementById('costing-master-view').style.display = 'block';
});

async function openCostingDetail(trek) {
    document.getElementById('costing-master-view').style.display = 'none';
    document.getElementById('costing-detail-view').style.display = 'block';
    document.getElementById('costing-trek-title').textContent = `${trek.name} Calculator`;
    
    // Reset cache and inputs
    costingCache = { guides: [], porters: [], permits: [], trails: [], lunches: [], transfers: [], cloudHotels: [], cloudTransports: [], trekCode: trek.code };
    document.getElementById('calc-pax').value = 2;
    document.getElementById('calc-days').value = trek.days || 14;

    // Show/hide EBC logic
    const tc = (trek.code || '').toLowerCase();
    const isEbc = tc === 'ebc' || tc === 'ebc-gokyo' || tc === 'gokyo';
    document.querySelectorAll('.ebc-specific-input, .ebc-specific-view').forEach(el => {
        el.style.display = isEbc ? (el.tagName === 'DIV' && el.classList.contains('form-group') && el.id !== 'calc-ramechhap-mode-group' ? 'block' : (el.id === 'calc-ramechhap-mode-group' ? 'none' : 'block')) : 'none';
    });
    
    // Show/hide Annapurna logic
    const isAnnapurna = tc.includes('abc') || tc.includes('annapurna');
    document.querySelectorAll('.annapurna-specific-input, .annapurna-specific-view').forEach(el => {
        el.style.display = isAnnapurna ? 'block' : 'none';
    });
    
    const transfersSection = document.getElementById('calc-transfers-section');
    if (transfersSection) {
        transfersSection.style.display = (isEbc || isAnnapurna) ? 'none' : 'block';
    }

    if (isEbc) {
        document.getElementById('calc-flight-opt').value = 'Kathmandu';
        document.getElementById('calc-ramechhap-mode-group').style.display = 'none';
    }

    try {
        const [guidesRes, portersRes, permitsRes, trailsRes, lunchesRes, transRes, hotelsRes, transportsRes] = await Promise.all([
            supabase.from('trek_guides').select('*').eq('trek_id', trek.id),
            supabase.from('trek_porters').select('*').eq('trek_id', trek.id),
            supabase.from('trek_permits').select('*').eq('trek_id', trek.id),
            supabase.from('trek_trail_accommodations').select('*').eq('trek_id', trek.id),
            supabase.from('trek_lunches').select('*').eq('trek_id', trek.id),
            supabase.from('trek_transfers').select('*').eq('trek_id', trek.id),
            supabase.from('cloud_hotels').select('*'),
            supabase.from('cloud_transport').select('*')
        ]);

        if (guidesRes.data) costingCache.guides = guidesRes.data;
        if (portersRes.data) costingCache.porters = portersRes.data;
        if (permitsRes.data) costingCache.permits = permitsRes.data;
        if (trailsRes.data) costingCache.trails = trailsRes.data;
        if (lunchesRes.data) costingCache.lunches = lunchesRes.data;
        if (transRes.data) costingCache.transfers = transRes.data;
        if (hotelsRes.data) costingCache.cloudHotels = hotelsRes.data;
        if (transportsRes.data) costingCache.cloudTransports = transportsRes.data;

        renderCostingUI();
        calculateCostingTotal();
    } catch (err) {
        console.error(err);
        alert('Error fetching trek data for costing');
    }
}

function renderCostingUI() {
    // Checkbox Lists Generator
    const generateCheckboxes = (containerId, items, valueKey, labelFn, namePrefix) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        items.forEach((item, index) => {
            const id = `chk_${namePrefix}_${index}`;
            container.innerHTML += `
                <label style="display: flex; align-items: center; gap: 0.5rem; color: white; cursor: pointer;">
                    <input type="checkbox" class="calc-checkbox ${namePrefix}-chk" value="${item[valueKey]}" onchange="calculateCostingTotal()" checked>
                    ${labelFn(item)}
                </label>
            `;
        });
    };

    generateCheckboxes('calc-trails-container', costingCache.trails, 'cost_per_day_per_person', i => `${i.location} (NPR ${i.cost_per_day_per_person})`, 'trail');
    generateCheckboxes('calc-lunches-container', costingCache.lunches, 'cost', i => `${i.place} (NPR ${i.cost})`, 'lunch');
    generateCheckboxes('calc-transfers-container', costingCache.transfers, 'cost', i => `${i.transfer_type} - ${i.departure} to ${i.arrival} (NPR ${i.cost})`, 'transfer');
}

window.calculateCostingTotal = () => {
    const pax = parseInt(document.getElementById('calc-pax').value) || 0;
    const days = parseInt(document.getElementById('calc-days').value) || 0;
    const cCode = (costingCache.trekCode || '').toLowerCase();
    let total = 0;

    // Guide Allocation
    let mainGuides = 0, asstGuides = 0;
    if (pax <= 6) { mainGuides = 1; asstGuides = 0; }
    else if (pax <= 12) { mainGuides = 1; asstGuides = 1; }
    else if (pax <= 16) { mainGuides = 1; asstGuides = 2; }
    else { mainGuides = 2; asstGuides = 2; }
    
    let mainGuideCost = 0, asstGuideCost = 0;
    const mGuide = costingCache.guides.find(g => g.name && !g.name.toLowerCase().includes('assistant')); 
    const aGuide = costingCache.guides.find(g => g.name && g.name.toLowerCase().includes('assistant'));
    
    if (mGuide) mainGuideCost = parseFloat(mGuide.cost_per_day) || 0;
    else if (costingCache.guides.length > 0) mainGuideCost = parseFloat(costingCache.guides[0].cost_per_day) || 0;

    if (aGuide) asstGuideCost = parseFloat(aGuide.cost_per_day) || 0;
    else if (costingCache.guides.length > 1) asstGuideCost = parseFloat(costingCache.guides[1].cost_per_day) || 0;

    let guideDays = Math.max(1, days - 2);
    if (cCode.includes('abc') || cCode.includes('annapurna')) {
        guideDays = 15;
    }
    const guideTotal = ((mainGuides * mainGuideCost) + (asstGuides * asstGuideCost)) * guideDays;
    
    const gPaxEl = document.getElementById('calc-guide-pax');
    if (gPaxEl) gPaxEl.textContent = pax;
    let gDetails = [];
    if (mainGuides > 0) gDetails.push(`${mainGuides} Lead (NPR ${mainGuideCost.toLocaleString()})`);
    if (asstGuides > 0) gDetails.push(`${asstGuides} Asst (NPR ${asstGuideCost.toLocaleString()})`);
    const gDetEl = document.getElementById('calc-guide-details');
    if (gDetEl) gDetEl.innerHTML = gDetails.length > 0 ? `(${gDetails.join(' + ')}) × ${guideDays} Days = <strong>NPR ${guideTotal.toLocaleString()}</strong>` : 'No guides assigned.';
    document.getElementById('calc-guide-cost-display').textContent = `NPR ${guideTotal.toLocaleString()}`;
    total += guideTotal;

    // Porter Allocation
    const porterCount = Math.floor(pax / 2);
    let porterCostPerDay = 0;
    if (costingCache.porters.length > 0) {
        porterCostPerDay = parseFloat(costingCache.porters[0].cost_per_day) || 0;
    }
    let porterDays = (cCode === 'gokyo' || cCode === 'ebc-gokyo') ? Math.max(1, days - 1) : Math.max(1, days - 3);
    if (cCode.includes('abc') || cCode.includes('annapurna')) {
        porterDays = 15;
    }
    const porterTotal = porterCostPerDay * porterCount * porterDays;
    
    const pPaxEl = document.getElementById('calc-porter-pax');
    if (pPaxEl) pPaxEl.textContent = pax;
    const pDetEl = document.getElementById('calc-porter-details');
    if (pDetEl) pDetEl.innerHTML = `${porterCount} Porter(s) × NPR ${porterCostPerDay.toLocaleString()} × ${porterDays} Days = <strong>NPR ${porterTotal.toLocaleString()}</strong>`;
    document.getElementById('calc-porter-cost-display').textContent = `NPR ${porterTotal.toLocaleString()}`;
    total += porterTotal;

    // Helper for summing checked boxes
    const sumCheckboxes = (className) => {
        let sum = 0;
        document.querySelectorAll(`.${className}:checked`).forEach(chk => {
            sum += parseFloat(chk.value) || 0;
        });
        return sum;
    };

    // Permits (Per Pax)
    let permitsSum = 0;
    let permitsHtml = '';
    costingCache.permits.forEach(p => {
        const cost = parseFloat(p.cost) || 0;
        permitsSum += cost;
        permitsHtml += `<div style="display: flex; align-items: center; gap: 0.5rem;"><i class="ph-fill ph-check-circle" style="color: var(--admin-primary);"></i> ${p.permit_name} (NPR ${cost})</div>`;
    });
    
    const permitsContainer = document.getElementById('calc-permits-container');
    if (permitsContainer) {
        permitsContainer.innerHTML = permitsHtml || 'No permits required.';
    }

    const permitsTotal = permitsSum * pax;
    document.getElementById('calc-permits-cost-display').innerHTML = `NPR ${permitsSum.toLocaleString()} × ${pax} Pax = <strong>NPR ${permitsTotal.toLocaleString()}</strong>`;
    total += permitsTotal;

    // Trails & Lunches (Total Cost Per Pax for whole trek)
    let foodTotal = 0;
    const mealInc = document.getElementById('calc-meal-inclusion').value;
    const foodSection = document.getElementById('calc-food-section');
    
    if (mealInc === 'With Food') {
        if (foodSection) foodSection.style.display = 'block';
        
        let trailsSum = 0;
        let trailsHtml = '';
        costingCache.trails.forEach(t => {
            const cost = parseFloat(t.cost_per_day_per_person) || 0;
            trailsSum += cost;
            trailsHtml += `<div style="display: flex; align-items: center; gap: 0.5rem;"><i class="ph-fill ph-check-circle" style="color: var(--admin-primary);"></i> ${t.location} (NPR ${cost})</div>`;
        });
        const trailsContainer = document.getElementById('calc-trails-container');
        if (trailsContainer) trailsContainer.innerHTML = trailsHtml || 'No accommodations added.';

        let lunchesSum = 0;
        let lunchesHtml = '';
        costingCache.lunches.forEach(l => {
            const cost = parseFloat(l.cost) || 0;
            lunchesSum += cost;
            lunchesHtml += `<div style="display: flex; align-items: center; gap: 0.5rem;"><i class="ph-fill ph-check-circle" style="color: var(--admin-primary);"></i> ${l.place} (NPR ${cost})</div>`;
        });
        const lunchesContainer = document.getElementById('calc-lunches-container');
        if (lunchesContainer) lunchesContainer.innerHTML = lunchesHtml || 'No lunches added.';

        foodTotal = (trailsSum + lunchesSum) * pax;
        document.getElementById('calc-food-cost-display').innerHTML = `(NPR ${trailsSum.toLocaleString()} + NPR ${lunchesSum.toLocaleString()}) × ${pax} Pax = <strong>NPR ${foodTotal.toLocaleString()}</strong>`;
    } else {
        if (foodSection) foodSection.style.display = 'none';
        document.getElementById('calc-food-cost-display').textContent = `NPR 0`;
    }
    
    total += foodTotal;

    // Airport Transfers (Mandatory for Kathmandu)
    const airportRoute = 'Kathmandu';
    let airportTotal = 0;
    let airportDetailsStr = '';

    let carsNeeded = 0;
    let hiaceNeeded = 0;

    if (pax <= 4) {
        carsNeeded = 1;
    } else if (pax <= 14) {
        hiaceNeeded = 1;
    } else if (pax <= 20) {
        carsNeeded = 1;
        hiaceNeeded = 1;
    } else {
        hiaceNeeded = 2; // For up to 28 pax (can scale further if needed)
        if (pax > 28) {
            hiaceNeeded = Math.ceil(pax / 14); 
        }
    }

    // Fetch prices from cloud transport cache
    let carPrice = 0, hiacePrice = 0;
    costingCache.cloudTransports.forEach(t => {
        const tr = (t.route || '').toLowerCase();
        if (tr.includes('kathmandu') && tr.includes('airport')) {
            const v = (t.vehicle_name || '').toLowerCase();
            if (v.includes('car')) carPrice += parseFloat(t.cost_npr) || 0;
            if (v.includes('hiace')) hiacePrice += parseFloat(t.cost_npr) || 0;
        }
    });

    airportTotal = (carsNeeded * carPrice) + (hiaceNeeded * hiacePrice);
    
    let arrMath = [];
    if (carsNeeded > 0) arrMath.push(`${carsNeeded} Car × NPR ${carPrice.toLocaleString()}`);
    if (hiaceNeeded > 0) arrMath.push(`${hiaceNeeded} Hiace × NPR ${hiacePrice.toLocaleString()}`);
    
    airportDetailsStr = `${arrMath.join(' + ')} = <br><strong>Cost: NPR ${airportTotal.toLocaleString()}</strong>`;

    const airportDetEl = document.getElementById('calc-airport-transfer-details');
    if (airportDetEl) {
        airportDetEl.innerHTML = airportDetailsStr;
    }

    // Transfers (Flat Cost for now - excluding EBC specific flights/long routes handled below)
    let transfersTotal = airportTotal;
    if (!(cCode.includes('ebc') || cCode.includes('ebc-gokyo') || cCode.includes('gokyo') || cCode.includes('abc') || cCode.includes('annapurna'))) {
        transfersTotal += sumCheckboxes('transfer-chk');
    }

    // ----------------------------------------------------
    // EBC SPECIFIC LOGIC (Flights & Ramechhap Transfers)
    // ----------------------------------------------------
    let ebcFlightTotal = 0;
    if (cCode === 'ebc' || cCode === 'ebc-gokyo' || cCode === 'gokyo') {
        const flightOpt = document.getElementById('calc-flight-opt').value; // 'Kathmandu' or 'Ramechhap'
        let flightCostPerPax = 0;
        
        // Find flight cost in transfers cache
        const flightTransfers = costingCache.transfers.filter(t => {
            if ((t.transfer_type || '').toLowerCase() !== 'flight') return false;
            
            // If explicit flight_option is set, match it exactly
            if (t.flight_option && t.flight_option !== 'Any (Global)') {
                return t.flight_option.toLowerCase() === flightOpt.toLowerCase();
            }
            
            // Fallback: match departure
            return t.departure && t.departure.toLowerCase().includes(flightOpt.toLowerCase());
        });
        flightTransfers.forEach(f => { flightCostPerPax += parseFloat(f.cost) || 0; });
        ebcFlightTotal += (flightCostPerPax * pax); // Do NOT multiply by 2, user adds both legs in DB

        let detailsText = `Flight (${flightOpt}): ${pax} Pax × NPR ${flightCostPerPax.toLocaleString()} = <strong>NPR ${(flightCostPerPax * pax).toLocaleString()}</strong>`;

        // If Ramechhap, calculate long route transfers
        if (flightOpt === 'Ramechhap') {
            const rMode = document.getElementById('calc-ramechhap-mode').value;
            document.getElementById('calc-ramechhap-rec').textContent = pax <= 3 ? "(Recommended: Sharing)" : "(Recommended: Pvt)";
            
            if (rMode === 'Sharing') {
                let shareCostPerPax = 0;
                costingCache.transfers.forEach(t => {
                    if ((t.transfer_type || '').toLowerCase() === 'long_route' && t.mode === 'Sharing') {
                        // Match explicit flight_option if provided
                        if (t.flight_option && t.flight_option !== 'Any (Global)') {
                            if (t.flight_option.toLowerCase() === flightOpt.toLowerCase()) {
                                shareCostPerPax += parseFloat(t.cost) || 0;
                            }
                        } else {
                            // Fallback
                            shareCostPerPax += parseFloat(t.cost) || 0;
                        }
                    }
                });
                ebcFlightTotal += (shareCostPerPax * pax); // Do NOT multiply by 2, user adds both legs
                detailsText += `<br>Sharing Transfer: ${pax} Pax × NPR ${shareCostPerPax.toLocaleString()} = <strong>NPR ${(shareCostPerPax * pax).toLocaleString()}</strong>`;
            } else if (rMode === 'Pvt') {
                let carCount = 0;
                let hiaceCount = 0;
                if (pax >= 1 && pax <= 4) { carCount = 1; }
                else if (pax >= 5 && pax <= 14) { hiaceCount = 1; }
                else if (pax >= 15 && pax <= 20) { carCount = 1; hiaceCount = 1; }
                else if (pax >= 21 && pax <= 28) { hiaceCount = 2; }
                else {
                    hiaceCount = Math.floor(pax / 14);
                    const rem = pax % 14;
                    if (rem > 4) hiaceCount++;
                    else if (rem > 0) carCount++;
                }

                // Fetch vehicle costs from Trek Transfers (same as Sharing)
                let carCost = 0, hiaceCost = 0;
                costingCache.transfers.forEach(t => {
                    if ((t.transfer_type || '').toLowerCase() === 'long_route' && t.mode === 'Pvt') {
                        // Match explicit flight_option if provided
                        let matchesOpt = false;
                        if (t.flight_option && t.flight_option !== 'Any (Global)') {
                            matchesOpt = (t.flight_option.toLowerCase() === flightOpt.toLowerCase());
                        } else {
                            matchesOpt = true; // Fallback to all Pvt long routes if no opt selected
                        }
                        
                        if (matchesOpt) {
                            const v = (t.vehicle_details || '').toLowerCase();
                            if (v.includes('car')) carCost += parseFloat(t.cost) || 0;
                            if (v.includes('hiace')) hiaceCost += parseFloat(t.cost) || 0;
                        }
                    }
                });

                const pvtCost = ((carCount * carCost) + (hiaceCount * hiaceCost)); // User adds both legs in DB
                ebcFlightTotal += pvtCost;
                
                let pvtMath = [];
                if (carCount > 0) pvtMath.push(`${carCount} Car × NPR ${carCost.toLocaleString()}`);
                if (hiaceCount > 0) pvtMath.push(`${hiaceCount} Hiace × NPR ${hiaceCost.toLocaleString()}`);
                
                detailsText += `<br>Pvt Transfer: (${pvtMath.join(' + ')}) = <strong>NPR ${pvtCost.toLocaleString()}</strong>`;
            }
        }
        
        document.getElementById('calc-flight-details').innerHTML = detailsText;
        document.getElementById('calc-flight-cost-display').textContent = `NPR ${ebcFlightTotal.toLocaleString()}`;
        total += ebcFlightTotal;
    } else if (cCode.includes('abc') || cCode.includes('annapurna')) {
        let annapurnaTotal = 0;
        let detailsText = '';

        // 1. Pokhara to KTM Transfer
        const kpMode = document.getElementById('calc-ktm-pkr-transfer').value; 
        let kpCostPerPax = 0;
        costingCache.transfers.forEach(t => {
            const dep = (t.departure || '').toLowerCase();
            const arr = (t.arrival || '').toLowerCase();
            if ((t.transfer_type || '').toLowerCase() === kpMode.toLowerCase() && 
                ((dep.includes('pokhara') && arr.includes('kathmandu')) || 
                 (dep.includes('kathmandu') && arr.includes('pokhara')))) {
                kpCostPerPax = parseFloat(t.cost) || 0; // Assignment instead of += to avoid summing both if both exist
            }
        });
        // One way trip from Pokhara back to Kathmandu
        const kpTotal = kpCostPerPax * pax;
        annapurnaTotal += kpTotal;
        detailsText += `PKR ➔ KTM (${kpMode}): ${pax} Pax × NPR ${kpCostPerPax.toLocaleString()} = <strong>NPR ${kpTotal.toLocaleString()}</strong>`;

        let ktmToBesPerPax = 0, mukToPkrPerPax = 0, besiToPisangCost = 0, thorangToMuktiCost = 0;

        if (cCode.includes('annapurna') && !cCode.includes('abc')) {
            // Kathmandu to Besisahar Bus + 500 Drop
            let ktmToBesCost = 0;
            costingCache.transfers.forEach(t => {
                const dep = (t.departure || '').toLowerCase();
                const arr = (t.arrival || '').toLowerCase();
                const mode = (t.mode || '').toLowerCase();
                const details = (t.vehicle_details || '').toLowerCase();
                const type = (t.transfer_type || '').toLowerCase();
                if (dep.includes('kathmandu') && arr.includes('besi') && 
                    (mode.includes('bus') || details.includes('bus') || type.includes('bus') || mode.includes('sharing'))) {
                    ktmToBesCost = parseFloat(t.cost) || 0;
                }
            });
            ktmToBesPerPax = ktmToBesCost + 500; // Always add 500 even if base is 0, so it shows up
            const ktmToBesTotal = ktmToBesPerPax * pax;
            annapurnaTotal += ktmToBesTotal;
            detailsText += `<br>KTM ➔ Besisahar (Bus + Drop): ${pax} Pax × NPR ${ktmToBesPerPax.toLocaleString()} = <strong>NPR ${ktmToBesTotal.toLocaleString()}</strong>`;

            // Muktinath to Pokhara Bus + 500 Drop
            let mukToPkrCost = 0;
            costingCache.transfers.forEach(t => {
                const dep = (t.departure || '').toLowerCase();
                const arr = (t.arrival || '').toLowerCase();
                const mode = (t.mode || '').toLowerCase();
                const details = (t.vehicle_details || '').toLowerCase();
                const type = (t.transfer_type || '').toLowerCase();
                if ((dep.includes('mukti') || dep.includes('mukthi')) && arr.includes('pokhara') && 
                    (mode.includes('bus') || details.includes('bus') || type.includes('bus') || mode.includes('sharing'))) {
                    mukToPkrCost = parseFloat(t.cost) || 0;
                }
            });
            mukToPkrPerPax = mukToPkrCost + 500; // Always add 500 even if base is 0, so it shows up
            const mukToPkrTotal = mukToPkrPerPax * pax;
            annapurnaTotal += mukToPkrTotal;
            detailsText += `<br>Muktinath ➔ PKR (Bus + Drop): ${pax} Pax × NPR ${mukToPkrPerPax.toLocaleString()} = <strong>NPR ${mukToPkrTotal.toLocaleString()}</strong>`;

            // Besisahar to Upper Pisang (Jeep)
            costingCache.transfers.forEach(t => {
                const dep = (t.departure || '').toLowerCase();
                const arr = (t.arrival || '').toLowerCase();
                if (dep.includes('besi') && (arr.includes('pisong') || arr.includes('pisang'))) {
                    besiToPisangCost = parseFloat(t.cost) || 0;
                }
            });
            const besiToPisangTotal = besiToPisangCost * pax;
            annapurnaTotal += besiToPisangTotal;
            detailsText += `<br>Besisahar ➔ Upper Pisang (Jeep): ${pax} Pax × NPR ${besiToPisangCost.toLocaleString()} = <strong>NPR ${besiToPisangTotal.toLocaleString()}</strong>`;

            // Thorang Phedi to Muktinath (Jeep)
            costingCache.transfers.forEach(t => {
                const dep = (t.departure || '').toLowerCase();
                const arr = (t.arrival || '').toLowerCase();
                if ((dep.includes('thorang') || dep.includes('thorong')) && (arr.includes('mukti') || arr.includes('mukthi'))) {
                    thorangToMuktiCost = parseFloat(t.cost) || 0;
                }
            });
            const thorangToMuktiTotal = thorangToMuktiCost * pax;
            annapurnaTotal += thorangToMuktiTotal;
            detailsText += `<br>Thorang Phedi ➔ Muktinath (Jeep): ${pax} Pax × NPR ${thorangToMuktiCost.toLocaleString()} = <strong>NPR ${thorangToMuktiTotal.toLocaleString()}</strong>`;
        }
        // 3. Pokhara Airport/Bus Park Transfer (Pick up & Drop off)
        let pkrCarPrice = 0, pkrHiacePrice = 0;
        costingCache.cloudTransports.forEach(t => {
            const tr = (t.route || '').toLowerCase();
            if (tr.includes('pokhara') && (tr.includes('airport') || tr.includes('pick') || tr.includes('drop'))) {
                const v = (t.vehicle_name || '').toLowerCase();
                if (v.includes('car')) pkrCarPrice += parseFloat(t.cost_npr) || 0;
                if (v.includes('hiace')) pkrHiacePrice += parseFloat(t.cost_npr) || 0;
            }
        });

        let pkrVehicleCost = 0;
        let pkrVehicleName = '';
        if (pax >= 1 && pax <= 3) {
            pkrVehicleCost = pkrCarPrice;
            pkrVehicleName = 'Car';
        } else if (pax >= 4 && pax <= 7) {
            pkrVehicleCost = pkrHiacePrice;
            pkrVehicleName = 'Hiace';
        } else if (pax >= 8) {
            pkrVehicleCost = pkrHiacePrice * 2;
            pkrVehicleName = '2 Hiaces';
        }

        if (pkrVehicleCost > 0) {
            annapurnaTotal += pkrVehicleCost;
            detailsText += `<br>PKR Pick/Drop: (1 ${pkrVehicleName} × NPR ${pkrVehicleCost.toLocaleString()}) = <strong>NPR ${pkrVehicleCost.toLocaleString()}</strong>`;
        }

        const paxTransferTotal = annapurnaTotal;
        detailsText += `<br><br><strong>Pax Transfer Cost: NPR ${paxTransferTotal.toLocaleString()}</strong>`;

        const staffCount = mainGuides + asstGuides + porterCount;
        if (staffCount > 0) {
            let staffVehicleCost = 0;
            let staffVehicleName = '';
            if (staffCount >= 1 && staffCount <= 3) { staffVehicleCost = pkrCarPrice; staffVehicleName = 'Car'; }
            else if (staffCount >= 4 && staffCount <= 7) { staffVehicleCost = pkrHiacePrice; staffVehicleName = 'Hiace'; }
            else if (staffCount >= 8) { staffVehicleCost = pkrHiacePrice * 2; staffVehicleName = '2 Hiaces'; }

            const staffKpTotal = kpCostPerPax * staffCount;
            const staffKtmToBesTotal = ktmToBesPerPax * staffCount;
            const staffMukToPkrTotal = mukToPkrPerPax * staffCount;
            const staffBesiToPisangTotal = besiToPisangCost * staffCount;
            const staffThorangToMuktiTotal = thorangToMuktiCost * staffCount;

            const staffTransfersTotal = staffKpTotal + staffKtmToBesTotal + staffMukToPkrTotal + staffBesiToPisangTotal + staffThorangToMuktiTotal + staffVehicleCost;
            
            annapurnaTotal += staffTransfersTotal;
            
            detailsText += `<br><br><strong style="color: var(--admin-primary);">STAFF TRANSFERS</strong>`;
            detailsText += `<br>PKR ➔ KTM (${kpMode}): ${staffCount} Staff × NPR ${kpCostPerPax.toLocaleString()} = <strong>NPR ${staffKpTotal.toLocaleString()}</strong>`;
            
            if (cCode.includes('annapurna') && !cCode.includes('abc')) {
                detailsText += `<br>KTM ➔ Besisahar (Bus + Drop): ${staffCount} Staff × NPR ${ktmToBesPerPax.toLocaleString()} = <strong>NPR ${staffKtmToBesTotal.toLocaleString()}</strong>`;
                detailsText += `<br>Besisahar ➔ Upper Pisang (Jeep): ${staffCount} Staff × NPR ${besiToPisangCost.toLocaleString()} = <strong>NPR ${staffBesiToPisangTotal.toLocaleString()}</strong>`;
                detailsText += `<br>Thorang Phedi ➔ Muktinath (Jeep): ${staffCount} Staff × NPR ${thorangToMuktiCost.toLocaleString()} = <strong>NPR ${staffThorangToMuktiTotal.toLocaleString()}</strong>`;
                detailsText += `<br>Muktinath ➔ PKR (Bus + Drop): ${staffCount} Staff × NPR ${mukToPkrPerPax.toLocaleString()} = <strong>NPR ${staffMukToPkrTotal.toLocaleString()}</strong>`;
            }

            if (staffVehicleCost > 0) {
                detailsText += `<br>PKR Pick/Drop: (1 ${staffVehicleName} × NPR ${staffVehicleCost.toLocaleString()}) = <strong>NPR ${staffVehicleCost.toLocaleString()}</strong>`;
            }
            detailsText += `<br><strong>Staff Transfer Cost: NPR ${staffTransfersTotal.toLocaleString()}</strong>`;
        }
        
        const annTrDet = document.getElementById('calc-annapurna-transfers-details');
        if (annTrDet) annTrDet.innerHTML = detailsText;
        const annTrDisp = document.getElementById('calc-annapurna-transfers-cost-display');
        if (annTrDisp) annTrDisp.innerHTML = `NPR ${annapurnaTotal.toLocaleString()}`;
        
        total += transfersTotal + annapurnaTotal;

        // 3. Pokhara Hotel Logic
        const pkrHotelCat = document.getElementById('calc-pokhara-hotel-cat').value;
        let pkrHotelTotal = 0;
        if (pkrHotelCat !== '0') {
            let doubleRooms = 0, tripleRooms = 0;
            const catHotels = costingCache.cloudHotels.filter(h => h.star_category === pkrHotelCat && h.location === 'Pokhara');
            
            let twoBedPrice = 0, threeBedPrice = 0;
            const twoBedHotel = catHotels.find(h => h.room_type && h.room_type.toLowerCase().includes('2'));
            const threeBedHotel = catHotels.find(h => h.room_type && h.room_type.toLowerCase().includes('3'));
            
            if (twoBedHotel) twoBedPrice = parseFloat(twoBedHotel.price_per_night) || 0;
            if (threeBedHotel) threeBedPrice = parseFloat(threeBedHotel.price_per_night) || 0;
            
            let roomPolicy = document.getElementById('calc-hotel-room-type').value;
            if (!threeBedHotel) roomPolicy = 'Double Only';
            
            if (roomPolicy === 'Double Only') {
                doubleRooms = Math.ceil(pax / 2);
            } else {
                if (pax === 1) { doubleRooms = 1; }
                else if (pax % 2 === 0) { doubleRooms = pax / 2; }
                else { doubleRooms = Math.floor(pax / 2) - 1; tripleRooms = 1; }
            }

            const nights = 2; // 2 nights in Pokhara
            const dbCost = doubleRooms * twoBedPrice * nights;
            const trCost = tripleRooms * threeBedPrice * nights;
            pkrHotelTotal = dbCost + trCost;
            
            let hDetails = [];
            if (doubleRooms > 0) hDetails.push(`${doubleRooms} Dbl (NPR ${twoBedPrice})`);
            if (tripleRooms > 0) hDetails.push(`${tripleRooms} Trp (NPR ${threeBedPrice})`);
            
            const pkrHDet = document.getElementById('calc-pkr-hotel-details');
            if (pkrHDet) pkrHDet.innerHTML = `(${hDetails.join(' + ')}) × ${nights} Nights = <strong>NPR ${pkrHotelTotal.toLocaleString()}</strong>`;
            const pkrHDisp = document.getElementById('calc-pkr-hotel-cost-display');
            if (pkrHDisp) pkrHDisp.textContent = `NPR ${pkrHotelTotal.toLocaleString()}`;
        } else {
            const pkrHDet = document.getElementById('calc-pkr-hotel-details');
            if (pkrHDet) pkrHDet.innerHTML = `No hotel needed in Pokhara.`;
            const pkrHDisp = document.getElementById('calc-pkr-hotel-cost-display');
            if (pkrHDisp) pkrHDisp.textContent = `NPR 0`;
        }
        total += pkrHotelTotal;

    } else {
        const ctDisp = document.getElementById('calc-transfers-cost-display');
        if (ctDisp) ctDisp.textContent = `NPR ${transfersTotal.toLocaleString()}`;
        total += transfersTotal;
    }

    // ----------------------------------------------------
    // GLOBAL HOTEL LOGIC
    // ----------------------------------------------------
    const hotelCat = document.getElementById('calc-hotel-cat').value;
    let hotelTotal = 0;
    if (hotelCat !== '0') {
        let doubleRooms = 0, tripleRooms = 0;
        
        // Find hotels for this category in Kathmandu
        const catHotels = costingCache.cloudHotels.filter(h => h.star_category === hotelCat && h.location === 'Kathmandu');
        
        // Find specific room prices
        let twoBedPrice = 0;
        let threeBedPrice = 0;
        
        const twoBedHotel = catHotels.find(h => h.room_type && h.room_type.toLowerCase().includes('2'));
        const threeBedHotel = catHotels.find(h => h.room_type && h.room_type.toLowerCase().includes('3'));
        
        if (twoBedHotel) twoBedPrice = parseFloat(twoBedHotel.price_per_night) || 0;
        if (threeBedHotel) threeBedPrice = parseFloat(threeBedHotel.price_per_night) || 0;
        
        // Auto-enforce Double Only if no 3-bed room exists in this category
        let roomPolicy = document.getElementById('calc-hotel-room-type').value;
        if (!threeBedHotel) {
            roomPolicy = 'Double Only';
            document.getElementById('calc-hotel-room-type').value = 'Double Only';
            document.getElementById('calc-hotel-room-type').disabled = true;
        } else {
            document.getElementById('calc-hotel-room-type').disabled = false;
        }

        if (roomPolicy === 'Double Only') {
            doubleRooms = Math.ceil(pax / 2);
            tripleRooms = 0;
        } else {
            if (pax === 1) {
                doubleRooms = 1;
            } else if (pax % 2 === 0) {
                doubleRooms = pax / 2;
            } else {
                doubleRooms = Math.floor(pax / 2) - 1;
                tripleRooms = 1;
            }
        }

        const totalRooms = doubleRooms + tripleRooms;
        document.getElementById('calc-hotel-rooms-rec').textContent = `(${doubleRooms} Double/Twin, ${tripleRooms} Triple)`;

        hotelTotal = ((doubleRooms * twoBedPrice) + (tripleRooms * threeBedPrice)) * 2;
        
        let detailStr = [];
        if (doubleRooms > 0) detailStr.push(`${doubleRooms} x 2-Bed (NPR ${twoBedPrice.toLocaleString()})`);
        if (tripleRooms > 0) detailStr.push(`${tripleRooms} x 3-Bed (NPR ${threeBedPrice.toLocaleString()})`);
        
        document.getElementById('calc-hotel-details').innerHTML = detailStr.length > 0 ? `(${detailStr.join(' + ')}) × 2 Nights = <strong>NPR ${hotelTotal.toLocaleString()}</strong>` : 'No rooms assigned.';
        document.getElementById('calc-hotel-cost-display').textContent = `NPR ${hotelTotal.toLocaleString()}`;
        total += hotelTotal;
    } else {
        document.getElementById('calc-hotel-rooms-rec').textContent = '';
        document.getElementById('calc-hotel-details').textContent = 'No hotel selected.';
        document.getElementById('calc-hotel-cost-display').textContent = 'NPR 0';
    }

    const totalStr = `NPR ${total.toLocaleString()}`;
    document.getElementById('calc-total-cost').textContent = totalStr;
    const bottomTotal = document.getElementById('calc-total-cost-bottom');
    if (bottomTotal) bottomTotal.textContent = totalStr;

    // Convert to INR and USD (Grand Total)
    const inrEl = document.getElementById('calc-total-inr');
    const usdEl = document.getElementById('calc-total-usd');
    if (inrEl && usdEl) {
        const rateInr = window.liveRates?.INR || 0.625;
        const rateUsd = window.liveRates?.USD || 0.0075;
        const inrTotal = total * rateInr;
        const usdTotal = total * rateUsd;
        
        inrEl.textContent = `INR ${inrTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        usdEl.textContent = `USD ${usdTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    }

    // Per Person Calculations
    const ppBottom = document.getElementById('calc-pp-cost-bottom');
    const ppInr = document.getElementById('calc-pp-inr');
    const ppUsd = document.getElementById('calc-pp-usd');

    if (ppBottom && ppInr && ppUsd) {
        const ppTotal = total / pax;
        ppBottom.textContent = `NPR ${ppTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        
        const rateInr = window.liveRates?.INR || 0.625;
        const rateUsd = window.liveRates?.USD || 0.0075;
        const ppInrTotal = ppTotal * rateInr;
        const ppUsdTotal = ppTotal * rateUsd;

        ppInr.textContent = `INR ${ppInrTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        ppUsd.textContent = `USD ${ppUsdTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    }
};

// Listeners for global inputs
document.getElementById('calc-pax')?.addEventListener('input', calculateCostingTotal);
document.getElementById('calc-days')?.addEventListener('input', calculateCostingTotal);
document.getElementById('calc-meal-inclusion')?.addEventListener('change', calculateCostingTotal);
document.getElementById('calc-flight-opt')?.addEventListener('change', (e) => {
    document.getElementById('calc-ramechhap-mode-group').style.display = e.target.value === 'Ramechhap' ? 'block' : 'none';
    calculateCostingTotal();
});
document.getElementById('calc-ramechhap-mode')?.addEventListener('change', calculateCostingTotal);
document.getElementById('calc-hotel-cat')?.addEventListener('change', calculateCostingTotal);
document.getElementById('calc-hotel-room-type')?.addEventListener('change', calculateCostingTotal);
document.getElementById('calc-ktm-pkr-transfer')?.addEventListener('change', calculateCostingTotal);
document.getElementById('calc-pokhara-hotel-cat')?.addEventListener('change', calculateCostingTotal);
document.getElementById('calc-pkr-ghandruk-mode')?.addEventListener('change', calculateCostingTotal);

window.editCloudItem = (type, id) => {
    const item = window.cloudDataCache[type][id];
    if (!item) return;
    
    const setToggle = (btnId, formId) => {
        document.getElementById(formId).style.display = 'block';
        const btn = document.getElementById(btnId);
        btn.innerHTML = `<i class="ph ph-x"></i> CANCEL`;
        btn.style.background = 'rgba(255,255,255,0.2)';
    };

    if (type === 'hotels') {
        setToggle('toggle-add-g-hotel-btn', 'add-global-hotel-form');
        document.getElementById('gHotelEditId').value = item.id;
        document.getElementById('gHotelLocation').value = item.location;
        document.getElementById('gHotelName').value = item.hotel_name;
        document.getElementById('gHotelStars').value = item.star_category || '';
        document.getElementById('gHotelRoom').value = item.room_type;
        document.getElementById('gHotelPrice').value = item.price_per_night;
        document.getElementById('btn-add-g-hotel').textContent = 'UPDATE HOTEL';
    } else if (type === 'transport') {
        setToggle('toggle-add-g-transport-btn', 'add-global-transport-form');
        document.getElementById('gTransportEditId').value = item.id;
        document.getElementById('gTransportName').value = item.vehicle_name;
        document.getElementById('gTransportCap').value = item.capacity;
        document.getElementById('gTransportCap').value = item.capacity;
        
        let isStandard = false;
        const selectEl = document.getElementById('gTransportRouteSelect');
        Array.from(selectEl.options).forEach(opt => {
            if (opt.value === item.route) isStandard = true;
        });
        
        if (isStandard && item.route) {
            selectEl.value = item.route;
            document.getElementById('gTransportRouteOther').style.display = 'none';
        } else {
            selectEl.value = 'Other';
            document.getElementById('gTransportRouteOther').style.display = 'block';
            document.getElementById('gTransportRouteOther').value = item.route || '';
        }
        
        document.getElementById('gTransportCost').value = item.cost_npr;
        document.getElementById('btn-add-g-transport').textContent = 'UPDATE TRANSPORT';
    } else if (type === 'transfers') {
        setToggle('toggle-add-t-transfer-btn', 'add-t-transfer-form');
        document.getElementById('tTransferEditId').value = item.id;
        document.getElementById('gTransferType').value = item.transfer_type;
        document.getElementById('gTransferMode').value = item.mode || '';
        document.getElementById('gTransferFlightOpt').value = item.flight_option || '';
        document.getElementById('gTransferDep').value = item.departure;
        document.getElementById('gTransferArr').value = item.arrival;
        document.getElementById('gTransferOccupancy').value = item.occupancy || '';
        document.getElementById('gTransferCost').value = item.cost;
        if (item.transfer_type !== 'flight') {
            document.getElementById('gTransferVehicleGroup').style.display = 'block';
            document.getElementById('gTransferVehicle').value = item.vehicle_details || '';
        } else {
            document.getElementById('gTransferVehicleGroup').style.display = 'none';
        }
        document.getElementById('btn-add-t-transfer').textContent = 'UPDATE TRANSFER';
    } else if (type === 'permits') {
        setToggle('toggle-add-t-permit-btn', 'add-trek-permit-form');
        document.getElementById('tPermitEditId').value = item.id;
        document.getElementById('tPermitName').value = item.permit_name;
        document.getElementById('tPermitCost').value = item.cost;
        document.getElementById('btn-add-t-permit').textContent = 'UPDATE PERMIT';
    } else if (type === 'trails') {
        setToggle('toggle-add-t-trail-btn', 'add-trek-trail-acc-form');
        document.getElementById('tTrailEditId').value = item.id;
        document.getElementById('tTrailLoc').value = item.location;
        document.getElementById('tTrailCost').value = item.cost_per_day_per_person;
        document.getElementById('btn-add-t-trail').textContent = 'UPDATE ACCOMMODATION';
    } else if (type === 'guides') {
        setToggle('toggle-add-t-guide-btn', 'add-t-guide-form');
        document.getElementById('tGuideEditId').value = item.id;
        document.getElementById('gGuideName').value = item.name;
        document.getElementById('gGuideCost').value = item.cost_per_day;
        document.getElementById('btn-add-t-guide').textContent = 'UPDATE GUIDE';
    } else if (type === 'porters') {
        setToggle('toggle-add-t-porter-btn', 'add-t-porter-form');
        document.getElementById('tPorterEditId').value = item.id;
        document.getElementById('gPorterType').value = item.porter_type;
        document.getElementById('gPorterCost').value = item.cost_per_day;
        document.getElementById('btn-add-t-porter').textContent = 'UPDATE PORTER';
    } else if (type === 'lunches') {
        setToggle('toggle-add-t-lunch-btn', 'add-t-lunch-form');
        document.getElementById('tLunchEditId').value = item.id;
        document.getElementById('gLunchPlace').value = item.place;
        document.getElementById('gLunchCost').value = item.cost;
        document.getElementById('btn-add-t-lunch').textContent = 'UPDATE LUNCH';
    }
};

window.deleteCloudItem = async (type, id, tableName) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
        if (type === 'hotels') loadGlobalHotels();
        else if (type === 'transport') loadGlobalTransport();
        else loadTrekData(document.getElementById('cloudTrekId').value);
    } catch (err) {
        console.error(err);
        alert('Error deleting item');
    }
};

async function loadGlobalHotels() {
    const tbody = document.getElementById('g-hotels-tbody');
    if (!tbody) return;
    try {
        const { data, error } = await supabase.from('cloud_hotels').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 1rem; color: var(--text-secondary);">No hotels added yet.</td></tr>';
            return;
        }
        data.forEach(hotel => {
            window.cloudDataCache.hotels[hotel.id] = hotel;
            tbody.innerHTML += `
                <tr>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${hotel.location}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${hotel.hotel_name}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${hotel.star_category || '-'}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${hotel.room_type}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--admin-success);">NPR ${hotel.price_per_night}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                        <button onclick="editCloudItem('hotels', '${hotel.id}')" style="background:transparent; border:none; color:var(--admin-primary); cursor:pointer; margin-right: 0.5rem;"><i class="ph ph-pencil"></i></button>
                        <button onclick="deleteCloudItem('hotels', '${hotel.id}', 'cloud_hotels')" style="background:transparent; border:none; color:#ff4d4f; cursor:pointer;"><i class="ph ph-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="4" style="color:red;">Error loading hotels.</td></tr>';
    }
}

async function loadGlobalTransport() {
    const tbody = document.getElementById('g-transport-tbody');
    if (!tbody) return;
    try {
        const { data, error } = await supabase.from('cloud_transport').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 1rem; color: var(--text-secondary);">No transport added yet.</td></tr>';
            return;
        }
        data.forEach(t => {
            window.cloudDataCache.transport[t.id] = t;
            tbody.innerHTML += `
                <tr>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${t.vehicle_name}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${t.route || '-'}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${t.capacity}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--admin-success);">NPR ${t.cost_npr}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                        <button onclick="editCloudItem('transport', '${t.id}')" style="background:transparent; border:none; color:var(--admin-primary); cursor:pointer; margin-right: 0.5rem;"><i class="ph ph-pencil"></i></button>
                        <button onclick="deleteCloudItem('transport', '${t.id}', 'cloud_transport')" style="background:transparent; border:none; color:#ff4d4f; cursor:pointer;"><i class="ph ph-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="3" style="color:red;">Error loading transport.</td></tr>';
    }
}

async function loadCloudTreks() {
    loadGlobalHotels();
    loadGlobalTransport();
    const container = document.getElementById('trek-cards-container');
    if (!container) return;

    try {
        const { data, error } = await supabase.from('trek_destinations').select('*').order('created_at');
        if (error) throw error;

        container.innerHTML = '';
        data.forEach(trek => {
            const card = document.createElement('div');
            card.className = 'trek-card';
            card.style.cssText = `
                background: rgba(0,0,0,0.5); 
                border: 1px solid var(--admin-border); 
                padding: 1.5rem; 
                border-radius: 10px; 
                cursor: pointer; 
                transition: transform 0.2s, background 0.2s;
                text-align: center;
            `;
            card.innerHTML = `<h3 style="color: white; margin: 0;">${trek.name}</h3>`;
            
            card.addEventListener('mouseenter', () => { card.style.background = 'rgba(255, 107, 53, 0.1)'; card.style.transform = 'translateY(-2px)'; });
            card.addEventListener('mouseleave', () => { card.style.background = 'rgba(0,0,0,0.5)'; card.style.transform = 'translateY(0)'; });
            
            card.addEventListener('click', () => {
                openTrekDetailView(trek);
            });

            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading treks:', err);
        container.innerHTML = '<p style="color: red;">Error loading treks. Did you run the SQL script?</p>';
    }
}

function openTrekDetailView(trek) {
    document.getElementById('cloud-master-list').style.display = 'none';
    document.getElementById('cloud-detail-view').style.display = 'block';
    
    document.getElementById('current-trek-title').textContent = trek.name;
    document.getElementById('cloudTrekId').value = trek.id;
    document.getElementById('cloudTrekDays').value = trek.days || 14;
    
    loadTrekData(trek.id);
}

async function loadTrekData(trekId) {
    // Transfers
    const tBodyT = document.getElementById('t-transfers-tbody');
    if (tBodyT) {
        tBodyT.innerHTML = '';
        const { data: tData } = await supabase.from('trek_transfers').select('*').eq('trek_id', trekId).order('created_at', { ascending: false });
        if (tData && tData.length > 0) {
            tData.forEach(item => {
                window.cloudDataCache.transfers[item.id] = item;
                tBodyT.innerHTML += `<tr>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${item.transfer_type}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${item.mode || '-'}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${item.departure} - ${item.arrival}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${item.vehicle_details || '-'}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${item.occupancy || '-'}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--admin-success);">NPR ${item.cost}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                        <button onclick="editCloudItem('transfers', '${item.id}')" style="background:transparent; border:none; color:var(--admin-primary); cursor:pointer; margin-right: 0.5rem;"><i class="ph ph-pencil"></i></button>
                        <button onclick="deleteCloudItem('transfers', '${item.id}', 'trek_transfers')" style="background:transparent; border:none; color:#ff4d4f; cursor:pointer;"><i class="ph ph-trash"></i></button>
                    </td>
                </tr>`;
            });
        } else {
            tBodyT.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 1rem; color: var(--text-secondary);">No transfers added.</td></tr>';
        }
    }

    // Permits
    const pBody = document.getElementById('t-permits-tbody');
    if (pBody) {
        pBody.innerHTML = '';
        const { data: pData } = await supabase.from('trek_permits').select('*').eq('trek_id', trekId).order('created_at', { ascending: false });
        if (pData && pData.length > 0) {
            pData.forEach(item => {
                window.cloudDataCache.permits[item.id] = item;
                pBody.innerHTML += `<tr>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${item.permit_name}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--admin-success);">NPR ${item.cost}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                        <button onclick="editCloudItem('permits', '${item.id}')" style="background:transparent; border:none; color:var(--admin-primary); cursor:pointer; margin-right: 0.5rem;"><i class="ph ph-pencil"></i></button>
                        <button onclick="deleteCloudItem('permits', '${item.id}', 'trek_permits')" style="background:transparent; border:none; color:#ff4d4f; cursor:pointer;"><i class="ph ph-trash"></i></button>
                    </td>
                </tr>`;
            });
        } else {
            pBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 1rem; color: var(--text-secondary);">No permits added.</td></tr>';
        }
    }

    // Trails
    const trBody = document.getElementById('t-trails-tbody');
    if (trBody) {
        trBody.innerHTML = '';
        const { data: trData } = await supabase.from('trek_trail_accommodations').select('*').eq('trek_id', trekId).order('created_at', { ascending: false });
        if (trData && trData.length > 0) {
            let totalCost = 0;
            trData.forEach(item => {
                totalCost += parseFloat(item.cost_per_day_per_person) || 0;
                window.cloudDataCache.trails[item.id] = item;
                trBody.innerHTML += `<tr>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${item.location}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--admin-success);">NPR ${item.cost_per_day_per_person}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                        <button onclick="editCloudItem('trails', '${item.id}')" style="background:transparent; border:none; color:var(--admin-primary); cursor:pointer; margin-right: 0.5rem;"><i class="ph ph-pencil"></i></button>
                        <button onclick="deleteCloudItem('trails', '${item.id}', 'trek_trail_accommodations')" style="background:transparent; border:none; color:#ff4d4f; cursor:pointer;"><i class="ph ph-trash"></i></button>
                    </td>
                </tr>`;
            });
            trBody.innerHTML += `<tr>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary);"><strong>Total</strong></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--admin-success);"><strong>NPR ${totalCost.toLocaleString()}</strong></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);"></td>
            </tr>`;
        } else {
            trBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 1rem; color: var(--text-secondary);">No accommodations added.</td></tr>';
        }
    }

    // Guides
    const gBody = document.getElementById('t-guides-tbody');
    if (gBody) {
        gBody.innerHTML = '';
        const { data: gData } = await supabase.from('trek_guides').select('*').eq('trek_id', trekId).order('created_at', { ascending: false });
        if (gData && gData.length > 0) {
            gData.forEach(item => {
                window.cloudDataCache.guides[item.id] = item;
                gBody.innerHTML += `<tr>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${item.name}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--admin-success);">NPR ${item.cost_per_day}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                        <button onclick="editCloudItem('guides', '${item.id}')" style="background:transparent; border:none; color:var(--admin-primary); cursor:pointer; margin-right: 0.5rem;"><i class="ph ph-pencil"></i></button>
                        <button onclick="deleteCloudItem('guides', '${item.id}', 'trek_guides')" style="background:transparent; border:none; color:#ff4d4f; cursor:pointer;"><i class="ph ph-trash"></i></button>
                    </td>
                </tr>`;
            });
        } else {
            gBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 1rem; color: var(--text-secondary);">No guides added.</td></tr>';
        }
    }

    // Porters
    const poBody = document.getElementById('t-porters-tbody');
    if (poBody) {
        poBody.innerHTML = '';
        const { data: poData } = await supabase.from('trek_porters').select('*').eq('trek_id', trekId).order('created_at', { ascending: false });
        if (poData && poData.length > 0) {
            poData.forEach(item => {
                window.cloudDataCache.porters[item.id] = item;
                poBody.innerHTML += `<tr>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${item.porter_type}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--admin-success);">NPR ${item.cost_per_day}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                        <button onclick="editCloudItem('porters', '${item.id}')" style="background:transparent; border:none; color:var(--admin-primary); cursor:pointer; margin-right: 0.5rem;"><i class="ph ph-pencil"></i></button>
                        <button onclick="deleteCloudItem('porters', '${item.id}', 'trek_porters')" style="background:transparent; border:none; color:#ff4d4f; cursor:pointer;"><i class="ph ph-trash"></i></button>
                    </td>
                </tr>`;
            });
        } else {
            poBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 1rem; color: var(--text-secondary);">No porters added.</td></tr>';
        }
    }

    // Lunches
    const lBody = document.getElementById('t-lunches-tbody');
    if (lBody) {
        lBody.innerHTML = '';
        const { data: lData } = await supabase.from('trek_lunches').select('*').eq('trek_id', trekId).order('created_at', { ascending: false });
        if (lData && lData.length > 0) {
            let totalCost = 0;
            lData.forEach(item => {
                totalCost += parseFloat(item.cost) || 0;
                window.cloudDataCache.lunches[item.id] = item;
                lBody.innerHTML += `<tr>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">${item.place}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--admin-success);">NPR ${item.cost}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                        <button onclick="editCloudItem('lunches', '${item.id}')" style="background:transparent; border:none; color:var(--admin-primary); cursor:pointer; margin-right: 0.5rem;"><i class="ph ph-pencil"></i></button>
                        <button onclick="deleteCloudItem('lunches', '${item.id}', 'trek_lunches')" style="background:transparent; border:none; color:#ff4d4f; cursor:pointer;"><i class="ph ph-trash"></i></button>
                    </td>
                </tr>`;
            });
            lBody.innerHTML += `<tr>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary);"><strong>Total</strong></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--admin-success);"><strong>NPR ${totalCost.toLocaleString()}</strong></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);"></td>
            </tr>`;
        } else {
            lBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 1rem; color: var(--text-secondary);">No lunches added.</td></tr>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Helper to map textarea ID to DB field name
    function getDbFieldFromId(id) {
        if (!id) return null;
        if (id.includes('Highlights')) return 'trip_highlights';
        if (id.includes('Itinerary')) return 'detailed_itinerary';
        if (id.includes('Inclusions')) return 'inclusions';
        if (id.includes('Exclusions')) return 'exclusions';
        if (id.includes('ImportantNotes') || id.includes('notes')) return 'important_notes';
        if (id.includes('ThingsToRemember') || id.includes('remember')) return 'things_to_remember';
        if (id.includes('Terms') || id.includes('terms')) return 'terms_and_conditions';
        if (id.includes('Risk') || id.includes('risk')) return 'risk_liabilities';
        if (id.includes('Health') || id.includes('health')) return 'health_and_fitness';
        if (id.includes('Insurance') || id.includes('insurance')) return 'travel_insurance';
        if (id.includes('Cancellation') || id.includes('cancellation')) return 'cancellation_policy';
        return null;
    }

    // Inject Copy buttons & Pull From dropdowns to all textarea labels
    document.querySelectorAll('textarea').forEach(textarea => {
        const label = document.querySelector(`label[for="${textarea.id}"]`);
        if (label) {
            label.style.display = 'flex';
            label.style.justifyContent = 'space-between';
            label.style.alignItems = 'center';
            label.style.flexWrap = 'wrap';
            label.style.gap = '0.5rem';
            
            const controlsDiv = document.createElement('div');
            controlsDiv.style.display = 'flex';
            controlsDiv.style.gap = '0.8rem';
            controlsDiv.style.alignItems = 'center';

            const dbField = getDbFieldFromId(textarea.id);
            if (dbField) {
                const select = document.createElement('select');
                select.innerHTML = '<option value="" disabled selected>Pull from...</option>';
                select.style.cssText = 'background: rgba(0,0,0,0.5); border: 1px solid var(--admin-border); color: var(--text-secondary); border-radius: 3px; font-size: 0.7rem; padding: 0.2rem; cursor: pointer; max-width: 120px;';
                
                select.addEventListener('focus', () => {
                    if (select.children.length <= 1 && window.fdsData) {
                        window.fdsData.forEach(fd => {
                            const option = document.createElement('option');
                            option.value = fd.id;
                            option.textContent = fd.destination;
                            select.appendChild(option);
                        });
                    }
                });

                select.addEventListener('change', () => {
                    if (!select.value) return;
                    const fd = window.fdsData?.find(f => f.id === select.value);
                    if (fd && fd[dbField]) {
                        textarea.value = fd[dbField];
                        textarea.style.transition = 'background 0.3s';
                        textarea.style.background = 'rgba(46, 196, 182, 0.2)';
                        setTimeout(() => { textarea.style.background = 'rgba(0,0,0,0.5)'; }, 500);
                    } else if (fd && !fd[dbField]) {
                        alert('This departure does not have data for this field.');
                    }
                    select.value = '';
                });
                controlsDiv.appendChild(select);
            }
            
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.innerHTML = '<i class="ph ph-copy"></i> Copy';
            btn.style.cssText = 'background: transparent; border: none; color: var(--admin-primary); cursor: pointer; display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; padding: 0;';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                textarea.select();
                document.execCommand('copy');
                btn.innerHTML = '<i class="ph ph-check"></i> Copied';
                setTimeout(() => {
                    btn.innerHTML = '<i class="ph ph-copy"></i> Copy';
                }, 2000);
            });
            controlsDiv.appendChild(btn);

            label.appendChild(controlsDiv);
        }
    });

    const backBtn = document.getElementById('back-to-cloud-list');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('cloud-master-list').style.display = 'block';
            document.getElementById('cloud-detail-view').style.display = 'none';
        });
    }

    const saveDaysBtn = document.getElementById('btn-save-trek-days');
    if (saveDaysBtn) {
        saveDaysBtn.addEventListener('click', async (e) => {
            const btn = e.target;
            btn.textContent = '...';
            btn.disabled = true;
            try {
                const id = document.getElementById('cloudTrekId').value;
                const days = parseInt(document.getElementById('cloudTrekDays').value) || 14;
                const { error } = await supabase.from('trek_destinations').update({ days }).eq('id', id);
                if (error) throw error;
                
                btn.style.background = 'var(--admin-success)';
                setTimeout(() => btn.style.background = 'var(--admin-primary)', 2000);
            } catch(err) {
                console.error(err);
                alert('Error updating days');
            } finally {
                btn.textContent = 'SAVE';
                btn.disabled = false;
            }
        });
    }

    // ------------------------------------
    // GLOBAL FORMS
    // ------------------------------------
    
    // Toggle Buttons
    const toggleGHotelBtn = document.getElementById('toggle-add-g-hotel-btn');
    if (toggleGHotelBtn) {
        toggleGHotelBtn.addEventListener('click', () => {
            const form = document.getElementById('add-global-hotel-form');
            if (form.style.display === 'none') {
                form.style.display = 'block';
                toggleGHotelBtn.innerHTML = '<i class="ph ph-x"></i> CANCEL';
                toggleGHotelBtn.style.background = 'rgba(255,255,255,0.2)';
            } else {
                form.style.display = 'none';
                toggleGHotelBtn.innerHTML = '<i class="ph ph-plus"></i> ADD HOTEL';
                toggleGHotelBtn.style.background = 'var(--admin-primary)';
            }
        });
    }

    const toggleGTransportBtn = document.getElementById('toggle-add-g-transport-btn');
    if (toggleGTransportBtn) {
        toggleGTransportBtn.addEventListener('click', () => {
            const form = document.getElementById('add-global-transport-form');
            if (form.style.display === 'none') {
                form.style.display = 'block';
                toggleGTransportBtn.innerHTML = '<i class="ph ph-x"></i> CANCEL';
                toggleGTransportBtn.style.background = 'rgba(255,255,255,0.2)';
            } else {
                form.style.display = 'none';
                toggleGTransportBtn.innerHTML = '<i class="ph ph-plus"></i> ADD TRANSPORT';
                toggleGTransportBtn.style.background = 'var(--admin-primary)';
            }
        });
    }
    
    // Transfer logic (conditional fields)
    const gTransferType = document.getElementById('gTransferType');
    const gTransferVehicleGroup = document.getElementById('gTransferVehicleGroup');
    if (gTransferType && gTransferVehicleGroup) {
        gTransferType.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'flight') {
                gTransferVehicleGroup.style.display = 'none';
            } else {
                gTransferVehicleGroup.style.display = 'block';
            }
        });
    }

    // Add Global Transport
    const addGTransportForm = document.getElementById('add-global-transport-form');
    if (addGTransportForm) {
        addGTransportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-add-g-transport');
            btn.textContent = 'SAVING...';
            btn.disabled = true;
            try {
                const editId = document.getElementById('gTransportEditId').value;
                let routeVal = document.getElementById('gTransportRouteSelect').value;
                if (routeVal === 'Other') routeVal = document.getElementById('gTransportRouteOther').value;

                const payload = {
                    vehicle_name: document.getElementById('gTransportName').value,
                    capacity: parseInt(document.getElementById('gTransportCap').value),
                    route: routeVal,
                    cost_npr: parseFloat(document.getElementById('gTransportCost').value)
                };
                
                let error;
                if (editId) {
                    const res = await supabase.from('cloud_transport').update(payload).eq('id', editId);
                    error = res.error;
                } else {
                    const res = await supabase.from('cloud_transport').insert([payload]);
                    error = res.error;
                }
                if (error) throw error;
                
                addGTransportForm.reset();
                document.getElementById('gTransportRouteOther').style.display = 'none';
                document.getElementById('gTransportEditId').value = '';
                addGTransportForm.style.display = 'none';
                const toggleBtn = document.getElementById('toggle-add-g-transport-btn');
                toggleBtn.innerHTML = '<i class="ph ph-plus"></i> ADD TRANSPORT';
                toggleBtn.style.background = 'var(--admin-primary)';
                
                loadGlobalTransport();
            } catch (err) {
                console.error(err);
                alert('Error saving transport');
            } finally {
                btn.textContent = 'SAVE TRANSPORT';
                btn.disabled = false;
            }
        });
    }

    // Add Global Hotel
    const addGHotelForm = document.getElementById('add-global-hotel-form');
    if (addGHotelForm) {
        addGHotelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-add-g-hotel');
            btn.textContent = 'SAVING...';
            btn.disabled = true;
            try {
                const editId = document.getElementById('gHotelEditId').value;
                const payload = {
                    location: document.getElementById('gHotelLocation').value,
                    hotel_name: document.getElementById('gHotelName').value,
                    star_category: document.getElementById('gHotelStars').value || null,
                    room_type: document.getElementById('gHotelRoom').value,
                    price_per_night: parseFloat(document.getElementById('gHotelPrice').value)
                };
                
                let error;
                if (editId) {
                    const res = await supabase.from('cloud_hotels').update(payload).eq('id', editId);
                    error = res.error;
                } else {
                    const res = await supabase.from('cloud_hotels').insert([payload]);
                    error = res.error;
                }
                if (error) throw error;
                
                addGHotelForm.reset();
                document.getElementById('gHotelEditId').value = '';
                addGHotelForm.style.display = 'none';
                const toggleBtn = document.getElementById('toggle-add-g-hotel-btn');
                toggleBtn.innerHTML = '<i class="ph ph-plus"></i> ADD HOTEL';
                toggleBtn.style.background = 'var(--admin-primary)';
                
                loadGlobalHotels();
            } catch (err) {
                console.error(err);
                alert('Error saving hotel');
            } finally {
                btn.textContent = 'SAVE HOTEL';
                btn.disabled = false;
            }
        });
    }

    // ------------------------------------
    // TREK SPECIFIC FORMS
    // ------------------------------------

    // Toggles for Trek Specific Forms
    const setupToggle = (btnId, formId, defaultText) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                const form = document.getElementById(formId);
                if (form.style.display === 'none') {
                    form.style.display = 'block';
                    btn.innerHTML = '<i class="ph ph-x"></i> CANCEL';
                    btn.style.background = 'rgba(255,255,255,0.2)';
                } else {
                    form.style.display = 'none';
                    btn.innerHTML = `<i class="ph ph-plus"></i> ${defaultText}`;
                    btn.style.background = 'var(--admin-primary)';
                }
            });
        }
    };

    setupToggle('toggle-add-t-transfer-btn', 'add-t-transfer-form', 'ADD TRANSFER');
    setupToggle('toggle-add-t-permit-btn', 'add-trek-permit-form', 'ADD PERMIT');
    setupToggle('toggle-add-t-trail-btn', 'add-trek-trail-acc-form', 'ADD LOCATION');
    setupToggle('toggle-add-t-guide-btn', 'add-t-guide-form', 'ADD GUIDE');
    setupToggle('toggle-add-t-porter-btn', 'add-t-porter-form', 'ADD PORTER');
    setupToggle('toggle-add-t-lunch-btn', 'add-t-lunch-form', 'ADD LUNCH');

    
    // Add Trek Transfer
    const addTTransferForm = document.getElementById('add-t-transfer-form');
    if (addTTransferForm) {
        addTTransferForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-add-t-transfer');
            btn.textContent = 'SAVING...';
            btn.disabled = true;

            const tType = document.getElementById('gTransferType').value;
            const tDep = document.getElementById('gTransferDep').value;
            const tArr = document.getElementById('gTransferArr').value;
            const tOcc = document.getElementById('gTransferOccupancy').value;
            const tCost = parseFloat(document.getElementById('gTransferCost').value);
            const tVeh = tType !== 'flight' ? document.getElementById('gTransferVehicle').value : null;
            const trekId = document.getElementById('cloudTrekId').value;
            const editId = document.getElementById('tTransferEditId').value;

            try {
                const payload = {
                    trek_id: trekId,
                    transfer_type: tType,
                    mode: document.getElementById('gTransferMode').value,
                    departure: tDep,
                    arrival: tArr,
                    vehicle_details: tVeh,
                    occupancy: tOcc ? parseInt(tOcc) : null,
                    cost: tCost,
                    flight_option: document.getElementById('gTransferFlightOpt').value || null
                };
                
                let error;
                if (editId) {
                    const res = await supabase.from('trek_transfers').update(payload).eq('id', editId);
                    error = res.error;
                } else {
                    const res = await supabase.from('trek_transfers').insert([payload]);
                    error = res.error;
                }
                
                if (error) throw error;
                addTTransferForm.reset();
                document.getElementById('tTransferEditId').value = '';
                addTTransferForm.style.display = 'none';
                const toggleBtn = document.getElementById('toggle-add-t-transfer-btn');
                toggleBtn.innerHTML = '<i class="ph ph-plus"></i> ADD TRANSFER';
                toggleBtn.style.background = 'var(--admin-primary)';
                document.getElementById('gTransferVehicleGroup').style.display = 'none';
                loadTrekData(trekId);
            } catch (err) {
                console.error(err);
                alert('Error saving transfer');
            } finally {
                btn.textContent = 'SAVE TRANSFER';
                btn.disabled = false;
            }
        });
    }

    // Add Trek Permit
    const addTPermitForm = document.getElementById('add-trek-permit-form');
    if (addTPermitForm) {
        addTPermitForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-add-t-permit');
            btn.textContent = 'SAVING...';
            btn.disabled = true;
            try {
                const trekId = document.getElementById('cloudTrekId').value;
                const editId = document.getElementById('tPermitEditId').value;
                const payload = {
                    trek_id: trekId,
                    permit_name: document.getElementById('tPermitName').value,
                    cost: parseFloat(document.getElementById('tPermitCost').value)
                };
                
                let error;
                if (editId) {
                    const res = await supabase.from('trek_permits').update(payload).eq('id', editId);
                    error = res.error;
                } else {
                    const res = await supabase.from('trek_permits').insert([payload]);
                    error = res.error;
                }
                
                if (error) throw error;
                addTPermitForm.reset();
                document.getElementById('tPermitEditId').value = '';
                addTPermitForm.style.display = 'none';
                const toggleBtn = document.getElementById('toggle-add-t-permit-btn');
                toggleBtn.innerHTML = '<i class="ph ph-plus"></i> ADD PERMIT';
                toggleBtn.style.background = 'var(--admin-primary)';
                loadTrekData(trekId);
            } catch (err) {
                console.error(err);
                alert('Error saving permit');
            } finally {
                btn.textContent = 'SAVE PERMIT';
                btn.disabled = false;
            }
        });
    }

    // Add Trek Trail Accommodation
    const addTTrailForm = document.getElementById('add-trek-trail-acc-form');
    if (addTTrailForm) {
        addTTrailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-add-t-trail');
            btn.textContent = 'SAVING...';
            btn.disabled = true;
            try {
                const trekId = document.getElementById('cloudTrekId').value;
                const editId = document.getElementById('tTrailEditId').value;
                const payload = {
                    trek_id: trekId,
                    location: document.getElementById('tTrailLoc').value,
                    cost_per_day_per_person: parseFloat(document.getElementById('tTrailCost').value)
                };
                
                let error;
                if (editId) {
                    const res = await supabase.from('trek_trail_accommodations').update(payload).eq('id', editId);
                    error = res.error;
                } else {
                    const res = await supabase.from('trek_trail_accommodations').insert([payload]);
                    error = res.error;
                }
                
                if (error) throw error;
                addTTrailForm.reset();
                document.getElementById('tTrailEditId').value = '';
                addTTrailForm.style.display = 'none';
                const toggleBtn = document.getElementById('toggle-add-t-trail-btn');
                toggleBtn.innerHTML = '<i class="ph ph-plus"></i> ADD LOCATION';
                toggleBtn.style.background = 'var(--admin-primary)';
                loadTrekData(trekId);
            } catch (err) {
                console.error(err);
                alert('Error saving trail accommodation');
            } finally {
                btn.textContent = 'SAVE ACCOMMODATION';
                btn.disabled = false;
            }
        });
    }

    // Add Trek Guide
    const addGGuideForm = document.getElementById('add-t-guide-form');
    if (addGGuideForm) {
        addGGuideForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-add-t-guide');
            btn.textContent = 'SAVING...';
            btn.disabled = true;
            try {
                const trekId = document.getElementById('cloudTrekId').value;
                const editId = document.getElementById('tGuideEditId').value;
                const payload = {
                    trek_id: trekId,
                    name: document.getElementById('gGuideName').value,
                    cost_per_day: parseFloat(document.getElementById('gGuideCost').value)
                };
                
                let error;
                if (editId) {
                    const res = await supabase.from('trek_guides').update(payload).eq('id', editId);
                    error = res.error;
                } else {
                    const res = await supabase.from('trek_guides').insert([payload]);
                    error = res.error;
                }
                
                if (error) throw error;
                addGGuideForm.reset();
                document.getElementById('tGuideEditId').value = '';
                addGGuideForm.style.display = 'none';
                const toggleBtn = document.getElementById('toggle-add-t-guide-btn');
                toggleBtn.innerHTML = '<i class="ph ph-plus"></i> ADD GUIDE';
                toggleBtn.style.background = 'var(--admin-primary)';
                loadTrekData(trekId);
            } catch (err) {
                console.error(err);
                alert('Error saving guide');
            } finally {
                btn.textContent = 'SAVE GUIDE';
                btn.disabled = false;
            }
        });
    }

    // Add Trek Porter
    const addGPorterForm = document.getElementById('add-t-porter-form');
    if (addGPorterForm) {
        addGPorterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-add-t-porter');
            btn.textContent = 'SAVING...';
            btn.disabled = true;
            try {
                const trekId = document.getElementById('cloudTrekId').value;
                const editId = document.getElementById('tPorterEditId').value;
                const payload = {
                    trek_id: trekId,
                    porter_type: document.getElementById('gPorterType').value,
                    cost_per_day: parseFloat(document.getElementById('gPorterCost').value)
                };
                
                let error;
                if (editId) {
                    const res = await supabase.from('trek_porters').update(payload).eq('id', editId);
                    error = res.error;
                } else {
                    const res = await supabase.from('trek_porters').insert([payload]);
                    error = res.error;
                }
                
                if (error) throw error;
                addGPorterForm.reset();
                document.getElementById('tPorterEditId').value = '';
                addGPorterForm.style.display = 'none';
                const toggleBtn = document.getElementById('toggle-add-t-porter-btn');
                toggleBtn.innerHTML = '<i class="ph ph-plus"></i> ADD PORTER';
                toggleBtn.style.background = 'var(--admin-primary)';
                loadTrekData(trekId);
            } catch (err) {
                console.error(err);
                alert('Error saving porter');
            } finally {
                btn.textContent = 'SAVE PORTER';
                btn.disabled = false;
            }
        });
    }

    // Add Trek Lunch
    const addTLunchForm = document.getElementById('add-t-lunch-form');
    if (addTLunchForm) {
        addTLunchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-add-t-lunch');
            btn.textContent = 'SAVING...';
            btn.disabled = true;
            try {
                const trekId = document.getElementById('cloudTrekId').value;
                const editId = document.getElementById('tLunchEditId').value;
                const payload = {
                    trek_id: trekId,
                    place: document.getElementById('gLunchPlace').value,
                    cost: parseFloat(document.getElementById('gLunchCost').value)
                };
                
                let error;
                if (editId) {
                    const res = await supabase.from('trek_lunches').update(payload).eq('id', editId);
                    error = res.error;
                } else {
                    const res = await supabase.from('trek_lunches').insert([payload]);
                    error = res.error;
                }
                
                if (error) throw error;
                addTLunchForm.reset();
                document.getElementById('tLunchEditId').value = '';
                addTLunchForm.style.display = 'none';
                const toggleBtn = document.getElementById('toggle-add-t-lunch-btn');
                toggleBtn.innerHTML = '<i class="ph ph-plus"></i> ADD LUNCH';
                toggleBtn.style.background = 'var(--admin-primary)';
                loadTrekData(trekId);
            } catch (err) {
                console.error(err);
                alert('Error saving lunch');
            } finally {
                btn.textContent = 'SAVE LUNCH';
                btn.disabled = false;
            }
        });
    }
    
    // Itinerary Builder Logic
    window.currentItineraryDays = [];

    window.renderItineraryBuilder = function() {
        const builder = document.getElementById('itinerary-builder');
        if (!builder) return;
        
        builder.innerHTML = '';
        
        window.currentItineraryDays.forEach((dayObj, index) => {
            const dayDiv = document.createElement('div');
            dayDiv.style.cssText = 'background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); position: relative;';
            
            dayDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; font-size: 1rem; color: var(--accent);">Day ${index + 1}</h4>
                    <button type="button" class="remove-day-btn" data-index="${index}" style="background: transparent; border: none; color: #ff4444; cursor: pointer; font-size: 0.9rem;">&times; Remove</button>
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.8rem; color: var(--text-secondary);">Day Number</label>
                        <input type="number" class="day-number-input" data-index="${index}" value="${dayObj.day || index + 1}" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px;">
                    </div>
                    <div style="flex: 3;">
                        <label style="font-size: 0.8rem; color: var(--text-secondary);">Title</label>
                        <input type="text" class="day-title-input" data-index="${index}" value="${dayObj.title || ''}" placeholder="e.g. Arrival in Kathmandu" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px;">
                    </div>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.8rem; color: var(--text-secondary);">Description</label>
                    <textarea class="day-desc-input" data-index="${index}" rows="3" placeholder="Describe the day's activities..." style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px;">${dayObj.desc || ''}</textarea>
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <div style="flex: 2;">
                        <label style="font-size: 0.8rem; color: var(--text-secondary);">Metrics (Comma separated)</label>
                        <input type="text" class="day-metrics-input" data-index="${index}" value="${(dayObj.metrics || []).join(', ')}" placeholder="e.g. 10km trek, Elev 3000m" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px;">
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end;">
                        <label style="display: flex; align-items: center; gap: 5px; font-size: 0.9rem; color: #fff; cursor: pointer; padding: 8px; background: rgba(255, 107, 53, 0.1); border: 1px solid var(--accent); border-radius: 4px;">
                            <input type="checkbox" class="day-highlight-input" data-index="${index}" ${dayObj.is_highlight ? 'checked' : ''}>
                            ⭐ Mark as Highlight
                        </label>
                    </div>
                </div>
                <div>
                    <label style="font-size: 0.8rem; color: var(--text-secondary);">Philosophical Quote (Optional)</label>
                    <textarea class="day-quote-input" data-index="${index}" rows="2" placeholder="e.g. 'The mountains are calling...'" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px; font-style: italic;">${dayObj.quote || ''}</textarea>
                </div>
            `;
            
            builder.appendChild(dayDiv);
        });
        
        builder.querySelectorAll('.remove-day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                window.currentItineraryDays.splice(idx, 1);
                window.syncItineraryBuilder();
            });
        });
        
        builder.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                const val = e.target.value;
                if (e.target.classList.contains('day-number-input')) window.currentItineraryDays[idx].day = parseInt(val) || idx + 1;
                if (e.target.classList.contains('day-title-input')) window.currentItineraryDays[idx].title = val;
                if (e.target.classList.contains('day-desc-input')) window.currentItineraryDays[idx].desc = val;
                if (e.target.classList.contains('day-metrics-input')) window.currentItineraryDays[idx].metrics = val.split(',').map(s => s.trim()).filter(s => s);
                if (e.target.classList.contains('day-quote-input')) window.currentItineraryDays[idx].quote = val;
                if (e.target.classList.contains('day-highlight-input')) window.currentItineraryDays[idx].is_highlight = e.target.checked;
                window.updateHiddenItinerary();
            });
        });
        
        window.updateHiddenItinerary();
    };

    window.syncItineraryBuilder = function() {
        window.renderItineraryBuilder();
        window.updateHiddenItinerary();
    };

    window.updateHiddenItinerary = function() {
        const input = document.getElementById('pkgItinerary');
        if (input) input.value = JSON.stringify(window.currentItineraryDays, null, 2);
    };

    const addDayBtn = document.getElementById('add-itinerary-day-btn');
    if (addDayBtn) {
        addDayBtn.addEventListener('click', () => {
            window.currentItineraryDays.push({
                day: window.currentItineraryDays.length + 1,
                title: '',
                desc: '',
                metrics: [],
                is_highlight: false,
                quote: ''
            });
            window.syncItineraryBuilder();
        });
    }

    const aiBtn = document.getElementById('generate-ai-itinerary-btn');
    if (aiBtn) {
        aiBtn.addEventListener('click', async () => {
            const title = document.getElementById('pkgTitle').value;
            const duration = document.getElementById('pkgDuration').value;
            
            if (!title) {
                alert("Please enter a Trip Name first before generating the itinerary.");
                return;
            }

            const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
            if (!apiKey) {
                alert("DeepSeek API key is not configured in .env!");
                return;
            }

            aiBtn.innerHTML = '<i class="ph ph-spinner" style="animation: spin 1s linear infinite; margin-right: 4px;"></i> Generating...';
            aiBtn.disabled = true;

            try {
                let existingDataPrompt = '';
                const hasExistingData = window.currentItineraryDays && window.currentItineraryDays.some(d => d.title.trim() || d.desc.trim());
                if (hasExistingData) {
                    existingDataPrompt = `
                    CRITICAL INSTRUCTION: The user has already provided raw data/notes for the itinerary below. 
                    You MUST read this data and use it as the factual foundation. Structure it, expand the descriptions beautifully into luxury travel prose, add appropriate metrics, and determine the climax. DO NOT invent a completely new itinerary route, stick to the locations and events provided by the user:
                    
                    ${JSON.stringify(window.currentItineraryDays, null, 2)}
                    `;
                }

                const prompt = `You are an expert luxury travel itinerary generator. The user is creating a new premium trip named "${title}" which lasts for "${duration || 'unknown days'}".
                
                ${existingDataPrompt}
                
                Generate a comprehensive, day-by-day luxury itinerary. Return ONLY a valid, raw JSON array of objects without any markdown formatting, no backticks, just the JSON string starting with [ and ending with ]. 
                
                Each day object MUST contain exactly these fields:
                - "day": integer (the day number)
                - "title": string (short title of the day, e.g. "Arrival in Kathmandu")
                - "desc": string (detailed description of the day's events)
                - "metrics": array of 2-3 short strings with emojis (e.g. ["🥾 10 km trek", "🏔️ Elev: 15,200 ft", "🚌 2 hrs drive"])
                - "is_highlight": boolean (Set this to true ONLY for the 1 or 2 most climactic and significant days of the trek, like reaching a peak or a major milestone. NEVER set Day 1 or arrival days to true!)
                - "quote": string (A very short, philosophical, poetic, or inspiring quote about this specific part of the journey. Do not use quotes for every single day, just 2 or 3 days where it makes the most emotional impact. If no quote, leave as empty string "")
                `;

                const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.7
                    })
                });

                const data = await res.json();
                if (data.error) throw new Error(data.error.message);

                let content = data.choices[0].message.content;
                // Strip markdown backticks if AI ignores instruction
                content = content.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();
                
                const parsed = JSON.parse(content);
                window.currentItineraryDays = parsed;
                window.syncItineraryBuilder();
                
                alert("Itinerary generated successfully! Please review the content.");
            } catch (err) {
                console.error("AI Generation failed:", err);
                alert("AI Generation failed. See console for details.");
            } finally {
                aiBtn.innerHTML = '<i class="ph ph-sparkle" style="margin-right: 4px;"></i> Auto-Generate with AI';
                aiBtn.disabled = false;
            }
        });
    }

    // Things to Carry Builder Logic
    window.currentCarryCategories = [];

    window.renderCarryBuilder = function() {
        const builder = document.getElementById('carry-builder');
        if (!builder) return;
        
        builder.innerHTML = '';
        
        window.currentCarryCategories.forEach((catObj, index) => {
            const catDiv = document.createElement('div');
            catDiv.style.cssText = 'background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); position: relative;';
            
            catDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; font-size: 1rem; color: var(--accent);">Category ${index + 1}</h4>
                    <button type="button" class="remove-carry-btn" data-index="${index}" style="background: transparent; border: none; color: #ff4444; cursor: pointer; font-size: 0.9rem;">&times; Remove</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.8rem; color: var(--text-secondary);">Category Name</label>
                    <input type="text" class="carry-cat-input" data-index="${index}" value="${catObj.category || ''}" placeholder="e.g. Basic Gears" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; color: var(--text-secondary);">Items (Comma separated)</label>
                    <input type="text" class="carry-items-input" data-index="${index}" value="${(catObj.items || []).join(', ')}" placeholder="e.g. Backpack, Water Bottle, Trekking Poles" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px;">
                </div>
            `;
            
            builder.appendChild(catDiv);
        });
        
        builder.querySelectorAll('.remove-carry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                window.currentCarryCategories.splice(idx, 1);
                window.syncCarryBuilder();
            });
        });
        
        builder.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                const val = e.target.value;
                if (e.target.classList.contains('carry-cat-input')) window.currentCarryCategories[idx].category = val;
                if (e.target.classList.contains('carry-items-input')) window.currentCarryCategories[idx].items = val.split(',').map(s => s.trim()).filter(s => s);
                window.updateHiddenCarry();
            });
        });
        
        window.updateHiddenCarry();
    };

    window.syncCarryBuilder = function() {
        window.renderCarryBuilder();
        window.updateHiddenCarry();
    };

    window.updateHiddenCarry = function() {
        const input = document.getElementById('pkgThingsToCarry');
        if (input) input.value = JSON.stringify(window.currentCarryCategories, null, 2);
    };

    const addCarryBtn = document.getElementById('add-carry-category-btn');
    if (addCarryBtn) {
        addCarryBtn.addEventListener('click', () => {
            window.currentCarryCategories.push({
                category: '',
                items: []
            });
            window.syncCarryBuilder();
        });
    }

});
