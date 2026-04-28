import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { responsesApi } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";
import { ResponseStatusBadge } from "@/components/StatusBadges";
import { PageLoader, EmptyState } from "@/components/Common";

const MyResponses = () => {
  const { user } = useAuth();
  const { data: allResponses = [], isLoading } = useQuery({ queryKey: ["responses"], queryFn: responsesApi.list });
  const mine = allResponses.filter((r) => {
    const fid = r.freelancer_id || r.freelancer?.id;
    return fid && user?.id && String(fid) === String(user.id);
  });

  return (
    <div className="container-app py-10">
      <h1 className="text-3xl font-bold mb-8">Мои отклики</h1>
      {isLoading ? <PageLoader /> : mine.length === 0 ? (
        <EmptyState title="Откликов пока нет" description="Найдите интересный заказ и откликнитесь" />
      ) : (
        <div className="space-y-3">
          {mine.map((r) => (
            <Link to={`/orders/${r.order_id}`} key={r.id} className="card-soft p-5 flex justify-between items-center hover:shadow-card transition">
              <div>
                <div className="font-medium">Заказ #{r.order_id}</div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{r.message}</p>
              </div>
              <ResponseStatusBadge status={r.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyResponses;
