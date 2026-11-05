/* ==========================================================
   SNEAKERS HUB - js/checkout.js
   Code for checkout.html only: a checkout DEMONSTRATION.

   - NO real payment is taken and NO card details are collected.
     Real payments need a payment provider (Stripe, PayPal...) and a backend.
   - The demo order is saved only in this browser (localStorage),
     and it does NOT include the phone number or the full address.

   Needs: data.js, theme.js, store.js, auth.js, ui.js
   ========================================================== */

function byId(id) {
  return document.getElementById(id);
}

let orderPlaced = false;   // becomes true after a successful (demo) order


/* ----------------------------------------------------------
   1. SMALL HELPERS (same idea as in login.js / register.js)
   ---------------------------------------------------------- */

function showAlert(box, type, message) {
  box.className = 'alert alert-' + type;
  box.textContent = message;
  box.hidden = false;
}

function hideAlert(box) {
  box.hidden = true;
  box.textContent = '';
}

function setFieldError(input, errorElement, message) {
  errorElement.textContent = message || '';
  input.classList.toggle('input-error', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}


/* ----------------------------------------------------------
   2. THE ORDER SUMMARY (right side)
   ---------------------------------------------------------- */

function renderOrderSummary() {
  const items = getCartDetails();

  byId('orderItems').innerHTML = items.map(function (item) {
    const name = escapeHTML(item.product.brand + ' ' + item.product.name);

    return `
      <div class="order-item">
        <img src="${item.image}" alt="${name}" loading="lazy">
        <div class="order-item-info">
          ${name}<br>
          <small>${escapeHTML(item.colorName)} &middot; Size ${item.size} &times; ${item.quantity}</small>
        </div>
        <strong>${formatPrice(item.lineTotal)}</strong>
      </div>
    `;
  }).join('');

  const totals = getCartTotals();
  byId('checkoutSubtotal').textContent = formatPrice(totals.subtotal);
  byId('checkoutShipping').textContent = totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping);
  byId('checkoutTotal').textContent = formatPrice(totals.total);
}

// Shows the checkout form, or the "your cart is empty" message
function showCorrectView() {
  const isEmpty = getCart().length === 0;

  byId('checkoutLayout').hidden = isEmpty;
  byId('emptyCheckout').hidden = !isEmpty;

  if (!isEmpty) {
    renderOrderSummary();
  }
}


/* ----------------------------------------------------------
   3. CHECKING THE FORM
   ---------------------------------------------------------- */

// Returns an object of errors (empty object = everything is fine)
function validateCheckout(values) {
  const errors = {};

  const fullName = values.fullName.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const address = values.address.trim();
  const city = values.city.trim();
  const postal = values.postal.trim();

  if (fullName.length < 2) {
    errors.fullName = 'Please enter your full name.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  const phoneDigits = phone.replace(/\D/g, '');
  if (/[^\d\s+()-]/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = 'Please enter a valid phone number (7 to 15 digits).';
  }

  if (address.length < 5) {
    errors.address = 'Please enter your street address.';
  }
  if (city.length < 2) {
    errors.city = 'Please enter your city.';
  }
  if (!values.country) {
    errors.country = 'Please select a country.';
  }
  if (postal && !/^[A-Za-z0-9 -]{3,12}$/.test(postal)) {
    errors.postal = 'Please enter a valid postal code.';
  }

  return errors;
}

// Makes sure everything in the cart is still available in that quantity
function cartIsStillAvailable() {
  return getCartDetails().every(function (item) {
    return item.quantity <= item.maxQuantity;
  });
}


/* ----------------------------------------------------------
   4. PLACING THE (DEMO) ORDER
   ---------------------------------------------------------- */

function makeOrderNumber() {
  return 'SH-' + Date.now().toString(36).toUpperCase().slice(-6) +
         Math.floor(Math.random() * 90 + 10);
}

// Saves the demo order. It contains NO payment details, phone or street address.
function saveDemoOrder(values, paymentLabel) {
  const totals = getCartTotals();

  const order = {
    number: makeOrderNumber(),
    date: new Date().toISOString(),
    items: getCartDetails().map(function (item) {
      return {
        productId: item.product.id,
        name: item.product.brand + ' ' + item.product.name,
        color: item.colorName,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal
      };
    }),
    totals: { subtotal: totals.subtotal, shipping: totals.shipping, total: totals.total },
    payment: paymentLabel,
    customer: { name: values.fullName.trim(), city: values.city.trim(), country: values.country }
  };

  writeStorage(STORAGE_KEYS.lastOrder, order);
  return order;
}

// Shows the "thank you" message
function showSuccess(order) {
  byId('checkoutLayout').hidden = true;
  byId('emptyCheckout').hidden = true;
  byId('orderSuccess').hidden = false;

  byId('orderNumber').textContent = order.number;
  byId('orderTotalText').textContent = formatPrice(order.totals.total);
  byId('orderShipText').textContent =
    'We would ship to ' + order.customer.city + ', ' + order.customer.country + '.';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}


/* ----------------------------------------------------------
   5. START-UP
   ---------------------------------------------------------- */

function initCheckout() {
  const form = byId('checkoutForm');
  if (!form) {
    return;
  }

  // A visitor who is not logged in is already being sent to login.html (auth.js)
  if (!isLoggedIn()) {
    return;
  }

  const alertBox = byId('checkoutAlert');
  const placeOrderButton = byId('placeOrderBtn');

  // The form fields (names match the ones used in validateCheckout)
  const fields = {
    fullName: { input: byId('coFullName'), error: byId('coFullNameError') },
    email:    { input: byId('coEmail'),    error: byId('coEmailError') },
    phone:    { input: byId('coPhone'),    error: byId('coPhoneError') },
    address:  { input: byId('coAddress'),  error: byId('coAddressError') },
    city:     { input: byId('coCity'),     error: byId('coCityError') },
    postal:   { input: byId('coPostal'),   error: byId('coPostalError') },
    country:  { input: byId('coCountry'),  error: byId('coCountryError') }
  };
  const fieldNames = Object.keys(fields);

  function readValues() {
    const values = {};
    fieldNames.forEach(function (name) {
      values[name] = fields[name].input.value;
    });
    return values;
  }

  function showErrors(errors) {
    fieldNames.forEach(function (name) {
      setFieldError(fields[name].input, fields[name].error, errors[name] || '');
    });
  }

  // Fill in the name and email of the logged-in user
  const user = getCurrentUser();
  if (user) {
    fields.fullName.input.value = user.fullName;
    fields.email.input.value = user.email;
  }

  // Check a field when the visitor leaves it; remove its error while typing
  fieldNames.forEach(function (name) {
    const input = fields[name].input;

    input.addEventListener('blur', function () {
      if (!input.value) {
        return;
      }
      const errors = validateCheckout(readValues());
      setFieldError(input, fields[name].error, errors[name] || '');
    });

    input.addEventListener(name === 'country' ? 'change' : 'input', function () {
      setFieldError(input, fields[name].error, '');
      hideAlert(alertBox);
    });
  });

  // Send the order
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    hideAlert(alertBox);

    // 1. Check the form
    const values = readValues();
    const errors = validateCheckout(values);

    if (Object.keys(errors).length > 0) {
      showErrors(errors);
      showAlert(alertBox, 'error', 'Please fix the highlighted fields.');

      for (let i = 0; i < fieldNames.length; i++) {
        if (errors[fieldNames[i]]) {
          fields[fieldNames[i]].input.focus();
          break;
        }
      }
      return;
    }
    showErrors({});

    // 2. Check the cart is not empty and everything is still in stock
    if (getCart().length === 0) {
      showCorrectView();
      return;
    }
    if (!cartIsStillAvailable()) {
      showAlert(alertBox, 'error',
        'Some items are no longer available in the quantity you chose. Please review your cart.');
      return;
    }

    // 3. Place the order (a short pause makes the demo feel real)
    placeOrderButton.disabled = true;
    placeOrderButton.textContent = 'Placing order...';

    setTimeout(function () {
      const payment = form.querySelector('input[name="payment"]:checked').value;
      const paymentLabel = payment === 'cod' ? 'Cash on delivery (demo)' : 'Online payment (demo)';

      const order = saveDemoOrder(values, paymentLabel);

      orderPlaced = true;       // so the cart change below does not show "empty cart"
      clearCart();

      showSuccess(order);
      showToast('Demo order placed!');

      placeOrderButton.disabled = false;
      placeOrderButton.textContent = 'Place Order (Demo)';
    }, 700);
  });

  // The cart was changed in another tab
  document.addEventListener('cartchange', function () {
    if (!orderPlaced) {
      showCorrectView();
    }
  });

  showCorrectView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckout);
} else {
  initCheckout();
}