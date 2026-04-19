import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/services";
import { PageLoader, EmptyState } from "@/components/Common";
import { PaymentStatusBadge, formatKGS } from "@/components/StatusBadges";
import { CreditCard } from "lucide-react";

const Payments = () => {
  const { data: payments = [], isLoading } = useQuery({ queryKey: ["payments"], queryFn: paymentsApi.list });

  return (
    <div className="container-app py-10">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-primary" /> Платежи
      </h1>
      {isLoading ? <PageLoader /> : payments.length === 0 ? (
        <EmptyState title="Платежей пока нет" />
      ) : (
        <div className="card-elevated overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/60 text-sm">
              <tr>
                <th className="text-left p-4 font-medium">ID</th>
                <th className="text-left p-4 font-medium">Заказ</th>
                <th className="text-left p-4 font-medium">Сумма</th>
                <th className="text-left p-4 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="p-4 font-mono text-sm">#{p.id}</td>
                  <td className="p-4">#{p.order_id}</td>
                  <td className="p-4 font-semibold text-primary">{formatKGS(p.amount)}</td>
                  <td className="p-4"><PaymentStatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payments;
