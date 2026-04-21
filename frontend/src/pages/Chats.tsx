import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatsApi, usersApi, ordersApi, reviewsApi } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, User, MessageSquare, Search, ChevronLeft, CheckCircle2, X, CreditCard, Star } from "lucide-react";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiError } from "@/lib/api";
import { Chat, Message } from "@/lib/types";
import { useProfileCompleteness } from "@/components/ProfileGuard";

const ChatListItem = ({ 
  chat, 
  currentUser, 
  isSelected, 
  onClick 
}: { 
  chat: Chat; 
  currentUser: any; 
  isSelected: boolean; 
  onClick: () => void 
}) => {
  const otherUserId = currentUser?.id === chat.client_id ? chat.freelancer_id : chat.client_id;
  
  // Fetch user info for this chat item
  const { data: otherUser } = useQuery({
    queryKey: ["user", otherUserId],
    queryFn: () => usersApi.get(otherUserId),
    staleTime: 300000, // 5 min
  });

  // Fetch last message for this chat item
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", chat.id],
    queryFn: () => chatsApi.messages(chat.id),
    refetchInterval: 5000,
  });

  const lastMessage = messages[0]; // Newest first from backend

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 flex items-center gap-3 cursor-pointer transition-all border-l-4",
        isSelected 
          ? "bg-primary/5 border-primary shadow-sm" 
          : "border-transparent hover:bg-secondary/30"
      )}
    >
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
        {(otherUser?.email || "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="font-bold truncate text-sm">
            {otherUser?.email || `User #${otherUserId}`}
          </span>
          {lastMessage && (
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter shrink-0 ml-2">
              {formatDistanceToNow(new Date(lastMessage.created_at), { locale: ru })}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center gap-2">
          <p className="text-xs text-muted-foreground truncate italic flex-1">
            {lastMessage?.text || "Нет сообщений"}
          </p>
          <div className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold shrink-0 border border-primary/10">
            #{chat.orders_id}
          </div>
        </div>
      </div>
    </div>
  );
};

const Chats = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(id ? Number(id) : null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isProfileComplete } = useProfileCompleteness();
  const [isMobileListVisible, setIsMobileListVisible] = useState(!id);
  
  // Review state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: chats = [], isLoading: isChatsLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await chatsApi.list();
      return res;
    },
    refetchInterval: 5000,
  });

  const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ["messages", selectedChatId],
    queryFn: async () => {
      const res = await chatsApi.messages(selectedChatId!);
      return res;
    },
    enabled: !!selectedChatId,
    refetchInterval: 3000,
  });

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const otherUserId = selectedChat 
    ? (user?.id === selectedChat.client_id ? selectedChat.freelancer_id : selectedChat.client_id)
    : null;

  const { data: activeOtherUser } = useQuery({
    queryKey: ["user", otherUserId],
    queryFn: () => usersApi.get(otherUserId!),
    enabled: !!otherUserId,
  });

  const send = useMutation({
    mutationFn: () => chatsApi.sendMessage(selectedChatId!, messageText),
    onSuccess: () => {
      setMessageText("");
      qc.invalidateQueries({ queryKey: ["messages", selectedChatId] });
      qc.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (e: any) => toast.error(apiError(e)),
  });

  const submitReview = useMutation({
    mutationFn: () => {
      const chat = chats.find(c => c.id === selectedChatId);
      if (!chat) throw new Error("Chat not found");
      return reviewsApi.create({
        reviewed_user_id: chat.client_id,
        rating: reviewRating,
        comment: reviewComment,
        order_id: chat.orders_id,
      });
    },
    onSuccess: () => {
      toast.success("Отзыв о заказчике отправлен!");
      setIsReviewDialogOpen(false);
      setReviewComment("");
      setReviewRating(5);
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (id) {
      setSelectedChatId(Number(id));
      setIsMobileListVisible(false);
    }
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, selectedChatId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || send.isPending) return;
    if (!isProfileComplete) {
      toast.error("Сначала заполните профиль (имя, о себе и навыки)");
      return;
    }
    send.mutate();
  };

  if (isChatsLoading && chats.length === 0) return <PageLoader />;

  return (
    <div className="container-app h-[calc(100vh-12rem)] min-h-[500px] flex gap-0 border border-border/50 rounded-3xl overflow-hidden bg-background/50 backdrop-blur-sm shadow-xl">
      {/* Sidebar: Chat List */}
      <div className={cn(
        "w-full md:w-80 border-r border-border/50 flex flex-col bg-background/30",
        !isMobileListVisible && "hidden md:flex"
      )}>
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Сообщения</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 bg-background/50 rounded-xl border-none ring-1 ring-border/50 text-sm" placeholder="Поиск чатов..." />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length > 0 ? (
            chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                currentUser={user}
                isSelected={selectedChatId === chat.id}
                onClick={() => {
                  setSelectedChatId(chat.id);
                  setIsMobileListVisible(false);
                  navigate(`/chats/${chat.id}`, { replace: true });
                }}
              />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p className="text-sm font-medium">У вас пока нет активных чатов</p>
            </div>
          )}
        </div>
      </div>

      {/* Main: Chat View */}
      <div className={cn(
        "flex-1 flex flex-col bg-background/20",
        isMobileListVisible && "hidden md:flex"
      )}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileListVisible(true)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {(activeOtherUser?.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {activeOtherUser?.email || "Загрузка..."}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    Заказ #{selectedChat.orders_id}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-90">
              {messages.length > 0 ? (
                [...messages].reverse().map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start animate-in slide-in-from-left-4 duration-300")}>
                      <span className="text-[10px] font-bold text-muted-foreground mb-1 px-2 uppercase tracking-tighter">
                        {isMe ? "Вы" : (activeOtherUser?.email || `User #${msg.sender_id}`)}
                      </span>
                      <div className={cn(
                        "max-w-[75%] p-4 rounded-3xl shadow-sm",
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-br-none" 
                          : "bg-background border border-border/50 rounded-bl-none shadow-md"
                      )}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <div className={cn(
                          "text-[9px] mt-1 font-bold uppercase tracking-wider opacity-60 text-right",
                        )}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Интерактивные кнопки для фрилансера при получении оплаты */}
                      {msg.text.includes("💸 Я оплатил заказ!") && !isMe && user?.role === "freelancer" && (
                        <div className="mt-2 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              chatsApi.sendMessage(selectedChatId!, "✅ ПОДТВЕРЖДЕНО: ДЕНЬГИ ПОЛУЧЕНЫ. Спасибо за сотрудничество!");
                              toast.success("Подтверждение отправлено");
                              qc.invalidateQueries({ queryKey: ["messages", selectedChatId] });
                              // Открываем диалог отзыва
                              setIsReviewDialogOpen(true);
                            }}
                            className="rounded-full bg-success hover:bg-success/90 text-white h-8 text-[10px] font-bold uppercase"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Да, получил
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if(confirm("Вы уверены, что оплата не пришла?")) {
                                chatsApi.sendMessage(selectedChatId!, "❌ ОПЛАТА НЕ ПОЛУЧЕНА: ТРЕБУЕТСЯ ПОВТОРНАЯ ОПЛАТА. Пожалуйста, проверьте транзакцию.");
                                toast.error("Сообщение об ошибке отправлено");
                                qc.invalidateQueries({ queryKey: ["messages", selectedChatId] });
                              }
                            }}
                            className="rounded-full h-8 text-[10px] font-bold uppercase"
                          >
                            <X className="h-3 w-3 mr-1" /> Нет
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                  Напишите первое сообщение...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-md">
              {!isProfileComplete ? (
                <div className="text-center p-2 bg-warning/10 border border-warning/20 rounded-2xl">
                  <p className="text-xs text-warning font-medium">
                    Заполните профиль, чтобы отправлять сообщения
                  </p>
                  <Button asChild variant="link" size="sm" className="text-warning h-auto p-0 text-xs underline">
                    <Link to="/profile">Перейти в профиль</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Напишите сообщение..."
                    className="rounded-2xl bg-background/50 border-border/50 focus:ring-primary/20 h-12"
                  />
                  <Button 
                    type="submit" 
                    disabled={!messageText.trim() || send.isPending} 
                    className="rounded-2xl h-12 w-12 p-0 bg-gradient-primary shadow-glow"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50 space-y-4">
            <div className="h-24 w-24 rounded-full bg-secondary/50 flex items-center justify-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                Выберите диалог слева, чтобы начать общение с заказчиком или исполнителем.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Review Client Dialog */}
      <AlertDialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-3xl p-8 border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Star className="h-6 w-6 text-warning fill-warning" /> Оцените заказчика
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-2">
              Все прошло успешно? Оставьте отзыв заказчику, чтобы другие фрилансеры знали, с кем работают.
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
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Ваш комментарий</label>
              <Textarea 
                value={reviewComment} 
                onChange={(e) => setReviewComment(e.target.value)} 
                placeholder="Напишите пару слов о сотрудничестве..." 
                className="min-h-32 bg-secondary/30 border-none focus:ring-2 ring-primary/20 rounded-2xl p-4" 
              />
            </div>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            <Button 
              disabled={!reviewComment || submitReview.isPending} 
              onClick={() => submitReview.mutate()} 
              className="w-full rounded-full bg-gradient-primary h-12 font-bold text-lg shadow-glow"
            >
              {submitReview.isPending ? "Отправка..." : "Отправить отзыв"}
            </Button>
            <AlertDialogCancel className="w-full rounded-full border-none hover:bg-secondary/50 h-12 font-semibold">
              Пропустить
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Chats;
