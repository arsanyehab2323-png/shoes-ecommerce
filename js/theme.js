/* ==========================================================
   SNEAKERS HUB - js/theme.js
   The dynamic color theme system.

   HOW IT WORKS (simple version):
   1. The website's colors are CSS variables in style.css.
   2. Each theme (black, white, red, blue, green) is a set of
      variables that applies when <html data-theme="NAME"> is set.
   3. This file changes that ONE attribute, and CSS does the rest.
   4. The chosen theme is saved in localStorage, so it is still
      selected after you refresh or visit another page.
   5. The SHOE PHOTOS change color too (see "Shoe colors" below).

   Needs: data.js (STORAGE_KEYS, DEFAULT_THEME, isValidTheme, getProductById)
   ========================================================== */


// The color of the browser's address bar on phones, per theme
const THEME_META_COLORS = {
  black: '#0b0b0c',
  white: '#ffffff',
  red:   '#1a0508',
  blue:  '#050c1f',
  green: '#04140c'
};


/* ----------------------------------------------------------
   Reading and saving the theme
   ---------------------------------------------------------- */

// Get the saved theme from localStorage (or the default one)
function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved && isValidTheme(saved)) {
      return saved;
    }
  } catch (error) {
    // localStorage can be blocked in some browsers; ignore and use default
  }
  return DEFAULT_THEME;
}

// Get the theme that is active on the page right now
function getCurrentTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  return isValidTheme(current) ? current : DEFAULT_THEME;
}

function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch (error) {
    // ignore
  }
}


/* ----------------------------------------------------------
   SHOE COLORS
   We recolor the SHOE ITSELF inside the photo:
   1. The photo is drawn on a hidden <canvas>.
   2. Every pixel that has the shoe's original color (red) is
      changed to the new color. Background and white parts stay.
   3. The new picture replaces the old one on the page.

   An <img> becomes a "color-changing shoe" when it has:
     data-shoe-base="red"   -> the original color of the shoe in the photo
     data-product-id="3"    -> (optional) the product it shows
   The hero image (.hero-img) works automatically (base = red).
   ---------------------------------------------------------- */

// Position of each color on the color wheel (hue, in degrees)
const SHOE_HUES = { red: 355, blue: 222, green: 142 };
const SHOE_SEPIA_HUE = 38;   // used only by the CSS-filter backup below

// Recolored pictures are remembered here so we don't redo the work
const shoeRecolorCache = {};

function clamp01(number) {
  return Math.max(0, Math.min(1, number));
}

// Converts a color from hue/saturation/value to red/green/blue (0-255)
function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r1 = 0, g1 = 0, b1 = 0;

  if (h < 60)       { r1 = c; g1 = x; b1 = 0; }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
  else              { r1 = c; g1 = 0; b1 = x; }

  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}

// Goes through every pixel and recolors the ones that belong to the shoe
function recolorPixels(pixels, baseTheme, targetTheme) {
  const baseHue = SHOE_HUES[baseTheme];

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const saturation = max === 0 ? 0 : delta / max;

    // Gray, white or very dark pixels are not part of the colored shoe
    if (saturation < 0.25 || max < 40) {
      continue;
    }

    // Find the pixel's hue (its position on the color wheel)
    let hue;
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue = hue * 60;
    if (hue < 0) {
      hue += 360;
    }

    // How far is this pixel from the shoe's original color?
    let offset = hue - baseHue;
    if (offset > 180) { offset -= 360; }
    if (offset < -180) { offset += 360; }

    // weight: 1 = surely the shoe, 0 = not the shoe (soft edges in between)
    const weight = clamp01((45 - Math.abs(offset)) / 27) * clamp01((saturation - 0.25) / 0.2);
    if (weight <= 0) {
      continue;
    }

    const value = max / 255;
    let newHue = hue;
    let newSaturation = saturation;
    let newValue = value;

    if (targetTheme === 'black') {
      newSaturation = saturation * 0.08;
      newValue = value * 0.32;
    } else if (targetTheme === 'white') {
      newSaturation = saturation * 0.06;
      newValue = 0.55 + 0.45 * value;
    } else {
      newHue = (SHOE_HUES[targetTheme] + offset + 360) % 360;
    }

    const rgb = hsvToRgb(newHue, newSaturation, newValue);

    pixels[i]     = r + (rgb[0] - r) * weight;
    pixels[i + 1] = g + (rgb[1] - g) * weight;
    pixels[i + 2] = b + (rgb[2] - b) * weight;
  }
}

// Loads a photo, recolors the shoe and gives back the new picture.
// callback(newPictureUrl) or callback(null) if it was not possible.
function recolorShoePhoto(url, baseTheme, targetTheme, callback) {
  // Black or white shoes have no color to change: use the CSS backup instead
  if (!SHOE_HUES[baseTheme]) {
    callback(null);
    return;
  }

  const cacheKey = url + '|' + baseTheme + '|' + targetTheme;
  if (shoeRecolorCache[cacheKey]) {
    callback(shoeRecolorCache[cacheKey]);
    return;
  }

  const source = new Image();
  source.crossOrigin = 'anonymous';   // needed so the browser lets us read the pixels

  source.onload = function () {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;

      const context = canvas.getContext('2d');
      context.drawImage(source, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      recolorPixels(imageData.data, baseTheme, targetTheme);
      context.putImageData(imageData, 0, 0);

      const result = canvas.toDataURL('image/jpeg', 0.92);
      shoeRecolorCache[cacheKey] = result;
      callback(result);
    } catch (error) {
      console.warn('SNEAKERS HUB: could not recolor the photo, using a CSS filter instead.', error);
      callback(null);
    }
  };

  source.onerror = function () {
    console.warn('SNEAKERS HUB: could not load the photo for recoloring, using a CSS filter instead.');
    callback(null);
  };

  source.src = url;
}

// BACKUP: a CSS filter that tints a photo (less accurate than recoloring)
function getShoeFilter(baseTheme, targetTheme) {
  if (baseTheme === targetTheme) {
    return 'none';
  }
  if (targetTheme === 'black') {
    return 'grayscale(1) brightness(0.45) contrast(1.2)';
  }
  if (targetTheme === 'white') {
    return 'grayscale(1) brightness(1.6) contrast(0.9)';
  }
  if (baseTheme === 'black' || baseTheme === 'white') {
    return 'sepia(1) saturate(3) hue-rotate(' + (SHOE_HUES[targetTheme] - SHOE_SEPIA_HUE) + 'deg)';
  }
  const rotation = (SHOE_HUES[targetTheme] - SHOE_HUES[baseTheme] + 360) % 360;
  return 'hue-rotate(' + rotation + 'deg) saturate(1.1)';
}

// Changes the picture with a small fade, so the change looks smooth
function swapImageSource(img, newSrc) {
  if (img.getAttribute('src') === newSrc) {
    return;
  }
  img.style.opacity = '0.25';
  setTimeout(function () {
    img.setAttribute('src', newSrc);
    img.style.opacity = '1';
  }, 180);
}

// Shows a shoe photo in the chosen theme color
function showShoePhoto(img, sourceUrl, baseTheme, theme, needsRecolor) {
  // Remember the latest request (the user may click several colors quickly)
  img.setAttribute('data-shoe-theme', theme);
  img.style.transition = 'filter 0.6s ease, transform 0.5s ease, opacity 0.3s ease';

  // Nothing to recolor: just show the photo as it is
  if (!needsRecolor || baseTheme === theme) {
    img.style.filter = 'none';
    swapImageSource(img, sourceUrl);
    return;
  }

  recolorShoePhoto(sourceUrl, baseTheme, theme, function (newUrl) {
    // The user already picked another color: ignore this old result
    if (img.getAttribute('data-shoe-theme') !== theme) {
      return;
    }

    if (newUrl) {
      img.style.filter = 'none';
      swapImageSource(img, newUrl);
    } else {
      // Backup plan: tint the original photo with a CSS filter
      img.style.filter = getShoeFilter(baseTheme, theme);
      swapImageSource(img, sourceUrl);
    }
  });
}

// Update every shoe photo on the page for the given theme.
// Other files (like ui.js) call this after they create product cards.
function updateShoeImages(theme) {
  theme = theme || getCurrentTheme();

  const images = document.querySelectorAll('[data-shoe-base], .hero-img');

  images.forEach(function (img) {
    const baseTheme = img.getAttribute('data-shoe-base') || 'red';
    const productId = img.getAttribute('data-product-id');
    let sourceUrl = '';
    let needsRecolor = false;

    if (productId) {
      // A product photo
      const product = getProductById(productId);
      if (!product) {
        return;
      }

      const color = product.colors.find(function (c) { return c.theme === theme; });

      if (color && color.image) {
        sourceUrl = color.image;          // a real photo in this color
      } else if (color) {
        sourceUrl = product.image;        // sold in this color, no photo: recolor it
        needsRecolor = true;
      } else {
        sourceUrl = product.image;        // not sold in this color: keep normal photo
      }
    } else {
      // The hero photo: always recolor it. Remember its original address.
      if (!img.getAttribute('data-original-src')) {
        img.setAttribute('data-original-src', img.getAttribute('src'));
      }
      sourceUrl = img.getAttribute('data-original-src');
      needsRecolor = true;
    }

    showShoePhoto(img, sourceUrl, baseTheme, theme, needsRecolor);
  });
}


/* ----------------------------------------------------------
   Updating the page
   ---------------------------------------------------------- */

// Highlight the button of the active theme (header dots + big theme cards)
function updateThemeButtons(theme) {
  const buttons = document.querySelectorAll('[data-theme-option]');

  buttons.forEach(function (button) {
    const isActive = button.getAttribute('data-theme-option') === theme;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

// Change the color of the phone's browser bar to match the theme
function updateBrowserColor(theme) {
  let meta = document.querySelector('meta[name="theme-color"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', THEME_META_COLORS[theme]);
}

// Apply a theme to the whole website.
// shouldSave = false means "don't write to localStorage" (used when loading).
function applyTheme(theme, shouldSave) {
  if (!isValidTheme(theme)) {
    theme = DEFAULT_THEME;
  }

  // THIS is the line that changes the entire website's colors:
  document.documentElement.setAttribute('data-theme', theme);

  if (shouldSave !== false) {
    saveTheme(theme);
  }

  updateThemeButtons(theme);
  updateBrowserColor(theme);
  updateShoeImages(theme);

  // Tell other scripts that the theme changed (they can listen for it)
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
}

// Public function: other files call setTheme('red') to change + save the theme
function setTheme(theme) {
  applyTheme(theme, true);
}


/* ----------------------------------------------------------
   Start-up and events
   ---------------------------------------------------------- */

// Any element with data-theme-option="red" (etc.) becomes a theme button.
// We listen on the whole document, so buttons created later also work.
document.addEventListener('click', function (event) {
  const button = event.target.closest('[data-theme-option]');
  if (!button) {
    return;
  }
  setTheme(button.getAttribute('data-theme-option'));
});

// If the theme is changed in another browser tab, follow it here too
window.addEventListener('storage', function (event) {
  if (event.key === STORAGE_KEYS.theme && event.newValue && isValidTheme(event.newValue)) {
    applyTheme(event.newValue, false);
  }
});

// Apply the saved theme as soon as the page is ready
function initTheme() {
  applyTheme(getSavedTheme(), false);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}