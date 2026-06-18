# Al Amanah Store - Takmeeli Talbeena

Production-ready React + Vite e-commerce website for **Al Amanah Store** with Netlify deployment.

## Features

- Landing page with Al Amanah Store + Takmeeli Talbeena branding
- Product catalog with search and category filters
- Product detail pages, cart, checkout form, and reviews
- Password-protected admin dashboard (`VITE_ADMIN_PASSWORD`)
- Admin product and promotional banner management
- Order submission using Netlify Forms
- JSON-based starter data (`public/data/products.json`, `public/data/banners.json`)
- Responsive green/white design

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Netlify

- `netlify.toml` included for build + SPA redirects.
- Set environment variable in Netlify:
  - `VITE_ADMIN_PASSWORD=your-secure-password`

Netlify Forms name used for orders: `orders`.
