# SNEAKERS HUB

A modern, responsive sneaker store **demo** built with plain **HTML5, CSS3 and vanilla JavaScript**
(no frameworks). It runs locally in Visual Studio Code with the **Live Server** extension.

> **This is a frontend demonstration for learning.** There is no real login security, no real payments
> and no real orders. See [Security notice](#security-notice).

---

## Features

- Responsive design for mobile, tablet and desktop
- **Dynamic color theme system:** pick black, white, red, blue or green and the whole website changes
  (CSS variables). The choice is saved and remembered after a refresh.
- The big home-page sneaker changes color together with the theme
- Product cards with images, prices, ratings and color buttons (a card's color buttons change only that product's picture)
- Search, filters (category, size, color, max price, in stock) and sorting (popularity, price, rating)
- Product details page with color, size, stock status and quantity
- Shopping cart with quantity controls and automatic subtotal, shipping and total
- Wishlist (hearts on every card)
- Demo login and registration, with a creative login page (tap the sneaker to open the form)
- Protected pages: product details, cart, wishlist and checkout ask visitors to log in first,
  then bring them back to the page they wanted
- Checkout demonstration (no card details are collected)
- Cart, wishlist, theme and demo accounts saved in `localStorage`

---

## Project structure

```
sneakers-hub/
├── index.html              Home page
├── products.html           All sneakers (search, filters, sorting)
├── product-details.html    One sneaker (protected page)
├── cart.html               Shopping cart (protected page)
├── wishlist.html           Favorite sneakers (protected page)
├── checkout.html           Checkout demonstration (protected page)
├── login.html              Creative login page
├── register.html           Create an account
├── about.html              About the store
├── contact.html            Contact page (demo form)
├── README.md               This file
│
├── css/
│   ├── style.css           Shared styles for all pages + the 5 color themes
│   └── login.css           Extra styles for the creative login page
│
└── js/
    ├── data.js             Products, categories, colors and settings (shared)
    ├── theme.js            Dynamic color theme system
    ├── store.js            Cart and wishlist (localStorage)
    ├── auth.js             Demo login / registration / protected pages
    ├── ui.js               Shared helpers: toasts, product cards, mobile menu...
    ├── home.js             Home page
    ├── products.js         Products page
    ├── product-details.js  Product details page
    ├── cart.js             Cart page
    ├── wishlist.js         Wishlist page
    ├── checkout.js         Checkout page
    ├── login.js            Login page
    ├── register.js         Register page
    └── contact.js          Contact page
```

---

## How to run

1. Install **Visual Studio Code**.
2. In VS Code, open the **Extensions** panel (`Ctrl + Shift + X`), search for **Live Server**
   (by Ritwick Dey) and click **Install**.
3. Open the project: **File > Open Folder...** and choose the `sneakers-hub` folder.
4. Right-click `index.html` and choose **Open with Live Server**
   (or click **Go Live** in the blue bar at the bottom).
5. The site opens in your browser, usually at `http://127.0.0.1:5500/index.html`.

Important:

- Open the site through Live Server (an address starting with `http://127.0.0.1` or `http://localhost`),
  **not** by double-clicking the HTML file. Password hashing only works on `localhost` / `127.0.0.1` or HTTPS.
- An internet connection is needed for the product photos (Unsplash) and the Google Fonts.
  If a photo cannot load, a built-in backup picture is shown.

---

## Demo account

| Username | Password   |
|----------|------------|
| `demo`   | `Demo@1234`|

You can also create your own account on the Register page. Accounts exist only in your browser.

---

## Try these

1. Click a sneaker while logged out: you are sent to the login page, and after logging in you come back to that sneaker.
2. Change the color with the dots in the header: the whole page changes. Refresh: the color is remembered.
3. Add sneakers to the cart (choose a size first) and open the cart to change quantities.
4. Tap the heart on a card to save it, then open the wishlist.
5. Go through the checkout. No payment is taken.

---

## Customizing

- **Products, prices, sizes, stock, colors and photos:** edit the `PRODUCTS` list in `js/data.js`.
- **Currency, shipping fee and free-shipping limit:** edit `STORE_SETTINGS` in `js/data.js`.
- **Theme colors:** edit the `[data-theme="..."]` blocks at the top of `css/style.css`.
- **Photos:** each product has an `image` and a `gallery`. A color can have its own `image`;
  if it has none, the main photo is recolored as a preview.

---

## Data saved in your browser (localStorage)

| Key                       | What it holds                           |
|---------------------------|-----------------------------------------|
| `sneakershub_theme`       | The selected color theme                |
| `sneakershub_cart`        | The cart (product, size, color, quantity) |
| `sneakershub_wishlist`    | Saved product ids                       |
| `sneakershub_users`       | Demo accounts (hashed passwords only)   |
| `sneakershub_session`     | Who is logged in (demo)                 |
| `sneakershub_last_order`  | The last demo order (no payment details)|

To reset everything, open the browser console (`F12`) and run `localStorage.clear()`, then refresh.

---

## Security notice

This project is a **frontend demonstration**. It is **not secure** and must not be used as a real shop.

- Login, registration and the "protected pages" run in the browser. Anyone can open the developer tools
  and read or change the data, or skip the login check.
- Passwords are never stored as plain text (a salted PBKDF2 hash is stored), but this is only to show how the
  flow works. **Never enter a real password.**
- Real authentication **requires a backend server**: server-side password hashing (Argon2 or bcrypt), HTTPS,
  secure HttpOnly cookies or tokens, rate limiting, email verification and password-reset emails.
- The checkout collects **no card details** and takes **no payment**. A real shop needs a payment provider
  (such as Stripe or PayPal) and a backend.
- The contact form and the newsletter form **do not send anything**.

---

## Troubleshooting

| Problem | What to check |
|---|---|
| Page has no style | `css/style.css` must exist inside the `css` folder |
| Red errors like `404` in the browser console (`F12`) | A file is missing or has a wrong name or folder |
| `PRODUCTS is not defined` | `js/data.js` is missing or was copied incomplete |
| Cannot log in, "secure hashing is not available" | Open the site with Live Server (`127.0.0.1` / `localhost`) |
| Changes do not appear | Hard refresh with `Ctrl + F5` |
| A photo does not load | The backup picture appears; replace the photo link in `js/data.js` |
| Weird cart or login state | Run `localStorage.clear()` in the console and refresh |

---

## Notes

- Recolored shoe photos are an approximation (a preview), not real product photos in that color.
- All brands, products, prices, reviews and contact details are sample content.