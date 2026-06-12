import datetime as dt
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Product ----------

class ProductBase(BaseModel):
    sku: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = ""
    price: float = Field(gt=0)
    stock_qty: int = Field(ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(default=None, min_length=1, max_length=64)
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    stock_qty: Optional[int] = Field(default=None, ge=0)


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: dt.datetime


# ---------- Customer ----------

class CustomerBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    phone: Optional[str] = ""
    address: Optional[str] = ""


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: dt.datetime


# ---------- Order ----------

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(min_length=1)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product_name: Optional[str] = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    status: str
    created_at: dt.datetime
    items: List[OrderItemOut]
    customer_name: Optional[str] = None
    total: Optional[float] = None


class OrderStatusUpdate(BaseModel):
    status: str
