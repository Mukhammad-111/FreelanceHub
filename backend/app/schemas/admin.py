from pydantic import BaseModel


class Stats(BaseModel):
    users_total: int
    orders_total: int
    services_total: int
    payments_total: int