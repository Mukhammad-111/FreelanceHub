import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/services";
import { PageLoader } from "@/components/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiError } from "@/lib/api";
import { LayoutGrid, Trash2, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminCategories = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const [newCat, setNewCat] = useState("");

  const createCat = useMutation({
    mutationFn: () => categoriesApi.create(newCat),
    onSuccess: () => { toast.success("Категория создана"); setNewCat(""); qc.invalidateQueries({ queryKey: ["categories"] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  const deleteCat = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => { toast.success("Удалено"); qc.invalidateQueries({ queryKey: ["categories"] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="container-app py-10 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-2"><ArrowLeft className="h-4 w-4 mr-2" /> К админ-панели</Button>
      
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <LayoutGrid className="h-7 w-7 text-primary" /> Управление категориями
      </h1>

      <div className="card-elevated p-8">
        <div className="flex gap-2 mb-8">
          <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Название новой категории" />
          <Button onClick={() => createCat.mutate()} disabled={!newCat || createCat.isPending} className="rounded-full bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" /> Добавить
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="rounded-2xl bg-secondary/50 p-4 flex items-center justify-between group">
              <span className="font-medium">{c.name}</span>
              <button onClick={() => deleteCat.mutate(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
