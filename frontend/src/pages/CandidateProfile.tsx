import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usersApi, reviewsApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/Common";
import { ArrowLeft, Star, User, Briefcase, Award, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Review } from "@/lib/types";
import { ReviewItem } from "@/components/ReviewItem";

const CandidateProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersApi.get(userId),
    enabled: !!userId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", userId],
    queryFn: () => reviewsApi.byUser(userId),
    enabled: !!userId,
  });


  if (isLoading) return <PageLoader />;
  if (error || !profile) return (
    <div className="container-app py-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Пользователь не найден</h2>
      <Button onClick={() => navigate(-1)} variant="outline" className="rounded-full">
        <ArrowLeft className="h-4 w-4 mr-2" /> Назад
      </Button>
    </div>
  );

  const details = profile?.profile;
  const name = details?.name || profile?.email?.split("@")[0] || "Пользователь";
  const skills = details?.skills ? details.skills.split(",").map(s => s.trim()) : [];
  const avgRating = (reviews && reviews.length > 0) ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="container-app py-10 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" /> Назад
      </Button>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="card-elevated p-6 text-center">
            <div className="h-24 w-24 rounded-3xl bg-gradient-primary text-primary-foreground flex items-center justify-center text-4xl font-bold shadow-glow mx-auto mb-4">
              {name[0]?.toUpperCase()}
            </div>
            <h1 className="text-xl font-bold mb-1">{name}</h1>
            <p className="text-sm text-muted-foreground mb-4 capitalize">{profile.role}</p>
            
            <div className="flex flex-col items-center gap-2 pt-4 border-t border-border/50">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-warning text-warning" />
                <span className="text-xl font-bold">{avgRating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{reviews.length} отзывов</p>
            </div>
          </div>

          <div className="card-soft p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> Навыки
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="rounded-md font-normal bg-secondary/80">
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Навыки не указаны</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Details & Reviews */}
        <div className="md:col-span-2 space-y-6">
          <div className="card-soft p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> О кандидате
            </h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {details?.bio || "Фрилансер пока не добавил описание о себе."}
            </p>
          </div>


          <div className="card-soft p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Отзывы клиентов
            </h3>
            
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((r) => (
                  <ReviewItem key={r.id} review={r} />
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground">У этого фрилансера пока нет отзывов</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
