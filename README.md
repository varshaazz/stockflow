# Stockflow - Inventory & Order Management

This is my project for the inventory/order management assignment. It's a small
full-stack app for keeping track of products, customers and orders - basically
a mini back-office tool for a small warehouse. Backend is FastAPI + Postgres,
frontend is React (Vite).

I called it "Stockflow" because I wanted the UI to feel like an actual ledger/
stockroom tool rather than a generic admin template, so the design leans on
that a bit (mono labels for SKUs/numbers, dashed "ticket" tags for status, etc).

## What it does

- Manage **products** - name, SKU (unique), price, stock quantity
- Manage **customers** - name, email (unique), phone, address
- Create **orders** - pick a customer, add line items, and it checks stock
  before letting you submit. If you try to order more than what's available,
  it tells you exactly which items are short.
- When an order goes through, stock is decremented automatically. If you
  cancel or delete an order, the stock gets put back.
- Dashboard with a quick overview - counts, low stock warnings, recent orders.

## Project structure

```
backend/
  app/
    main.py          - FastAPI app + CORS setup
    config.py        - reads DB config from env vars
    database.py      - SQLAlchemy engine/session
    models.py        - Product, Customer, Order, OrderItem
    schemas.py       - pydantic request/response models
    routers/
      products.py
      customers.py
      orders.py       - order creation + stock logic lives here
  requirements.txt
  Dockerfile
  .env.example

frontend/
  src/
    api/client.js     - small fetch wrapper
    components/       - Sidebar, status tags, loading states etc
    pages/
      Dashboard.jsx
      Products.jsx
      Customers.jsx
      Orders.jsx
    styles/global.css
  Dockerfile
  .env.example

docker-compose.yml
.env.example          - copy to .env for docker-compose
```

## Running it locally (without Docker)

You'll need Python 3.11+, Node 18+, and a running Postgres instance.

### 1. Database

Create a database (any name works, just match it in your `.env`):

```sql
CREATE DATABASE inventory_db;
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # on Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env with your local Postgres credentials

uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`. Tables are created
automatically on first startup (no migration step needed for this project).
You can check `http://localhost:8000/docs` for the auto-generated Swagger UI.

### 3. Frontend

In a separate terminal:

```bash
cd frontend
cp .env.example .env   # VITE_API_URL should point at the backend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Running with Docker Compose

This is the easier path - spins up Postgres, the API, and the frontend together.

```bash
cp .env.example .env
# adjust passwords etc if you want, defaults work fine for local testing

docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Postgres: localhost:5432 (credentials from `.env`)

First boot takes a little longer since Postgres needs to initialize and the
backend waits for it to be healthy before starting.

To stop everything:

```bash
docker-compose down
```

Add `-v` if you also want to wipe the database volume.

## A few implementation notes

- Stock checks happen **before** any database writes - if any line item in an
  order doesn't have enough stock, the whole order is rejected with a 400 and
  a list of exactly which items are short, rather than partially creating it.
- SKU and email uniqueness are enforced both at the DB level (unique index)
  and checked explicitly in the route handlers so the error message is
  actually useful instead of a raw integrity error.
- Order line items store a snapshot of `unit_price` at the time of purchase,
  so if you change a product's price later, past orders still show what was
  actually charged.
- Deleting a product/customer that's referenced by existing orders is blocked
  (409) rather than cascading - didn't want orders silently losing data.

## Known limitations / things I'd add with more time

- No authentication - anyone hitting the app can do anything. Fine for this
  assignment but wouldn't ship it like this.
- No pagination on the tables - okay for a few hundred rows, would need it
  for a real catalog.
- Order editing isn't supported, only status changes (pending → completed/
  cancelled) and deletion.
