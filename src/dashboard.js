import gsap from 'gsap';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
                                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
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
});
