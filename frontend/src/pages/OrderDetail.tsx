import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi, responsesApi, paymentsApi, reviewsApi, usersApi, categoriesApi, chatsApi } from "@/lib/services";
import { PageLoader } from "@/components/Common";
import { OrderStatusBadge, formatKGS, ResponseStatusBadge } from "@/components/StatusBadges";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { apiError } from "@/lib/api";
import {
  ArrowLeft, CheckCircle2, CreditCard, Star, Trash2, X, Edit, Save, LayoutGrid, Mail, MessageSquare, Loader2, User
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileGuard, useProfileCompleteness } from "@/components/ProfileGuard";

const FreelancerResponseCard = ({ response, order, onAccept, onReject }: any) => {
  const navigate = useNavigate();
  if (!response || !response.freelancer_id) return null;

  const { data: profile } = useQuery({
    queryKey: ["user", response.freelancer_id],
    queryFn: () => usersApi.get(response.freelancer_id),
  });

  const name = profile?.profile?.name || `Фрилансер #${response.freelancer_id}`;
  const rating = profile?.profile?.rating || 0;

  return (
    <div
      className="rounded-2xl bg-secondary/30 border border-border/50 p-5 hover:bg-secondary/50 transition-all cursor-pointer group hover:shadow-lg hover:-translate-y-0.5"
      onClick={() => navigate(`/profile/${response.freelancer_id}`)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-4 items-start">
          <div className="h-14 w-14 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0 shadow-glow">
            {name ? name[0].toUpperCase() : "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{name}</h4>
              <div className="flex items-center gap-1 bg-warning/10 text-warning px-2 py-0.5 rounded-full text-xs font-bold border border-warning/20">
                <Star className="h-3 w-3 fill-warning" /> {rating > 0 ? rating.toFixed(1) : "Новый"}
              </div>
            </div>
            <p className="text-sm text-foreground/80 mt-2 line-clamp-2 italic font-medium leading-relaxed">
              &ldquo;{response.message}&rdquo;
            </p>
            {profile?.profile?.skills && typeof profile.profile.skills === "string" && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {profile.profile.skills.split(",").slice(0, 4).map((s: string, i: number) => (
                  <span key={i} className="text-[10px] bg-background/40 px-2 py-0.5 rounded-md border border-border/40 text-muted-foreground uppercase font-bold tracking-wider">
                    {s.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <ResponseStatusBadge status={response.status} />
          <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Профиль
          </Button>
        </div>
      </div>

      {response.status === "pending" && order.status === "OPEN" && (
        <div className="flex gap-2 mt-5 pt-4 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" onClick={() => onAccept(response.id)} className="rounded-full bg-gradient-primary h-9 px-6 font-semibold shadow-glow">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Принять
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReject(response.id)} className="rounded-full h-9 px-6 font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors">
            <X className="h-4 w-4 mr-2" /> Отклонить
          </Button>
        </div>
      )}
    </div>
  );
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({ queryKey: ["order", orderId], queryFn: () => ordersApi.get(orderId), enabled: !!orderId });
  const { data: allResponses = [] } = useQuery({ queryKey: ["responses", "order", orderId], queryFn: responsesApi.list, enabled: !!user });
  
  const isOwner = user && order && String(user.id) === String(order.client_id || order.client?.id);
  
  const responses = allResponses.filter(r => {
    const isThisOrder = String(r.order_id) === String(orderId);
    const fid = r.freelancer_id || r.freelancer?.id || (r.freelancer as any)?.id;
    const isMyResponse = fid && user?.id && String(fid) === String(user.id);
    return isThisOrder && (isOwner || isMyResponse);
  });

  const myResponse = responses.find(r => {
    const fid = r.freelancer_id || r.freelancer?.id;
    return fid && user?.id && String(fid) === String(user.id);
  });
  const { data: chats = [] } = useQuery({ queryKey: ["chats"], queryFn: chatsApi.list, enabled: !!user, refetchInterval: 5000 });

  // More robust way to find the chat associated with this order
  const orderChat = chats.find(c => {
    const cid = c.orders_id || (c as any).order_id || (c.order && c.order.id);
    return Number(cid) === Number(orderId);
  });
  const { data: clientProfile } = useQuery({
    queryKey: ["user", order?.client_id],
    queryFn: () => usersApi.get(order!.client_id!),
    enabled: !!order?.client_id,
  });

  const [message, setMessage] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [isReviewVisible, setIsReviewVisible] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);
  const [editData, setEditData] = useState({ title: "", description: "", budget: 0, category_id: 0 });
  const [reviewedUserId, setReviewedUserId] = useState<number | null>(null);

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

  const { isProfileComplete } = useProfileCompleteness();

  const respond = useMutation({
    mutationFn: () => {
      if (!isProfileComplete) {
        toast.error("Пожалуйста, сначала заполните профиль (имя, о себе и навыки)");
        throw new Error("Profile incomplete");
      }
      return responsesApi.create({ order_id: orderId, message });
    },
    onSuccess: () => { toast.success("Отклик отправлен"); setMessage(""); qc.invalidateQueries({ queryKey: ["responses"] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  const accept = useMutation({
    mutationFn: (rid: number) => responsesApi.accept(rid),
    onSuccess: async () => {
      toast.success("Исполнитель выбран");
      qc.invalidateQueries({ queryKey: ["chats"] });
      qc.invalidateQueries();

      // Auto-send welcome message
      setTimeout(async () => {
        try {
          const chats = await chatsApi.list();
          const chat = chats.find(c => Number(c.orders_id) === Number(orderId));
          if (chat) {
            const existingMessages = await chatsApi.messages(chat.id);
            // Send welcome message only if chat is empty
            if (existingMessages.length === 0) {
              await chatsApi.sendMessage(chat.id, "Поздравляем! Вы были выбраны исполнителем 🎉");
              toast.info("Приветственное сообщение отправлено");
            }
            navigate(`/chats/${chat.id}`);
          }
        } catch (e) {
          console.error("Failed to send welcome message", e);
        }
      }, 1500);
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const reject = useMutation({
    mutationFn: (rid: number) => responsesApi.reject(rid),
    onSuccess: () => { toast.success("Отклик отклонён"); qc.invalidateQueries(); },
    onError: (e) => toast.error(apiError(e)),
  });

  const setStatus = useMutation({
    mutationFn: (status: any) => ordersApi.setStatus(orderId, status),
    onSuccess: (newStatus) => {
      toast.success(`Статус обновлён: ${newStatus}`);
      qc.invalidateQueries({ queryKey: ["order", orderId] });

      // Notify via chat
      if (orderChat) {
        if (newStatus === "CONFIRMED_PAID") {
          chatsApi.sendMessage(orderChat.id, "✅ Я подтверждаю получение оплаты. Спасибо за сотрудничество!");
        } else if (newStatus === "COMPLETED" && order?.status === "PAID") {
          chatsApi.sendMessage(orderChat.id, "❌ Оплата не пришла. Пожалуйста, проверьте транзакцию и попробуйте оплатить снова.");
        }
      }
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const pay = useMutation({
    mutationFn: () => paymentsApi.create({ order_id: orderId, amount: order!.budget }),
    onSuccess: async () => {
      toast.success("Оплата проведена");
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      setStatus.mutate("PAID");

      // Notify via chat - ensure we have the chat object
      try {
        let chat = orderChat;
        if (!chat) {
          const allChats = await chatsApi.list();
          chat = allChats.find(c => Number(c.orders_id) === Number(orderId)) || null;
        }
        if (chat) {
          await chatsApi.sendMessage(chat.id, "💸 Я оплатил заказ! Пожалуйста, проверь поступление средств и подтверди получение в деталях заказа.");
        }
      } catch (e) {
        console.error("Failed to send payment notification", e);
      }
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: () => ordersApi.remove(orderId),
    onSuccess: () => { toast.success("Заказ удалён"); navigate("/orders"); },
    onError: (e) => toast.error(apiError(e)),
  });

  const review = useMutation({
    mutationFn: () => {
      const orderResponses = responses.filter(r => Number(r.order_id) === Number(orderId));
      const acceptedResponse = orderResponses.find(r => r.status === "accepted");

      const freelancerId = order?.freelancer_id ||
        order?.freelancer?.id ||
        acceptedResponse?.freelancer_id ||
        acceptedResponse?.freelancer?.id;

      const targetId = reviewedUserId || freelancerId;

      if (!targetId) {
        toast.error("Критическая ошибка: ID пользователя не найден.");
        throw new Error("User ID not found");
      }

      return reviewsApi.create({
        reviewed_user_id: Number(targetId),
        rating: reviewRating,
        comment: reviewText,
        order_id: Number(orderId),
      });
    },
    onSuccess: () => {
      toast.success("Отзыв отправлен.");
      setReviewText("");
      setIsReviewVisible(false);
      if (isOwner) remove.mutate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ["messages", orderChat?.id],
    queryFn: () => chatsApi.messages(orderChat!.id),
    enabled: !!orderChat,
    refetchInterval: 3000,
  });

  const fId = order?.freelancer_id ||
    order?.freelancer?.id ||
    responses.find(r =>
      Number(r.order_id) === Number(orderId) &&
      (r.status === "accepted")
    )?.freelancer_id;

  const paymentActions = [...chatMessages]
    .filter(m =>
      m.text.includes("✅ ПОДТВЕРЖДЕНО") ||
      m.text.includes("❌ ОПЛАТА НЕ ПОЛУЧЕНА") ||
      m.text.includes("💸 Я оплатил заказ")
    )
    .sort((a, b) => b.id - a.id);

  const lastAction = paymentActions[0];
  const isPaymentConfirmed = lastAction?.text.includes("✅ ПОДТВЕРЖДЕНО");
  const isPaymentRejected = lastAction?.text.includes("❌ ОПЛАТА НЕ ПОЛУЧЕНА");

  if (isLoading) return <PageLoader />;
  if (!order) return <div className="container-app py-10 text-center">
    <h2 className="text-2xl font-bold mb-4">Заказ не найден</h2>
    <Button onClick={() => navigate("/orders")}>К списку заказов</Button>
  </div>;

  const isFreelancer = user?.role === "freelancer";

  return (
    <div className="container-app py-10 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 -ml-2 hover:bg-secondary/50 rounded-full transition-all group"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Назад к заказам
      </Button>

      {isEditing ? (
        <div className="card-elevated p-8 space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Edit className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold">Редактирование заказа</h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Заголовок</label>
            <Input
              className="h-12 text-lg font-semibold rounded-2xl focus:ring-primary/20"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Бюджет (KGS)</label>
              <div className="relative">
                <Input
                  type="number"
                  className="h-12 pl-10 text-lg font-bold rounded-2xl focus:ring-primary/20"
                  value={editData.budget}
                  onChange={(e) => setEditData({ ...editData, budget: Number(e.target.value) })}
                />
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Категория</label>
              <Select value={String(editData.category_id)} onValueChange={(v) => setEditData({ ...editData, category_id: Number(v) })}>
                <SelectTrigger className="h-12 rounded-2xl text-lg font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="rounded-xl">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Описание задачи</label>
            <Textarea
              rows={8}
              className="rounded-3xl p-6 text-lg leading-relaxed focus:ring-primary/20"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => update.mutate()}
              disabled={update.isPending}
              className="rounded-full h-12 px-8 bg-gradient-primary font-bold shadow-glow text-lg"
            >
              {update.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              Сохранить изменения
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsEditing(false)}
              className="rounded-full h-12 px-6 font-bold"
            >
              <X className="h-5 w-5 mr-2" /> Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Main Unified Card */}
          <div className="card-elevated overflow-hidden border-none shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border/30">

              {/* LEFT COLUMN: Order Info */}
              <div className="lg:col-span-2 p-8 lg:p-12 space-y-10">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider border border-primary/20">
                      <LayoutGrid className="h-3.5 w-3.5" />
                      {order.category?.name || categories.find(c => c.id === order.category_id)?.name || "Без категории"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-secondary/50 px-3 py-1.5 rounded-full border border-border/30">
                      ID: #{order.id}
                    </span>
                    <div className="lg:hidden ml-auto">
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">{order.title}</h1>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2.5">
                    <Mail className="h-5 w-5 text-primary" /> Описание задачи
                  </h3>
                  <div className="bg-secondary/10 p-8 lg:p-10 rounded-[2.5rem] border border-border/40 backdrop-blur-sm shadow-inner-soft">
                    <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed font-medium text-base lg:text-lg">
                      {order.description}
                    </p>
                  </div>
                </div>

                {/* Owner specific actions in the main area (Edit/Delete) */}
                {isOwner && order.status === "OPEN" && (
                  <div className="flex flex-wrap gap-3 pt-6">
                    <Button onClick={() => {
                      setEditData({ title: order.title, description: order.description, budget: order.budget, category_id: order.category_id });
                      setIsEditing(true);
                    }} variant="outline" className="rounded-full h-12 px-8 font-black border-2 hover:bg-primary/5 transition-all">
                      <Edit className="h-5 w-5 mr-2" /> Редактировать
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="rounded-full h-12 px-6 font-black text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-5 w-5 mr-2" /> Удалить заказ
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold">Удалить этот заказ?</AlertDialogTitle>
                          <AlertDialogDescription className="text-base pt-2">
                            Все отклики фрилансеров будут удалены вместе с заказом. Это действие нельзя отменить.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="pt-4 gap-2">
                          <AlertDialogCancel className="rounded-full h-12 px-6 font-bold">Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => remove.mutate()}
                            className="rounded-full h-12 px-8 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                          >
                            Да, удалить заказ
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Sidebar (Budget, Client, Action) */}
              <div className="bg-secondary/20 p-8 lg:p-12 flex flex-col gap-10">
                {/* Status Badge (Desktop Only) */}
                <div className="hidden lg:block">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Текущий статус</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>

                {/* Budget Card */}
                <div className="bg-background/60 p-8 rounded-[2rem] border border-border/30 backdrop-blur-xl shadow-lg-soft relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150 duration-700" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10">
                    <CreditCard className="h-4 w-4 text-primary" /> Предлагаемый бюджет
                  </p>
                  <p className="text-3xl font-bold text-primary tracking-tight relative z-10">{formatKGS(order.budget)}</p>
                </div>

                {/* Client Info Card */}
                {!isOwner && clientProfile && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2.5 ml-1">
                      <User className="h-4 w-4" /> Заказчик проекта
                    </h3>
                    <div
                      className="group flex flex-col gap-5 p-6 rounded-[2rem] bg-background/40 border border-border/30 hover:bg-background/60 transition-all cursor-pointer shadow-sm hover:shadow-md"
                      onClick={() => navigate(`/profile/${clientProfile.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center text-2xl font-black shrink-0 shadow-glow transition-transform group-hover:scale-105 duration-300">
                          {(clientProfile.profile?.name || clientProfile.email)[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-black text-lg group-hover:text-primary transition-colors truncate">
                            {clientProfile.profile?.name || "Заказчик"}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate font-medium">
                            <Mail className="h-3 w-3" />
                            {clientProfile.email}
                          </div>
                        </div>
                      </div>

                      {clientProfile.profile?.bio && (
                        <div className="relative">
                          <p className="text-sm text-muted-foreground line-clamp-2 italic font-medium leading-relaxed pl-4 border-l-2 border-primary/20 group-hover:border-primary transition-colors">
                            &ldquo;{clientProfile.profile.bio}&rdquo;
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                          Посмотреть профиль →
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Section (Response or Workflow) */}
                <div className="mt-auto space-y-6 pt-6 border-t border-border/40">
                  {/* Freelancer Response Form */}
                  {isFreelancer && order.status === "OPEN" && !myResponse && (
                    <ProfileGuard variant="inline" message="Заполните профиль, чтобы откликнуться на этот заказ.">
                      <div className="space-y-4 animate-in slide-in-from-right duration-500 delay-300">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Ваш отклик</h3>
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <Textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Кратко опишите ваш опыт и почему вы подходите для этой задачи..."
                          className="bg-background/50 border-border/30 focus:ring-primary/20 min-h-32 rounded-3xl p-5 text-base font-medium transition-all"
                        />
                        <Button
                          disabled={!message || respond.isPending}
                          onClick={() => respond.mutate()}
                          className="w-full h-12 rounded-full bg-gradient-primary font-bold shadow-glow text-base group transition-all"
                        >
                          {respond.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Отправить отклик"}
                        </Button>
                      </div>
                    </ProfileGuard>
                  )}

                  {/* Already Responded Status */}
                  {isFreelancer && myResponse && (
                    <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/20 space-y-4 animate-in zoom-in duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-primary uppercase tracking-widest">Вы откликнулись</span>
                        <ResponseStatusBadge status={myResponse.status} />
                      </div>
                      <div className="bg-background/40 p-4 rounded-2xl border border-primary/10">
                        <p className="text-sm text-foreground/80 italic font-medium leading-relaxed">&ldquo;{myResponse.message}&rdquo;</p>
                      </div>
                      {myResponse.status === "accepted" && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(orderChat ? `/chats/${orderChat.id}` : "/chats")}
                          className="w-full rounded-full h-11 font-black bg-white"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" /> Перейти в чат
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Client Workflow Buttons (In Progress, Payment etc) */}
                  {isOwner && (
                    <div className="space-y-3">
                      {order.status === "IN_PROGRESS" && (
                        <>
                          <Button onClick={() => setStatus.mutate("COMPLETED")} className="w-full rounded-full h-12 bg-gradient-primary font-black shadow-glow">
                            <CheckCircle2 className="h-5 w-5 mr-2" /> Завершить работу
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigate(orderChat ? `/chats/${orderChat.id}` : "/chats")}
                            className="w-full rounded-full h-12 font-black border-2"
                          >
                            <MessageSquare className="h-5 w-5 mr-2" /> Чат с исполнителем
                          </Button>
                        </>
                      )}

                      {order.status === "COMPLETED" && (
                        <Button onClick={() => pay.mutate()} className="w-full rounded-full h-12 bg-gradient-primary font-bold shadow-glow text-base">
                          <CreditCard className="h-5 w-5 mr-2" /> Оплатить {formatKGS(order.budget)}
                        </Button>
                      )}

                      {order.status === "PAID" && !isPaymentConfirmed && !isPaymentRejected && (
                        <div className="flex flex-col items-center gap-3 bg-primary/5 p-6 rounded-[2rem] border border-primary/10 text-center">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                          <p className="text-sm font-bold text-foreground">Ожидаем подтверждения</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">Исполнитель должен подтвердить получение средств на свою карту.</p>
                        </div>
                      )}

                      {order.status === "PAID" && isPaymentRejected && (
                        <div className="flex flex-col gap-4 p-6 bg-destructive/5 border border-destructive/20 rounded-[2rem] animate-in zoom-in duration-300">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                              <X className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-destructive">Платеж отклонен</p>
                              <p className="text-xs font-medium text-muted-foreground leading-tight">Исполнитель не получил деньги</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => pay.mutate()}
                            className="w-full rounded-full bg-destructive text-white h-12 font-black shadow-md"
                          >
                            <CreditCard className="h-5 w-5 mr-2" /> Повторить оплату
                          </Button>
                        </div>
                      )}

                      {(order.status === "CONFIRMED_PAID" || (order.status === "PAID" && isPaymentConfirmed)) && (
                        <Button
                          onClick={() => {
                            setReviewedUserId(fId);
                            setIsReviewVisible(true);
                          }}
                          className="w-full rounded-full h-12 bg-gradient-primary font-bold shadow-glow text-base"
                        >
                          <Star className="h-5 w-5 mr-2" /> Оставить отзыв
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Freelancer Confirmation Banner */}
                  {!isOwner && user?.id && Number(user.id) === Number(fId) && order.status === "PAID" && (
                    <div className="bg-primary/10 p-6 rounded-[2rem] border-2 border-primary/30 space-y-4 animate-in zoom-in duration-500">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                          <CreditCard className="h-6 w-6" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-wider text-primary">Подтвердите оплату</h3>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                        Заказчик сообщил, что перевел вам <b>{formatKGS(order.budget)}</b>. Деньги поступили?
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => {
                            if (orderChat) {
                              chatsApi.sendMessage(orderChat.id, "✅ ПОДТВЕРЖДЕНО: ДЕНЬГИ ПОЛУЧЕНЫ. Спасибо за сотрудничество!");
                              toast.success("Подтверждение отправлено");
                              setReviewedUserId(order.client_id);
                              setIsReviewVisible(true);
                            }
                          }}
                          className="w-full rounded-full bg-success hover:bg-success/90 text-white font-black h-11 shadow-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Да, получил
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm("Вы уверены, что оплата не прошла?") && orderChat) {
                              chatsApi.sendMessage(orderChat.id, "❌ ОПЛАТА НЕ ПОЛУЧЕНА: ТРЕБУЕТСЯ ПОВТОРНАЯ ОПЛАТА. Пожалуйста, проверьте транзакцию.");
                              toast.error("Сообщение об ошибке отправлено");
                            }
                          }}
                          variant="ghost"
                          className="w-full rounded-full h-11 font-black text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 mr-2" /> Нет, не пришли
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Separate section for responses list if owner */}
          {isOwner && responses.length > 0 && (
            <div className="space-y-8 mt-4">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-2xl tracking-tight text-foreground">Отклики исполнителей</h3>
                </div>
                <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black border border-primary/20">
                  {responses.length} {responses.length === 1 ? "отклик" : "откликов"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
                  {responses.map((r: any) => (
                    <FreelancerResponseCard
                      key={r.id}
                      response={r}
                      order={order}
                      onAccept={(rid: number) => accept.mutate(rid)}
                      onReject={(rid: number) => reject.mutate(rid)}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Dialog */}
      <AlertDialog open={isReviewVisible} onOpenChange={setIsReviewVisible}>
        <AlertDialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl overflow-hidden bg-background">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-primary" />
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-3 tracking-tight">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <Star className="h-5 w-5 text-warning fill-warning animate-pulse" />
              </div>
              {reviewedUserId === order.client_id ? "Оцените заказчика" : "Оцените работу"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-3 font-medium text-muted-foreground leading-relaxed">
              {reviewedUserId === order.client_id
                ? "Вам понравилось работать с этим заказчиком? Оставьте честный отзыв!"
                : "Пожалуйста, поделитесь впечатлениями о работе с фрилансером."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-8 py-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Ваша оценка</label>
              <div className="flex justify-between items-center bg-secondary/20 p-5 rounded-3xl border border-border/30">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    type="button"
                    className="transition-all hover:scale-125 active:scale-90 relative group"
                  >
                    <Star className={`h-10 w-10 transition-colors duration-300 ${n <= reviewRating ? "fill-warning text-warning drop-shadow-glow-sm" : "text-muted-foreground/20"}`} />
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-warning scale-0 group-hover:scale-100 transition-transform" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Комментарий</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Расскажите о своем опыте..."
                className="min-h-[140px] bg-secondary/30 border-none focus:ring-4 ring-primary/10 rounded-[2rem] p-6 text-base font-medium placeholder:text-muted-foreground/50 transition-all shadow-inner-soft"
              />
            </div>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-col gap-3">
            <Button
              disabled={!reviewText || review.isPending}
              onClick={() => review.mutate()}
              className="w-full rounded-full bg-gradient-primary h-12 font-bold text-base shadow-glow transition-all hover:opacity-90"
            >
              {review.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Отправить отзыв"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsReviewVisible(false)}
              className="w-full rounded-full h-12 font-bold hover:bg-secondary/50"
            >
              Отмена
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDetail;
