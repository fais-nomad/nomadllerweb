import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Initialize Lenis
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// Nav Scroll Effect
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Hero Parallax
gsap.to('.hero-slider', {
  yPercent: 30,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true
  }
});

// Slider Logic
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const heroTitle = document.querySelector('.hero-title');
const heroSubtitle = document.querySelector('.hero-subtitle');
let currentSlide = 0;

function updateHero(index) {
  // Remove active classes
  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));

  // Add active classes
  slides[index].classList.add('active');
  dots[index].classList.add('active');

  // Animate text change
  const newTitle = slides[index].getAttribute('data-title').replace(' ', '<br>');
  const newSubtitle = slides[index].getAttribute('data-subtitle');

  gsap.to([heroTitle, heroSubtitle], {
    opacity: 0,
    y: 20,
    duration: 0.5,
    onComplete: () => {
      heroTitle.innerHTML = newTitle;
      heroSubtitle.textContent = newSubtitle;
      gsap.to([heroTitle, heroSubtitle], {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
      });
    }
  });
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  updateHero(currentSlide);
}

// Auto transition every 5 seconds
let sliderInterval = setInterval(nextSlide, 5000);

// Dot navigation
dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    clearInterval(sliderInterval);
    currentSlide = i;
    updateHero(i);
    sliderInterval = setInterval(nextSlide, 5000);
  });
});

// Reveal Animations
const reveals = document.querySelectorAll('.reveal');

reveals.forEach((el) => {
  gsap.fromTo(el, 
    {
      opacity: 0,
      y: 50,
      filter: 'blur(10px)'
    },
    {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    }
  );
});

// Package Cards Staggered Reveal
gsap.from('.package-card', {
  opacity: 0,
  y: 20,
  stagger: 0.05,
  duration: 0.6,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '.packages-grid',
    start: 'top 90%',
    toggleActions: 'play none none none'
  }
});

// Magnetic Button Effect (Simple version)
const btn = document.querySelector('.btn');
if (btn) {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    gsap.to(btn, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.5,
      ease: 'power2.out'
    });
  });

  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.3)'
    });
  });
}

// Package Cards Arrow Navigation
const grid = document.querySelector('.packages-grid');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');

if (grid && nextBtn && prevBtn) {
  nextBtn.addEventListener('click', () => {
    const cardWidth = grid.querySelector('.package-card').offsetWidth + 32; // width + gap
    grid.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });

  prevBtn.addEventListener('click', () => {
    const cardWidth = grid.querySelector('.package-card').offsetWidth + 32; // width + gap
    grid.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });
}

// Story Slider Arrow Navigation
const storyGrid = document.querySelector('.stories-grid');
const storyNext = document.getElementById('story-next');
const storyPrev = document.getElementById('story-prev');

if (storyGrid && storyNext && storyPrev) {
  storyNext.addEventListener('click', () => {
    const cardWidth = storyGrid.querySelector('.story-card').offsetWidth + 32;
    storyGrid.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });

  storyPrev.addEventListener('click', () => {
    const cardWidth = storyGrid.querySelector('.story-card').offsetWidth + 32;
    storyGrid.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });
}

// Why Nomadller Slider Arrow Navigation
const whyGrid = document.querySelector('.features-grid');
const whyNext = document.getElementById('why-next');
const whyPrev = document.getElementById('why-prev');

if (whyGrid && whyNext && whyPrev) {
  whyNext.addEventListener('click', () => {
    const cardWidth = whyGrid.querySelector('.feature-item').offsetWidth + 32;
    whyGrid.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });

  whyPrev.addEventListener('click', () => {
    const cardWidth = whyGrid.querySelector('.feature-item').offsetWidth + 32;
    whyGrid.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });
}

console.log('Nomadller Website Initialized');
