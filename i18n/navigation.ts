import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Locale-aware drop-ins for next/link and next/navigation — use these instead
// everywhere a page under app/[locale]/** links to or navigates another
// in-app route, so the active locale's prefix (or lack thereof, for the
// default locale) is added automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
