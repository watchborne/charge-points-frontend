import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Locale-aware drop-ins for next/link and next/navigation: use them for every
// in-app navigation under app/[locale].
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
