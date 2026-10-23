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
