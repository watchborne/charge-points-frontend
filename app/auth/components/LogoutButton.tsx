import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export const LogoutButton = () => {
  const t = useTranslations("");

  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.replace("/");
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      {t("layout.navbar.actions.logout")}
    </Button>
  );
};
