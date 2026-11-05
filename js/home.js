/* ==========================================================
   SNEAKERS HUB - js/home.js
   Code for the HOME page (index.html) only:
   - fills the "Featured Sneakers" grid
   - makes the newsletter form work (demo)
   - changes the "Join us" banner when the visitor is already logged in

   Needs: data.js, theme.js, store.js, auth.js, ui.js
   ========================================================== */


/* ----------------------------------------------------------
   1. FEATURED SNEAKERS
   The 8 most popular products that are still in stock.
   ---------------------------------------------------------- */

function getFeaturedProducts() {
  return PRODUCTS
    .filter(function (product) {
      return getTotalStock(product) > 0;           // hide sold-out products
    })
    .sort(function (a, b) {
      return b.popularity - a.popularity;          // most popular first
    })
    .slice(0, 8);                                  // keep only 8
}

function renderFeatured() {
  const grid = document.getElementById('featuredGrid');

  renderProductGrid(grid, getFeaturedProducts(), {
    emptyTitle: 'No featured sneakers yet',
    emptyText: 'Please check back soon.'
  });
}


/* ----------------------------------------------------------
   2. "JOIN US" BANNER
   Visitors see: "Create Account".
   Logged-in members see a welcome message instead
   (they already have an account, so we do not ask them to create one).
   ---------------------------------------------------------- */

const promoOriginal = { saved: false };   // the visitor version of the banner

function updatePromoBanner() {
  const banner = document.querySelector('.promo-banner');
  if (!banner) {
    return;
  }

  const eyebrow = banner.querySelector('.eyebrow');
  const title = banner.querySelector('h2');
  const text = banner.querySelector('p');
  const button = banner.querySelector('a.btn');
  if (!eyebrow || !title || !text || !button) {
    return;
  }

  // The first time: remember the original (visitor) texts so we can restore them
  if (!promoOriginal.saved) {
    promoOriginal.eyebrow = eyebrow.textContent;
    promoOriginal.title = title.textContent;
    promoOriginal.text = text.textContent;
    promoOriginal.button = button.textContent;
    promoOriginal.href = button.getAttribute('href');
    promoOriginal.saved = true;
  }

  const user = getCurrentUser();

  if (user) {
    // Logged in: a welcome message and a useful button
    eyebrow.textContent = 'Welcome back';
    title.textContent = 'Great to see you, ' + user.fullName.split(' ')[0] + '!';
    text.textContent = 'Your wishlist and your cart are waiting for you.';
    button.textContent = 'View My Wishlist';
    button.setAttribute('href', 'wishlist.html');
  } else {
    // Logged out: the original "Create Account" banner
    eyebrow.textContent = promoOriginal.eyebrow;
    title.textContent = promoOriginal.title;
    text.textContent = promoOriginal.text;
    button.textContent = promoOriginal.button;
    button.setAttribute('href', promoOriginal.href);
  }
}


/* ----------------------------------------------------------
   3. NEWSLETTER FORM (demo: the email is NOT saved or sent anywhere)
   ---------------------------------------------------------- */

function setupNewsletter() {
  const form = document.getElementById('newsletterForm');
  const input = document.getElementById('newsletterEmail');
  const message = document.getElementById('newsletterMessage');

  if (!form || !input || !message) {
    return;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const email = input.value.trim();
    const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!looksValid) {
      message.textContent = 'Please enter a valid email address.';
      message.className = 'form-message error';
      input.classList.add('input-error');
      input.focus();
      return;
    }

    input.classList.remove('input-error');
    message.textContent = 'Thank you for subscribing! (Demo only: nothing was sent.)';
    message.className = 'form-message success';
    input.value = '';
  });

  // remove the red border as soon as the visitor starts typing again
  input.addEventListener('input', function () {
    input.classList.remove('input-error');
  });
}


/* ----------------------------------------------------------
   4. START-UP
   ---------------------------------------------------------- */

function initHome() {
  renderFeatured();
  setupNewsletter();
  updatePromoBanner();

  // Update the banner when the visitor logs in or out (also from another tab)
  document.addEventListener('authchange', updatePromoBanner);
  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEYS.session || event.key === STORAGE_KEYS.users) {
      updatePromoBanner();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHome);
} else {
  initHome();
}