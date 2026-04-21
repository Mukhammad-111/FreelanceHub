import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/lib/services";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

export const useProfileCompleteness = () => {
  const { data: profile, isLoading } = useQuery({ 
    queryKey: ["profile", "me"], 
    queryFn: profilesApi.me,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isComplete = !!(
    profile?.profile?.name?.trim() && 
    profile?.profile?.bio?.trim() && 
    profile?.profile?.skills?.trim()
  );

  return { isComplete, isLoading, profile };
};

interface ProfileRequirementGuardProps {
  children: React.ReactNode;
  message?: string;
}

export const ProfileRequirementGuard = ({ children, message }: ProfileRequirementGuardProps) => {
  const { isComplete, isLoading } = useProfileCompleteness();

  if (isLoading) return null;

  if (!isComplete) {
    return (
      <div className="card-soft p-8 border-warning/30 bg-warning/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-warning/20 text-warning flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Профиль не заполнен</h3>
              <p className="text-muted-foreground leading-relaxed">
                {message || "Пожалуйста, заполните ваше имя, информацию о себе и навыки, чтобы иметь возможность взаимодействовать с другими пользователями."}
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

  return <>{children}</>;
};
