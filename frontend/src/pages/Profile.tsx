import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesApi, reviewsApi } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageLoader } from "@/components/Common";
import { toast } from "sonner";
import { apiError } from "@/lib/api";
import { Star, User, AlertCircle, Loader2 } from "lucide-react";
import { ReviewItem } from "@/components/ReviewItem";
import { useProfileCompleteness } from "@/components/ProfileRequirementGuard";

const Profile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile", "me"], queryFn: profilesApi.me });
  const { isComplete } = useProfileCompleteness();
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", user?.id], queryFn: () => reviewsApi.byUser(user!.id), enabled: !!user,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");

  useEffect(() => {
    if (profile?.profile) {
      setName(profile.profile.name || "");
      setDescription(profile.profile.bio || "");
      setSkills(profile.profile.skills || "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => profilesApi.update({
      name, bio: description, skills,
    }),
    onSuccess: () => { toast.success("Профиль обновлён"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading) return <PageLoader />;

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="container-app py-10 max-w-4xl space-y-6">
      {!isComplete && !isLoading && (
        <div className="bg-warning/10 border border-warning/20 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
          <AlertCircle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm font-medium text-warning-foreground">
            Ваш профиль не заполнен. Пожалуйста, укажите имя, информацию о себе и навыки, чтобы иметь возможность откликаться на заказы и услуги.
          </p>
        </div>
      )}
      <div className="card-elevated p-8">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="h-20 w-20 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-glow">
            {(name || user?.email || "U")[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{name || user?.email}</h1>
            <div className="text-muted-foreground capitalize text-sm">{user?.role} • {user?.email}</div>
            {reviews.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="font-semibold">{avg.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({reviews.length} отзывов)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="card-soft p-8 space-y-5">
        <h2 className="text-xl font-semibold">Редактировать профиль</h2>
        <div className="space-y-2">
          <Label>Имя</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>О себе</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-28" placeholder="Расскажите о своём опыте..." />
        </div>
        <div className="space-y-2">
          <Label>Навыки (через запятую)</Label>
          <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Figma" />
        </div>
        <Button type="submit" disabled={save.isPending} className="rounded-full bg-gradient-primary shadow-glow">
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Сохранить
        </Button>
      </form>

      {reviews.length > 0 && (
        <div className="card-soft p-8">
          <h2 className="text-xl font-semibold mb-4">Отзывы</h2>
          <div className="space-y-4">
            {reviews.map((r) => (
              <ReviewItem key={r.id} review={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
