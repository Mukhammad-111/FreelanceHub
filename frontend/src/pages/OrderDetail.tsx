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
  ArrowLeft, CheckCircle2, CreditCard, Star, Trash2, X, Edit, Save, LayoutGrid, Mail, MessageSquare, Loader2
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
  const { data: responses = [] } = useQuery({ queryKey: ["responses", "order", orderId], queryFn: responsesApi.list, enabled: !!user });
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
      console.log("--- FULL DEBUG INFO ---");
      console.log("Order object:", order);
      console.log("All responses:", responses);
      
      const orderResponses = responses.filter(r => Number(r.order_id) === Number(orderId));
      console.log("Responses for this order:", orderResponses);

      // Try multiple ways to find the ID
      const acceptedResponse = orderResponses.find(r => 
        r.status === "accepted"
      );
      
      const freelancerId = order?.freelancer_id || 
                         order?.freelancer?.id || 
                         acceptedResponse?.freelancer_id || 
                         acceptedResponse?.freelancer?.id;
      
      console.log("Attempted ID retrieval:");
      console.log("- from order.freelancer_id:", order?.freelancer_id);
      console.log("- from order.freelancer.id:", order?.freelancer?.id);
      console.log("- from acceptedResponse.freelancer_id:", acceptedResponse?.freelancer_id);
      console.log("- from acceptedResponse.freelancer.id:", acceptedResponse?.freelancer?.id);
      console.log("Final freelancerId:", freelancerId);

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

  // Пытаемся найти ID фрилансера всеми способами
  const fId = order?.freelancer_id || 
              order?.freelancer?.id || 
              responses.find(r => 
                Number(r.order_id) === Number(orderId) && 
                (r.status === "accepted")
              )?.freelancer_id;
  
  // Ищем все сообщения, связанные с оплатой
  const paymentActions = [...chatMessages]
    .filter(m => 
      m.text.includes("✅ ПОДТВЕРЖДЕНО") || 
      m.text.includes("❌ ОПЛАТА НЕ ПОЛУЧЕНА") ||
      m.text.includes("💸 Я оплатил заказ")
    )
    .sort((a, b) => b.id - a.id); // Самое свежее — первое

  const lastAction = paymentActions[0];
  const isPaymentConfirmed = lastAction?.text.includes("✅ ПОДТВЕРЖДЕНО");
  const isPaymentRejected = lastAction?.text.includes("❌ ОПЛАТА НЕ ПОЛУЧЕНА");

  useEffect(() => {
    if (order && chatMessages.length > 0) {
      console.log("--- Payment Detection Debug ---");
      console.log("Last Action Text:", lastAction?.text);
      console.log("Is Confirmed:", isPaymentConfirmed);
      console.log("Is Rejected:", isPaymentRejected);
    }
  }, [order, chatMessages, lastAction, isPaymentConfirmed, isPaymentRejected]);

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
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                    <LayoutGrid className="h-3 w-3" /> 
                    {order.category?.name || categories.find(c => c.id === order.category_id)?.name || "Без категории"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    ID: #{order.id}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{order.title}</h1>
              </div>
              <div className="shrink-0">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-border/50">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <CreditCard className="h-3 w-3" /> Бюджет
                </p>
                <p className="text-2xl font-black text-primary">{formatKGS(order.budget)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <LayoutGrid className="h-3 w-3" /> Категория
                </p>
                <p className="text-lg font-bold text-foreground">
                  {order.category?.name || categories.find(c => c.id === order.category_id)?.name || "Общее"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Star className="h-3 w-3" /> Статус
                </p>
                <div className="pt-1">
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Mail className="h-4 w-4" /> Описание задачи
              </h3>
              <div className="bg-secondary/20 p-6 rounded-3xl border border-border/40">
                <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed font-medium">
                  {order.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-6 pt-2">
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
                  <>
                    <Button onClick={() => setStatus.mutate("COMPLETED")} className="rounded-full bg-gradient-primary">
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Отметить выполненным
                    </Button>
                    <ProfileGuard variant="inline" message="Заполните профиль, чтобы общаться с исполнителем.">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(orderChat ? `/chats/${orderChat.id}` : "/chats")}
                        className="rounded-full shadow-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" /> Чат с исполнителем
                      </Button>
                    </ProfileGuard>
                  </>
                )}
                {isOwner && order.status === "COMPLETED" && (
                  <Button onClick={() => pay.mutate()} className="rounded-full bg-gradient-primary shadow-glow">
                    <CreditCard className="h-4 w-4 mr-2" /> Оплатить {formatKGS(order.budget)}
                  </Button>
                )}
                {isOwner && order.status === "PAID" && !isPaymentConfirmed && !isPaymentRejected && (
                  <div className="flex items-center gap-3 bg-secondary/30 px-6 py-3 rounded-full border border-border/50">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Ожидаем подтверждения получения денег от исполнителя...</span>
                  </div>
                )}
                
                {isOwner && order.status === "PAID" && isPaymentRejected && (
                  <div className="flex flex-col gap-3 p-6 bg-destructive/10 border border-destructive/20 rounded-3xl animate-in zoom-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-destructive/20 text-destructive flex items-center justify-center">
                        <X className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-destructive">Исполнитель не получил оплату</p>
                        <p className="text-xs text-muted-foreground">Пожалуйста, проверьте реквизиты и попробуйте еще раз</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => pay.mutate()} 
                      className="rounded-full bg-gradient-primary shadow-glow h-11 font-bold"
                    >
                      <CreditCard className="h-4 w-4 mr-2" /> Оплатить повторно
                    </Button>
                  </div>
                )}

                {isOwner && (order.status === "CONFIRMED_PAID" || (order.status === "PAID" && isPaymentConfirmed)) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="rounded-full bg-gradient-primary shadow-glow px-8">
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Завершить сделку
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Сделка завершена!</AlertDialogTitle>
                        <AlertDialogDescription>
                          Хотите оставить отзыв исполнителю перед окончательным закрытием заказа?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel onClick={() => {
                          toast.info("Заказ будет удален...");
                          setTimeout(() => remove.mutate(), 1000);
                        }} className="rounded-full">
                          Не оставлять
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                          setReviewedUserId(fId);
                          setIsReviewVisible(true);
                        }} className="rounded-full bg-gradient-primary">
                          Оставить отзыв
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Фрилансер подтверждает оплату */}
                {!isOwner && user?.id && Number(user.id) === Number(fId) && order.status === "PAID" && (
                  <div className="card-elevated p-6 border-2 border-primary/20 w-full md:w-auto animate-in zoom-in duration-300">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" /> Заказчик сообщил об оплате
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Пожалуйста, проверьте свой баланс. Вы получили <b>{formatKGS(order.budget)}</b>?
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          if (orderChat) {
                            chatsApi.sendMessage(orderChat.id, "✅ ПОДТВЕРЖДЕНО: ДЕНЬГИ ПОЛУЧЕНЫ. Спасибо за сотрудничество!");
                            toast.success("Подтверждение отправлено");
                            setReviewedUserId(order.client_id);
                            setIsReviewVisible(true);
                          }
                        }} 
                        className="rounded-full bg-success hover:bg-success/90 text-white"
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
                        variant="destructive" 
                        className="rounded-full"
                      >
                        <X className="h-4 w-4 mr-2" /> Нет, не пришли
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Review Dialog */}
      <AlertDialog open={isReviewVisible} onOpenChange={setIsReviewVisible}>
        <AlertDialogContent className="max-w-md rounded-3xl p-8 border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Star className="h-6 w-6 text-warning fill-warning" /> {reviewedUserId === order.client_id ? "Оцените заказчика" : "Оцените работу"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-2">
              {reviewedUserId === order.client_id 
                ? "Вам понравилось работать с этим заказчиком? Оставьте отзыв!" 
                : "Пожалуйста, оставьте ваш отзыв об исполнителе, чтобы завершить сделку."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Оценка</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button 
                    key={n} 
                    onClick={() => setReviewRating(n)} 
                    type="button"
                    className="transition-all hover:scale-110 active:scale-90"
                  >
                    <Star className={`h-10 w-10 ${n <= reviewRating ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Комментарий</label>
              <Textarea 
                value={reviewText} 
                onChange={(e) => setReviewText(e.target.value)} 
                placeholder="Что вам понравилось?" 
                className="min-h-32 bg-secondary/30 border-none focus:ring-2 ring-primary/20 rounded-2xl p-4" 
              />
            </div>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            <Button 
              disabled={!reviewText || review.isPending} 
              onClick={() => review.mutate()} 
              className="w-full rounded-full bg-gradient-primary h-12 font-bold text-lg shadow-glow"
            >
              {review.isPending ? "Отправка..." : "Отправить и завершить"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setIsReviewVisible(false)}
              className="w-full rounded-full"
            >
              Отмена
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Client Info Section */}
      {!isOwner && clientProfile && (
        <div className="card-soft p-6 mb-6 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/profile/${clientProfile.id}`)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                {(clientProfile.profile?.name || clientProfile.email)[0].toUpperCase()}
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Заказчик</div>
                <div className="font-bold text-lg group-hover:text-primary transition-colors">
                  {clientProfile.profile?.name || "Заказчик"}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Mail className="h-3 w-3" />
                  {clientProfile.email}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Профиль
            </Button>
          </div>
          {clientProfile.profile?.bio && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2 italic">
              &ldquo;{clientProfile.profile.bio}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Freelancer response */}
      {isFreelancer && order.status === "OPEN" && !myResponse && (
        <ProfileGuard variant="inline" message="Пожалуйста, заполните свой профиль (имя, о себе и навыки), чтобы откликнуться на этот заказ.">
          <div className="card-soft p-6 mb-6">
            <h3 className="font-semibold text-lg mb-3">Откликнуться на заказ</h3>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Расскажите, почему вы подходите..." className="mb-3 min-h-24" />
            <Button disabled={!message || respond.isPending} onClick={() => respond.mutate()} className="rounded-full bg-gradient-primary">
              Отправить отклик
            </Button>
          </div>
        </ProfileGuard>
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

      {isOwner && orderResponses.length > 0 && (
        <div className="card-soft p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl">Отклики на ваш заказ</h3>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
              {orderResponses.length}
            </span>
          </div>
          <div className="space-y-4">
            {orderResponses.map((r) => (
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
  );
};

export default OrderDetail;
