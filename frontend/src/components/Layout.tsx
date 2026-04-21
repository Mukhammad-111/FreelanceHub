import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Briefcase, LayoutGrid, ListChecks, MessageSquare, CreditCard,
  Shield, User as UserIcon, LogOut, Menu, Sparkles
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NavItem = ({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick?: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        isActive ? "bg-accent text-accent-foreground" : "text-foreground/70 hover:text-foreground hover:bg-secondary"
      )
    }
  >
    <Icon className="h-4 w-4" />
    {label}
  </NavLink>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/orders", icon: Briefcase, label: "Заказы" },
    { to: "/services", icon: LayoutGrid, label: "Услуги" },
    ...(user ? [{ to: "/dashboard", icon: ListChecks, label: "Дашборд" }] : []),
    ...(user ? [{ to: "/chats", icon: MessageSquare, label: "Сообщения" }] : []),
    ...(user ? [{ to: "/payments", icon: CreditCard, label: "Платежи" }] : []),
    ...(user?.role === "admin" ? [{ to: "/admin", icon: Shield, label: "Админ" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container-app flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Sparkles className="h-5 w-5" />
            </span>
            FreelanceHub
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => <NavItem key={l.to} {...l} />)}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      {(user.name || user.email)[0]?.toUpperCase()}
                    </div>
                    <span className="hidden sm:inline">{user.name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-medium">{user.name || user.email}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <UserIcon className="h-4 w-4 mr-2" /> Профиль
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await logout(); navigate("/"); }}>
                    <LogOut className="h-4 w-4 mr-2" /> Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")} className="hidden sm:inline-flex">Войти</Button>
                <Button onClick={() => navigate("/register")} className="rounded-full bg-gradient-primary hover:opacity-90 shadow-glow">
                  Регистрация
                </Button>
              </>
            )}

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="mt-8 flex flex-col gap-1">
                  {links.map((l) => <NavItem key={l.to} {...l} onClick={() => setOpen(false)} />)}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 animate-fade-in">
        <Outlet />
      </main>

      <footer className="border-t border-border/60 mt-16">
        <div className="container-app py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} FreelanceHub. Все права защищены.</div>
          <div className="flex gap-6">
            <Link to="/orders" className="hover:text-foreground">Заказы</Link>
            <Link to="/services" className="hover:text-foreground">Услуги</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
