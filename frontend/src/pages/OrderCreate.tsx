import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ordersApi, categoriesApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiError } from "@/lib/api";
import { Loader2 } from "lucide-react";

const OrderCreate = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const create = useMutation({
    mutationFn: () => ordersApi.create({
      title, description, budget: Number(budget), category_id: Number(categoryId),
    }),
    onSuccess: (o) => { toast.success("Заказ создан!"); navigate(`/orders/${o.id}`); },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div className="container-app py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Новый заказ</h1>
      <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="card-elevated p-8 space-y-5">
        <div className="space-y-2">
          <Label>Название</Label>
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, создать сайт-визитку" />
        </div>
        <div className="space-y-2">
          <Label>Описание</Label>
          <Textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-32" placeholder="Подробнее опишите задачу..." />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Бюджет (KGS)</Label>
            <Input type="number" required min={1} value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Категория</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" disabled={create.isPending || !categoryId} className="w-full rounded-full bg-gradient-primary shadow-glow">
          {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Опубликовать заказ
        </Button>
      </form>
    </div>
  );
};

export default OrderCreate;
