"use client";

import type { User } from "@supabase/supabase-js";
import { Button, ColorPill, Skeleton, Switch } from "@watchborne/electrons";
import { ExternalLink, Moon, Palette, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useTheme } from "@/app/components/ThemeProvider";
import { SUPABASE_DASHBOARD_URL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const t = useTranslations("");
  const format = useFormatter();
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const formatDateTime = (value: string) =>
    format.dateTime(new Date(value), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const emailVerified = Boolean(user?.user_metadata?.email_verified);

  const rowClassName = "flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between";

  return (
    <div className="flex flex-col gap-6 content-stretch">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {t("appPage.profile.page.title")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {t("appPage.profile.page.subtitle")}
        </p>
      </div>

      <section className="rounded-lg border">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <Palette className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{t("appPage.profile.theme.title")}</span>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {theme === "dark" ? t("appPage.profile.theme.dark") : t("appPage.profile.theme.light")}
          </span>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label={t("appPage.profile.theme.title")}
          />
        </div>
      </section>

      <section className="rounded-lg border">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{t("appPage.profile.session.title")}</span>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : (
            <dl className="flex flex-col divide-y">
              <div className={rowClassName}>
                <dt className="text-sm text-muted-foreground">
                  {t("appPage.profile.session.userId")}
                </dt>
                <dd className="font-mono text-sm break-all sm:text-right">{user?.id ?? "—"}</dd>
              </div>
              <div className={rowClassName}>
                <dt className="text-sm text-muted-foreground">
                  {t("appPage.profile.session.email")}
                </dt>
                <dd className="text-sm break-all sm:text-right">{user?.email ?? "—"}</dd>
              </div>
              <div className={rowClassName}>
                <dt className="text-sm text-muted-foreground">
                  {t("appPage.profile.session.lastSignIn")}
                </dt>
                <dd className="text-sm sm:text-right">
                  {user?.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : "—"}
                </dd>
              </div>
              <div className={rowClassName}>
                <dt className="text-sm text-muted-foreground">
                  {t("appPage.profile.session.createdAt")}
                </dt>
                <dd className="text-sm sm:text-right">
                  {user?.created_at ? formatDateTime(user.created_at) : "—"}
                </dd>
              </div>
              <div className={rowClassName}>
                <dt className="text-sm text-muted-foreground">
                  {t("appPage.profile.session.emailVerified")}
                </dt>
                <dd className="sm:text-right">
                  <ColorPill color={emailVerified ? "green" : "orange"}>
                    {emailVerified
                      ? t("appPage.profile.session.verified")
                      : t("appPage.profile.session.notVerified")}
                  </ColorPill>
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      <section id="administration" className="rounded-lg border scroll-mt-4">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{t("appPage.profile.administration.title")}</span>
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t("appPage.profile.administration.description")}
          </p>
          <Button asChild variant="outline" className="gap-2 shrink-0">
            <a href={SUPABASE_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
              {t("appPage.profile.administration.button")}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
