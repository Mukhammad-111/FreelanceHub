import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Role } from "@/lib/types";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name, email, password, role });
      toast.success("Аккаунт создан!");
      navigate("/");
    } catch (e: any) {
      toast.error(e.message || "Не удалось зарегистрироваться");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-hero">
      <div className="w-full max-w-md card-elevated p-8 animate-fade-in">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </span>
          FreelanceHub
        </Link>
        <h1 className="text-2xl font-bold mb-1">Создать аккаунт</h1>
        <p className="text-muted-foreground text-sm mb-6">Начните пользоваться платформой за минуту</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Я хочу:</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as Role)} className="grid grid-cols-2 gap-2">
              <Label className={`cursor-pointer rounded-xl border-2 p-3 text-center text-sm transition ${role === "client" ? "border-primary bg-accent" : "border-border"}`}>
                <RadioGroupItem value="client" className="sr-only" />
                Заказывать
              </Label>
              <Label className={`cursor-pointer rounded-xl border-2 p-3 text-center text-sm transition ${role === "freelancer" ? "border-primary bg-accent" : "border-border"}`}>
                <RadioGroupItem value="freelancer" className="sr-only" />
                Выполнять
              </Label>
            </RadioGroup>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90 shadow-glow rounded-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Зарегистрироваться
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
