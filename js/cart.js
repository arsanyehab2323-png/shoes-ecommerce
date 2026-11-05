/* ==========================================================
   SNEAKERS HUB - js/cart.js
   Code for cart.html only:
   shows the cart, changes quantities, removes items and
   calculates the subtotal, shipping and total automatically.

   The cart itself (saving, adding, removing) lives in store.js.
   Needs: data.js, theme.js, store.js, auth.js, ui.js
   ========================================================== */

function byId(id) {
  return document.getElementById(id);
}

// When WE change the cart on this page, we update the page ourselves.
// When another tab changes it, we redraw everything (see the bottom of the file).
let changingHere = false;

function runCartChange(action) {
  changingHere = true;
  try {
    return action();
  } finally {
    changingHere = false;
  }
}


/* ----------------------------------------------------------
   1. BUILDING THE HTML OF ONE CART ROW
   ---------------------------------------------------------- */

// A + or - button (disabled buttons look faded)
function qtyButtonHTML(action, key, symbol, label, disabled) {
  return '<button type="button" class="qty-btn" data-action="' + action + '" data-key="' + key + '"' +
         ' aria-label="' + label + '"' +
         (disabled ? ' disabled style="opacity:0.4;cursor:not-allowed;"' : '') + '>' + symbol + '</button>';
}

function createCartItemHTML(item, animate) {
  const product = item.product;
  const url = 'product-details.html?id=' + product.id + '&color=' + item.colorTheme;
  const name = escapeHTML(product.brand + ' ' + product.name);
  const stock = getStockInfo(product, item.size);

  const stockNote = stock.status === 'low-stock'
    ? '<span class="stock-status low-stock" style="font-size:0.8rem;">' + stock.text + '</span>'
    : '';

  return `
    <article class="cart-item" data-key="${item.key}" data-quantity="${item.quantity}"${animate ? '' : ' style="animation:none;"'}>
      <a href="${url}" aria-label="View ${name}">
        <img class="cart-item-img" src="${item.image}" alt="${name} in ${escapeHTML(item.colorName)}"
             data-product-id="${product.id}" data-color="${item.colorTheme}" loading="lazy">
      </a>

      <div class="cart-item-info">
        <h3><a href="${url}">${name}</a></h3>
        <p class="cart-item-meta">${escapeHTML(item.colorName)} &middot; Size ${item.size}</p>
        <div class="qty-control" role="group" aria-label="Quantity">
          ${qtyButtonHTML('decrease', item.key, '&minus;', 'Decrease quantity', item.quantity <= 1)}
          <span class="qty-value">${item.quantity}</span>
          ${qtyButtonHTML('increase', item.key, '+', 'Increase quantity', item.quantity >= item.maxQuantity)}
        </div>
        ${stockNote}
      </div>

      <div class="cart-item-side">
        <span class="cart-item-price">${formatPrice(item.lineTotal)}</span>
        <small class="cart-item-meta cart-item-each">${formatPrice(item.unitPrice)} each</small>
        <button type="button" class="remove-btn" data-action="remove" data-key="${item.key}">Remove</button>
      </div>
    </article>
  `;
}

// Shoes in a color that has no special photo: recolor the main photo (preview)
function colorizeCartImages() {
  if (typeof showShoePhoto !== 'function') {
    return;
  }

  document.querySelectorAll('.cart-item-img[data-product-id]').forEach(function (img) {
    const product = getProductById(img.getAttribute('data-product-id'));
    const colorTheme = img.getAttribute('data-color');
    if (!product) {
      return;
    }

    const color = product.colors.find(function (c) { return c.theme === colorTheme; });
    const baseTheme = product.colors[0].theme;

    if (color && !color.image && colorTheme !== baseTheme) {
      showShoePhoto(img, product.image, baseTheme, colorTheme, true);
    }
  });
}


/* ----------------------------------------------------------
   2. SHOWING THE CART
   ---------------------------------------------------------- */

// Draws the whole cart (or the "empty cart" message)
function renderCart(animate) {
  const items = getCartDetails();
  const isEmpty = items.length === 0;

  byId('cartLayout').hidden = isEmpty;
  byId('emptyCart').hidden = !isEmpty;

  if (isEmpty) {
    byId('cartSubtitle').textContent = 'Your cart is empty.';
    return;
  }

  byId('cartItems').innerHTML = items.map(function (item) {
    return createCartItemHTML(item, animate);
  }).join('');

  colorizeCartImages();
  updateSummary();
}

// Subtotal, shipping, total, and the "free shipping" hint
function updateSummary() {
  const totals = getCartTotals();
  const pairs = totals.itemCount === 1 ? ' item' : ' items';

  byId('cartSubtitle').textContent = totals.itemCount + pairs + ' in your cart.';
  byId('cartItemsTitle').textContent = 'Your items (' + totals.itemCount + ')';

  byId('summaryItems').textContent = totals.itemCount;
  byId('summarySubtotal').textContent = formatPrice(totals.subtotal);
  byId('summaryShipping').textContent = totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping);
  byId('summaryTotal').textContent = formatPrice(totals.total);

  const limit = STORE_SETTINGS.freeShippingOver;
  if (totals.subtotal > limit) {
    byId('shippingNote').textContent = 'You qualify for free shipping! 🎉';
  } else {
    const missing = Math.floor(limit - totals.subtotal) + 1;
    byId('shippingNote').textContent =
      'Free shipping on orders over ' + formatPrice(limit) + '. Add ' + formatPrice(missing) + ' more to qualify.';
  }
}

// Updates ONE row after its quantity changed (no full redraw)
function refreshRow(key) {
  const item = getCartDetails().find(function (line) { return line.key === key; });
  const row = byId('cartItems').querySelector('[data-key="' + key + '"]');
  if (!item || !row) {
    return;
  }

  row.setAttribute('data-quantity', item.quantity);
  row.querySelector('.qty-value').textContent = item.quantity;
  row.querySelector('.cart-item-price').textContent = formatPrice(item.lineTotal);

  const minus = row.querySelector('[data-action="decrease"]');
  const plus = row.querySelector('[data-action="increase"]');

  [[minus, item.quantity <= 1], [plus, item.quantity >= item.maxQuantity]].forEach(function (pair) {
    pair[0].disabled = pair[1];
    pair[0].style.opacity = pair[1] ? '0.4' : '';
    pair[0].style.cursor = pair[1] ? 'not-allowed' : '';
  });
}


/* ----------------------------------------------------------
   3. ACTIONS: CHANGE QUANTITY, REMOVE, CLEAR
   ---------------------------------------------------------- */

function changeQuantity(key, change) {
  const row = byId('cartItems').querySelector('[data-key="' + key + '"]');
  if (!row) {
    return;
  }

  const newQuantity = Number(row.getAttribute('data-quantity')) + change;
  const result = runCartChange(function () {
    return updateCartQuantity(key, newQuantity);
  });

  if (!result.success) {
    showToast(result.message, 'error');
    return;
  }

  refreshRow(key);
  updateSummary();
}

function removeItem(key) {
  runCartChange(function () {
    removeFromCart(key);
  });

  const row = byId('cartItems').querySelector('[data-key="' + key + '"]');
  if (row) {
    row.remove();
  }

  showToast('Item removed from your cart.');

  if (getCart().length === 0) {
    renderCart(false);      // shows the "empty cart" message
  } else {
    updateSummary();
  }
}

function clearAllItems() {
  if (!window.confirm('Remove all items from your cart?')) {
    return;
  }

  runCartChange(function () {
    clearCart();
  });

  showToast('Your cart is now empty.');
  renderCart(false);
}


/* ----------------------------------------------------------
   4. START-UP
   ---------------------------------------------------------- */

function initCart() {
  if (!byId('cartLayout')) {
    return;
  }

  // A visitor who is not logged in is already being sent to login.html (auth.js)
  if (!isLoggedIn()) {
    return;
  }

  // One listener for all the buttons inside the cart list
  byId('cartItems').addEventListener('click', function (event) {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) {
      return;
    }

    const key = button.getAttribute('data-key');
    const action = button.getAttribute('data-action');

    if (action === 'increase') {
      changeQuantity(key, 1);
    } else if (action === 'decrease') {
      changeQuantity(key, -1);
    } else if (action === 'remove') {
      removeItem(key);
    }
  });

  byId('clearCartBtn').addEventListener('click', clearAllItems);

  renderCart(true);

  // The cart was changed in ANOTHER tab: draw it again
  document.addEventListener('cartchange', function () {
    if (!changingHere) {
      renderCart(false);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCart);
} else {
  initCart();
}