import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Logic ---
    const navMarketing = document.getElementById('nav-marketing');
    const viewMarketing = document.getElementById('marketing-view-section');
    const mainDashboardTitle = document.getElementById('main-dashboard-title');
    
    const allNavItems = document.querySelectorAll('.sidebar-nav .nav-item');
    allNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.id !== 'nav-marketing') {
                if (viewMarketing) viewMarketing.style.display = 'none';
                if (navMarketing) navMarketing.classList.remove('active');
            }
        });
    });

    if (navMarketing) {
        navMarketing.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.dashboard-wrapper .main-content > div[id$="-section"], .dashboard-wrapper .main-content > div[id$="-view"]').forEach(el => {
                if (el.id !== 'marketing-view-section') el.style.display = 'none';
            });
            allNavItems.forEach(nav => nav.classList.remove('active'));
            if (viewMarketing) viewMarketing.style.display = 'block';
            navMarketing.classList.add('active');
            if (mainDashboardTitle) mainDashboardTitle.textContent = 'Marketing & Campaigns';
            showCampaignsList();
        });
    }

    // --- Views ---
    const campaignsListView   = document.getElementById('campaigns-list-view');
    const campaignDetailView  = document.getElementById('campaign-detail-view');
    const addCampaignForm     = document.getElementById('add-campaign-form');
    const createCampaignBtn   = document.getElementById('create-campaign-btn');
    const campaignsTableBody  = document.getElementById('campaigns-table-body');

    // Detail view elements
    const detailCampName      = document.getElementById('detail-camp-name');
    const detailCampStatus    = document.getElementById('detail-camp-status');
    const detailLeadsBody     = document.getElementById('detail-leads-body');
    const detailLeadsCount    = document.getElementById('detail-leads-count');
    const btnBackToCampaigns  = document.getElementById('btn-back-to-campaigns');
    const btnDetailEdit       = document.getElementById('btn-detail-edit');
    const btnDetailStop       = document.getElementById('btn-detail-stop');
    const btnDetailDelete     = document.getElementById('btn-detail-delete');
    const btnDetailCoupons    = document.getElementById('btn-detail-coupons');

    let currentCampaign = null;

    function showCampaignsList() {
        if (campaignsListView) campaignsListView.style.display = 'block';
        if (campaignDetailView) campaignDetailView.style.display = 'none';
        loadCampaigns();
    }

    function showCampaignDetail(camp) {
        currentCampaign = camp;
        if (campaignsListView) campaignsListView.style.display = 'none';
        if (campaignDetailView) campaignDetailView.style.display = 'block';

        if (detailCampName) detailCampName.textContent = camp.name;
        const isActive = camp.status !== 'stopped';
        if (detailCampStatus) {
            detailCampStatus.textContent = isActive ? '● Active' : '⏸ Stopped';
            detailCampStatus.style.color = isActive ? '#2EC4B6' : '#aaa';
        }
        if (btnDetailStop) {
            btnDetailStop.textContent = isActive ? '⏸ Stop Campaign' : '▶ Resume Campaign';
        }
        loadCampaignLeads(camp.id);
    }

    // Back button
    if (btnBackToCampaigns) {
        btnBackToCampaigns.addEventListener('click', () => showCampaignsList());
    }

    // --- Create Campaign ---
    if (addCampaignForm) {
        addCampaignForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            createCampaignBtn.textContent = 'CREATING...';
            createCampaignBtn.disabled = true;

            const id = document.getElementById('campaignId').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
            const name = document.getElementById('campaignName').value.trim();
            const successMsg = document.getElementById('campaignSuccessMsg').value.trim();

            const { error } = await supabase
                .from('campaigns')
                .insert([{ id, name, success_message: successMsg }]);

            createCampaignBtn.textContent = 'CREATE CAMPAIGN';
            createCampaignBtn.disabled = false;

            if (error) {
                alert('Error creating campaign. The ID might already exist.');
            } else {
                alert('Campaign created successfully!');
                addCampaignForm.reset();
                loadCampaigns();
            }
        });
    }

    // --- Load Campaigns List ---
    async function loadCampaigns() {
        if (!campaignsTableBody) return;
        campaignsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; opacity:0.5;">Loading...</td></tr>';

        const { data: campaigns, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !campaigns) {
            campaignsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error loading campaigns.</td></tr>';
            return;
        }

        campaignsTableBody.innerHTML = '';

        if (campaigns.length === 0) {
            campaignsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No campaigns yet. Create one above.</td></tr>';
            return;
        }

        campaigns.forEach(camp => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            const isActive = camp.status !== 'stopped';

            const statusBadge = isActive
                ? `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(46,196,182,0.12);color:#2EC4B6;border:1px solid rgba(46,196,182,0.3);padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;letter-spacing:0.5px;">● ACTIVE</span>`
                : `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(150,150,150,0.1);color:#888;border:1px solid rgba(150,150,150,0.25);padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;letter-spacing:0.5px;">⏸ STOPPED</span>`;

            const btnBase = `border:none; cursor:pointer; border-radius:8px; padding:0.45rem 0.85rem; font-size:0.78rem; font-weight:700; display:inline-flex; align-items:center; gap:5px; transition:opacity 0.15s; white-space:nowrap;`;

            tr.innerHTML = `
                <td><code style="background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:5px;font-size:0.8rem;">${camp.id}</code></td>
                <td style="font-weight:600;">${camp.name}</td>
                <td>${statusBadge}</td>
                <td style="opacity:0.55;font-size:0.85rem;">${new Date(camp.created_at).toLocaleDateString()}</td>
                <td>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button class="btn-view-camp" data-id="${camp.id}" title="View Registrations"
                            style="${btnBase} background:#2EC4B6; color:#0a1a1a;">
                            👁 View
                        </button>
                        <button class="btn-generate-coupons" data-id="${camp.id}" title="Generate & Print Coupons"
                            style="${btnBase} background:#FF6B35; color:white;">
                            🖨 Coupons
                        </button>
                        <div style="width:1px;height:24px;background:rgba(255,255,255,0.1);margin:0 2px;"></div>
                        <button class="btn-edit-camp" data-id="${camp.id}" title="Edit Campaign Name"
                            style="${btnBase} background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.8); border:1px solid rgba(255,255,255,0.12);">
                            ✏️
                        </button>
                        <button class="btn-stop-camp" data-id="${camp.id}" data-status="${camp.status}" title="${isActive ? 'Stop Campaign' : 'Resume Campaign'}"
                            style="${btnBase} background:rgba(255,255,255,0.07); color:${isActive ? '#f0ad4e' : '#2EC4B6'}; border:1px solid rgba(255,255,255,0.12);">
                            ${isActive ? '⏸' : '▶'}
                        </button>
                        <button class="btn-delete-camp" data-id="${camp.id}" title="Delete Campaign"
                            style="${btnBase} background:rgba(220,53,69,0.12); color:#dc3545; border:1px solid rgba(220,53,69,0.25);">
                            🗑
                        </button>
                    </div>
                </td>
            `;
            campaignsTableBody.appendChild(tr);
        });

        // VIEW
        document.querySelectorAll('.btn-view-camp').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const campId = btn.getAttribute('data-id');
                const camp = campaigns.find(c => c.id === campId);
                if (camp) showCampaignDetail(camp);
            });
        });

        // EDIT
        document.querySelectorAll('.btn-edit-camp').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const campId = btn.getAttribute('data-id');
                const camp = campaigns.find(c => c.id === campId);
                if (!camp) return;
                const newName = prompt('Edit campaign name:', camp.name);
                if (!newName || newName.trim() === camp.name) return;
                const { error } = await supabase.from('campaigns').update({ name: newName.trim() }).eq('id', campId);
                if (error) { alert('Error updating campaign.'); } 
                else { loadCampaigns(); }
            });
        });

        // STOP / RESUME
        document.querySelectorAll('.btn-stop-camp').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const campId = btn.getAttribute('data-id');
                const currentStatus = btn.getAttribute('data-status');
                const newStatus = currentStatus === 'stopped' ? 'active' : 'stopped';
                const action = newStatus === 'stopped' ? 'stop' : 'resume';
                if (!confirm(`Are you sure you want to ${action} this campaign?`)) return;
                const { error } = await supabase.from('campaigns').update({ status: newStatus }).eq('id', campId);
                if (error) { alert('Error updating status.'); }
                else { loadCampaigns(); }
            });
        });

        // DELETE
        document.querySelectorAll('.btn-delete-camp').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const campId = btn.getAttribute('data-id');
                if (!confirm(`⚠️ Delete campaign "${campId}"?\n\nThis will also delete ALL its coupons and leads. This cannot be undone.`)) return;
                const { error } = await supabase.from('campaigns').delete().eq('id', campId);
                if (error) { alert('Error deleting campaign.'); }
                else { loadCampaigns(); }
            });
        });

        // PRINT COUPONS
        document.querySelectorAll('.btn-generate-coupons').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await generateCoupons(btn, btn.getAttribute('data-id'));
            });
        });
    }

    // --- Generate Coupons ---
    async function generateCoupons(btn, campId) {
        const countStr = prompt(`How many coupons for "${campId}"? (max 500)`);
        if (!countStr) return;
        const count = parseInt(countStr, 10);
        if (isNaN(count) || count <= 0 || count > 500) {
            alert('Please enter a valid number between 1 and 500.');
            return;
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Generating...';
        btn.disabled = true;

        const newCodes = [];
        const insertPayload = [];
        for (let i = 0; i < count; i++) {
            const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
            const code = `NOV-${randomChars}`;
            newCodes.push(code);
            insertPayload.push({ code, campaign_id: campId });
        }

        const { error } = await supabase.from('campaign_codes').insert(insertPayload);
        btn.innerHTML = originalText;
        btn.disabled = false;

        if (error) {
            alert('Failed to save codes. Please try again.');
            return;
        }

        sessionStorage.setItem('print_campaign_id', campId);
        sessionStorage.setItem('print_campaign_codes', JSON.stringify(newCodes));
        window.open('/print-coupons.html', '_blank');
    }

    // --- Campaign Detail: Load Leads ---
    async function loadCampaignLeads(campId) {
        if (!detailLeadsBody) return;
        detailLeadsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; opacity:0.5;">Loading registrations...</td></tr>';

        const { data: leads, error } = await supabase
            .from('marketing_leads')
            .select('*')
            .eq('campaign_id', campId)
            .order('created_at', { ascending: false });

        if (error) {
            detailLeadsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error loading data.</td></tr>';
            return;
        }

        if (detailLeadsCount) detailLeadsCount.textContent = leads.length;

        if (leads.length === 0) {
            detailLeadsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; opacity:0.6;">No registrations yet for this campaign.</td></tr>';
            return;
        }

        detailLeadsBody.innerHTML = '';
        leads.forEach((lead, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="opacity:0.6;">${i + 1}</td>
                <td><strong>${lead.guest_name}</strong></td>
                <td>${lead.guest_phone}</td>
                <td><code style="color: var(--admin-primary); font-size:0.85rem;">${lead.coupon_code}</code></td>
                <td style="opacity:0.6;">${new Date(lead.created_at).toLocaleString()}</td>
            `;
            detailLeadsBody.appendChild(tr);
        });
    }

    // --- Detail View Action Buttons ---
    if (btnDetailEdit) {
        btnDetailEdit.addEventListener('click', async () => {
            if (!currentCampaign) return;
            const newName = prompt('Edit campaign name:', currentCampaign.name);
            if (!newName || newName.trim() === currentCampaign.name) return;
            const { error } = await supabase.from('campaigns').update({ name: newName.trim() }).eq('id', currentCampaign.id);
            if (error) { alert('Error updating.'); }
            else {
                currentCampaign.name = newName.trim();
                detailCampName.textContent = newName.trim();
                alert('Campaign name updated!');
            }
        });
    }

    if (btnDetailStop) {
        btnDetailStop.addEventListener('click', async () => {
            if (!currentCampaign) return;
            const isActive = currentCampaign.status !== 'stopped';
            const newStatus = isActive ? 'stopped' : 'active';
            const action = isActive ? 'stop' : 'resume';
            if (!confirm(`Are you sure you want to ${action} this campaign?`)) return;
            const { error } = await supabase.from('campaigns').update({ status: newStatus }).eq('id', currentCampaign.id);
            if (error) { alert('Error updating status.'); }
            else {
                currentCampaign.status = newStatus;
                showCampaignDetail(currentCampaign);
            }
        });
    }

    if (btnDetailDelete) {
        btnDetailDelete.addEventListener('click', async () => {
            if (!currentCampaign) return;
            if (!confirm(`⚠️ Delete "${currentCampaign.name}"?\n\nAll coupons and leads will be permanently deleted. This cannot be undone.`)) return;
            const { error } = await supabase.from('campaigns').delete().eq('id', currentCampaign.id);
            if (error) { alert('Error deleting campaign.'); }
            else { showCampaignsList(); }
        });
    }

    if (btnDetailCoupons) {
        btnDetailCoupons.addEventListener('click', async () => {
            if (!currentCampaign) return;
            await generateCoupons(btnDetailCoupons, currentCampaign.id);
        });
    }
});
