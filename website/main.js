import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis with GSAP sync
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Mobile Menu Toggle (Legacy Guarded + Goxom)
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });
}

// Goxom Mobile Menu Toggle
const gxMobileToggle = document.getElementById('gx-mobile-toggle');
const gxNavMenu = document.getElementById('gx-nav-menu');
if (gxMobileToggle && gxNavMenu) {
  gxMobileToggle.addEventListener('click', () => {
    gxNavMenu.classList.toggle('active');
  });

  gxNavMenu.querySelectorAll('.gx-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      gxNavMenu.classList.remove('active');
    });
  });
}

// Header Scroll Effect
const nav = document.querySelector('nav');
const gxHeader = document.getElementById('gx-header');

window.addEventListener('scroll', () => {
  const isScrolled = window.scrollY > 40;
  if (nav) nav.classList.toggle('scrolled', isScrolled);
  if (gxHeader) gxHeader.classList.toggle('scrolled', isScrolled);
});



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
  if (slides[index]) slides[index].classList.add('active');
  if (dots[index]) dots[index].classList.add('active');

  // Animate text change
  const newTitle = slides[index].getAttribute('data-title').replace(/ /g, '<br>');
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

  // Update mini gallery
  const miniCard1 = document.getElementById('mini-card-1');
  const miniCard2 = document.getElementById('mini-card-2');
  if (miniCard1 && miniCard2 && slides.length > 0) {
    const next1 = (index + 1) % slides.length;
    const next2 = (index + 2) % slides.length;
    
    miniCard1.querySelector('.mini-card-bg').style.backgroundImage = `url('${slides[next1].getAttribute('data-img')}')`;
    miniCard2.querySelector('.mini-card-bg').style.backgroundImage = `url('${slides[next2].getAttribute('data-img')}')`;
  }
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  updateHero(currentSlide);
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateHero(currentSlide);
}

// Auto transition every 5 seconds
let sliderInterval = setInterval(nextSlide, 5000);

// Dot navigation
if (dots.length > 0) {
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      clearInterval(sliderInterval);
      currentSlide = i;
      updateHero(i);
      sliderInterval = setInterval(nextSlide, 5000);
    });
  });
}

// Hero Arrow Navigation
const mainHeroNext = document.getElementById('hero-next');
const mainHeroPrev = document.getElementById('hero-prev');

if (mainHeroNext && mainHeroPrev) {
  mainHeroNext.addEventListener('click', () => {
    clearInterval(sliderInterval);
    nextSlide();
    sliderInterval = setInterval(nextSlide, 5000);
  });
  mainHeroPrev.addEventListener('click', () => {
    clearInterval(sliderInterval);
    prevSlide();
    sliderInterval = setInterval(nextSlide, 5000);
  });
}

// Init mini-gallery on load
if (slides.length > 0) {
  updateHero(0);
}

// Reveal Animations
const reveals = document.querySelectorAll('.reveal');

reveals.forEach((el) => {
  gsap.fromTo(el, 
    {
      opacity: 0,
      y: 50
    },
    {
      opacity: 1,
      y: 0,
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
    const card = grid.querySelector('.package-card');
    const scrollAmount = card ? (card.offsetWidth + 28) : 380;
    grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  prevBtn.addEventListener('click', () => {
    const card = grid.querySelector('.package-card');
    const scrollAmount = card ? (card.offsetWidth + 28) : 380;
    grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
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

import { loadPackagesGrid, renderCards, getTripCategory } from './src/packages.js';

// Load dynamic packages if we are on the homepage
if (document.getElementById('packages-grid-container')) {
  loadPackagesGrid();
}

// Goxom Search Engine Handler
window.handleSearchSubmit = function() {
  const destSelect = document.getElementById('search-dest');
  const typeSelect = document.getElementById('search-activity') || document.getElementById('search-type');
  const container = document.getElementById('packages-grid-container');
  
  if (!container || !window.allTrips) return;
  
  const destVal = (destSelect ? destSelect.value : '').toLowerCase().trim();
  const typeVal = (typeSelect ? typeSelect.value : '').toLowerCase().trim();

  let results = [...window.allTrips];

  if (destVal && destVal !== 'all' && destVal !== '') {
    results = results.filter(t => {
      const fullText = ((t.title || '') + ' ' + (t.subtitle || '') + ' ' + (t.difficulty || '')).toLowerCase();
      return fullText.includes(destVal);
    });
  }

  if (typeVal && typeVal !== 'all' && typeVal !== '') {
    results = results.filter(t => {
      const cat = getTripCategory(t);
      if (cat === typeVal) return true;
      const fullText = ((t.title || '') + ' ' + (t.subtitle || '') + ' ' + (t.difficulty || '')).toLowerCase();
      return fullText.includes(typeVal);
    });
  }

  // Smooth scroll to expeditions
  const expSection = document.getElementById('expeditions');
  if (expSection) {
    expSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Highlight 'All Expeditions' pill
  const filterPills = document.querySelectorAll('.gx-filter-pill');
  filterPills.forEach(p => p.classList.remove('active'));
  const allPill = document.querySelector('.gx-filter-pill[data-cat="all"]');
  if (allPill) allPill.classList.add('active');

  renderCards(container, results, 'all');
};

// Destination Card Click Quick Filter
window.filterByDestination = function(dest) {
  const destSelect = document.getElementById('search-dest');
  if (destSelect) {
    destSelect.value = dest;
  }
  window.handleSearchSubmit();
};

console.log('Nomadller Goxom Travel Website Initialized');

