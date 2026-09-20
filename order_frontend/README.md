# OrderTrack — frontend

React frontend for the Real Time Order Tracking System. It talks to the Spring Boot
backend in `order_backend`, nothing else.

## Stack

| Thing | Used |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Routing | react-router |
| Http | axios |
| Icons | lucide-react |
| Styling | plain CSS, one file per component, tokens in `src/index.css` |

No ui library on purpose, the whole look comes from the tokens in `index.css`.

## Running it

The backend has to be up first, see the main README.

```bash
cp .env.example .env     # VITE_API_BASE_URL points at the backend
npm install
npm run dev
```

Opens on `http://localhost:3000`. That port is not a coincidence, the backend allows
`http://localhost:3000` as a cors origin by default. If you change one, change the other.

| Script | What it does |
|---|---|
| `npm run dev` | dev server with hot reload |
| `npm run build` | type check and production build |
| `npm run lint` | eslint over the project |
| `npm run preview` | serve the built output |

## Folder layout

```
src
├── api          # axios instance and one file per group of endpoints
├── components
│   ├── layout   # sidebar, topbar, the app shell
│   ├── orders   # order table and the status timeline
│   ├── routes   # route guards
│   └── ui       # button, field, card, pill, pagination, dialog, states
├── context      # auth and toast, each split into context, provider and hook
├── lib          # formatting helpers and the order status rules
├── pages        # one folder per area, screens live here
└── types        # the shapes the backend sends back
```

Rule of thumb followed here: `pages` own the data fetching and the state, everything
under `components` only takes props and renders.

## Screens

| Route | What it does |
|---|---|
| `/login`, `/register` | sign in and sign up |
| `/orders` | your orders, paginated, with a small summary on top |
| `/orders/new` | place an order |
| `/orders/:orderId` | status timeline, move to next status, cancel |
| `/users` | admin only, list and search users |

## A few decisions worth knowing

**The token is never stored.** Login returns the jwt and the backend also sets it in an
httpOnly cookie. The cookie is what keeps the session alive, axios sends it because of
`withCredentials`. Only the email, name and an admin flag go into localStorage, and any
401 clears them and sends the user back to login.

**Admin is detected by asking.** There is no `/auth/me` endpoint, so right after login the
app calls the admin users endpoint once, and the Users link shows only if that call is
allowed. A `/auth/me` on the backend would replace this.

**Tracking auto refreshes, it does not stream.** The backend has no push channel yet, so an
order which is still moving is fetched again every 8 seconds. Once it is delivered,
cancelled or returned the timer stops. Whenever the backend gets an SSE endpoint this is
the one place which has to change.

**Status rules are mirrored, not owned.** `lib/status.ts` keeps the same allowed transitions
the backend has, only to decide which buttons to show. The backend still validates
everything and its answer wins.
