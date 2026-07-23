import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export const LogoutButton = () => {
  const t = useTranslations("");

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    // Full-page navigation, not a client-side router push: the marketing Navbar
    // resolves the signed-in user once on mount, so a soft navigation would
    // leave it showing the stale "Go to dashboard" link and keep this button
    // stuck disabled. A hard reload remounts everything against the now-cleared
    // session.
    window.location.assign("/");
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
