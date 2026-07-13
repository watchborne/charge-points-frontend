import { Battery } from "lucide-react";

import { Card } from "@/components/ui/card";

export const EmptyStateChargePoints = () => {
  return (
    <Card className="p-12 text-center">
      <Battery className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
      <p className="text-muted-foreground font-medium">No detected charge points</p>
      <p className="text-sm text-muted-foreground mt-2">
        Charge points will appear here once connected to the OCPP server
      </p>
    </Card>
  );
};
