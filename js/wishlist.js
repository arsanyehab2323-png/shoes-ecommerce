/* ==========================================================
   SNEAKERS HUB - js/wishlist.js
   Code for wishlist.html only: shows the products saved with the heart.

   The wishlist itself (saving, adding, removing) lives in store.js.
   The heart buttons on the cards are handled by ui.js.
   Needs: data.js, theme.js, store.js, auth.js, ui.js
   ========================================================== */

function byId(id) {
  return document.getElementById(id);
}


/* ----------------------------------------------------------
   1. SHOWING THE WISHLIST
   ---------------------------------------------------------- */

// "3 saved sneakers" + the text under the page title
function updateCountText(count) {
  const noun = count === 1 ? 'sneaker' : 'sneakers';

  byId('wishlistCountText').textContent = count + ' saved ' + noun;
  byId('wishlistSubtitle').textContent = count === 0
    ? 'Nothing saved yet.'
    : 'You have ' + count + ' ' + noun + ' saved.';
}

// Draws the whole wishlist (or the "empty wishlist" message)
function renderWishlist() {
  // newest saved sneaker first
  const products = getWishlist().slice().reverse().map(getProductById);
  const isEmpty = products.length === 0;

  byId('wishlistSection').hidden = isEmpty;
  byId('emptyWishlist').hidden = !isEmpty;
  updateCountText(products.length);

  if (isEmpty) {
    return;
  }

  renderProductGrid(byId('wishlistGrid'), products);
}

// Called when the wishlist changes (heart clicked, or changed in another tab).
// If a card was only REMOVED, we just remove that card (the other cards stay still).
function syncWishlistPage() {
  const ids = getWishlist();
  const grid = byId('wishlistGrid');
  const cards = Array.from(grid.querySelectorAll('.product-card'));

  const shownIds = cards.map(function (card) {
    return Number(card.getAttribute('data-product-id'));
  });

  const hasNewProduct = ids.some(function (id) {
    return shownIds.indexOf(id) === -1;
  });

  // something new was added, or nothing is left: draw everything again
  if (hasNewProduct || ids.length === 0) {
    renderWishlist();
    return;
  }

  // otherwise: remove the cards that are no longer in the wishlist
  cards.forEach(function (card) {
    if (ids.indexOf(Number(card.getAttribute('data-product-id'))) === -1) {
      card.remove();
    }
  });
  updateCountText(ids.length);
}


/* ----------------------------------------------------------
   2. START-UP
   ---------------------------------------------------------- */

function initWishlist() {
  if (!byId('wishlistGrid')) {
    return;
  }

  // A visitor who is not logged in is already being sent to login.html (auth.js)
  if (!isLoggedIn()) {
    return;
  }

  renderWishlist();

  // "Clear wishlist" button (asks first)
  byId('clearWishlistBtn').addEventListener('click', function () {
    if (window.confirm('Remove all sneakers from your wishlist?')) {
      clearWishlist();
      showToast('Your wishlist is now empty.');
    }
  });

  // The wishlist changed (this page's hearts, or another tab)
  document.addEventListener('wishlistchange', syncWishlistPage);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWishlist);
} else {
  initWishlist();
}