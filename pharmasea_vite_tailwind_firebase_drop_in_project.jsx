/*Project Tree

```
pharmasea/
├─ index.html
├─ package.json
├─ vite.config.js
├─ postcss.config.js
├─ tailwind.config.js
├─ .env.sample
├─ firestore.rules
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ styles/index.css
   ├─ lib/
   │  ├─ firebase.js
   │  ├─ auth.js
   │  ├─ db.js
   │  └─ csv.js
   ├─ components/
   │  ├─ BottomNav.jsx
   │  ├─ ProductCard.jsx
   │  ├─ AddProductModal.jsx
   │  ├─ BulkUploadModal.jsx
   │  └─ ui/
   │     ├─ button.jsx
   │     ├─ card.jsx
   │     ├─ input.jsx
   │     └─ textarea.jsx
   └─ pages/
      ├─ Home.jsx
      ├─ ProductDetail.jsx
      ├─ Messages.jsx
      ├─ ChatThread.jsx
      ├─ Cart.jsx
      ├─ Orders.jsx
      ├─ ProfileCustomer.jsx
      └─ ProfilePharmacy.jsx
```

---






```









---












---









---









---















---



---

### Usage
1) Copy this folder structure into a new repo (or your existing **PD-App-Finnal** style).
2) `cp .env.sample .env` and fill Firebase values.
3) `npm i` then `npm run dev`.
4) **Sign up flow**: Implement a simple sign-up form (email/password) and choose role `customer` or `pharmacy` by calling `signUp({ email, password, displayName, role })` from `src/lib/auth.js` (you can place quick inputs on `/profile` for now or wire your existing auth screen).
5) **Stable chat threads:** threads are keyed as `vendorId__customerId` (pharmacy UID + customer UID). Messages live in `/threads/{threadId}/messages`.
6) **Bulk upload:** in Pharmacy Profile → Bulk upload modal. Accepts CSV/XLSX (headers: `name, price, description, image, category, stock, sku`).
7) **Security:** add `firestore.rules` to your Firebase project and deploy.

> The UI matches your mockups (bottom nav, large headings, rounded cards, ETA row, etc.) and keeps the **stable vendorId + customerId** rule from your PD App baseline. Plug in your existing landing/auth screens as needed.*/
