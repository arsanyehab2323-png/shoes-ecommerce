/* ==========================================================
   SNEAKERS HUB - js/register.js
   Code for register.html only.

   REMINDER: this is a frontend DEMO (see the warning in auth.js).
   The password is never saved as plain text: auth.js saves a hash.

   Needs: data.js, theme.js, store.js, auth.js, ui.js
   ========================================================== */


/* ----------------------------------------------------------
   1. SMALL HELPERS
   (the same helpers as in login.js; each page has its own copy)
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
   2. START-UP
   ---------------------------------------------------------- */

function initRegister() {
  const form = document.getElementById('registerForm');
  if (!form) {
    return;
  }

  // Already logged in? No need to register again.
  if (isLoggedIn()) {
    window.location.replace(getRedirectTarget());
    return;
  }

  const alertBox = document.getElementById('registerAlert');
  const registerButton = document.getElementById('registerButton');
  const loginLink = document.getElementById('loginLink');

  // Each field has an input box and a place for its error message.
  // The names (fullName, email...) match the names used in auth.js.
  const fields = {
    fullName:        { input: document.getElementById('regFullName'),        error: document.getElementById('fullNameError') },
    email:           { input: document.getElementById('regEmail'),           error: document.getElementById('emailError') },
    username:        { input: document.getElementById('regUsername'),        error: document.getElementById('usernameError') },
    password:        { input: document.getElementById('regPassword'),        error: document.getElementById('passwordError') },
    confirmPassword: { input: document.getElementById('regConfirmPassword'), error: document.getElementById('confirmPasswordError') }
  };
  const fieldNames = Object.keys(fields);

  // Reads everything the visitor typed
  function readValues() {
    const values = {};
    fieldNames.forEach(function (name) {
      values[name] = fields[name].input.value;
    });
    return values;
  }

  // Shows the errors object (from validateRegistration) under the fields
  function showErrors(errors) {
    fieldNames.forEach(function (name) {
      setFieldError(fields[name].input, fields[name].error, errors[name] || '');
    });
  }

  // Puts the cursor in the first field that has an error
  function focusFirstError(errors) {
    for (let i = 0; i < fieldNames.length; i++) {
      if (errors[fieldNames[i]]) {
        fields[fieldNames[i]].input.focus();
        return;
      }
    }
  }


  /* ---- Keep the "redirect" when going to the login page ---- */
  const params = new URLSearchParams(window.location.search);
  const target = getRedirectTarget();
  const hasRedirect = isSafeRedirect(params.get('redirect'));

  if (hasRedirect) {
    loginLink.setAttribute('href', 'login.html?redirect=' + encodeURIComponent(target));
  }


  /* ---- Show / hide password (both password fields) ---- */
  document.querySelectorAll('[data-toggle-password]').forEach(function (button) {
    button.addEventListener('click', function () {
      const input = document.getElementById(button.getAttribute('data-toggle-password'));
      const isHidden = input.getAttribute('type') === 'password';

      input.setAttribute('type', isHidden ? 'text' : 'password');
      button.textContent = isHidden ? 'Hide' : 'Show';
      button.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      button.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
    });
  });


  /* ---- Check fields while the visitor fills the form ---- */
  fieldNames.forEach(function (name) {
    const input = fields[name].input;

    // When the visitor leaves a field: check it (but not if it is still empty)
    input.addEventListener('blur', function () {
      if (!input.value) {
        return;
      }
      const errors = validateRegistration(readValues());
      setFieldError(input, fields[name].error, errors[name] || '');
    });

    // While typing: remove the old error
    input.addEventListener('input', function () {
      setFieldError(input, fields[name].error, '');
      hideAlert(alertBox);

      // If the password changes, check the confirmation again
      if (name === 'password' && fields.confirmPassword.input.value) {
        const errors = validateRegistration(readValues());
        setFieldError(fields.confirmPassword.input, fields.confirmPassword.error, errors.confirmPassword || '');
      }
    });
  });


  /* ---- Submit the form ---- */
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    hideAlert(alertBox);

    // 1. Check everything in the browser first
    const values = readValues();
    const errors = validateRegistration(values);

    if (Object.keys(errors).length > 0) {
      showErrors(errors);
      showAlert(alertBox, 'error', 'Please fix the highlighted fields.');
      focusFirstError(errors);
      return;
    }
    showErrors({});

    // 2. Create the account (the button is disabled while we wait)
    registerButton.disabled = true;
    registerButton.textContent = 'Creating account...';

    let result;
    try {
      result = await registerUser(values);
    } catch (error) {
      result = { success: false, message: 'Something went wrong. Please try again.', errors: {} };
    }

    // 3. Success -> go to the login page
    if (result.success) {
      showAlert(alertBox, 'success', result.message + ' Taking you to the login page...');
      showToast('Account created!');

      const loginUrl = 'login.html?registered=1' +
                       (hasRedirect ? '&redirect=' + encodeURIComponent(target) : '');
      setTimeout(function () {
        window.location.href = loginUrl;
      }, 1200);
      return;
    }

    // 4. Failure (for example: username already taken)
    const serverErrors = result.errors || {};
    showErrors(serverErrors);
    showAlert(alertBox, 'error', result.message);
    focusFirstError(serverErrors);

    registerButton.disabled = false;
    registerButton.textContent = 'Create Account';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRegister);
} else {
  initRegister();
}