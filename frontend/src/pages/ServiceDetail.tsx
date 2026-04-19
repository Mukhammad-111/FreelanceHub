import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi, categoriesApi } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiError } from "@/lib/api";
import { formatKGS } from "@/components/StatusBadges";
import { Edit, Trash2, ArrowLeft, Save, X, LayoutGrid, User } from "lucide-react";

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const serviceId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: "", description: "", price: 0, category_id: 0 });

  const { data: service, isLoading } = useQuery({
    queryKey: ["services", serviceId],
    queryFn: () => servicesApi.get(serviceId),
    enabled: !!serviceId,
  });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const update = useMutation({
    mutationFn: () => servicesApi.update(serviceId, editData),
    onSuccess: () => {
      toast.success("Услуга обновлена");
      setIsEditing(false);
      qc.invalidateQueries({ queryKey: ["services", serviceId] });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: () => servicesApi.remove(serviceId),
    onSuccess: () => {
      toast.success("Услуга удалена");
      navigate("/services");
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const startEdit = () => {
    if (!service) return;
    setEditData({
      title: service.title,
      description: service.description,
      price: service.price,
      category_id: service.category_id,
    });
    setIsEditing(true);
  };

  if (isLoading) return <PageLoader />;
  if (!service) return <div className="container-app py-20 text-center">Услуга не найдена</div>;

  const isOwner = user?.id === service.freelancer_id;

  return (
    <div className="container-app py-10 space-y-8">
      <Button variant="ghost" onClick={() => navigate("/services")} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> Назад к услугам
      </Button>

      <div className="card-elevated p-8">
        {isEditing ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Заголовок</label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Цена (KGS)</label>
                <Input
                  type="number"
                  value={editData.price}
                  onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Категория</label>
                <Select
                  value={String(editData.category_id)}
                  onValueChange={(v) => setEditData({ ...editData, category_id: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Описание</label>
              <Textarea
                rows={6}
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => update.mutate()} disabled={update.isPending} className="rounded-full bg-gradient-primary">
                <Save className="h-4 w-4 mr-2" /> Сохранить
              </Button>
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-full">
                <X className="h-4 w-4 mr-2" /> Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <LayoutGrid className="h-4 w-4" /> {service.category?.name || "Без категории"}
                </div>
                <h1 className="text-3xl font-bold">{service.title}</h1>
              </div>
              <div className="text-3xl font-bold text-primary">{formatKGS(service.price)}</div>
            </div>

            <div className="flex items-center gap-6 py-4 border-y border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Исполнитель</div>
                  <div className="font-medium">{service.freelancer?.name || service.freelancer?.email || "Исполнитель"}</div>
                </div>
              </div>
            </div>

            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed text-lg">
                {service.description}
              </p>
            </div>

            {isOwner && (
              <div className="flex gap-2 pt-8">
                <Button onClick={startEdit} className="rounded-full bg-gradient-primary">
                  <Edit className="h-4 w-4 mr-2" /> Редактировать
                </Button>
                <Button variant="destructive" onClick={() => {
                  if (confirm("Удалить эту услугу?")) remove.mutate();
                }} className="rounded-full">
                  <Trash2 className="h-4 w-4 mr-2" /> Удалить
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetail;
