import gsap from 'gsap';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
document.addEventListener('DOMContentLoaded', () => {
    // Check if agent is logged in
    const agentDataStr = localStorage.getItem('nomadller_agent');
    
    if (!agentDataStr) {
        // Not logged in, redirect to home
        window.location.href = '/#agent-access';
        return;
    }

    const agentData = JSON.parse(agentDataStr);

    // Populate Agent Info
    const welcomeName = document.getElementById('agent-welcome-name');
    const mainTitle = document.getElementById('agent-main-title');

    if (welcomeName) welcomeName.textContent = `Welcome, ${agentData.name}`;
    if (mainTitle) mainTitle.textContent = `Hello, ${agentData.name}!`;

    // Animations
    gsap.fromTo('.agent-welcome', 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );

    gsap.fromTo('.resource-card', 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.3, ease: "power2.out" }
    );

    // Logout logic
    const logoutBtn = document.getElementById('agent-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('nomadller_agent');
            gsap.to('body', {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    window.location.href = '/';
                }
            });
        });
    }

    // Resource buttons
    const fixedDeparturesBtn = document.getElementById('fixed-departures-btn');
    if (fixedDeparturesBtn) {
        fixedDeparturesBtn.addEventListener('click', () => {
            window.location.href = '/agent-fixed-departures';
        });
    }

    document.querySelectorAll('.resource-card button:not(#fixed-departures-btn):not([onclick])').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('This feature will be available shortly. Please contact Nomadller Admin for immediate assistance.');
        });
    });

    // --- PROFILE LOGIC ---
    const profileBtn = document.getElementById('agent-profile-btn');
    const profileModal = document.getElementById('agent-profile-modal');
    const closeProfileBtn = document.getElementById('close-profile-modal');
    const profileForm = document.getElementById('agent-profile-form');

    if (profileBtn && profileModal) {
        // Open Modal and Fetch Data
        profileBtn.addEventListener('click', async () => {
            profileModal.style.display = 'flex';
            gsap.fromTo('.modal-content', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });

            // Fetch latest agent data
            try {
                const { data, error } = await supabase
                    .from('agents')
                    .select('*')
                    .eq('agent_code', agentData.code)
                    .single();
                
                if (error) throw error;

                if (data) {
                    document.getElementById('prof-company').value = data.company_name || agentData.name || '';
                    document.getElementById('prof-caption').value = data.caption || '';
                    document.getElementById('prof-logo-url').value = data.logo_url || '';
                    document.getElementById('prof-email').value = data.contact_email || '';
                    document.getElementById('prof-phone').value = data.phone_number || '';

                    // Show logo preview if exists
                    if (data.logo_url) {
                        const previewContainer = document.getElementById('logo-preview-container');
                        const previewImg = document.getElementById('logo-preview-img');
                        previewImg.src = data.logo_url;
                        previewContainer.style.display = 'block';
                    }
                }
            } catch (err) {
                console.error('Error fetching agent profile:', err);
            }
        });

        // Close Modal
        closeProfileBtn.addEventListener('click', () => {
            gsap.to('.modal-content', { 
                y: 50, opacity: 0, duration: 0.3, 
                onComplete: () => { profileModal.style.display = 'none'; } 
            });
        });

        // Logo file upload preview
        const logoFileInput = document.getElementById('prof-logo-file');
        const logoUrlInput = document.getElementById('prof-logo-url');
        const logoPreviewContainer = document.getElementById('logo-preview-container');
        const logoPreviewImg = document.getElementById('logo-preview-img');

        if (logoFileInput) {
            logoFileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Show local preview immediately
                const localUrl = URL.createObjectURL(file);
                logoPreviewImg.src = localUrl;
                logoPreviewContainer.style.display = 'block';
                logoUrlInput.value = ''; // clear manual URL
                logoUrlInput.placeholder = 'Uploading...';

                // Upload to Supabase Storage
                try {
                    const ext = file.name.split('.').pop();
                    const fileName = `logos/${agentData.code}_${Date.now()}.${ext}`;
                    const { data, error } = await supabase.storage
                        .from('agent-assets')
                        .upload(fileName, file, { upsert: true, contentType: file.type });

                    if (error) throw error;

                    const { data: urlData } = supabase.storage
                        .from('agent-assets')
                        .getPublicUrl(fileName);

                    logoUrlInput.value = urlData.publicUrl;
                    logoUrlInput.placeholder = 'https://example.com/logo.png';
                    logoPreviewImg.src = urlData.publicUrl;
                } catch (err) {
                    console.error('Logo upload error:', err);
                    // Fall back — keep local preview, agent can paste URL manually
                    logoUrlInput.placeholder = 'Upload failed. Paste URL manually.';
                }
            });
        }

        // URL input preview update
        if (logoUrlInput) {
            logoUrlInput.addEventListener('change', () => {
                if (logoUrlInput.value) {
                    logoPreviewImg.src = logoUrlInput.value;
                    logoPreviewContainer.style.display = 'block';
                }
            });
        }

        // Save Profile
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('save-profile-btn');
            submitBtn.textContent = 'SAVING...';
            submitBtn.disabled = true;

            const updates = {
                company_name: document.getElementById('prof-company').value,
                caption: document.getElementById('prof-caption').value,
                logo_url: document.getElementById('prof-logo-url').value,
                contact_email: document.getElementById('prof-email').value,
                phone_number: document.getElementById('prof-phone').value
            };

            try {
                const { error } = await supabase
                    .from('agents')
                    .update(updates)
                    .eq('agent_code', agentData.code);

                if (error) throw error;

                alert('Profile updated successfully!');
                gsap.to('.modal-content', { 
                    y: 50, opacity: 0, duration: 0.3, 
                    onComplete: () => { profileModal.style.display = 'none'; } 
                });
            } catch (err) {
                console.error('Error updating profile:', err);
                alert('Failed to update profile.');
            } finally {
                submitBtn.textContent = 'SAVE PROFILE';
                submitBtn.disabled = false;
            }
        });
    }
});
