import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ordersApi, servicesApi, categoriesApi } from "@/lib/services";
import {
  Briefcase, Search, ShieldCheck, Star, Wallet, Users,
  ArrowRight, Sparkles, CheckCircle2, Code2, Palette, Smartphone, PenTool, Megaphone
} from "lucide-react";
import { formatKGS, OrderStatusBadge } from "@/components/StatusBadges";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { icon: Search, title: "Найти специалиста", text: "Каталог услуг и фрилансеров с фильтрами по категориям и цене." },
  { icon: Briefcase, title: "Публиковать заказы", text: "Описывайте задачу, получайте отклики и выбирайте лучших." },
  { icon: ShieldCheck, title: "Прозрачные сделки", text: "JWT-авторизация, ролевая модель и контроль каждого шага." },
  { icon: Wallet, title: "Учёт оплаты", text: "Внутренняя система платежей в сомах (KGS) — без сложностей." },
  { icon: Star, title: "Рейтинг и отзывы", text: "Отзывы только после завершения работы — честная репутация." },
  { icon: Users, title: "Для команд и одиночек", text: "Подходит и для разовых задач, и для долгих проектов." },
];

const cats = [
  { icon: Code2, name: "Web Development" },
  { icon: Palette, name: "Design" },
  { icon: Smartphone, name: "Mobile" },
  { icon: PenTool, name: "Writing" },
  { icon: Megaphone, name: "Marketing" },
];

const Index = () => {
  const { user } = useAuth();
  const { data: orders = [] } = useQuery({ queryKey: ["orders", "preview"], queryFn: () => ordersApi.list() });
  const { data: services = [] } = useQuery({ queryKey: ["services", "preview"], queryFn: () => servicesApi.list() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container-app py-20 lg:py-28 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1 text-xs font-medium shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Платформа №1 для фрилансеров в КР
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
              Проверенные и эффективные{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">фриланс-решения</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Заказчики находят исполнителей, фрилансеры — интересные проекты. Прозрачно, быстро и удобно.
            </p>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button asChild size="lg" className="rounded-full bg-gradient-primary shadow-glow hover:opacity-90">
                  <Link to="/orders">Перейти к заказам <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="rounded-full bg-gradient-primary shadow-glow hover:opacity-90">
                  <Link to="/register">Начать бесплатно <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/services">Смотреть услуги</Link>
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Без комиссии</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Быстрый старт</div>
            </div>
          </div>

          <div className="relative">
            <div className="card-elevated p-6 max-w-md ml-auto rotate-1">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">Свежие заказы</div>
                <Link to="/orders" className="text-sm text-primary hover:underline">Все →</Link>
              </div>
              <div className="space-y-3">
                {(orders.slice(0, 3).length ? orders.slice(0, 3) : [
                  { id: 0, title: "Создать сайт-визитку", budget: 25000, status: "OPEN" as const, description: "" },
                  { id: 0, title: "Дизайн мобильного приложения", budget: 40000, status: "OPEN" as const, description: "" },
                  { id: 0, title: "Текст для landing page", budget: 8000, status: "IN_PROGRESS" as const, description: "" },
                ]).map((o, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/60">
                    <div>
                      <div className="font-medium text-sm">{o.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatKGS(o.budget)}</div>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </div>
                ))}
              </div>
            </div>
            <div className="card-elevated p-4 max-w-xs absolute -bottom-6 -left-2 hidden sm:block -rotate-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">5★</div>
                <div>
                  <div className="text-sm font-medium">Средний рейтинг</div>
                  <div className="text-xs text-muted-foreground">по завершённым заказам</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-app py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Всё для вашего проекта</h2>
          <p className="text-muted-foreground mt-3">Удобные инструменты для заказчиков и фрилансеров.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card-soft p-6 hover:shadow-card transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-accent text-accent-foreground flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-app py-12">
        <div className="card-elevated p-8 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Популярные категории</h2>
              <p className="text-muted-foreground mt-2">Выбирайте направление и находите проекты.</p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/services">Все услуги</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(categories.length ? categories.slice(0, 5).map((c, i) => ({ icon: cats[i % cats.length].icon, name: c.name })) : cats).map((c) => (
              <div key={c.name} className="rounded-2xl bg-secondary/50 hover:bg-accent transition p-5 text-center cursor-default">
                <div className="h-10 w-10 mx-auto rounded-xl bg-card flex items-center justify-center mb-3 shadow-soft">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-medium">{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services preview */}
      {services.length > 0 && (
        <section className="container-app py-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold">Свежие услуги</h2>
            <Link to="/services" className="text-primary text-sm hover:underline">Все услуги →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.slice(0, 6).map((s) => (
              <Link key={s.id} to={`/services/${s.id}`} className="card-soft p-5 hover:shadow-card transition block">
                <div className="font-semibold line-clamp-1">{s.title}</div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{s.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <div className="font-semibold text-primary">{formatKGS(s.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container-app py-16">
        <div className="rounded-3xl bg-gradient-primary text-primary-foreground p-10 lg:p-14 text-center shadow-glow">
          <h2 className="text-3xl sm:text-4xl font-bold">Готовы начать?</h2>
          <p className="mt-3 opacity-90 max-w-xl mx-auto">
            Зарегистрируйтесь, опубликуйте первый заказ или услугу и получайте результат уже сегодня.
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            {!user && (
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link to="/register">Создать аккаунт</Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="rounded-full bg-transparent border-white/40 hover:bg-white/10 text-primary-foreground">
              <Link to="/orders">Смотреть заказы</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
