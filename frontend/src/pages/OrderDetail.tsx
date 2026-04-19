import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi, responsesApi, paymentsApi, reviewsApi } from "@/lib/services";
import { PageLoader } from "@/components/Common";
import { OrderStatusBadge, formatKGS, ResponseStatusBadge } from "@/components/StatusBadges";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { apiError } from "@/lib/api";
import {
  ArrowLeft, CheckCircle2, CreditCard, Star, Trash2, X, Edit, Save, LayoutGrid
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesApi } from "@/lib/services";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({ queryKey: ["order", orderId], queryFn: () => ordersApi.get(orderId), enabled: !!orderId });
  const { data: responses = [] } = useQuery({ queryKey: ["responses", "order", orderId], queryFn: responsesApi.list, enabled: !!user });

  const [message, setMessage] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: "", description: "", budget: 0, category_id: 0 });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const update = useMutation({
    mutationFn: () => ordersApi.update(orderId, editData),
    onSuccess: () => {
      toast.success("Заказ обновлён");
      setIsEditing(false);
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const respond = useMutation({
    mutationFn: () => responsesApi.create({ order_id: orderId, message }),
    onSuccess: () => { toast.success("Отклик отправлен"); setMessage(""); qc.invalidateQueries({ queryKey: ["responses"] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  const accept = useMutation({
    mutationFn: (rid: number) => responsesApi.accept(rid),
    onSuccess: () => { toast.success("Исполнитель выбран"); qc.invalidateQueries(); },
    onError: (e) => toast.error(apiError(e)),
  });
  const reject = useMutation({
    mutationFn: (rid: number) => responsesApi.reject(rid),
    onSuccess: () => { toast.success("Отклик отклонён"); qc.invalidateQueries(); },
    onError: (e) => toast.error(apiError(e)),
  });

  const setStatus = useMutation({
    mutationFn: (status: any) => ordersApi.setStatus(orderId, status),
    onSuccess: () => { toast.success("Статус обновлён"); qc.invalidateQueries(); },
    onError: (e) => toast.error(apiError(e)),
  });

  const pay = useMutation({
    mutationFn: () => paymentsApi.create({ order_id: orderId, amount: order!.budget }),
    onSuccess: () => { toast.success("Оплата проведена"); qc.invalidateQueries(); setStatus.mutate("PAID"); },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: () => ordersApi.remove(orderId),
    onSuccess: () => { toast.success("Заказ удалён"); navigate("/orders"); },
    onError: (e) => toast.error(apiError(e)),
  });

  const review = useMutation({
    mutationFn: () => reviewsApi.create({
      reviewed_user_id: order!.freelancer_id!,
      rating: reviewRating,
      comment: reviewText,
      order_id: orderId,
    }),
    onSuccess: () => { toast.success("Отзыв отправлен"); setReviewText(""); },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading) return <PageLoader />;
  if (!order) return <div className="container-app py-10">Заказ не найден</div>;

  const isOwner = user?.id === order.client_id;
  const isFreelancer = user?.role === "freelancer";
  const orderResponses = responses.filter((r) => r.order_id === orderId);
  const myResponse = orderResponses.find((r) => r.freelancer_id === user?.id);

  return (
    <div className="container-app py-10 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-2"><ArrowLeft className="h-4 w-4 mr-2" /> Назад</Button>

      <div className="card-elevated p-8 mb-6">
        {isEditing ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Заголовок</label>
              <Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Бюджет (KGS)</label>
                <Input type="number" value={editData.budget} onChange={(e) => setEditData({ ...editData, budget: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Категория</label>
                <Select value={String(editData.category_id)} onValueChange={(v) => setEditData({ ...editData, category_id: Number(v) })}>
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
              <Textarea rows={6} value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
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
          <>
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <LayoutGrid className="h-4 w-4" /> {order.category?.name || "Без категории"}
                </div>
                <h1 className="text-3xl font-bold">{order.title}</h1>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-6 whitespace-pre-wrap text-foreground/80 leading-relaxed">{order.description}</p>
            <div className="mt-6 pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Бюджет</div>
                <div className="text-3xl font-bold text-primary">{formatKGS(order.budget)}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                {isOwner && order.status === "OPEN" && (
                  <>
                    <Button onClick={() => {
                      setEditData({ title: order.title, description: order.description, budget: order.budget, category_id: order.category_id });
                      setIsEditing(true);
                    }} variant="outline" className="rounded-full">
                      <Edit className="h-4 w-4 mr-2" /> Редактировать
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4 mr-2" /> Удалить
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Удалить заказ?</AlertDialogTitle>
                          <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove.mutate()}>Удалить</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                {isOwner && order.status === "IN_PROGRESS" && (
                  <Button onClick={() => setStatus.mutate("COMPLETED")} className="rounded-full bg-gradient-primary">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Отметить выполненным
                  </Button>
                )}
                {isOwner && order.status === "COMPLETED" && (
                  <Button onClick={() => pay.mutate()} className="rounded-full bg-gradient-primary shadow-glow">
                    <CreditCard className="h-4 w-4 mr-2" /> Оплатить {formatKGS(order.budget)}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Freelancer response */}
      {isFreelancer && order.status === "OPEN" && !myResponse && (
        <div className="card-soft p-6 mb-6">
          <h3 className="font-semibold text-lg mb-3">Откликнуться на заказ</h3>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Расскажите, почему вы подходите..." className="mb-3 min-h-24" />
          <Button disabled={!message || respond.isPending} onClick={() => respond.mutate()} className="rounded-full bg-gradient-primary">
            Отправить отклик
          </Button>
        </div>
      )}

      {isFreelancer && myResponse && (
        <div className="card-soft p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="font-medium">Ваш отклик</div>
            <ResponseStatusBadge status={myResponse.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{myResponse.message}</p>
        </div>
      )}

      {/* Responses for owner */}
      {isOwner && orderResponses.length > 0 && (
        <div className="card-soft p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">Отклики ({orderResponses.length})</h3>
          <div className="space-y-3">
            {orderResponses.map((r) => (
              <div key={r.id} className="rounded-xl bg-secondary/60 p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-medium text-sm">Фрилансер #{r.freelancer_id}</div>
                    <p className="text-sm mt-2">{r.message}</p>
                  </div>
                  <ResponseStatusBadge status={r.status} />
                </div>
                {r.status === "pending" && order.status === "OPEN" && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => accept.mutate(r.id)} className="rounded-full bg-gradient-primary">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Принять
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject.mutate(r.id)} className="rounded-full">
                      <X className="h-4 w-4 mr-1" /> Отклонить
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review */}
      {isOwner && (order.status === "COMPLETED" || order.status === "PAID") && order.freelancer_id && (
        <div className="card-soft p-6">
          <h3 className="font-semibold text-lg mb-4">Оставить отзыв исполнителю</h3>
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map((n) => (
              <button key={n} onClick={() => setReviewRating(n)} type="button">
                <Star className={`h-7 w-7 ${n <= reviewRating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Поделитесь впечатлениями..." className="mb-3" />
          <Button disabled={!reviewText || review.isPending} onClick={() => review.mutate()} className="rounded-full bg-gradient-primary">
            Отправить отзыв
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
