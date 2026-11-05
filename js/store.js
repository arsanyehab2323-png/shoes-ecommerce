/* ==========================================================
   SNEAKERS HUB - js/store.js
   The shopping cart and the wishlist.
   Everything is saved in localStorage, so it stays after a
   refresh and is shared between all pages.

   Needs: data.js (STORAGE_KEYS, STORE_SETTINGS, getProductById,
                   getProductImage)
   ========================================================== */


/* ----------------------------------------------------------
   1. SAFE localStorage HELPERS
   (auth.js uses these two functions as well)
   ---------------------------------------------------------- */

// Read a value from localStorage (returns "fallback" if empty or broken)
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

// Save a value to localStorage. Returns true if it worked.
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function roundMoney(number) {
  return Math.round(number * 100) / 100;
}


/* ----------------------------------------------------------
   2. CART
   A cart line looks like this:
   { key: '1-42-red', productId: 1, size: 42, colorTheme: 'red', quantity: 2 }
   The same product + size + color is ONE line (quantity goes up).
   Prices are NOT stored: we always read them from data.js.
   ---------------------------------------------------------- */

function makeCartKey(productId, size, colorTheme) {
  return productId + '-' + size + '-' + colorTheme;
}

// Returns the cart (a clean list, broken items are removed)
function getCart() {
  const saved = readStorage(STORAGE_KEYS.cart, []);

  if (!Array.isArray(saved)) {
    return [];
  }

  return saved.filter(function (item) {
    return item &&
           getProductById(item.productId) &&
           Number.isInteger(item.quantity) &&
           item.quantity >= 1;
  });
}

function saveCart(cart) {
  writeStorage(STORAGE_KEYS.cart, cart);
  updateCounters();
  document.dispatchEvent(new CustomEvent('cartchange'));
}

// Add a product to the cart.
// Returns { success: true/false, message: '...' } (show the message in a toast)
function addToCart(productId, size, colorTheme, quantity) {
  quantity = Number(quantity) || 1;

  const product = getProductById(productId);
  if (!product) {
    return { success: false, message: 'Product not found.' };
  }
  if (!size) {
    return { success: false, message: 'Please select a size first.' };
  }
  if (!colorTheme) {
    colorTheme = product.colors[0].theme;
  }

  const available = product.stock[size] || 0;
  if (available <= 0) {
    return { success: false, message: 'This size is out of stock.' };
  }

  const cart = getCart();
  const key = makeCartKey(product.id, size, colorTheme);
  const existing = cart.find(function (item) { return item.key === key; });
  const alreadyInCart = existing ? existing.quantity : 0;

  if (alreadyInCart + quantity > available) {
    const message = alreadyInCart > 0
      ? 'You already have ' + alreadyInCart + ' in your cart. Only ' + available + ' available in this size.'
      : 'Only ' + available + ' available in this size.';
    return { success: false, message: message };
  }

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      key: key,
      productId: product.id,
      size: Number(size),
      colorTheme: colorTheme,
      quantity: quantity
    });
  }

  saveCart(cart);
  return { success: true, message: product.name + ' added to your cart.' };
}

// Remove one line from the cart
function removeFromCart(key) {
  const cart = getCart().filter(function (item) { return item.key !== key; });
  saveCart(cart);
}

// Change the quantity of one line (never below 1, never above the stock)
// Returns { success, message }
function updateCartQuantity(key, newQuantity) {
  const cart = getCart();
  const item = cart.find(function (line) { return line.key === key; });

  if (!item) {
    return { success: false, message: 'Item not found in your cart.' };
  }

  newQuantity = Math.floor(Number(newQuantity));
  if (!newQuantity || newQuantity < 1) {
    return { success: false, message: 'The minimum quantity is 1. Use Remove to delete the item.' };
  }

  const product = getProductById(item.productId);
  const available = product.stock[item.size] || 0;

  if (newQuantity > available) {
    return { success: false, message: 'Only ' + available + ' available in this size.' };
  }

  item.quantity = newQuantity;
  saveCart(cart);
  return { success: true, message: 'Quantity updated.' };
}

function clearCart() {
  saveCart([]);
}

// Total number of shoes in the cart (3 pairs of the same shoe = 3)
function getCartCount() {
  return getCart().reduce(function (sum, item) {
    return sum + item.quantity;
  }, 0);
}

// The cart with all details the cart page needs (name, price, image...)
function getCartDetails() {
  return getCart().map(function (item) {
    const product = getProductById(item.productId);
    const color = product.colors.find(function (c) { return c.theme === item.colorTheme; });

    return {
      key: item.key,
      product: product,
      size: item.size,
      colorTheme: item.colorTheme,
      colorName: color ? color.name : item.colorTheme,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: roundMoney(product.price * item.quantity),
      image: getProductImage(product, item.colorTheme),
      maxQuantity: product.stock[item.size] || 0
    };
  });
}

// Subtotal, shipping and total (shipping is free above the limit in data.js)
function getCartTotals() {
  const items = getCartDetails();

  const subtotal = roundMoney(items.reduce(function (sum, line) {
    return sum + line.lineTotal;
  }, 0));

  const shipping = (subtotal === 0 || subtotal > STORE_SETTINGS.freeShippingOver)
    ? 0
    : STORE_SETTINGS.shippingFee;

  return {
    itemCount: getCartCount(),
    subtotal: subtotal,
    shipping: shipping,
    total: roundMoney(subtotal + shipping)
  };
}


/* ----------------------------------------------------------
   3. WISHLIST
   Just a list of product ids, for example [1, 5, 12]
   ---------------------------------------------------------- */

function getWishlist() {
  const saved = readStorage(STORAGE_KEYS.wishlist, []);

  if (!Array.isArray(saved)) {
    return [];
  }

  // keep only real products, and no duplicates
  const clean = [];
  saved.forEach(function (id) {
    id = Number(id);
    if (getProductById(id) && clean.indexOf(id) === -1) {
      clean.push(id);
    }
  });
  return clean;
}

function saveWishlist(list) {
  writeStorage(STORAGE_KEYS.wishlist, list);
  updateCounters();
  document.dispatchEvent(new CustomEvent('wishlistchange'));
}

function isInWishlist(productId) {
  return getWishlist().indexOf(Number(productId)) !== -1;
}

function addToWishlist(productId) {
  const list = getWishlist();
  productId = Number(productId);
  if (getProductById(productId) && list.indexOf(productId) === -1) {
    list.push(productId);
    saveWishlist(list);
  }
}

function removeFromWishlist(productId) {
  productId = Number(productId);
  saveWishlist(getWishlist().filter(function (id) { return id !== productId; }));
}

// Heart button: adds the product if it is not in the wishlist, removes it if it is.
// Returns { inWishlist: true/false, message: '...' }
function toggleWishlist(productId) {
  const product = getProductById(productId);
  if (!product) {
    return { inWishlist: false, message: 'Product not found.' };
  }

  if (isInWishlist(productId)) {
    removeFromWishlist(productId);
    return { inWishlist: false, message: product.name + ' removed from your wishlist.' };
  }

  addToWishlist(productId);
  return { inWishlist: true, message: product.name + ' added to your wishlist.' };
}

function getWishlistCount() {
  return getWishlist().length;
}

function clearWishlist() {
  saveWishlist([]);
}


/* ----------------------------------------------------------
   4. HEADER COUNTERS (the small numbers on the heart and bag icons)
   ---------------------------------------------------------- */

function setBadge(elementId, count) {
  const badge = document.getElementById(elementId);
  if (!badge) {
    return;
  }
  badge.textContent = count > 99 ? '99+' : String(count);
  badge.hidden = count === 0;   // hide the badge when it is zero
}

function updateCounters() {
  setBadge('cartCount', getCartCount());
  setBadge('wishlistCount', getWishlistCount());
}

// If the cart or wishlist is changed in another tab, update this tab too
window.addEventListener('storage', function (event) {
  if (event.key === STORAGE_KEYS.cart) {
    updateCounters();
    document.dispatchEvent(new CustomEvent('cartchange'));
  }
  if (event.key === STORAGE_KEYS.wishlist) {
    updateCounters();
    document.dispatchEvent(new CustomEvent('wishlistchange'));
  }
});

// Show the correct numbers as soon as the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateCounters);
} else {
  updateCounters();
}