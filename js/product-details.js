/* ==========================================================
   SNEAKERS HUB - js/product-details.js
   Code for product-details.html only.

   - Reads the product from the address: product-details.html?id=3&color=red
   - The color buttons change ONLY the product picture
     (they do not change the website theme).
   - This page is protected: auth.js sends visitors who are not logged in
     to the login page and brings them back here afterwards.

   Needs: data.js, theme.js, store.js, auth.js, ui.js
   ========================================================== */

const MAX_QUANTITY_PER_ORDER = 10;

// What the visitor has chosen so far
let product = null;          // the product shown on this page
let selectedColor = null;    // a color theme name: 'red', 'black'...
let selectedSize = null;     // a number like 42, or null if no size yet
let quantity = 1;

function byId(id) {
  return document.getElementById(id);
}


/* ----------------------------------------------------------
   1. FILLING THE PAGE
   ---------------------------------------------------------- */

// Name, brand, price, rating, description, breadcrumb, browser tab title
function fillProductInfo() {
  byId('detailBrand').textContent = product.brand;
  byId('detailName').textContent = product.name;
  byId('detailStars').textContent = renderStars(product.rating);
  byId('detailRating').textContent = product.rating.toFixed(1) + ' (' + product.reviews + ' reviews)';
  byId('detailPrice').textContent = formatPrice(product.price);
  byId('detailOldPrice').textContent = product.oldPrice ? formatPrice(product.oldPrice) : '';
  byId('detailDesc').textContent = product.description;

  const categoryLink = byId('crumbCategory');
  categoryLink.textContent = getCategoryName(product.category);
  categoryLink.setAttribute('href', 'products.html?category=' + product.category);
  byId('crumbName').textContent = product.name;

  document.title = product.brand + ' ' + product.name + ' | SNEAKERS HUB';
}

// One round button for every color of this product
function buildColorButtons() {
  byId('detailColors').innerHTML = product.colors.map(function (color) {
    return '<button type="button" class="color-swatch large" ' +
           'style="background:' + color.hex + '" ' +
           'data-color-theme="' + color.theme + '" ' +
           'aria-label="' + escapeHTML(color.name) + '" title="' + escapeHTML(color.name) + '"></button>';
  }).join('');
}

// One button for every size (sold-out sizes are disabled)
function buildSizeButtons() {
  byId('sizeList').innerHTML = product.sizes.map(function (size) {
    const units = product.stock[size] || 0;
    const soldOut = units <= 0;
    const label = soldOut ? 'Size ' + size + ' (sold out)' : 'Size ' + size;

    return '<button type="button" class="size-btn" data-size="' + size + '"' +
           ' aria-label="' + label + '"' +
           (soldOut ? ' disabled title="Sold out"' : '') + '>' + size + '</button>';
  }).join('');
}

// The small pictures under the big one
function buildThumbnails() {
  byId('galleryThumbs').innerHTML = product.gallery.map(function (url, index) {
    return '<button type="button" class="thumb' + (index === 0 ? ' active' : '') + '" ' +
           'data-index="' + index + '" aria-label="Show photo ' + (index + 1) + '">' +
           '<img src="' + url + '" alt="" loading="lazy"></button>';
  }).join('');
}


/* ----------------------------------------------------------
   2. COLOR (changes only the product picture)
   ---------------------------------------------------------- */

// Shows the big picture in the selected color
function showColorImage() {
  const color = product.colors.find(function (c) { return c.theme === selectedColor; });
  const mainImage = byId('mainImage');
  const baseTheme = product.colors[0].theme;      // the color of the original photo

  mainImage.setAttribute('alt', product.brand + ' ' + product.name + ' in ' + color.name);

  if (color.image) {
    // a real photo exists for this color
    showShoePhoto(mainImage, color.image, baseTheme, selectedColor, false);
  } else {
    // no photo for this color: recolor the shoe of the main photo (preview)
    showShoePhoto(mainImage, product.image, baseTheme, selectedColor, true);
  }

  // The first small picture always shows the selected color
  const firstThumb = byId('galleryThumbs').querySelector('.thumb img');
  if (firstThumb) {
    firstThumb.setAttribute('src', color.image || product.image);
  }
}

function selectColor(theme) {
  const color = product.colors.find(function (c) { return c.theme === theme; });
  if (!color) {
    return;
  }
  selectedColor = theme;

  // highlight the chosen color button + show its name
  byId('detailColors').querySelectorAll('.color-swatch').forEach(function (button) {
    button.classList.toggle('active', button.getAttribute('data-color-theme') === theme);
  });
  byId('selectedColorName').textContent = color.name;

  // the first small picture becomes the selected one
  byId('galleryThumbs').querySelectorAll('.thumb').forEach(function (thumb, index) {
    thumb.classList.toggle('active', index === 0);
  });

  showColorImage();

  // remember the color in the address, so a refresh (or a login) keeps it
  window.history.replaceState(null, '', window.location.pathname + '?id=' + product.id + '&color=' + theme);
}


/* ----------------------------------------------------------
   3. SIZE, STOCK AND QUANTITY
   ---------------------------------------------------------- */

function selectSize(size) {
  // clicking the selected size again un-selects it
  selectedSize = selectedSize === size ? null : size;

  byId('sizeList').querySelectorAll('.size-btn').forEach(function (button) {
    button.classList.toggle('active', Number(button.getAttribute('data-size')) === selectedSize);
  });

  byId('sizeHint').textContent = selectedSize !== null ? 'Size ' + selectedSize + ' selected' : 'Select a size';
  byId('sizeError').textContent = '';

  setQuantity(quantity, false);   // the new size may have less stock
  updateStockStatus();
}

// "In stock" / "Only 3 left" / "Out of stock" (for the size, or for the whole product)
function updateStockStatus() {
  const hasSize = selectedSize !== null;
  const info = hasSize ? getStockInfo(product, selectedSize) : getStockInfo(product);
  const text = hasSize ? 'Size ' + selectedSize + ': ' + info.text : info.text;

  const status = byId('stockStatus');
  status.className = 'stock-status ' + info.status;
  status.textContent = text;
}

// The biggest quantity the visitor can choose
function getMaxQuantity() {
  if (selectedSize !== null) {
    return Math.min(product.stock[selectedSize] || 0, MAX_QUANTITY_PER_ORDER);
  }
  return MAX_QUANTITY_PER_ORDER;
}

function setQuantity(value, showMessage) {
  const max = getMaxQuantity();
  value = Math.max(1, value);

  if (value > max) {
    value = Math.max(1, max);
    if (showMessage) {
      showToast(selectedSize !== null
        ? 'Only ' + max + ' available in this size.'
        : 'You can order up to ' + MAX_QUANTITY_PER_ORDER + ' pairs at a time.', 'error');
    }
  }

  quantity = value;
  byId('qtyValue').textContent = quantity;
}


/* ----------------------------------------------------------
   4. BUTTONS: ADD TO CART AND WISHLIST
   ---------------------------------------------------------- */

function setupAddToCartButton() {
  const button = byId('addToCartBtn');

  // A completely sold-out product cannot be bought
  if (getTotalStock(product) === 0) {
    button.disabled = true;
    button.textContent = 'Sold Out';
    byId('qtyMinus').disabled = true;
    byId('qtyPlus').disabled = true;
    return;
  }

  button.addEventListener('click', function () {
    // A size is required
    if (selectedSize === null) {
      byId('sizeError').textContent = 'Please select a size first.';
      showToast('Please select a size first.', 'error');
      const firstSize = byId('sizeList').querySelector('.size-btn:not([disabled])');
      if (firstSize) {
        firstSize.focus();
      }
      return;
    }

    const result = addToCart(product.id, selectedSize, selectedColor, quantity);
    showToast(result.message, result.success ? undefined : 'error');

    if (result.success) {
      setQuantity(1, false);
      button.textContent = 'Added ✓';
      setTimeout(function () { button.textContent = 'Add to Cart'; }, 1300);
    }
  });
}

function updateWishlistButton() {
  const button = byId('detailWishlist');
  const saved = isInWishlist(product.id);

  button.textContent = saved ? '♥ In your wishlist' : '♡ Add to Wishlist';
  button.setAttribute('aria-pressed', saved ? 'true' : 'false');
}


/* ----------------------------------------------------------
   5. RELATED PRODUCTS
   ---------------------------------------------------------- */

function showRelatedProducts() {
  const byPopularity = function (a, b) { return b.popularity - a.popularity; };

  // first: same category
  let related = PRODUCTS
    .filter(function (p) { return p.id !== product.id && p.category === product.category; })
    .sort(byPopularity);

  // not enough? complete with other popular products
  if (related.length < 4) {
    const others = PRODUCTS
      .filter(function (p) { return p.id !== product.id && p.category !== product.category; })
      .sort(byPopularity);
    related = related.concat(others);
  }

  renderProductGrid(byId('relatedGrid'), related.slice(0, 4));
  byId('relatedSection').hidden = false;
}


/* ----------------------------------------------------------
   6. EVENTS
   ---------------------------------------------------------- */

function setupEvents() {
  // Color buttons (these do NOT change the website theme)
  byId('detailColors').addEventListener('click', function (event) {
    const button = event.target.closest('.color-swatch[data-color-theme]');
    if (button) {
      selectColor(button.getAttribute('data-color-theme'));
    }
  });

  // Size buttons
  byId('sizeList').addEventListener('click', function (event) {
    const button = event.target.closest('.size-btn:not([disabled])');
    if (button) {
      selectSize(Number(button.getAttribute('data-size')));
    }
  });

  // Small pictures
  byId('galleryThumbs').addEventListener('click', function (event) {
    const thumb = event.target.closest('.thumb');
    if (!thumb) {
      return;
    }

    const index = Number(thumb.getAttribute('data-index'));

    byId('galleryThumbs').querySelectorAll('.thumb').forEach(function (other) {
      other.classList.toggle('active', other === thumb);
    });

    if (index === 0) {
      showColorImage();                       // the selected color view
    } else {
      const mainImage = byId('mainImage');
      mainImage.setAttribute('data-shoe-theme', 'photo');   // cancels any recoloring in progress
      mainImage.style.filter = 'none';
      swapImageSource(mainImage, product.gallery[index]);
    }
  });

  // Quantity
  byId('qtyMinus').addEventListener('click', function () { setQuantity(quantity - 1, false); });
  byId('qtyPlus').addEventListener('click', function () { setQuantity(quantity + 1, true); });

  // Wishlist (the visitor is logged in, because this page is protected)
  byId('detailWishlist').addEventListener('click', function () {
    const result = toggleWishlist(product.id);
    showToast(result.message);
  });
  document.addEventListener('wishlistchange', updateWishlistButton);
}


/* ----------------------------------------------------------
   7. START-UP
   ---------------------------------------------------------- */

function initDetails() {
  if (!byId('detailsLayout')) {
    return;
  }

  // A visitor who is not logged in is already being sent to login.html (auth.js)
  if (!isLoggedIn()) {
    return;
  }

  product = getProductById(getQueryParam('id'));

  // Wrong or missing id: show the "not found" message
  if (!product) {
    byId('detailsLayout').hidden = true;
    byId('detailsWrapper').hidden = true;
    byId('notFound').hidden = false;
    document.title = 'Sneaker not found | SNEAKERS HUB';
    return;
  }

  fillProductInfo();
  buildColorButtons();
  buildSizeButtons();
  buildThumbnails();

  // Which color? Use ?color=... if the product really has it
  const colorParam = getQueryParam('color');
  const hasColor = product.colors.some(function (c) { return c.theme === colorParam; });
  selectedColor = hasColor ? colorParam : product.colors[0].theme;

  // Show the right picture immediately (no fade on first load)
  const firstColor = product.colors.find(function (c) { return c.theme === selectedColor; });
  byId('mainImage').setAttribute('src', firstColor.image || product.image);

  selectColor(selectedColor);
  updateStockStatus();
  setQuantity(1, false);
  setupAddToCartButton();
  updateWishlistButton();
  setupEvents();
  showRelatedProducts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDetails);
} else {
  initDetails();
}