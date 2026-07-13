import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Only rendered by `LoginPage` when `NODE_ENV !== "production"` (see
 * `app/login/page.tsx`). Posts straight to `/auth/dev-login`, which is
 * itself gated the same way plus behind `SUPABASE_SERVICE_ROLE_KEY` — this
 * component is a convenience shortcut, not the security boundary.
 */
export function DevLoginShortcut() {
  return (
    <div className="mt-6 rounded-lg border border-dashed p-4 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Dev only — signs in instantly, skips the magic-link email
      </p>
      <form action="/auth/dev-login" method="GET" className="flex gap-2">
        <Input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className="text-sm"
        />
        <Button type="submit" variant="outline" size="sm">
          Sign in
        </Button>
      </form>
    </div>
  );
}
