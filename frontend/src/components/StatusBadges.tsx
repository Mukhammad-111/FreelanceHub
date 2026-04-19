import { Badge } from "@/components/ui/badge";
import { OrderStatus, ResponseStatus, PaymentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const orderMap: Record<OrderStatus, { label: string; className: string }> = {
  OPEN: { label: "Открыт", className: "bg-accent text-accent-foreground" },
  IN_PROGRESS: { label: "В работе", className: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Завершён", className: "bg-emerald-100 text-emerald-700" },
  PAID: { label: "Оплачен", className: "bg-primary text-primary-foreground" },
};

const responseMap: Record<ResponseStatus, { label: string; className: string }> = {
  pending: { label: "На рассмотрении", className: "bg-amber-100 text-amber-700" },
  accepted: { label: "Принят", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Отклонён", className: "bg-rose-100 text-rose-700" },
};

const paymentMap: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: "Ожидает", className: "bg-amber-100 text-amber-700" },
  paid: { label: "Оплачено", className: "bg-emerald-100 text-emerald-700" },
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const m = orderMap[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={cn("rounded-full font-medium border-0", m.className)}>{m.label}</Badge>;
};

export const ResponseStatusBadge = ({ status }: { status: ResponseStatus }) => {
  const m = responseMap[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={cn("rounded-full font-medium border-0", m.className)}>{m.label}</Badge>;
};

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const m = paymentMap[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={cn("rounded-full font-medium border-0", m.className)}>{m.label}</Badge>;
};

export const formatKGS = (v: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "KGS", maximumFractionDigits: 0 }).format(v);
