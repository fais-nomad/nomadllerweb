import gsap from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
    // Reveal animations
    gsap.fromTo('.login-card', 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );

    const loginForm = document.getElementById('admin-login-form');
    const errorMsg = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Basic dummy validation: admin / admin
            if (username === 'admin' && password === 'admin') {
                gsap.to('.login-card', {
                    y: -50,
                    opacity: 0,
                    duration: 0.5,
                    ease: "power3.in",
                    onComplete: () => {
                        window.location.href = '/dashboard.html';
                    }
                });
            } else {
                errorMsg.style.display = 'block';
                // Shake animation for error
                gsap.fromTo('.login-card', 
                    { x: -10 }, 
                    { x: 10, duration: 0.1, yoyo: true, repeat: 5, onComplete: () => {
                        gsap.to('.login-card', { x: 0, duration: 0.1 });
                    }}
                );
            }
        });
    }
});
