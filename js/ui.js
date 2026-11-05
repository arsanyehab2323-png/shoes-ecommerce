/* ==========================================================
   SNEAKERS HUB - js/ui.js
   Shared interface helpers used by every page:
   - toast messages
   - product cards (built from the data in data.js)
   - wishlist hearts and color dots on the cards
   - mobile menu, header search, active menu link
   - backup picture when an image fails to load

   COLOR RULES:
   - The color dots on a PRODUCT CARD change only that product's picture.
   - The big color pickers (header + "Pick a Color" section) change the
     whole website (theme.js).

   Needs: data.js, theme.js, store.js, auth.js (load them BEFORE this file)
   ========================================================== */


/* ----------------------------------------------------------
   1. SMALL HELPERS
   ---------------------------------------------------------- */

// Makes text safe to put inside HTML (prevents code injection)
function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, function (character) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character];
  });
}

// Reads a value from the address bar: ?search=runner -> getQueryParam('search') = 'runner'
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// 4.8 -> "★★★★★", 4.2 -> "★★★★☆"
function renderStars(rating) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}


/* ----------------------------------------------------------
   2. TOAST MESSAGES (small popups in the corner)
   showToast('Added to cart')           -> normal message
   showToast('Please log in', 'error')  -> red message
   ---------------------------------------------------------- */

function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  if (!container) {
    return;
  }

  // keep at most 3 messages on screen
  while (container.children.length >= 3) {
    container.removeChild(container.firstChild);
  }

  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'error' ? ' error' : '');
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(function () { toast.classList.add('hide'); }, 3000);
  setTimeout(function () { toast.remove(); }, 3400);
}


/* ----------------------------------------------------------
   3. PRODUCT CARDS
   ---------------------------------------------------------- */

// Builds the HTML of ONE product card
function createProductCard(product, index) {
  const url = 'product-details.html?id=' + product.id;
  const soldOut = getTotalStock(product) === 0;
  const tagText = soldOut ? 'Sold Out' : product.tag;

  // One small round button per available color (the first color is selected)
  const swatches = product.colors.map(function (color, colorIndex) {
    const activeClass = colorIndex === 0 ? ' active' : '';
    return '<button type="button" class="color-swatch' + activeClass + '"' +
           ' style="background:' + color.hex + '"' +
           ' data-color-theme="' + color.theme + '"' +
           ' aria-label="' + escapeHTML(color.name) + '" title="' + escapeHTML(color.name) + '"></button>';
  }).join('');

  const oldPrice = product.oldPrice
    ? '<span class="product-old-price">' + formatPrice(product.oldPrice) + '</span>'
    : '';

  const tag = tagText ? '<span class="product-tag">' + escapeHTML(tagText) + '</span>' : '';

  return `
    <article class="product-card" data-product-id="${product.id}" style="animation-delay:${Math.min(index || 0, 12) * 60}ms">
      <div class="product-media">
        <a href="${url}" aria-label="View ${escapeHTML(product.name)}">
          <img class="product-img"
               src="${product.image}"
               alt="${escapeHTML(product.brand + ' ' + product.name)} sneaker"
               loading="lazy">
        </a>
        ${tag}
        <button type="button" class="wishlist-btn" data-wishlist-id="${product.id}"
                aria-label="Add to wishlist" aria-pressed="false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
      </div>

      <div class="product-info">
        <span class="product-brand">${escapeHTML(product.brand)}</span>
        <h3 class="product-name"><a href="${url}">${escapeHTML(product.name)}</a></h3>
        <div class="product-rating">
          <span class="stars" aria-hidden="true">${renderStars(product.rating)}</span>
          <span class="rating-count">${product.rating.toFixed(1)} (${product.reviews})</span>
        </div>
        <div class="product-colors" role="group" aria-label="Available colors">${swatches}</div>
        <div class="product-bottom">
          <div>
            <span class="product-price">${formatPrice(product.price)}</span>${oldPrice}
          </div>
          <a class="btn btn-small btn-primary" href="${url}">View</a>
        </div>
      </div>
    </article>
  `;
}

// Fills a container with cards.
// options (all optional): emptyTitle, emptyText, emptyButtonText, emptyButtonHref
function renderProductGrid(container, products, options) {
  if (!container) {
    return;
  }
  options = options || {};

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>${escapeHTML(options.emptyTitle || 'No sneakers found')}</h3>
        <p>${escapeHTML(options.emptyText || 'Try changing your search or filters.')}</p>
        <a class="btn btn-primary" href="${options.emptyButtonHref || 'products.html'}">${escapeHTML(options.emptyButtonText || 'Browse all sneakers')}</a>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(createProductCard).join('');
  updateWishlistButtons();
}

// Changes the color of ONE product card (only its picture, not the website)
function setCardColor(card, colorTheme) {
  const product = getProductById(card.getAttribute('data-product-id'));
  const img = card.querySelector('.product-img');
  if (!product || !img) {
    return;
  }

  const color = product.colors.find(function (c) { return c.theme === colorTheme; });
  if (!color) {
    return;
  }

  // 1. Highlight the chosen color dot (only inside this card)
  card.querySelectorAll('.color-swatch').forEach(function (dot) {
    dot.classList.toggle('active', dot.getAttribute('data-color-theme') === colorTheme);
  });

  // 2. Change the picture
  const baseTheme = product.colors[0].theme;   // the color shown in the original photo

  if (typeof showShoePhoto === 'function') {
    if (color.image) {
      // a real photo exists for this color
      showShoePhoto(img, color.image, baseTheme, colorTheme, false);
    } else {
      // no photo for this color: recolor the shoe in the main photo (preview)
      showShoePhoto(img, product.image, baseTheme, colorTheme, true);
    }
  } else {
    img.setAttribute('src', color.image || product.image);
  }

  // 3. The links of this card now open the product page with this color selected
  card.querySelectorAll('a[href^="product-details.html"]').forEach(function (link) {
    link.setAttribute('href', 'product-details.html?id=' + product.id + '&color=' + colorTheme);
  });
}

// Fills the hearts: red + filled for products that are in the wishlist
function updateWishlistButtons() {
  const wishlist = getWishlist();

  document.querySelectorAll('.wishlist-btn[data-wishlist-id]').forEach(function (button) {
    const id = Number(button.getAttribute('data-wishlist-id'));
    const isSaved = wishlist.indexOf(id) !== -1;

    button.classList.toggle('active', isSaved);
    button.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
    button.setAttribute('aria-label', isSaved ? 'Remove from wishlist' : 'Add to wishlist');
  });
}

// Heart button click (works on every card, even cards created later)
document.addEventListener('click', function (event) {
  const heart = event.target.closest('.wishlist-btn[data-wishlist-id]');
  if (!heart) {
    return;
  }
  event.preventDefault();

  // The wishlist is a protected feature: visitors must log in first
  if (!isLoggedIn()) {
    showToast('Please log in to save your favorites.', 'error');
    setTimeout(function () {
      window.location.href = buildLoginUrl(getCurrentPageUrl());
    }, 900);
    return;
  }

  const result = toggleWishlist(heart.getAttribute('data-wishlist-id'));
  showToast(result.message);
});

// Color dot on a card: changes ONLY this product's picture
document.addEventListener('click', function (event) {
  const dot = event.target.closest('.product-card .color-swatch[data-color-theme]');
  if (!dot) {
    return;
  }
  setCardColor(dot.closest('.product-card'), dot.getAttribute('data-color-theme'));
});

// Keep the hearts correct when the wishlist changes
document.addEventListener('wishlistchange', updateWishlistButtons);


/* ----------------------------------------------------------
   4. MOBILE MENU (the ☰ button)
   ---------------------------------------------------------- */

function setMenuOpen(isOpen) {
  const header = document.getElementById('siteHeader');
  const toggle = document.getElementById('menuToggle');
  if (!header || !toggle) {
    return;
  }

  header.classList.toggle('menu-open', isOpen);
  toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
}

function setupMobileMenu() {
  const header = document.getElementById('siteHeader');
  const toggle = document.getElementById('menuToggle');
  if (!header || !toggle) {
    return;
  }

  // open / close with the button
  toggle.addEventListener('click', function () {
    setMenuOpen(!header.classList.contains('menu-open'));
  });

  // close when a menu link is clicked
  document.querySelectorAll('#mainNav .nav-link').forEach(function (link) {
    link.addEventListener('click', function () { setMenuOpen(false); });
  });

  // close with the Escape key
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      setMenuOpen(false);
    }
  });

  // close when clicking outside the header
  document.addEventListener('click', function (event) {
    if (!event.target.closest('#siteHeader')) {
      setMenuOpen(false);
    }
  });

  // close when the window becomes wide (desktop layout)
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) {
      setMenuOpen(false);
    }
  });
}


/* ----------------------------------------------------------
   5. HEADER: active link, search, footer year
   ---------------------------------------------------------- */

// Highlights the menu link of the page you are on
function setActiveNavLink() {
  let page = window.location.pathname.split('/').pop() || 'index.html';

  // the product details page belongs to the "Sneakers" menu item
  if (page === 'product-details.html') {
    page = 'products.html';
  }

  document.querySelectorAll('#mainNav .nav-link').forEach(function (link) {
    const isCurrent = link.getAttribute('href') === page;
    link.classList.toggle('active', isCurrent);
    if (isCurrent) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

// Header search box: goes to products.html?search=...
function setupHeaderSearch() {
  const form = document.getElementById('headerSearchForm');
  const input = document.getElementById('headerSearchInput');
  if (!form || !input) {
    return;
  }

  // keep the searched word inside the box
  const currentSearch = getQueryParam('search');
  if (currentSearch) {
    input.value = currentSearch;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const term = input.value.trim();
    window.location.href = term
      ? 'products.html?search=' + encodeURIComponent(term)
      : 'products.html';
  });
}

function setupFooterYear() {
  const year = document.getElementById('currentYear');
  if (year) {
    year.textContent = new Date().getFullYear();
  }
}


/* ----------------------------------------------------------
   6. BACKUP PICTURE FOR BROKEN IMAGES
   ---------------------------------------------------------- */

function applyImageFallback(img) {
  if (img.getAttribute('src') === FALLBACK_IMAGE) {
    return;   // already showing the backup picture
  }
  img.style.filter = 'none';
  img.setAttribute('src', FALLBACK_IMAGE);
}

// Any image that fails to load gets the backup picture.
// (The 'true' lets us catch errors of images created later too.)
document.addEventListener('error', function (event) {
  if (event.target && event.target.tagName === 'IMG') {
    applyImageFallback(event.target);
  }
}, true);

// Images that already failed before this file loaded
function fixAlreadyBrokenImages() {
  document.querySelectorAll('img').forEach(function (img) {
    const isLazy = img.getAttribute('loading') === 'lazy';
    if (!isLazy && img.getAttribute('src') && img.complete && img.naturalWidth === 0) {
      applyImageFallback(img);
    }
  });
}


/* ----------------------------------------------------------
   7. START-UP
   ---------------------------------------------------------- */

function initUI() {
  setActiveNavLink();
  setupMobileMenu();
  setupHeaderSearch();
  setupFooterYear();
  fixAlreadyBrokenImages();
  updateWishlistButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}