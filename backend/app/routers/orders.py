from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _serialize_order(order: models.Order) -> schemas.OrderOut:
    
    items_out = []
    total = 0.0
    for item in order.items:
        line_total = item.unit_price * item.quantity
        total += line_total
        items_out.append(
            schemas.OrderItemOut(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                product_name=item.product.name if item.product else None,
            )
        )

    return schemas.OrderOut(
        id=order.id,
        customer_id=order.customer_id,
        status=order.status,
        created_at=order.created_at,
        items=items_out,
        customer_name=order.customer.full_name if order.customer else None,
        total=round(total, 2),
    )


@router.get("", response_model=list[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.customer))
        .order_by(models.Order.id.desc())
        .all()
    )
    return [_serialize_order(o) for o in orders]


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.customer))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _serialize_order(order)


@router.post("", response_model=schemas.OrderOut, status_code=201)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Pull all products up front and check stock before touching anything
    product_map = {}
    shortages = []

    for line in payload.items:
        product = db.get(models.Product, line.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product id {line.product_id} not found")

        if product.stock_qty < line.quantity:
            shortages.append(
                f"'{product.name}' (SKU {product.sku}): requested {line.quantity}, only {product.stock_qty} in stock"
            )
        product_map[line.product_id] = product

    if shortages:
        raise HTTPException(status_code=400, detail={"message": "Insufficient stock for one or more items", "issues": shortages})

    # All good - create the order, line items, and decrement stock together
    order = models.Order(customer_id=payload.customer_id, status="pending")
    db.add(order)
    db.flush()  # get order.id without committing yet

    for line in payload.items:
        product = product_map[line.product_id]
        db.add(models.OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=line.quantity,
            unit_price=product.price,
        ))
        product.stock_qty -= line.quantity

    db.commit()

    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.customer))
        .filter(models.Order.id == order.id)
        .first()
    )
    return _serialize_order(order)


@router.patch("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(order_id: int, payload: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    valid_statuses = {"pending", "completed", "cancelled"}
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(valid_statuses)}")

    order = db.get(models.Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # if cancelling a previously active order, restock the items
    if payload.status == "cancelled" and order.status != "cancelled":
        for item in order.items:
            product = db.get(models.Product, item.product_id)
            if product:
                product.stock_qty += item.quantity

    order.status = payload.status
    db.commit()

    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.customer))
        .filter(models.Order.id == order.id)
        .first()
    )
    return _serialize_order(order)


@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(models.Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # restock if the order was still active
    if order.status != "cancelled":
        for item in order.items:
            product = db.get(models.Product, item.product_id)
            if product:
                product.stock_qty += item.quantity

    db.delete(order)
    db.commit()
    return None
