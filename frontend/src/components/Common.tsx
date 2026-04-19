import { Loader2 } from "lucide-react";

export const PageLoader = () => (
  <div className="flex justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export const EmptyState = ({ title, description }: { title: string; description?: string }) => (
  <div className="text-center py-16 card-soft">
    <div className="text-lg font-semibold">{title}</div>
    {description && <div className="text-sm text-muted-foreground mt-2">{description}</div>}
  </div>
);
