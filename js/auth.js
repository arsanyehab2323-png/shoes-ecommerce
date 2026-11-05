/* ==========================================================
   SNEAKERS HUB - js/auth.js
   Login, registration and "who is logged in" (DEMO ONLY).

   ----------------------------------------------------------
   IMPORTANT - READ THIS:
   This is a FRONTEND DEMONSTRATION. It is NOT secure.
   - Everything is stored in the browser (localStorage). Anyone can
     open the developer tools and read or change it.
   - Real authentication REQUIRES A BACKEND SERVER that:
       * hashes passwords on the server (Argon2 / bcrypt),
       * uses HTTPS and secure HttpOnly cookies or tokens,
       * limits login attempts and verifies emails,
       * sends password-reset emails.
   - What we do here: passwords are NEVER saved as plain text.
     We save a salted PBKDF2 hash, only to show how the flow works.
   ----------------------------------------------------------

   Needs: data.js (STORAGE_KEYS), store.js (readStorage, writeStorage)
   ========================================================== */


/* ----------------------------------------------------------
   1. SETTINGS
   ---------------------------------------------------------- */

const PASSWORD_ITERATIONS = 150000;   // how much work it takes to hash a password

// A public demo account (only its HASH is saved in the browser)
const DEMO_ACCOUNT = {
  fullName: 'Demo Shopper',
  email: 'demo@sneakershub.test',
  username: 'demo',
  password: 'Demo@1234'
};

const CRYPTO_ERROR_MESSAGE =
  'Secure password hashing is not available here. Please open the site with Live Server (localhost / 127.0.0.1).';


/* ----------------------------------------------------------
   2. PASSWORD HASHING (never store the real password!)
   ---------------------------------------------------------- */

function isCryptoAvailable() {
  return !!(window.crypto && window.crypto.subtle && window.crypto.getRandomValues);
}

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach(function (byte) {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// A random "salt": makes two identical passwords produce different hashes
function createSalt() {
  return bytesToBase64(window.crypto.getRandomValues(new Uint8Array(16)));
}

// Turns a password + salt into a hash (a long scrambled text)
async function hashPassword(password, saltBase64, iterations) {
  const encoder = new TextEncoder();

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(saltBase64),
      iterations: iterations || PASSWORD_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return bytesToBase64(new Uint8Array(bits));
}


/* ----------------------------------------------------------
   3. USERS (saved in localStorage)
   A user looks like: { id, fullName, email, username, salt, hash, iterations, createdAt }
   There is NO password field, only the hash.
   ---------------------------------------------------------- */

function getUsers() {
  const users = readStorage(STORAGE_KEYS.users, []);
  return Array.isArray(users) ? users : [];
}

function saveUsers(users) {
  writeStorage(STORAGE_KEYS.users, users);
}

function makeUserId() {
  return 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function createUserRecord(fullName, email, username, password) {
  const salt = createSalt();
  const hash = await hashPassword(password, salt, PASSWORD_ITERATIONS);

  return {
    id: makeUserId(),
    fullName: fullName,
    email: email.toLowerCase(),
    username: username,
    salt: salt,
    hash: hash,
    iterations: PASSWORD_ITERATIONS,
    createdAt: new Date().toISOString()
  };
}

// Creates the demo account the first time the site is opened
async function ensureDemoAccount() {
  try {
    if (!isCryptoAvailable()) {
      return false;
    }

    const users = getUsers();
    const exists = users.some(function (user) {
      return user.username.toLowerCase() === DEMO_ACCOUNT.username;
    });

    if (!exists) {
      const record = await createUserRecord(
        DEMO_ACCOUNT.fullName,
        DEMO_ACCOUNT.email,
        DEMO_ACCOUNT.username,
        DEMO_ACCOUNT.password
      );
      users.push(record);
      saveUsers(users);
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Login and register wait for this, so the demo account always exists first
const demoAccountReady = ensureDemoAccount();


/* ----------------------------------------------------------
   4. REGISTRATION
   ---------------------------------------------------------- */

// Checks the form values. Returns an object of errors (empty = all good).
// Example: { email: 'Please enter a valid email address.' }
function validateRegistration(values) {
  const errors = {};

  const fullName = String(values.fullName || '').trim();
  const email = String(values.email || '').trim();
  const username = String(values.username || '').trim();
  const password = String(values.password || '');
  const confirmPassword = String(values.confirmPassword || '');

  if (fullName.length < 2) {
    errors.fullName = 'Please enter your full name.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    errors.username = 'Username must be 3-20 characters: letters, numbers or underscore.';
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Password must be at least 8 characters and include a letter and a number.';
  }
  if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

// Creates a new account. Returns { success, message, errors }
async function registerUser(values) {
  await demoAccountReady;

  const errors = validateRegistration(values);
  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Please fix the highlighted fields.', errors: errors };
  }
  if (!isCryptoAvailable()) {
    return { success: false, message: CRYPTO_ERROR_MESSAGE, errors: {} };
  }

  const fullName = String(values.fullName).trim();
  const email = String(values.email).trim().toLowerCase();
  const username = String(values.username).trim();

  const users = getUsers();

  users.forEach(function (user) {
    if (user.username.toLowerCase() === username.toLowerCase()) {
      errors.username = 'This username is already taken.';
    }
    if (user.email === email) {
      errors.email = 'An account with this email already exists.';
    }
  });

  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Please fix the highlighted fields.', errors: errors };
  }

  const record = await createUserRecord(fullName, email, username, String(values.password));
  users.push(record);
  saveUsers(users);

  return { success: true, message: 'Account created! You can now log in.', errors: {} };
}


/* ----------------------------------------------------------
   5. LOGIN / LOGOUT / SESSION
   ---------------------------------------------------------- */

// identifier = username OR email. Returns { success, message }
async function loginUser(identifier, password) {
  await demoAccountReady;

  identifier = String(identifier || '').trim().toLowerCase();
  password = String(password || '');

  if (!identifier || !password) {
    return { success: false, message: 'Please enter your username or email and your password.' };
  }
  if (!isCryptoAvailable()) {
    return { success: false, message: CRYPTO_ERROR_MESSAGE };
  }

  const user = getUsers().find(function (u) {
    return u.username.toLowerCase() === identifier || u.email === identifier;
  });

  // We use the SAME message for "no such user" and "wrong password",
  // so nobody can discover which usernames exist.
  const failMessage = 'Incorrect username/email or password.';

  if (!user) {
    await hashPassword(password, createSalt(), PASSWORD_ITERATIONS);  // keeps timing similar
    return { success: false, message: failMessage };
  }

  const hash = await hashPassword(password, user.salt, user.iterations);
  if (hash !== user.hash) {
    return { success: false, message: failMessage };
  }

  startSession(user);
  return { success: true, message: 'Welcome back, ' + user.fullName.split(' ')[0] + '!' };
}

// Remember who is logged in (only the user id, never the password)
function startSession(user) {
  writeStorage(STORAGE_KEYS.session, { userId: user.id, loggedInAt: Date.now() });
  updateAuthLink();
  document.dispatchEvent(new CustomEvent('authchange'));
}

// The logged-in user, or null
function getCurrentUser() {
  const session = readStorage(STORAGE_KEYS.session, null);
  if (!session || !session.userId) {
    return null;
  }

  const user = getUsers().find(function (u) { return u.id === session.userId; });
  if (!user) {
    return null;
  }

  return { id: user.id, fullName: user.fullName, username: user.username, email: user.email };
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function logoutUser() {
  try {
    localStorage.removeItem(STORAGE_KEYS.session);
  } catch (error) {
    // ignore
  }
  updateAuthLink();
  document.dispatchEvent(new CustomEvent('authchange'));
}

// "Forgot password": a DEMO ONLY message. Real recovery needs a server that sends emails.
function requestPasswordReset(email) {
  email = String(email || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  return {
    success: true,
    message: 'If an account exists for this email, a reset link would be sent. ' +
             '(Demo only: no email is sent, because real password recovery needs a backend.)'
  };
}


/* ----------------------------------------------------------
   6. PROTECTED PAGES + REDIRECT AFTER LOGIN
   The flow: visitor clicks a sneaker -> product-details.html?id=3
   -> not logged in -> login.html?redirect=product-details.html%3Fid%3D3
   -> after login -> back to product-details.html?id=3
   ---------------------------------------------------------- */

// The current page with its query, e.g. "product-details.html?id=3"
function getCurrentPageUrl() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  return page + window.location.search;
}

// Only allow redirects to OUR OWN pages (blocks links like https://evil.com)
function isSafeRedirect(target) {
  if (typeof target !== 'string') {
    return false;
  }
  if (!/^[a-z0-9-]+\.html(\?[A-Za-z0-9=&%._-]*)?$/i.test(target)) {
    return false;
  }
  // never redirect to the login/register pages themselves (would loop)
  return !/^(login|register)\.html/i.test(target);
}

function buildLoginUrl(returnTo) {
  if (isSafeRedirect(returnTo)) {
    return 'login.html?redirect=' + encodeURIComponent(returnTo);
  }
  return 'login.html';
}

// Reads ?redirect=... from the address bar (safe, defaults to the home page)
function getRedirectTarget() {
  const params = new URLSearchParams(window.location.search);
  const target = params.get('redirect');
  return isSafeRedirect(target) ? target : 'index.html';
}

function redirectAfterLogin() {
  window.location.href = getRedirectTarget();
}

// Use this before a protected action. If the visitor is not logged in,
// it sends them to the login page and brings them back to "returnTo" afterwards.
// Returns true if the visitor is logged in.
function requireLogin(returnTo) {
  if (isLoggedIn()) {
    return true;
  }
  window.location.href = buildLoginUrl(returnTo || getCurrentPageUrl());
  return false;
}

// A page is protected when its <body> has the attribute data-protected
function protectPageIfNeeded() {
  if (document.body && document.body.hasAttribute('data-protected') && !isLoggedIn()) {
    window.location.replace(buildLoginUrl(getCurrentPageUrl()));
  }
}


/* ----------------------------------------------------------
   7. WHAT THE PAGE SHOWS (Login <-> Logout, footer links)
   ---------------------------------------------------------- */

// A member does not need "Login" or "Register" links: hide them in the footer
function updateGuestOnlyLinks() {
  const loggedIn = isLoggedIn();
  const links = document.querySelectorAll(
    '.site-footer a[href="login.html"], .site-footer a[href="register.html"]'
  );

  links.forEach(function (link) {
    link.hidden = loggedIn;
  });
}

function updateAuthLink() {
  updateGuestOnlyLinks();

  const link = document.getElementById('authLink');
  if (!link) {
    return;
  }

  const user = getCurrentUser();

  if (user) {
    link.textContent = 'Logout';
    link.setAttribute('href', '#');
    link.setAttribute('title', 'Signed in as ' + user.username);
    link.setAttribute('data-logout', 'true');
  } else {
    const page = getCurrentPageUrl();
    const onAuthPage = /^(login|register)\.html/i.test(page);

    link.textContent = 'Login';
    link.setAttribute('href', onAuthPage ? 'login.html' : buildLoginUrl(page));
    link.removeAttribute('title');
    link.removeAttribute('data-logout');
  }
}

// Clicking "Logout" in the header
document.addEventListener('click', function (event) {
  const link = event.target.closest('#authLink[data-logout]');
  if (!link) {
    return;
  }
  event.preventDefault();
  logoutUser();
  window.location.href = 'index.html';
});

// If the user logs in/out in another tab, update this tab too
window.addEventListener('storage', function (event) {
  if (event.key === STORAGE_KEYS.session || event.key === STORAGE_KEYS.users) {
    updateAuthLink();
    protectPageIfNeeded();
  }
});


/* ----------------------------------------------------------
   8. START-UP
   ---------------------------------------------------------- */

function initAuth() {
  protectPageIfNeeded();
  updateAuthLink();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}