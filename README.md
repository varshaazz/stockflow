# Stockflow - Inventory & Order Management
Stockflow is a full-stack inventory and order management application designed
to help small businesses track products, customers, orders, and inventory
movement from a single dashboard. The backend is built with FastAPI and
PostgreSQL, while the frontend uses React and Vite.

The goal was to build a simple inventory system that can be used to track products, customers and orders from a single interface.

## Deployment

Frontend: https://stockflow-khaki-theta.vercel.app/

Backend API: https://stockflow-backend-f743.onrender.com

Backend Docker Image:
https://hub.docker.com/r/varshaazz/stockflow-backend

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

- Product SKUs and customer emails are unique.
- Stock is validated before an order is created.
- Product quantity is updated automatically after a successful order.
- Order totals are calculated on the backend.
- Existing orders are preserved even if products or customers are updated later.


