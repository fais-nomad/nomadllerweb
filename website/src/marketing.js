import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = urlParams.get('id');
    const specificCode = urlParams.get('code');

    const loadingView = document.getElementById('loading-view');
    const formView = document.getElementById('form-view');
    const successView = document.getElementById('success-view');
    const usedView = document.getElementById('used-view');
    const invalidView = document.getElementById('invalid-view');
    const campaignTitle = document.getElementById('campaign-title');
    const displayCoupon = document.getElementById('display-coupon');
    const claimForm = document.getElementById('claim-form');
    const submitBtn = document.getElementById('submit-btn');
    const successMessageText = document.getElementById('success-message-text');
    const successCoupon = document.getElementById('success-coupon');

    function showError(type) {
        loadingView.style.display = 'none';
        if (type === 'used') {
            usedView.style.display = 'flex';
        } else {
            invalidView.style.display = 'flex';
        }
    }

    if (!campaignId || !specificCode) {
        showError('invalid');
        return;
    }

    // 1. Fetch Campaign
    const { data: campaign, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

    if (campError || !campaign) {
        showError('invalid');
        return;
    }

    // 2. Verify Code
    const { data: codeData, error: codeError } = await supabase
        .from('campaign_codes')
        .select('*')
        .eq('code', specificCode)
        .eq('campaign_id', campaignId)
        .single();
        
    if (codeError || !codeData) {
        showError('invalid');
        return;
    }
    
    if (codeData.is_used) {
        showError('used');
        return;
    }

    const generatedCoupon = specificCode;

    // 3. Show Form
    campaignTitle.textContent = campaign.name;
    displayCoupon.textContent = generatedCoupon;
    
    loadingView.style.display = 'none';
    formView.style.display = 'block';

    // 4. Handle Form Submit
    claimForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> PROCESSING...';
        submitBtn.disabled = true;

        const guestName = document.getElementById('guest-name').value.trim();
        const guestPhone = document.getElementById('guest-phone').value.trim();

        // Mark as used first to prevent double clicks (or do it concurrently)
        const { error: updateError } = await supabase
            .from('campaign_codes')
            .update({ is_used: true })
            .eq('code', generatedCoupon);

        if (updateError) {
            console.error('Error updating code:', updateError);
            alert('Error verifying code. Please try again.');
            submitBtn.innerHTML = 'CLAIM REWARD <i class="ph ph-arrow-right"></i>';
            submitBtn.disabled = false;
            return;
        }

        const { data, error: insertError } = await supabase
            .from('marketing_leads')
            .insert([{
                campaign_id: campaign.id,
                coupon_code: generatedCoupon,
                guest_name: guestName,
                guest_phone: guestPhone
            }]);

        if (insertError) {
            console.error('Error saving lead:', insertError);
            alert('There was an error claiming your reward. Please try again.');
            submitBtn.innerHTML = 'CLAIM REWARD <i class="ph ph-arrow-right"></i>';
            submitBtn.disabled = false;
        } else {
            // Show Success
            formView.style.display = 'none';
            successMessageText.innerHTML = campaign.success_message;
            successCoupon.textContent = generatedCoupon;
            
            // Set WhatsApp link
            const whatsappBtn = document.getElementById('whatsapp-booking-btn');
            if (whatsappBtn) {
                const message = encodeURIComponent(`Hi, I would like to book a trip. My name is ${name} and my coupon code is ${generatedCoupon}.`);
                whatsappBtn.href = `https://wa.me/918590171767?text=${message}`;
            }

            successView.style.display = 'block';

            // Fire confetti
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FF6B35', '#2EC4B6', '#FFFFFF']
                });
            }
        }
    });
});
