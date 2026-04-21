import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/lib/services";
import { PageLoader } from "@/components/Common";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { UserCheck, AlertCircle, ArrowRight } from "lucide-react";

interface ProfileGuardProps {
  children: React.ReactNode;
  message: string;
  variant?: "block" | "inline";
}

export const useProfileCompleteness = () => {
  const { data: profileData, isLoading } = useQuery({ 
    queryKey: ["profile", "me"], 
    queryFn: profilesApi.me,
  });

  const p = profileData?.profile;
  const isProfileComplete = !!(
    p?.name?.trim() && 
    p?.bio?.trim() && 
    p?.skills?.trim() &&
    p.name.length >= 2 &&
    p.bio.length >= 10
  );

  return { isProfileComplete, isLoading, profile: profileData };
};

export const ProfileGuard = ({ children, message, variant = "block" }: ProfileGuardProps) => {
  const navigate = useNavigate();
  const { isProfileComplete, isLoading } = useProfileCompleteness();

  if (isLoading) return null;

  if (!isProfileComplete) {
    if (variant === "inline") {
      return (
        <div className="card-soft p-8 border-warning/30 bg-warning/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-start gap-4 text-left">
            <div className="h-12 w-12 rounded-2xl bg-warning/20 text-warning flex items-center justify-center shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Профиль не заполнен</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {message}
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-full border-warning/50 hover:bg-warning/10 hover:text-warning transition-all">
                <Link to="/profile" className="flex items-center">
                  Заполнить профиль <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="container-app py-20 max-w-2xl text-center space-y-6">
        <div className="card-elevated p-10 space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="h-24 w-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-glow rotate-3">
            <UserCheck className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-bold">Профиль не завершён</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {message}
          </p>
          <Button 
            onClick={() => navigate("/profile")} 
            className="rounded-full bg-gradient-primary shadow-glow px-10 h-12 text-lg font-bold"
          >
            Перейти в профиль
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
