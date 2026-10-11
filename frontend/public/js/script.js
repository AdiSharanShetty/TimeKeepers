document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      mainNav.style.display = mainNav.classList.contains('open') ? 'flex' : '';
    });
  }

  /* ---------- Simple search toggle (focuses the hero search field) ---------- */
  const searchToggle = document.getElementById('searchToggle');
  if (searchToggle) {
    searchToggle.addEventListener('click', () => {
      const field = document.querySelector('.search-card input[type="text"]');
      if (field) {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field.focus();
      }
    });
  }

  /* ---------- Hero image slider ---------- */
  const heroImages = [
    'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1573261821759-fdd1b36d9ca5?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1749831754129-3a84b9fdeb87?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1543428390-8bc1a79ff735?auto=format&fit=crop&w=900&q=80'
  ];
  let heroIndex = 0;
  const heroImg = document.getElementById('heroImg');
  const heroPrev = document.getElementById('heroPrev');
  const heroNext = document.getElementById('heroNext');

  function showHeroImage(i) {
    heroIndex = (i + heroImages.length) % heroImages.length;
    if (heroImg) {
      heroImg.style.opacity = 0;
      setTimeout(() => {
        heroImg.src = heroImages[heroIndex];
        heroImg.style.opacity = 1;
      }, 150);
    }
  }
  heroImg && (heroImg.style.transition = 'opacity .15s ease');
  heroPrev && heroPrev.addEventListener('click', () => showHeroImage(heroIndex - 1));
  heroNext && heroNext.addEventListener('click', () => showHeroImage(heroIndex + 1));

  // auto-rotate hero every 6s
  setInterval(() => showHeroImage(heroIndex + 1), 6000);

  /* ---------- Play button (placeholder video prompt) ---------- */
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      alert('This would open a brand video in a real store 🎬');
    });
  }

  /* ---------- Featured products carousel (scroll by one card) ---------- */
  const productGrid = document.getElementById('productGrid');
  const prodPrev = document.getElementById('prodPrev');
  const prodNext = document.getElementById('prodNext');

  function scrollProducts(direction) {
    if (!productGrid) return;
    const card = productGrid.querySelector('.product-card');
    const gap = 26;
    const distance = card ? card.offsetWidth + gap : 300;
    productGrid.scrollBy({ left: direction * distance, behavior: 'smooth' });
  }
  prodPrev && prodPrev.addEventListener('click', () => scrollProducts(-1));
  prodNext && prodNext.addEventListener('click', () => scrollProducts(1));

  // Make the grid horizontally scrollable on small screens
  if (productGrid) {
    productGrid.style.overflowX = 'auto';
    productGrid.style.scrollSnapType = 'x mandatory';
    productGrid.querySelectorAll('.product-card').forEach(c => c.style.scrollSnapAlign = 'start');
  }

  /* ---------- View Details / Buy Now buttons ---------- */
  document.querySelectorAll('.product-card').forEach(card => {
    const name = card.querySelector('h3')?.textContent.trim();
    const [viewBtn, buyBtn] = card.querySelectorAll('.product-actions .btn');
    viewBtn && viewBtn.addEventListener('click', () => alert(`Viewing details for ${name}`));
    buyBtn && buyBtn.addEventListener('click', () => alert(`${name} added to your cart!`));
  });

  /* ---------- Membership "Join Now" buttons ---------- */
  document.querySelectorAll('.plan-card').forEach(card => {
    const plan = card.querySelector('.plan-head span')?.textContent.trim();
    const btn = card.querySelector('.btn');
    btn && btn.addEventListener('click', () => alert(`Thanks for choosing the ${plan} plan!`));
  });

  /* ---------- Testimonials rotator ---------- */
  const testimonials = [
    {
      text: "Excellent quality watches and super fast delivery. My Seiko arrived perfectly packaged and looks even better in person. Will definitely shop here again!",
      name: "Alexander R.",
      avatar: "https://i.pravatar.cc/100?img=12"
    },
    {
      text: "The Rolex I bought exceeded every expectation. Packaging felt like a boutique experience and support answered every question within minutes.",
      name: "Priya N.",
      avatar: "https://i.pravatar.cc/100?img=32"
    },
    {
      text: "Great range of styles for every budget. The Standard membership paid for itself on my first order thanks to the priority shipping.",
      name: "Marcus T.",
      avatar: "https://i.pravatar.cc/100?img=51"
    }
  ];
  let testiIndex = 0;
  const testimonialText = document.getElementById('testimonialText');
  const testimonialName = document.getElementById('testimonialName');
  const testimonialAvatar = document.getElementById('testimonialAvatar');
  const testiPrev = document.getElementById('testiPrev');
  const testiNext = document.getElementById('testiNext');

  function renderTestimonial(i) {
    testiIndex = (i + testimonials.length) % testimonials.length;
    const t = testimonials[testiIndex];
    if (testimonialText) testimonialText.textContent = t.text;
    if (testimonialName) testimonialName.textContent = t.name;
    if (testimonialAvatar) testimonialAvatar.src = t.avatar;
  }
  testiPrev && testiPrev.addEventListener('click', () => renderTestimonial(testiIndex - 1));
  testiNext && testiNext.addEventListener('click', () => renderTestimonial(testiIndex + 1));

  /* ---------- Contact form ---------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Thanks for reaching out! We will get back to you shortly.');
      contactForm.reset();
    });
  }

  /* ---------- Newsletter form ---------- */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('You are subscribed! Watch your inbox for new arrivals.');
      newsletterForm.reset();
    });
  }

  /* ---------- Scroll-reveal for cards/sections ---------- */
  const revealTargets = document.querySelectorAll('.cat-card, .product-card, .plan-card, .testimonial-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
    observer.observe(el);
  });

});
