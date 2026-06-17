import { Mail, Building2, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  return (
    <main className="container mx-auto px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-5xl font-bold">Let us talk.</h1>

        <p className="mt-4 text-lg text-muted-foreground">
          Need help supervising your charging infrastructure?
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-6 p-8">
            <Input placeholder="Company" />

            <Input placeholder="Name" />

            <Input type="email" placeholder="Email" />

            <Input placeholder="Phone" />

            <Input placeholder="Number of charge points" />

            <Input placeholder="Tell us about your infrastructure..." />

            <Button className="w-full">Send Message</Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex gap-4 p-6">
              <Mail className="h-5 w-5" />

              <div>
                <h3 className="font-semibold">Email</h3>

                <p className="text-sm text-muted-foreground">
                  contact@watchborne.com
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex gap-4 p-6">
              <Building2 className="h-5 w-5" />

              <div>
                <h3 className="font-semibold">Demo</h3>

                <p className="text-sm text-muted-foreground">
                  Schedule a personalized demonstration.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex gap-4 p-6">
              <Phone className="h-5 w-5" />

              <div>
                <h3 className="font-semibold">Support</h3>

                <p className="text-sm text-muted-foreground">
                  Response within one business day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
