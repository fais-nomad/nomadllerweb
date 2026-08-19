import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const agentForm = document.getElementById('agent-access-form');
    
    if (agentForm) {
        agentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const codeInput = document.getElementById('agent-code').value;
            const submitBtn = agentForm.querySelector('button[type="submit"]');
            
            if (!codeInput) return;

            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Verifying...';
            submitBtn.disabled = true;

            try {
                // Check if the agent code exists in Supabase
                const { data, error } = await supabase
                    .from('agents')
                    .select('*')
                    .eq('agent_code', codeInput.toUpperCase())
                    .single();

                if (error || !data) {
                    const errorDiv = document.getElementById('login-error');
                    if (errorDiv) {
                        errorDiv.style.display = 'block';
                        errorDiv.textContent = 'Invalid Agent Code. Access denied.';
                        // Optional simple shake
                        if (window.gsap) {
                            window.gsap.fromTo('.login-card', { x: -10 }, { x: 10, duration: 0.1, yoyo: true, repeat: 5, onComplete: () => window.gsap.to('.login-card', { x: 0, duration: 0.1 }) });
                        }
                    } else {
                        alert('Invalid Agent Code. Please try again or contact support.');
                    }
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    return;
                }

                // If valid, store agent info in localStorage and redirect
                localStorage.setItem('nomadller_agent', JSON.stringify({
                    id: data.id,
                    name: data.agent_name,
                    code: data.agent_code
                }));

                // Animate out if gsap available
                if (window.gsap && document.querySelector('.login-card')) {
                    window.gsap.to('.login-card', {
                        y: -50, opacity: 0, duration: 0.5, ease: "power3.in",
                        onComplete: () => { window.location.href = '/agent-dashboard'; }
                    });
                } else {
                    window.location.href = '/agent-dashboard';
                }

            } catch (err) {
                console.error('Agent auth error:', err);
                alert('An error occurred. Please try again later.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
