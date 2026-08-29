import { Button } from "@watchborne/electrons";
import classNames from "classnames";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export const LogoutButton = ({ className }: { className?: string }) => {
  const t = useTranslations("");
  const router = useRouter();

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
    router.push("/");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={classNames(className, "gap-2")}
    >
      <LogOut className="h-4 w-4" />
      {t("layout.navbar.actions.logout")}
    </Button>
  );
};
