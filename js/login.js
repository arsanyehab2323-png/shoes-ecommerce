/* ==========================================================
   SNEAKERS HUB - js/login.js
   Code for login.html only (the CREATIVE login page).

   THE EXPERIENCE:
   1. The page opens with a big sneaker in the middle        (state: intro)
   2. The visitor taps the sneaker: it slides to the left
      and the login form appears next to it                   (state: open)
   3. After a successful login the form disappears, the sneaker
      returns to the middle and the visitor is sent on        (state: success)

   If the visitor came by clicking a sneaker, THAT sneaker (with its
   name, color and price) is the one shown on the left.

   REMINDER: this is a frontend DEMO (see the warning in auth.js).

   Needs: data.js, theme.js, store.js, auth.js, ui.js
   ========================================================== */

function byId(id) {
  return document.getElementById(id);
}


/* ----------------------------------------------------------
   1. SMALL HELPERS
   ---------------------------------------------------------- */

// Shows a message in the alert box. type: 'error' | 'success' | 'info'
function showAlert(box, type, message) {
  box.className = 'alert alert-' + type;
  box.textContent = message;
  box.hidden = false;
}

function hideAlert(box) {
  box.hidden = true;
  box.textContent = '';
}

// Shows (or clears) the error text under one field
function setFieldError(input, errorElement, message) {
  errorElement.textContent = message || '';
  input.classList.toggle('input-error', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}


/* ----------------------------------------------------------
   2. THE SNEAKER THE VISITOR CLICKED (if any)
   The address looks like: login.html?redirect=product-details.html%3Fid%3D3%26color%3Dred
   ---------------------------------------------------------- */

// Returns { product, color } or null when the visitor did not come from a product
function getChosenProduct(target) {
  if (target.indexOf('product-details.html') !== 0) {
    return null;
  }

  const url = new URL(target, window.location.href);
  const product = getProductById(url.searchParams.get('id'));
  if (!product) {
    return null;
  }

  const wantedColor = url.searchParams.get('color');
  const color = product.colors.find(function (c) { return c.theme === wantedColor; }) || product.colors[0];

  return { product: product, color: color };
}

// Shows the chosen product on the left side. Returns the product name (or '').
function showChosenProduct(chosen) {
  const product = chosen.product;
  const color = chosen.color;
  const baseTheme = product.colors[0].theme;

  // Use a FRESH copy of the picture, so the automatic theme recoloring
  // (theme.js) can not change it by mistake.
  const oldImg = byId('loginShoeImg');
  const img = oldImg.cloneNode(false);
  img.removeAttribute('data-shoe-base');
  img.removeAttribute('data-original-src');
  img.removeAttribute('data-shoe-theme');
  img.removeAttribute('style');
  oldImg.replaceWith(img);

  img.setAttribute('src', color.image || product.image);
  img.setAttribute('alt', product.brand + ' ' + product.name + ' in ' + color.name +
                          '. Tap to log in and view it.');

  // No photo for this color: recolor the shoe of the main photo (preview)
  if (!color.image && color.theme !== baseTheme && typeof showShoePhoto === 'function') {
    showShoePhoto(img, product.image, baseTheme, color.theme, true);
  }

  const fullName = product.brand + ' ' + product.name;

  byId('loginTap').textContent = '\uD83D\uDC46 Tap to log in and view ' + product.name;
  byId('loginShoe').setAttribute('aria-label', 'Tap the sneaker to log in and view ' + fullName);
  byId('loginCaptionTitle').textContent = fullName;
  byId('loginCaptionText').textContent = color.name + ' \u00B7 ' + formatPrice(product.price) +
                                         ' \u2014 log in to continue.';

  return fullName;
}


/* ----------------------------------------------------------
   3. START-UP
   ---------------------------------------------------------- */

function initLogin() {
  const form = byId('loginForm');
  if (!form) {
    return;
  }

  // Already logged in? No need to see this page: go where you wanted to go.
  if (isLoggedIn()) {
    window.location.replace(getRedirectTarget());
    return;
  }

  // The page elements we need
  const stage = byId('loginStage');
  const shoe = byId('loginShoe');
  const identifierInput = byId('loginIdentifier');
  const passwordInput = byId('loginPassword');
  const identifierError = byId('identifierError');
  const passwordError = byId('passwordError');
  const alertBox = byId('loginAlert');
  const loginButton = byId('loginButton');
  const toggleButton = byId('togglePassword');
  const fillDemoButton = byId('fillDemo');
  const registerLink = byId('registerLink');
  const forgotLink = byId('forgotLink');
  const forgotPanel = byId('forgotPanel');
  const forgotForm = byId('forgotForm');
  const forgotEmail = byId('forgotEmail');
  const forgotMessage = byId('forgotMessage');

  /* ---- Messages and options from the address bar ---- */
  const params = new URLSearchParams(window.location.search);
  const target = getRedirectTarget();                    // where to go after login
  const hasRedirect = isSafeRedirect(params.get('redirect'));
  const justRegistered = params.get('registered') === '1';

  if (justRegistered) {
    showAlert(alertBox, 'success', 'Account created! You can now log in.');
  } else if (hasRedirect && target !== 'index.html') {
    showAlert(alertBox, 'info', 'Please log in to continue.');
  }

  // Keep the redirect when the visitor goes to the register page
  if (hasRedirect) {
    registerLink.setAttribute('href', 'register.html?redirect=' + encodeURIComponent(target));
  }

  // Did the visitor click a sneaker? Then show THAT sneaker.
  const chosen = getChosenProduct(target);
  const chosenName = chosen ? showChosenProduct(chosen) : '';


  /* ---- The tap animation: intro -> open ---- */
  function openLogin() {
    if (stage.getAttribute('data-state') !== 'intro') {
      return;
    }
    stage.setAttribute('data-state', 'open');
    shoe.setAttribute('aria-expanded', 'true');

    // put the cursor in the first field once the form is visible
    setTimeout(function () {
      identifierInput.focus({ preventScroll: true });
    }, 800);
  }

  shoe.addEventListener('click', openLogin);

  // No animation needed: open at once for visitors who just registered
  // or who asked their device for less motion.
  const prefersLessMotion = window.matchMedia &&
                            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (justRegistered || prefersLessMotion) {
    stage.setAttribute('data-state', 'open');
    shoe.setAttribute('aria-expanded', 'true');
  }


  /* ---- Show / hide password ---- */
  toggleButton.addEventListener('click', function () {
    const isHidden = passwordInput.getAttribute('type') === 'password';

    passwordInput.setAttribute('type', isHidden ? 'text' : 'password');
    toggleButton.textContent = isHidden ? 'Hide' : 'Show';
    toggleButton.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    toggleButton.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
  });


  /* ---- Fill the demo account ---- */
  fillDemoButton.addEventListener('click', function () {
    identifierInput.value = DEMO_ACCOUNT.username;
    passwordInput.value = DEMO_ACCOUNT.password;
    setFieldError(identifierInput, identifierError, '');
    setFieldError(passwordInput, passwordError, '');
    hideAlert(alertBox);
    loginButton.focus();
  });


  /* ---- Clear errors while typing ---- */
  identifierInput.addEventListener('input', function () {
    setFieldError(identifierInput, identifierError, '');
    hideAlert(alertBox);
  });
  passwordInput.addEventListener('input', function () {
    setFieldError(passwordInput, passwordError, '');
    hideAlert(alertBox);
  });


  /* ---- Submit the login form ---- */
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    hideAlert(alertBox);

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;

    // 1. Check that both fields are filled
    let hasError = false;

    if (!identifier) {
      setFieldError(identifierInput, identifierError, 'Please enter your username or email.');
      hasError = true;
    } else {
      setFieldError(identifierInput, identifierError, '');
    }

    if (!password) {
      setFieldError(passwordInput, passwordError, 'Please enter your password.');
      hasError = true;
    } else {
      setFieldError(passwordInput, passwordError, '');
    }

    if (hasError) {
      (identifier ? passwordInput : identifierInput).focus();
      return;
    }

    // 2. Try to log in (the button is disabled while we wait)
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';

    let result;
    try {
      result = await loginUser(identifier, password);
    } catch (error) {
      result = { success: false, message: 'Something went wrong. Please try again.' };
    }

    // 3. Success -> the form disappears, the sneaker returns to the middle,
    //    then we go to the page the visitor wanted
    if (result.success) {
      byId('loginCaptionTitle').textContent = result.message;
      byId('loginCaptionText').textContent = chosenName
        ? 'Taking you to ' + chosenName + '...'
        : 'Taking you in...';

      stage.setAttribute('data-state', 'success');
      showToast(result.message);
      setTimeout(redirectAfterLogin, 1500);
      return;
    }

    // 4. Failure -> show the message and let the visitor try again
    showAlert(alertBox, 'error', result.message);
    passwordInput.value = '';
    passwordInput.focus();
    loginButton.disabled = false;
    loginButton.textContent = 'Log In';
  });


  /* ---- Forgot password (DEMO only) ---- */
  forgotLink.addEventListener('click', function (event) {
    event.preventDefault();

    const willOpen = forgotPanel.hidden;
    forgotPanel.hidden = !willOpen;

    if (willOpen) {
      // if the visitor already typed an email above, reuse it
      if (identifierInput.value.indexOf('@') !== -1) {
        forgotEmail.value = identifierInput.value.trim();
      }
      forgotEmail.focus();
    }
  });

  forgotForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const result = requestPasswordReset(forgotEmail.value);
    forgotMessage.textContent = result.message;
    forgotMessage.className = 'form-message ' + (result.success ? 'success' : 'error');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  initLogin();
}