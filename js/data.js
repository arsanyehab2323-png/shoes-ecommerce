/* ==========================================================
   SNEAKERS HUB - js/data.js
   Shared data used by EVERY page: products, categories,
   colors, storage keys and a few small helper functions.

   This file must be loaded FIRST (before the other scripts).
   ========================================================== */


/* ----------------------------------------------------------
   1. SETTINGS
   ---------------------------------------------------------- */

// Names of the keys we use inside the browser's localStorage
const STORAGE_KEYS = {
  theme: 'sneakershub_theme',
  cart: 'sneakershub_cart',
  wishlist: 'sneakershub_wishlist',
  users: 'sneakershub_users',       // demo accounts (registration)
  session: 'sneakershub_session',   // who is logged in (demo only)
  lastOrder: 'sneakershub_last_order'
};

// Store settings (change the currency symbol or prices here)
const STORE_SETTINGS = {
  currency: '$',
  freeShippingOver: 100,   // orders above this amount ship for free
  shippingFee: 9.99
};

const DEFAULT_THEME = 'black';

// The 4 product categories (the "id" is used in the URL: products.html?category=running)
const CATEGORIES = [
  { id: 'running',    name: 'Running' },
  { id: 'lifestyle',  name: 'Lifestyle' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'skate',      name: 'Skate' }
];

// The 5 colors. The "theme" value is ALSO the website theme name
// (it matches data-theme="..." in style.css).
const COLOR_OPTIONS = [
  { theme: 'black', name: 'Black', hex: '#151517' },
  { theme: 'white', name: 'White', hex: '#ffffff' },
  { theme: 'red',   name: 'Red',   hex: '#e11d2e' },
  { theme: 'blue',  name: 'Blue',  hex: '#2f6bff' },
  { theme: 'green', name: 'Green', hex: '#16a34a' }
];

const THEME_NAMES = COLOR_OPTIONS.map(function (c) { return c.theme; });

// Shoe sizes (EU) shown in the size filter
const ALL_SIZES = [38, 39, 40, 41, 42, 43, 44, 45, 46];


/* ----------------------------------------------------------
   2. IMAGES
   Product photos come from Unsplash. If an image ever fails to
   load, ui.js automatically replaces it with FALLBACK_IMAGE below.
   ---------------------------------------------------------- */

// A simple built-in placeholder (no file needed)
const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">' +
  '<rect width="800" height="800" fill="#2a2a2e"/>' +
  '<text x="400" y="400" font-size="140" text-anchor="middle">👟</text>' +
  '<text x="400" y="500" font-family="Arial, sans-serif" font-size="34" font-weight="700" ' +
  'fill="#9a9aa3" text-anchor="middle" letter-spacing="6">SNEAKERS HUB</text>' +
  '</svg>'
);

// Builds a full Unsplash image URL from a photo id
function unsplash(photoId, width) {
  return 'https://images.unsplash.com/photo-' + photoId +
         '?auto=format&fit=crop&w=' + (width || 800) + '&q=80';
}

// A small library of photos we reuse across products
const IMG = {
  a: unsplash('1542291026-7eec264c27ff'),
  b: unsplash('1549298916-b41d501d3772'),
  c: unsplash('1600185365926-3a2ce3cdb9eb'),
  d: unsplash('1595950653106-6c9ebd614d3a'),
  e: unsplash('1606107557195-0e29a4b5b4aa'),
  f: unsplash('1491553895911-0055eca6402d'),
  g: unsplash('1460353581641-37baddab0fa2'),
  h: unsplash('1543508282-6319a3e2621f'),
  i: unsplash('1560769629-975ec94e6a86'),
  j: unsplash('1514989940723-e8e51635b782'),
  k: unsplash('1525966222134-fcfa99b8ae77'),
  l: unsplash('1579338559194-a162d19bf842'),
  m: unsplash('1539185441755-769473a23570'),
  n: unsplash('1552346154-21d32810aba3'),
  o: unsplash('1556906781-9a412961c28c'),
  p: unsplash('1608231387042-66d1773070a5')
};


/* ----------------------------------------------------------
   3. PRODUCTS
   Each product has:
     id, name, brand, category, price, oldPrice (or null), tag,
     rating, reviews, popularity (used for sorting),
     description, image (main photo), gallery (extra photos),
     sizes (all sizes offered), stock (units left PER size; 0 = sold out),
     colors (each color has a "theme" and an optional "image").

   makeColor('red', IMG.a)  -> a color option that ALSO changes the
                               website theme to red when clicked.
   If the image is left out (null), the product keeps its main photo.
   ---------------------------------------------------------- */

function makeColor(theme, image) {
  const base = COLOR_OPTIONS.find(function (c) { return c.theme === theme; });
  return {
    theme: base.theme,
    name: base.name,
    hex: base.hex,
    image: image || null
  };
}

const PRODUCTS = [
  {
    id: 1,
    name: 'Pulse Runner',
    brand: 'Aerolite',
    category: 'running',
    price: 129,
    oldPrice: 159,
    tag: 'Best Seller',
    rating: 4.8,
    reviews: 214,
    popularity: 95,
    description: 'Lightweight daily trainer with a responsive foam midsole and breathable mesh upper.',
    image: IMG.a,
    gallery: [IMG.a, IMG.f, IMG.b],
    sizes: [39, 40, 41, 42, 43, 44, 45],
    stock: { 39: 4, 40: 7, 41: 9, 42: 12, 43: 6, 44: 3, 45: 0 },
    colors: [makeColor('red', IMG.a), makeColor('black', IMG.m), makeColor('white', IMG.o)]
  },
  {
    id: 2,
    name: 'Cloud Glide',
    brand: 'Nimbus',
    category: 'running',
    price: 149,
    oldPrice: null,
    tag: 'New',
    rating: 4.7,
    reviews: 162,
    popularity: 88,
    description: 'Cushioned long-distance runner that feels like running on a cloud.',
    image: IMG.d,
    gallery: [IMG.d, IMG.h, IMG.g],
    sizes: [38, 39, 40, 41, 42, 43, 44],
    stock: { 38: 3, 39: 5, 40: 8, 41: 10, 42: 7, 43: 4, 44: 2 },
    colors: [makeColor('blue', IMG.d), makeColor('white'), makeColor('black')]
  },
  {
    id: 3,
    name: 'Court King',
    brand: 'Voltix',
    category: 'basketball',
    price: 169,
    oldPrice: null,
    tag: 'Best Seller',
    rating: 4.9,
    reviews: 301,
    popularity: 99,
    description: 'High-top court shoe with ankle support, grippy outsole and a bold look.',
    image: IMG.e,
    gallery: [IMG.e, IMG.l, IMG.m],
    sizes: [40, 41, 42, 43, 44, 45, 46],
    stock: { 40: 2, 41: 5, 42: 9, 43: 8, 44: 6, 45: 3, 46: 1 },
    colors: [makeColor('red', IMG.e), makeColor('black', IMG.m), makeColor('white')]
  },
  {
    id: 4,
    name: 'Street Classic',
    brand: 'Urbane',
    category: 'lifestyle',
    price: 99,
    oldPrice: null,
    tag: '',
    rating: 4.5,
    reviews: 128,
    popularity: 80,
    description: 'Clean everyday sneaker with a soft leather feel that goes with everything.',
    image: IMG.c,
    gallery: [IMG.c, IMG.o, IMG.n],
    sizes: [38, 39, 40, 41, 42, 43, 44],
    stock: { 38: 6, 39: 8, 40: 10, 41: 12, 42: 9, 43: 5, 44: 4 },
    colors: [makeColor('white', IMG.c), makeColor('black'), makeColor('green')]
  },
  {
    id: 5,
    name: 'Skyline',
    brand: 'Stratos',
    category: 'lifestyle',
    price: 139,
    oldPrice: null,
    tag: '',
    rating: 4.6,
    reviews: 97,
    popularity: 72,
    description: 'Retro-inspired silhouette with modern cushioning for all-day comfort.',
    image: IMG.h,
    gallery: [IMG.h, IMG.d, IMG.p],
    sizes: [39, 40, 41, 42, 43, 44],
    stock: { 39: 3, 40: 6, 41: 8, 42: 7, 43: 5, 44: 2 },
    colors: [makeColor('blue', IMG.h), makeColor('black')]
  },
  {
    id: 6,
    name: 'Trail Blazer',
    brand: 'Aerolite',
    category: 'running',
    price: 119,
    oldPrice: 149,
    tag: 'Sale',
    rating: 4.4,
    reviews: 76,
    popularity: 64,
    description: 'Rugged trail runner with deep lugs for grip on dirt, gravel and wet rock.',
    image: IMG.j,
    gallery: [IMG.j, IMG.a, IMG.g],
    sizes: [40, 41, 42, 43, 44, 45],
    stock: { 40: 4, 41: 6, 42: 8, 43: 7, 44: 3, 45: 2 },
    colors: [makeColor('red', IMG.j), makeColor('black'), makeColor('green')]
  },
  {
    id: 7,
    name: 'Flex Trainer',
    brand: 'Nimbus',
    category: 'running',
    price: 109,
    oldPrice: null,
    tag: '',
    rating: 4.3,
    reviews: 89,
    popularity: 60,
    description: 'Flexible cross-training shoe built for the gym, the track and everything between.',
    image: IMG.f,
    gallery: [IMG.f, IMG.a, IMG.i],
    sizes: [38, 39, 40, 41, 42, 43],
    stock: { 38: 5, 39: 7, 40: 9, 41: 8, 42: 6, 43: 4 },
    colors: [makeColor('red', IMG.f), makeColor('black'), makeColor('blue')]
  },
  {
    id: 8,
    name: 'Air Dunk Pro',
    brand: 'Voltix',
    category: 'basketball',
    price: 159,
    oldPrice: null,
    tag: 'New',
    rating: 4.7,
    reviews: 188,
    popularity: 90,
    description: 'Explosive court performance with a cushioned heel and a locked-in fit.',
    image: IMG.l,
    gallery: [IMG.l, IMG.e, IMG.m],
    sizes: [41, 42, 43, 44, 45, 46],
    stock: { 41: 3, 42: 6, 43: 7, 44: 5, 45: 2, 46: 0 },
    colors: [makeColor('black', IMG.l), makeColor('white'), makeColor('green')]
  },
  {
    id: 9,
    name: 'Skate Low',
    brand: 'Urbane',
    category: 'skate',
    price: 79,
    oldPrice: null,
    tag: '',
    rating: 4.5,
    reviews: 143,
    popularity: 77,
    description: 'Durable low-top with a flat vulcanized sole and reinforced toe for board feel.',
    image: IMG.k,
    gallery: [IMG.k, IMG.p, IMG.n],
    sizes: [38, 39, 40, 41, 42, 43, 44],
    stock: { 38: 6, 39: 9, 40: 11, 41: 10, 42: 8, 43: 6, 44: 3 },
    colors: [makeColor('black', IMG.k), makeColor('white'), makeColor('red')]
  },
  {
    id: 10,
    name: 'Retro 90',
    brand: 'Stratos',
    category: 'lifestyle',
    price: 119,
    oldPrice: null,
    tag: '',
    rating: 4.6,
    reviews: 110,
    popularity: 70,
    description: 'A throwback 90s design with chunky layers and a super comfortable fit.',
    image: IMG.g,
    gallery: [IMG.g, IMG.h, IMG.c],
    sizes: [39, 40, 41, 42, 43, 44],
    stock: { 39: 4, 40: 6, 41: 7, 42: 9, 43: 5, 44: 1 },
    colors: [makeColor('white', IMG.g), makeColor('green'), makeColor('red')]
  },
  {
    id: 11,
    name: 'Street Hi',
    brand: 'Voltix',
    category: 'skate',
    price: 89,
    oldPrice: 109,
    tag: 'Sale',
    rating: 4.2,
    reviews: 65,
    popularity: 55,
    description: 'High-top skate shoe with a padded collar and tough canvas upper.',
    image: IMG.p,
    gallery: [IMG.p, IMG.k, IMG.n],
    sizes: [39, 40, 41, 42, 43],
    stock: { 39: 5, 40: 7, 41: 6, 42: 4, 43: 3 },
    colors: [makeColor('blue', IMG.p), makeColor('black')]
  },
  {
    id: 12,
    name: 'Nova Boost',
    brand: 'Aerolite',
    category: 'running',
    price: 179,
    oldPrice: null,
    tag: 'New',
    rating: 4.9,
    reviews: 256,
    popularity: 97,
    description: 'Our top performance racer: ultra-light, super springy and built for speed.',
    image: IMG.o,
    gallery: [IMG.o, IMG.d, IMG.c],
    sizes: [39, 40, 41, 42, 43, 44, 45],
    stock: { 39: 2, 40: 4, 41: 6, 42: 8, 43: 5, 44: 3, 45: 1 },
    colors: [makeColor('white', IMG.o), makeColor('blue', IMG.d), makeColor('black')]
  },
  {
    id: 13,
    name: 'Court Elite',
    brand: 'Nimbus',
    category: 'basketball',
    price: 189,
    oldPrice: null,
    tag: '',
    rating: 4.8,
    reviews: 174,
    popularity: 93,
    description: 'Premium basketball shoe with a carbon-reinforced plate and cushioned landings.',
    image: IMG.i,
    gallery: [IMG.i, IMG.e, IMG.l],
    sizes: [41, 42, 43, 44, 45, 46],
    stock: { 41: 4, 42: 6, 43: 5, 44: 3, 45: 2, 46: 2 },
    colors: [makeColor('red', IMG.i), makeColor('white')]
  },
  {
    id: 14,
    name: 'Vintage Court',
    brand: 'Urbane',
    category: 'lifestyle',
    price: 95,
    oldPrice: null,
    tag: '',
    rating: 4.4,
    reviews: 59,
    popularity: 52,
    description: 'Timeless court-inspired style. Currently sold out, so check back soon!',
    image: IMG.b,
    gallery: [IMG.b, IMG.c, IMG.o],
    sizes: [40, 41, 42, 43, 44],
    stock: { 40: 0, 41: 0, 42: 0, 43: 0, 44: 0 },
    colors: [makeColor('white', IMG.b), makeColor('green')]
  }
];

// Lowest and highest prices (rounded to 10) used by the price filter slider
const PRICE_RANGE = {
  min: Math.floor(Math.min.apply(null, PRODUCTS.map(function (p) { return p.price; })) / 10) * 10,
  max: Math.ceil(Math.max.apply(null, PRODUCTS.map(function (p) { return p.price; })) / 10) * 10
};


/* ----------------------------------------------------------
   4. SMALL HELPER FUNCTIONS (used by many pages)
   ---------------------------------------------------------- */

// Find a product by its id (works with 3 or "3")
function getProductById(id) {
  return PRODUCTS.find(function (product) {
    return product.id === Number(id);
  }) || null;
}

// Returns the right photo for a product + selected color.
// If that color has no special photo, the product's main photo is used.
function getProductImage(product, colorTheme) {
  if (colorTheme) {
    const color = product.colors.find(function (c) { return c.theme === colorTheme; });
    if (color && color.image) {
      return color.image;
    }
  }
  return product.image;
}

// Total units in stock across all sizes
function getTotalStock(product) {
  return Object.keys(product.stock).reduce(function (sum, size) {
    return sum + product.stock[size];
  }, 0);
}

// Stock info for one size (or for the whole product if size is not given)
// Returns { status: 'in-stock' | 'low-stock' | 'out-of-stock', text, units }
// The status matches the CSS classes .in-stock .low-stock .out-of-stock
function getStockInfo(product, size) {
  const hasSize = size !== undefined && size !== null && size !== '';
  const units = hasSize ? (product.stock[size] || 0) : getTotalStock(product);

  if (units <= 0) {
    return { status: 'out-of-stock', text: 'Out of stock', units: 0 };
  }
  if (units <= 5) {
    return { status: 'low-stock', text: 'Only ' + units + ' left', units: units };
  }
  return { status: 'in-stock', text: 'In stock', units: units };
}

function getCategoryName(categoryId) {
  const category = CATEGORIES.find(function (c) { return c.id === categoryId; });
  return category ? category.name : categoryId;
}

function isValidTheme(themeName) {
  return THEME_NAMES.indexOf(themeName) !== -1;
}

// 129 -> "$129.00"
function formatPrice(value) {
  return STORE_SETTINGS.currency + Number(value).toFixed(2);
}