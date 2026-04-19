import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { servicesApi, categoriesApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatKGS } from "@/components/StatusBadges";
import { PageLoader, EmptyState } from "@/components/Common";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, LayoutGrid } from "lucide-react";

const Services = () => {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", categoryId],
    queryFn: () => servicesApi.list(categoryId !== "all" ? { category_id: Number(categoryId) } : undefined),
  });

  const filtered = services.filter((s) =>
    !q || s.title.toLowerCase().includes(q.toLowerCase()) || s.description?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="container-app py-10">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutGrid className="h-7 w-7 text-primary" /> Услуги
          </h1>
          <p className="text-muted-foreground mt-1">Готовые предложения от фрилансеров</p>
        </div>
        {user?.role === "freelancer" && (
          <Button asChild className="rounded-full bg-gradient-primary hover:opacity-90 shadow-glow">
            <Link to="/services/create"><Plus className="h-4 w-4 mr-2" /> Создать услугу</Link>
          </Button>
        )}
      </div>

      <div className="card-soft p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск услуг..." className="pl-9 rounded-full" />
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="md:w-64 rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState title="Услуг не найдено" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => (
            <Link key={s.id} to={`/services/${s.id}`} className="card-soft p-6 hover:shadow-card transition flex flex-col">
              <h3 className="font-semibold text-lg line-clamp-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">{s.description}</p>
              <div className="flex justify-between items-center mt-5 pt-4 border-t border-border/60">
                <div className="text-xl font-bold text-primary">{formatKGS(s.price)}</div>
                {s.category && <div className="text-xs text-muted-foreground">{s.category.name}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;
