import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi, categoriesApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatusBadge, formatKGS } from "@/components/StatusBadges";
import { PageLoader, EmptyState } from "@/components/Common";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Briefcase } from "lucide-react";

const Orders = () => {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", categoryId],
    queryFn: () => ordersApi.list(categoryId !== "all" ? { category_id: Number(categoryId) } : undefined),
  });

  const filtered = orders.filter((o) =>
    !q || o.title.toLowerCase().includes(q.toLowerCase()) || o.description?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="container-app py-10">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-primary" /> Заказы
          </h1>
          <p className="text-muted-foreground mt-1">Найдите интересные проекты или опубликуйте свой</p>
        </div>
        {user?.role === "client" && (
          <Button asChild className="rounded-full bg-gradient-primary hover:opacity-90 shadow-glow">
            <Link to="/orders/create"><Plus className="h-4 w-4 mr-2" /> Создать заказ</Link>
          </Button>
        )}
      </div>

      <div className="card-soft p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по заказам..." className="pl-9 rounded-full" />
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="md:w-64 rounded-full"><SelectValue placeholder="Категория" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState title="Заказов пока нет" description="Заглядывайте позже или создайте свой первый заказ" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((o) => (
            <Link to={`/orders/${o.id}`} key={o.id} className="card-soft p-6 hover:shadow-card transition group">
              <div className="flex justify-between items-start gap-3">
                <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition">{o.title}</h3>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{o.description}</p>
              <div className="flex justify-between items-center mt-5 pt-4 border-t border-border/60">
                <div className="text-xl font-bold text-primary">{formatKGS(o.budget)}</div>
                {o.category && <div className="text-xs text-muted-foreground">{o.category.name}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
