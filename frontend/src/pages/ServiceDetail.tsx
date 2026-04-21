import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi, categoriesApi, chatsApi } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiError } from "@/lib/api";
import { formatKGS } from "@/components/StatusBadges";
import { Edit, Trash2, ArrowLeft, Save, X, LayoutGrid, User, MessageSquare } from "lucide-react";
import { ProfileGuard, useProfileCompleteness } from "@/components/ProfileGuard";

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
  
  const { isProfileComplete } = useProfileCompleteness();
  
  const startChat = useMutation({
    mutationFn: () => {
      if (!isProfileComplete) {
        toast.error("Пожалуйста, сначала заполните профиль (имя, о себе и навыки)");
        throw new Error("Profile incomplete");
      }
      return chatsApi.startChat(service!.freelancer_id);
    },
    onSuccess: (chat) => {
      navigate(`/chats/${chat.id}`);
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
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                    <LayoutGrid className="h-3 w-3" /> 
                    {service.category?.name || categories.find(c => Number(c.id) === Number(service.category_id))?.name || "Без категории"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    Услуга #{service.id}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{service.title}</h1>
              </div>
              <div className="shrink-0 bg-primary/5 p-4 rounded-2xl border border-primary/10 text-right">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Стоимость</div>
                <div className="text-3xl font-black text-primary leading-none">{formatKGS(service.price)}</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-6 py-4 border-y border-border/60 cursor-pointer hover:bg-secondary/20 transition-colors group"
              onClick={() => navigate(`/profile/${service.freelancer_id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold shadow-glow">
                  {(service.freelancer?.name || service.freelancer?.email || "F")[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Исполнитель</div>
                  <div className="font-bold text-lg group-hover:text-primary transition-colors">
                    {service.freelancer?.name || service.freelancer?.email || "Исполнитель"}
                  </div>
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

            {!isOwner && user?.role === "client" && (
              <div className="pt-8">
                <ProfileGuard variant="inline" message="Пожалуйста, заполните свой профиль (имя, о себе и навыки), чтобы написать исполнителю этой услуги.">
                  <Button 
                    onClick={() => startChat.mutate()} 
                    disabled={startChat.isPending} 
                    className="rounded-full bg-gradient-primary shadow-glow px-8 h-12 font-bold text-lg"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" /> Написать исполнителю
                  </Button>
                </ProfileGuard>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetail;
