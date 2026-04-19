import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, categoriesApi } from "@/lib/services";
import { PageLoader } from "@/components/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiError } from "@/lib/api";
import {
  Users, Briefcase, LayoutGrid, CheckCircle2, CreditCard,
  Ban, ShieldCheck, Trash2, Plus, Shield,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value?: number }) => (
  <div className="card-soft p-5">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value ?? 0}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  </div>
);



const Admin = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: stats, isLoading: l1 } = useQuery({ queryKey: ["admin", "stats"], queryFn: adminApi.stats });
  const { data: users = [], isLoading: l2 } = useQuery({ queryKey: ["admin", "users"], queryFn: adminApi.users });

  const block = useMutation({
    mutationFn: (id: number) => adminApi.block(id),
    onSuccess: () => { toast.success("Готово"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onError: (e) => toast.error(apiError(e)),
  });
  const removeUser = useMutation({
    mutationFn: (id: number) => adminApi.remove(id),
    onSuccess: () => { toast.success("Удалён"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onError: (e) => toast.error(apiError(e)),
  });
  const makeAdmin = useMutation({
    mutationFn: (id: number) => adminApi.makeAdmin(id),
    onSuccess: () => { toast.success("Назначен админ"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  if (l1 || l2) return <PageLoader />;

  return (
    <div className="container-app py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" /> Админ-панель
        </h1>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/admin/categories"><LayoutGrid className="h-4 w-4 mr-2" /> Категории</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Пользователи" value={stats?.users_total} />
        <StatCard icon={Briefcase} label="Заказы" value={stats?.orders_total} />
        <StatCard icon={LayoutGrid} label="Услуги" value={stats?.services_total} />
        <StatCard icon={CreditCard} label="Оплаты" value={stats?.payments_total} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Управление пользователями</h2>
        <div className="card-elevated p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/60 text-sm">
              <tr>
                <th className="text-left p-4 font-medium">ID</th>
                <th className="text-left p-4 font-medium">Имя / Email</th>
                <th className="text-left p-4 font-medium">Роль</th>
                <th className="text-left p-4 font-medium">Статус</th>
                <th className="text-right p-4 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="p-4 font-mono text-sm">#{u.id}</td>
                  <td className="p-4">
                    <div className="font-medium">{u.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="p-4"><Badge variant="outline" className="capitalize">{u.role}</Badge></td>
                  <td className="p-4">
                    {u.is_active === false ? <Badge className="bg-destructive text-destructive-foreground">Заблокирован</Badge> : <Badge className="bg-emerald-100 text-emerald-700 border-0">Активен</Badge>}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => block.mutate(u.id)}><Ban className="h-4 w-4" /></Button>
                      {u.role !== "admin" && (
                        <Button size="sm" variant="ghost" onClick={() => makeAdmin.mutate(u.id)}><ShieldCheck className="h-4 w-4" /></Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => removeUser.mutate(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
