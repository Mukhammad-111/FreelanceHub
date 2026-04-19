import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";
import { OrderStatusBadge, formatKGS } from "@/components/StatusBadges";
import { PageLoader, EmptyState } from "@/components/Common";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const MyOrders = () => {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useQuery({ queryKey: ["orders", "mine"], queryFn: () => ordersApi.list() });
  const mine = orders.filter((o) => o.client_id === user?.id);

  return (
    <div className="container-app py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Мои заказы</h1>
        <Button asChild className="rounded-full bg-gradient-primary shadow-glow">
          <Link to="/orders/new"><Plus className="h-4 w-4 mr-2" />Создать</Link>
        </Button>
      </div>
      {isLoading ? <PageLoader /> : mine.length === 0 ? (
        <EmptyState title="У вас пока нет заказов" description="Создайте первый заказ, чтобы начать" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mine.map((o) => (
            <Link to={`/orders/${o.id}`} key={o.id} className="card-soft p-6 hover:shadow-card transition">
              <div className="flex justify-between items-start gap-3">
                <h3 className="font-semibold line-clamp-2">{o.title}</h3>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{o.description}</p>
              <div className="text-lg font-bold text-primary mt-4">{formatKGS(o.budget)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
