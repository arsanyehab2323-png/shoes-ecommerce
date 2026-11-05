/* ==========================================================
   SNEAKERS HUB - js/contact.js
   Code for contact.html only: a DEMO contact form.

   The message is only checked in the browser. It is NOT sent anywhere
   and it is NOT saved. A real contact form needs a backend or an
   email service.

   Needs: data.js, theme.js, store.js, auth.js, ui.js
   ========================================================== */

const MAX_MESSAGE_LENGTH = 500;

function byId(id) {
  return document.getElementById(id);
}


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
   2. CHECKING THE FORM
   ---------------------------------------------------------- */

// Returns an object of errors (empty object = everything is fine)
function validateContact(values) {
  const errors = {};

  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();

  if (name.length < 2) {
    errors.name = 'Please enter your name.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!values.subject) {
    errors.subject = 'Please choose a subject.';
  }
  if (message.length < 10) {
    errors.message = 'Your message is too short (at least 10 characters).';
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    errors.message = 'Your message is too long (maximum ' + MAX_MESSAGE_LENGTH + ' characters).';
  }

  return errors;
}


/* ----------------------------------------------------------
   3. START-UP
   ---------------------------------------------------------- */

function initContact() {
  const form = byId('contactForm');
  if (!form) {
    return;
  }

  const alertBox = byId('contactAlert');
  const resultText = byId('contactResult');
  const sendButton = byId('contactButton');
  const counter = byId('messageCount');

  // The form fields (names match the ones used in validateContact)
  const fields = {
    name:    { input: byId('cnName'),    error: byId('cnNameError') },
    email:   { input: byId('cnEmail'),   error: byId('cnEmailError') },
    subject: { input: byId('cnSubject'), error: byId('cnSubjectError') },
    message: { input: byId('cnMessage'), error: byId('cnMessageError') }
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

  function updateCounter() {
    counter.textContent = fields.message.input.value.length + ' / ' + MAX_MESSAGE_LENGTH;
  }

  // If the visitor is logged in, fill in the name and email
  const user = getCurrentUser();
  if (user) {
    fields.name.input.value = user.fullName;
    fields.email.input.value = user.email;
  }
  updateCounter();

  // Check a field when the visitor leaves it; remove its error while typing
  fieldNames.forEach(function (name) {
    const input = fields[name].input;

    input.addEventListener('blur', function () {
      if (!input.value) {
        return;
      }
      const errors = validateContact(readValues());
      setFieldError(input, fields[name].error, errors[name] || '');
    });

    input.addEventListener(name === 'subject' ? 'change' : 'input', function () {
      setFieldError(input, fields[name].error, '');
      hideAlert(alertBox);
      resultText.textContent = '';
      resultText.className = 'form-message';
    });
  });

  fields.message.input.addEventListener('input', updateCounter);

  // Send the message (demo)
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    hideAlert(alertBox);
    resultText.textContent = '';
    resultText.className = 'form-message';

    // 1. Check the form
    const values = readValues();
    const errors = validateContact(values);

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

    // 2. "Send" it (a short pause makes the demo feel real)
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';

    setTimeout(function () {
      const firstName = values.name.trim().split(' ')[0];

      resultText.textContent = 'Thank you, ' + firstName + '! Your message looks good. ' +
                               '(Demo only: nothing was sent or saved.)';
      resultText.className = 'form-message success';
      showToast('Message checked (demo).');

      // empty the subject and the message (keep the name and email)
      fields.subject.input.value = '';
      fields.message.input.value = '';
      updateCounter();

      sendButton.disabled = false;
      sendButton.textContent = 'Send Message';
    }, 700);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContact);
} else {
  initContact();
}