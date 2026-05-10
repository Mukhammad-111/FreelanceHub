import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { UserCheck, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileGuardProps {
  children: React.ReactNode;
  message: string;
  variant?: "block" | "inline";
}

export const useProfileCompleteness = () => {
  const { user } = useAuth();
  const { data: profileData, isLoading } = useQuery({ 
    queryKey: ["profile", "me"], 
    queryFn: profilesApi.me,
    enabled: !!user,
  });

  const p = profileData?.profile;
  const isNameComplete = !!(p?.name?.trim() && p.name.trim().length >= 2);
  const isBioComplete = !!(p?.bio?.trim() && p.bio.trim().length >= 10);
  const isSkillsComplete = !!(p?.skills?.trim() && p.skills.trim().length > 0);

  // Requirements:
  // Freelancer: Name(2), Bio(10), Skills
  // Client: Name(2), Bio(10), (Skills optional)
  const isProfileComplete = user?.role === 'client' 
    ? (isNameComplete && isBioComplete)
    : (isNameComplete && isBioComplete && isSkillsComplete);

  return { isProfileComplete, isLoading, profile: profileData, isNameComplete, isBioComplete, isSkillsComplete };
};

export const ProfileGuard = ({ children, message, variant = "block" }: ProfileGuardProps) => {
  const navigate = useNavigate();
  const { isProfileComplete, isLoading } = useProfileCompleteness();

  if (isLoading) return null;

  if (!isProfileComplete) {
    if (variant === "inline") {
      return (
        <div className="card-soft p-5 sm:p-8 border-warning/30 bg-warning/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col sm:flex-row items-start gap-4 text-left">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-warning/20 text-warning flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="space-y-4 w-full">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Профиль не заполнен</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {message}
                </p>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto rounded-full border-warning/50 hover:bg-warning/10 hover:text-warning transition-all">
                <Link to="/profile" className="flex items-center justify-center">
                  Заполнить профиль <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="container-app py-10 sm:py-20 max-w-2xl text-center space-y-6 px-4">
        <div className="card-elevated p-6 sm:p-10 space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="h-20 w-20 sm:h-24 sm:w-24 bg-primary/10 text-primary rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-glow rotate-3">
            <UserCheck className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Профиль не завершён</h2>
          <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed">
            {message}
          </p>
          <Button 
            onClick={() => navigate("/profile")} 
            className="w-full sm:w-auto rounded-full bg-gradient-primary shadow-glow px-10 h-12 text-base sm:text-lg font-bold"
          >
            Перейти в профиль
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
