import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="font-semibold">Watchborne</h3>

            <p className="mt-3 text-sm text-muted-foreground">
              Real-time supervision platform for EV charging infrastructure.
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-medium">Product</h4>

            <div className="space-y-2 text-sm">
              <Link
                href="/pricing"
                className="block text-muted-foreground hover:text-foreground"
              >
                Pricing
              </Link>

              <Link
                href="/contact"
                className="block text-muted-foreground hover:text-foreground"
              >
                Contact
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-medium">Company</h4>

            <div className="space-y-2 text-sm">
              <Link
                href="/privacy"
                className="block text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="block text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Watchborne.
        </div>
      </div>
    </footer>
  );
}
