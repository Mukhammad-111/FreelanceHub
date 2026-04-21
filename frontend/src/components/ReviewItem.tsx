import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/services";
import { Star } from "lucide-react";
import { Review } from "@/lib/types";

export const ReviewItem = ({ review }: { review: Review }) => {
  // Пытаемся найти ID автора в разных полях (бэкенд может присылать по-разному)
  const rId = review.reviewer_id || (review as any).reviewer_user_id || (review as any).user_id || (review as any).sender_id || review.reviewer?.id;

  const { data: reviewerProfile } = useQuery({
    queryKey: ["user", rId],
    queryFn: () => usersApi.get(rId),
    enabled: !!rId,
    staleTime: 300000, // 5 min
  });

  const reviewerName = review.reviewer?.email || 
                       reviewerProfile?.email || 
                       reviewerProfile?.profile?.name || 
                       (rId ? `Пользователь #${rId}` : "Заказчик FreelanceHub");

  return (
    <div className="p-6 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-secondary/40 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            {reviewerName[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold">{reviewerName}</div>
            <div className="flex gap-0.5 mt-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star 
                  key={n} 
                  className={`h-3 w-3 ${n <= review.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} 
                />
              ))}
            </div>
          </div>
        </div>
        {review.created_at && (
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            {new Date(review.created_at).toLocaleDateString()}
          </span>
        )}
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed font-medium pl-1 italic">
        &ldquo;{review.comment}&rdquo;
      </p>
    </div>
  );
};
