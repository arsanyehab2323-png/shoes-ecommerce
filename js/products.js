/* ==========================================================
   SNEAKERS HUB - js/products.js
   Code for products.html only:
   search, filters (category, size, color, price, stock) and sorting.

   Needs: data.js, theme.js, store.js, auth.js, ui.js
   ========================================================== */


/* ----------------------------------------------------------
   1. THE CURRENT FILTERS
   Everything the visitor chose is kept in this one object.
   ---------------------------------------------------------- */

const filters = {
  search: '',
  category: 'all',          // 'all' or a category id (running, lifestyle...)
  size: null,               // null or a number like 42
  color: 'all',             // 'all' or a color (black, white, red, blue, green)
  maxPrice: PRICE_RANGE.max,
  inStockOnly: false,
  sort: 'popular'           // popular | price-asc | price-desc | rating
};


/* ----------------------------------------------------------
   2. FILTERING AND SORTING
   ---------------------------------------------------------- */

// Returns only the products that match ALL the chosen filters
function getFilteredProducts() {
  const words = filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean);

  return PRODUCTS.filter(function (product) {

    // Search: every typed word must appear in the brand or the name
    if (words.length > 0) {
      const text = (product.brand + ' ' + product.name).toLowerCase();
      const allWordsFound = words.every(function (word) {
        return text.indexOf(word) !== -1;
      });
      if (!allWordsFound) {
        return false;
      }
    }

    // Category
    if (filters.category !== 'all' && product.category !== filters.category) {
      return false;
    }

    // Size: the product must have this size in stock
    if (filters.size !== null && !(product.stock[filters.size] > 0)) {
      return false;
    }

    // Color: the product must be sold in this color
    if (filters.color !== 'all') {
      const hasColor = product.colors.some(function (color) {
        return color.theme === filters.color;
      });
      if (!hasColor) {
        return false;
      }
    }

    // Price
    if (product.price > filters.maxPrice) {
      return false;
    }

    // Stock
    if (filters.inStockOnly && getTotalStock(product) === 0) {
      return false;
    }

    return true;
  });
}

// Returns a sorted copy of the list
function sortProducts(list) {
  const sorted = list.slice();

  sorted.sort(function (a, b) {
    if (filters.sort === 'price-asc') {
      return a.price - b.price;
    }
    if (filters.sort === 'price-desc') {
      return b.price - a.price;
    }
    if (filters.sort === 'rating') {
      return (b.rating - a.rating) || (b.reviews - a.reviews);
    }
    return b.popularity - a.popularity;     // 'popular' (default)
  });

  return sorted;
}


/* ----------------------------------------------------------
   3. SHOWING THE RESULTS
   ---------------------------------------------------------- */

function renderResults() {
  const grid = document.getElementById('productsGrid');
  const countText = document.getElementById('resultsCount');

  const list = sortProducts(getFilteredProducts());

  // "Showing 5 of 14 sneakers"
  if (list.length === 0) {
    countText.textContent = 'No sneakers found.';
  } else {
    const ofTotal = list.length === PRODUCTS.length ? '' : ' of ' + PRODUCTS.length;
    countText.textContent = 'Showing ' + list.length + ofTotal + (list.length === 1 ? ' sneaker' : ' sneakers');
  }

  renderProductGrid(grid, list, {
    emptyTitle: 'No sneakers match your filters',
    emptyText: 'Try a different search, or clear the filters.',
    emptyButtonText: 'Clear filters',
    emptyButtonHref: 'products.html'
  });

  // When a color is chosen, show every card in that color
  if (filters.color !== 'all') {
    grid.querySelectorAll('.product-card').forEach(function (card) {
      setCardColor(card, filters.color);
    });
  }
}

// Page title, breadcrumb and browser tab title
function updateHeading() {
  const title = document.getElementById('pageTitle');
  const subtitle = document.getElementById('pageSubtitle');
  const crumb = document.getElementById('breadcrumbCurrent');

  if (filters.category === 'all') {
    title.textContent = 'All Sneakers';
    subtitle.textContent = 'Browse the full collection. Search, filter and sort to find your perfect pair.';
    crumb.textContent = 'Sneakers';
    document.title = 'Sneakers | SNEAKERS HUB';
  } else {
    const name = getCategoryName(filters.category);
    title.textContent = name + ' Sneakers';
    subtitle.textContent = 'Our ' + name.toLowerCase() + ' collection.';
    crumb.textContent = name;
    document.title = name + ' Sneakers | SNEAKERS HUB';
  }
}

// Keeps the address bar in sync: products.html?category=running&search=nova
function syncUrl() {
  const params = new URLSearchParams();

  if (filters.category !== 'all') {
    params.set('category', filters.category);
  }
  if (filters.search.trim()) {
    params.set('search', filters.search.trim());
  }

  const query = params.toString();
  window.history.replaceState(null, '', window.location.pathname + (query ? '?' + query : ''));
}


/* ----------------------------------------------------------
   4. FILTER BUTTONS (chips)
   ---------------------------------------------------------- */

// Creates the HTML of one chip button
function chipHTML(filterName, value, label, dotColor) {
  const dot = dotColor
    ? '<span style="display:inline-block;width:10px;height:10px;margin-right:6px;border-radius:50%;' +
      'background:' + dotColor + ';box-shadow:inset 0 0 0 1px rgba(128,128,128,0.6);"></span>'
    : '';

  return '<button type="button" class="chip" data-filter="' + filterName + '" data-value="' + value + '">' +
         dot + escapeHTML(label) + '</button>';
}

// Builds the category, size and color chips from the data in data.js
function buildFilterChips() {
  // Category
  let html = chipHTML('category', 'all', 'All');
  CATEGORIES.forEach(function (category) {
    html += chipHTML('category', category.id, category.name);
  });
  document.getElementById('categoryFilters').innerHTML = html;

  // Size
  html = '';
  ALL_SIZES.forEach(function (size) {
    html += chipHTML('size', size, String(size));
  });
  document.getElementById('sizeFilters').innerHTML = html;

  // Color
  html = chipHTML('color', 'all', 'All');
  COLOR_OPTIONS.forEach(function (color) {
    html += chipHTML('color', color.theme, color.name, color.hex);
  });
  document.getElementById('colorFilters').innerHTML = html;
}

// Highlights the chips that match the current filters
function updateChipStates() {
  document.querySelectorAll('.chip[data-filter]').forEach(function (chip) {
    const name = chip.getAttribute('data-filter');
    const value = chip.getAttribute('data-value');
    let isActive = false;

    if (name === 'category') {
      isActive = filters.category === value;
    } else if (name === 'color') {
      isActive = filters.color === value;
    } else if (name === 'size') {
      isActive = filters.size === Number(value);
    }

    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

// The price slider text: "$70" ... "Up to $150"
function updatePriceLabels() {
  document.getElementById('priceMinLabel').textContent = STORE_SETTINGS.currency + PRICE_RANGE.min;
  document.getElementById('priceMaxLabel').textContent = 'Up to ' + STORE_SETTINGS.currency + filters.maxPrice;
}

// Puts all the controls back to their starting values
function clearAllFilters() {
  filters.search = '';
  filters.category = 'all';
  filters.size = null;
  filters.color = 'all';
  filters.maxPrice = PRICE_RANGE.max;
  filters.inStockOnly = false;
  filters.sort = 'popular';

  document.getElementById('shopSearch').value = '';
  document.getElementById('priceRange').value = PRICE_RANGE.max;
  document.getElementById('inStockOnly').checked = false;
  document.getElementById('sortSelect').value = 'popular';

  refreshPage();
}

// Updates everything after a filter changed
function refreshPage() {
  updateChipStates();
  updatePriceLabels();
  updateHeading();
  syncUrl();
  renderResults();
}


/* ----------------------------------------------------------
   5. EVENTS
   ---------------------------------------------------------- */

function setupEvents() {
  const filterPanel = document.getElementById('filterPanel');

  // Chips (category / size / color): one listener for the whole panel
  filterPanel.addEventListener('click', function (event) {
    const chip = event.target.closest('.chip[data-filter]');
    if (!chip) {
      return;
    }

    const name = chip.getAttribute('data-filter');
    const value = chip.getAttribute('data-value');

    if (name === 'category') {
      filters.category = value;
    } else if (name === 'color') {
      filters.color = value;
    } else if (name === 'size') {
      // clicking the selected size again removes the size filter
      filters.size = filters.size === Number(value) ? null : Number(value);
    }

    refreshPage();
  });

  // "Clear all"
  document.getElementById('clearFilters').addEventListener('click', clearAllFilters);

  // Search box
  document.getElementById('shopSearch').addEventListener('input', function (event) {
    filters.search = event.target.value;
    syncUrl();
    renderResults();
  });

  // Sort menu
  document.getElementById('sortSelect').addEventListener('change', function (event) {
    filters.sort = event.target.value;
    renderResults();
  });

  // Price slider
  document.getElementById('priceRange').addEventListener('input', function (event) {
    filters.maxPrice = Number(event.target.value);
    updatePriceLabels();
    renderResults();
  });

  // "In stock only" checkbox
  document.getElementById('inStockOnly').addEventListener('change', function (event) {
    filters.inStockOnly = event.target.checked;
    renderResults();
  });

  // "Filters" button on phones: opens / closes the filter panel
  const filterToggle = document.getElementById('filterToggle');
  filterToggle.addEventListener('click', function () {
    const willOpen = !filterPanel.classList.contains('open');
    filterPanel.classList.toggle('open', willOpen);
    filterToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    filterToggle.textContent = willOpen ? 'Hide filters' : 'Filters';
  });
}


/* ----------------------------------------------------------
   6. START-UP
   ---------------------------------------------------------- */

function initProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) {
    return;
  }

  // Set up the price slider from the real prices
  const priceRange = document.getElementById('priceRange');
  priceRange.min = PRICE_RANGE.min;
  priceRange.max = PRICE_RANGE.max;
  priceRange.value = PRICE_RANGE.max;

  buildFilterChips();

  // Read the address bar: products.html?category=running&search=nova
  const categoryParam = getQueryParam('category');
  const isRealCategory = CATEGORIES.some(function (category) { return category.id === categoryParam; });
  if (isRealCategory) {
    filters.category = categoryParam;
  }

  const searchParam = getQueryParam('search');
  if (searchParam) {
    filters.search = searchParam.slice(0, 60);
    document.getElementById('shopSearch').value = filters.search;
  }

  setupEvents();
  refreshPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProducts);
} else {
  initProducts();
}