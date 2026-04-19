import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi, responsesApi } from "@/lib/services";
import { PageLoader } from "@/components/Common";
import { OrderStatusBadge, ResponseStatusBadge } from "@/components/StatusBadges";
import { Briefcase, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const isFreelancer = user?.role === "freelancer";

  const { data: myOrders = [], isLoading: l1 } = useQuery({
    queryKey: ["orders", "my"],
    queryFn: () => ordersApi.list({ status: "OPEN" }), // Simulating 'my' by filter or just generic list
    enabled: isClient,
  });

  const { data: myResponses = [], isLoading: l2 } = useQuery({
    queryKey: ["responses", "my"],
    queryFn: responsesApi.list,
    enabled: isFreelancer,
  });

  if (l1 || l2) return <PageLoader />;

  return (
    <div className="container-app py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Панель управления</h1>
        {isClient && (
          <Button asChild className="rounded-full bg-gradient-primary shadow-glow">
            <Link to="/orders/create"><Plus className="h-4 w-4 mr-2" /> Создать заказ</Link>
          </Button>
        )}
        {isFreelancer && (
          <Button asChild className="rounded-full bg-gradient-primary shadow-glow">
            <Link to="/services/create"><Plus className="h-4 w-4 mr-2" /> Создать услугу</Link>
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {isClient && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Мои открытые заказы
            </h2>
            <div className="space-y-3">
              {myOrders.length === 0 ? (
                <div className="card-soft p-6 text-center text-muted-foreground">Нет активных заказов</div>
              ) : (
                myOrders.map(o => (
                  <Link key={o.id} to={`/orders/${o.id}`} className="card-soft p-4 flex justify-between items-center hover:bg-secondary/40 transition-colors">
                    <div>
                      <div className="font-medium">{o.title}</div>
                      <div className="text-sm text-muted-foreground">{o.budget} KGS</div>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {isFreelancer && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Мои отклики
            </h2>
            <div className="space-y-3">
              {myResponses.length === 0 ? (
                <div className="card-soft p-6 text-center text-muted-foreground">Вы еще не откликались</div>
              ) : (
                myResponses.map(r => (
                  <Link key={r.id} to={`/orders/${r.order_id}`} className="card-soft p-4 flex justify-between items-center hover:bg-secondary/40 transition-colors">
                    <div>
                      <div className="font-medium">Заказ #{r.order_id}</div>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">{r.message}</p>
                    </div>
                    <ResponseStatusBadge status={r.status} />
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
