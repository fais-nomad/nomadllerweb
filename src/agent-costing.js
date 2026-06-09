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

window.showSelectTrek = () => {
    document.getElementById('section-costing-calculator').style.display = 'none';
    document.getElementById('section-select-trek').style.display = 'block';
};

// --- COSTING CALCULATOR LOGIC ---
let costingCache = {};

async function loadCostingTreks() {
    const container = document.getElementById('costing-treks-container');
    if (container) container.innerHTML = '<div style="color: var(--text-secondary);">Connecting to database...</div>';
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
    
    
});

async function openCostingDetail(trek) {
    document.getElementById('section-select-trek').style.display = 'none';
    document.getElementById('section-costing-calculator').style.display = 'block';
    const ctt = document.getElementById('calc-trek-title');
    if (ctt) ctt.textContent = `${trek.name} Calculator`;
    
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
    const gcd = document.getElementById('calc-guide-cost-display'); if(gcd) gcd.textContent = `NPR ${guideTotal.toLocaleString()}`;
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
    const pcd = document.getElementById('calc-porter-cost-display'); if(pcd) pcd.textContent = `NPR ${porterTotal.toLocaleString()}`;
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
    const pmd = document.getElementById('calc-permits-cost-display'); if(pmd) pmd.innerHTML = `NPR ${permitsSum.toLocaleString()} × ${pax} Pax = <strong>NPR ${permitsTotal.toLocaleString()}</strong>`;
    total += permitsTotal;

    // Trails & Lunches (Total Cost Per Pax for whole trek)
    let foodTotal = 0;
    const mealInc = document.getElementById('calc-meal-inclusion').value;
    const foodSection = document.getElementById('calc-food-section');
    
    if (mealInc === 'With Food' || mealInc === 'with') {
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
        const fmd = document.getElementById('calc-food-cost-display'); if(fmd) fmd.innerHTML = `(NPR ${trailsSum.toLocaleString()} + NPR ${lunchesSum.toLocaleString()}) × ${pax} Pax = <strong>NPR ${foodTotal.toLocaleString()}</strong>`;
    } else {
        if (foodSection) foodSection.style.display = 'none';
        const fcd = document.getElementById('calc-food-cost-display'); if(fcd) fcd.textContent = `NPR 0`;
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
            const rRec = document.getElementById('calc-ramechhap-rec');
            if (rRec) rRec.textContent = pax <= 3 ? "(Recommended: Sharing)" : "(Recommended: Pvt)";
            
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
        
        const fld = document.getElementById('calc-flight-details'); if(fld) fld.innerHTML = detailsText;
        const flc = document.getElementById('calc-flight-cost-display'); if(flc) flc.textContent = `NPR ${ebcFlightTotal.toLocaleString()}`;
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
        const tcd = document.getElementById('calc-transfers-cost-display'); if(tcd) tcd.textContent = `NPR ${transfersTotal.toLocaleString()}`;
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
        const hrRec = document.getElementById('calc-hotel-rooms-rec');
        if (hrRec) hrRec.textContent = `(${doubleRooms} Double/Twin, ${tripleRooms} Triple)`;

        hotelTotal = ((doubleRooms * twoBedPrice) + (tripleRooms * threeBedPrice)) * 2;
        
        let detailStr = [];
        if (doubleRooms > 0) detailStr.push(`${doubleRooms} x 2-Bed (NPR ${twoBedPrice.toLocaleString()})`);
        if (tripleRooms > 0) detailStr.push(`${tripleRooms} x 3-Bed (NPR ${threeBedPrice.toLocaleString()})`);
        
        const hd = document.getElementById('calc-hotel-details'); if(hd) hd.innerHTML = detailStr.length > 0 ? `(${detailStr.join(' + ')}) × 2 Nights = <strong>NPR ${hotelTotal.toLocaleString()}</strong>` : 'No rooms assigned.';
        const hcd = document.getElementById('calc-hotel-cost-display'); if(hcd) hcd.textContent = `NPR ${hotelTotal.toLocaleString()}`;
        total += hotelTotal;
    } else {
        const hrRec2 = document.getElementById('calc-hotel-rooms-rec');
        if (hrRec2) hrRec2.textContent = '';
        const htc = document.getElementById('calc-hotel-details'); if(htc) htc.textContent = 'No hotel selected.';
        const hcd = document.getElementById('calc-hotel-cost-display'); if(hcd) hcd.textContent = 'NPR 0';
    }

    // --- APPLY AGENT MARKUP ---
    let perPersonMarkup = 12800;
    if (cCode.includes('abc') || cCode.includes('annapurna')) {
        perPersonMarkup = 9600;
    }
    const totalMarkup = perPersonMarkup * pax;
    total += totalMarkup;

    const totalStr = `NPR ${total.toLocaleString()}`;
    const tct = document.getElementById('calc-total-cost'); if(tct) tct.textContent = totalStr;
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCostingTreks);
} else {
    loadCostingTreks();
}
