// --- COSTING CALCULATOR LOGIC ---
window.costingCache = {};

window.loadCostingTreks = async function() {
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
                window.openCostingDetail(trek);
            });

            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading costing treks:', err);
        container.innerHTML = '<p style="color: red;">Error loading treks.</p>';
    }
};

document.getElementById('btn-back-costing')?.addEventListener('click', () => {
    document.getElementById('costing-detail-view').style.display = 'none';
    document.getElementById('costing-master-view').style.display = 'block';
});

window.openCostingDetail = async function(trek) {
    document.getElementById('costing-master-view').style.display = 'none';
    document.getElementById('costing-detail-view').style.display = 'block';
    document.getElementById('costing-trek-title').textContent = `${trek.name} Calculator`;
    
    // Reset cache and inputs
    window.costingCache = { guides: [], porters: [], permits: [], trails: [], lunches: [], transfers: [], cloudHotels: [], cloudTransports: [], trekCode: trek.code };
    document.getElementById('calc-pax').value = 2;
    document.getElementById('calc-days').value = trek.days || 14;

    // Show/hide EBC logic
    const isEbc = trek.code === 'ebc' || trek.code === 'ebc-gokyo';
    document.getElementById('calc-ebc-flight-group').style.display = isEbc ? 'block' : 'none';
    
    // Default Ramechhap logic
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

        if (guidesRes.data) window.costingCache.guides = guidesRes.data;
        if (portersRes.data) window.costingCache.porters = portersRes.data;
        if (permitsRes.data) window.costingCache.permits = permitsRes.data;
        if (trailsRes.data) window.costingCache.trails = trailsRes.data;
        if (lunchesRes.data) window.costingCache.lunches = lunchesRes.data;
        if (transRes.data) window.costingCache.transfers = transRes.data;
        if (hotelsRes.data) window.costingCache.cloudHotels = hotelsRes.data;
        if (transportsRes.data) window.costingCache.cloudTransports = transportsRes.data;

        window.renderCostingUI();
        window.calculateCostingTotal();
    } catch (err) {
        console.error(err);
        alert('Error fetching trek data for costing');
    }
};

window.renderCostingUI = function() {
    // Checkbox Lists Generator
    const generateCheckboxes = (containerId, items, valueKey, labelFn, namePrefix) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        items.forEach((item, index) => {
            const id = `chk_${namePrefix}_${index}`;
            container.innerHTML += `
                <label style="display: flex; align-items: center; gap: 0.5rem; color: white; cursor: pointer;">
                    <input type="checkbox" class="calc-checkbox ${namePrefix}-chk" value="${item[valueKey]}" onchange="window.calculateCostingTotal()" checked>
                    ${labelFn(item)}
                </label>
            `;
        });
    };

    generateCheckboxes('calc-trails-container', window.costingCache.trails, 'cost_per_day_per_person', i => `${i.location} (NPR ${i.cost_per_day_per_person})`, 'trail');
    generateCheckboxes('calc-lunches-container', window.costingCache.lunches, 'cost', i => `${i.place} (NPR ${i.cost})`, 'lunch');
    generateCheckboxes('calc-transfers-container', window.costingCache.transfers, 'cost', i => `${i.transfer_type} - ${i.departure} to ${i.arrival} (NPR ${i.cost})`, 'transfer');
};

window.calculateCostingTotal = () => {
    const pax = parseInt(document.getElementById('calc-pax').value) || 0;
    const days = parseInt(document.getElementById('calc-days').value) || 0;
    let total = 0;

    // Guide Allocation
    let mainGuides = 0, asstGuides = 0;
    if (pax <= 6) { mainGuides = 1; asstGuides = 0; }
    else if (pax <= 12) { mainGuides = 1; asstGuides = 1; }
    else if (pax <= 16) { mainGuides = 1; asstGuides = 2; }
    else { mainGuides = 2; asstGuides = 2; }
    
    let mainGuideCost = 0, asstGuideCost = 0;
    const mGuide = window.costingCache.guides.find(g => g.name && !g.name.toLowerCase().includes('assistant')); 
    const aGuide = window.costingCache.guides.find(g => g.name && g.name.toLowerCase().includes('assistant'));
    
    if (mGuide) mainGuideCost = parseFloat(mGuide.cost_per_day) || 0;
    if (aGuide) asstGuideCost = parseFloat(aGuide.cost_per_day) || 0;
    
    const guideTotal = ((mainGuides * mainGuideCost) + (asstGuides * asstGuideCost)) * days;
    total += guideTotal;
    const guideDisp = document.getElementById('calc-guide-cost-display');
    if (guideDisp) guideDisp.textContent = `NPR ${guideTotal.toLocaleString()} (${mainGuides} Main, ${asstGuides} Asst)`;

    // Porter Allocation (1 for every 2 pax)
    const porters = Math.ceil(pax / 2);
    let porterCost = 0;
    if (window.costingCache.porters.length > 0) {
        porterCost = parseFloat(window.costingCache.porters[0].cost_per_day) || 0;
    }
    const porterTotal = (porters * porterCost) * days;
    total += porterTotal;
    const porterDisp = document.getElementById('calc-porter-cost-display');
    if (porterDisp) porterDisp.textContent = `NPR ${porterTotal.toLocaleString()} (${porters} Porters)`;

    // Permits (Fixed per pax)
    let permitTotal = 0;
    window.costingCache.permits.forEach(p => {
        permitTotal += (parseFloat(p.cost) || 0) * pax;
    });
    total += permitTotal;
    const permitDisp = document.getElementById('calc-permit-cost-display');
    if (permitDisp) permitDisp.textContent = `NPR ${permitTotal.toLocaleString()}`;

    // Kathmandu Hotels
    const hotelCat = document.getElementById('calc-hotel-cat')?.value;
    const roomType = document.getElementById('calc-hotel-room-type')?.value;
    let hotelTotal = 0;
    if (hotelCat && roomType) {
        const ktmHotels = window.costingCache.cloudHotels.filter(h => 
            h.location === 'Kathmandu' && 
            h.star_category === hotelCat && 
            h.room_type === roomType
        );
        let selectedHotelPrice = 0;
        if (ktmHotels.length > 0) {
            selectedHotelPrice = parseFloat(ktmHotels[0].price_per_night) || 0;
        }

        let numRooms = 0;
        if (roomType === 'Single') {
            numRooms = pax;
        } else if (roomType === 'Double') {
            numRooms = Math.ceil(pax / 2);
        } else if (roomType === 'Triple') {
            numRooms = Math.ceil(pax / 3);
        } else if (roomType === 'Double & Triple') {
            numRooms = Math.floor(pax / 2);
            if (pax % 2 !== 0) numRooms++; // This is simplified
        }
        
        hotelTotal = selectedHotelPrice * numRooms;
        total += hotelTotal;
        const hotelDisp = document.getElementById('calc-hotel-cost-display');
        if (hotelDisp) hotelDisp.textContent = `NPR ${hotelTotal.toLocaleString()} (${numRooms} Rooms at ${selectedHotelPrice})`;
    }

    // Dynamic checkboxes (Trails, Lunches, Transfers)
    let dynamicTotal = 0;
    let trailTotal = 0, lunchTotal = 0, transferTotal = 0;

    document.querySelectorAll('.trail-chk:checked').forEach(cb => { trailTotal += (parseFloat(cb.value) || 0) * pax; });
    document.querySelectorAll('.lunch-chk:checked').forEach(cb => { lunchTotal += (parseFloat(cb.value) || 0) * pax; });
    document.querySelectorAll('.transfer-chk:checked').forEach(cb => { 
        // Note: Regular transfers checkboxes (from trek_transfers) usually don't include flight/long_route if they are handled separately, 
        // but if they do, we sum them here. Wait, EBC flights and long route are calculated explicitly below.
        // Usually, the UI checkboxes are for standard sharing/local transfers.
        transferTotal += parseFloat(cb.value) || 0; 
    });

    // Check Meal Inclusion
    const mealInc = document.getElementById('calc-meal-inclusion')?.value;
    if (mealInc === 'With Food') {
        dynamicTotal += trailTotal;
        dynamicTotal += lunchTotal;
    } else {
        trailTotal = 0;
        lunchTotal = 0;
    }
    dynamicTotal += transferTotal;
    
    // EBC Special Flight Logic
    let ebcFlightTotal = 0;
    if (window.costingCache.trekCode === 'ebc' || window.costingCache.trekCode === 'ebc-gokyo') {
        const flightOpt = document.getElementById('calc-flight-opt').value; // 'Kathmandu' or 'Ramechhap'
        let flightCostPerPax = 0;
        
        // Find flight cost in transfers cache
        const flightTransfers = window.costingCache.transfers.filter(t => {
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
            const rModeLabel = document.getElementById('calc-ramechhap-rec');
            if (rModeLabel) rModeLabel.textContent = pax <= 3 ? "(Recommended: Sharing)" : "(Recommended: Pvt)";
            
            if (rMode === 'Sharing') {
                let shareCostPerPax = 0;
                window.costingCache.transfers.forEach(t => {
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
                window.costingCache.transfers.forEach(t => {
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
        
        dynamicTotal += ebcFlightTotal;
        const ebcDisp = document.getElementById('calc-ebc-flight-display');
        if (ebcDisp) ebcDisp.innerHTML = detailsText;
    }

    total += dynamicTotal;
    
    const foodDisp = document.getElementById('calc-food-cost-display');
    if (foodDisp) foodDisp.textContent = `NPR ${(trailTotal + lunchTotal).toLocaleString()}`;
    const transDisp = document.getElementById('calc-transfers-cost-display');
    if (transDisp) transDisp.textContent = `NPR ${transferTotal.toLocaleString()}`;

    let ppTotal = total / (pax || 1);

    // ======== AGENT MARKUP LOGIC ========
    if (window.IS_AGENT_PORTAL) {
        ppTotal += 8000;
        total = ppTotal * (pax || 1);
    }
    // ====================================

    const totalStr = `NPR ${total.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    const topTotal = document.getElementById('calc-total-cost');
    if (topTotal) topTotal.textContent = totalStr;
    const bottomTotal = document.getElementById('calc-total-cost-bottom');
    if (bottomTotal) bottomTotal.textContent = totalStr;
    const ppBottom = document.getElementById('calc-pp-cost-bottom');
    if (ppBottom) ppBottom.textContent = `NPR ${ppTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}`;

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

    // Convert to INR and USD (Per Person)
    const ppInr = document.getElementById('calc-pp-inr');
    const ppUsd = document.getElementById('calc-pp-usd');
    if (ppInr && ppUsd) {
        const rateInr = window.liveRates?.INR || 0.625;
        const rateUsd = window.liveRates?.USD || 0.0075;
        const ppInrTotal = ppTotal * rateInr;
        const ppUsdTotal = ppTotal * rateUsd;

        ppInr.textContent = `INR ${ppInrTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        ppUsd.textContent = `USD ${ppUsdTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    }
};

// Listeners for global inputs
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calc-pax')?.addEventListener('input', window.calculateCostingTotal);
    document.getElementById('calc-days')?.addEventListener('input', window.calculateCostingTotal);
    document.getElementById('calc-meal-inclusion')?.addEventListener('change', window.calculateCostingTotal);
    document.getElementById('calc-flight-opt')?.addEventListener('change', (e) => {
        const ramechhapGroup = document.getElementById('calc-ramechhap-mode-group');
        if (ramechhapGroup) ramechhapGroup.style.display = e.target.value === 'Ramechhap' ? 'block' : 'none';
        window.calculateCostingTotal();
    });
    document.getElementById('calc-ramechhap-mode')?.addEventListener('change', window.calculateCostingTotal);
    document.getElementById('calc-hotel-cat')?.addEventListener('change', window.calculateCostingTotal);
    document.getElementById('calc-hotel-room-type')?.addEventListener('change', window.calculateCostingTotal);
});
