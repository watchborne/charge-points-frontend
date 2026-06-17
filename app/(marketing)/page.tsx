import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Building2,
  PlugZap,
  ShieldCheck,
  Clock3,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Activity,
    title: "Real-time supervision",
    description:
      "Monitor charger status instantly with live updates and clear operational visibility.",
  },
  {
    icon: Building2,
    title: "Multi-site monitoring",
    description:
      "Organize charging stations across multiple customers and locations.",
  },
  {
    icon: PlugZap,
    title: "OCPP-native",
    description:
      "Built around OCPP workflows and charging infrastructure operations.",
  },
  {
    icon: Clock3,
    title: "Offline detection",
    description:
      "Quickly identify disconnected stations before your customers do.",
  },
  {
    icon: MapPin,
    title: "Fleet overview",
    description: "Get a single view of every station deployed in the field.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable monitoring",
    description:
      "Designed for installers who need trustworthy operational visibility.",
  },
];

const roadmap = [
  "Alerting",
  "Historical analytics",
  "Role-based access control",
  "Site health overview",
];

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* HERO */}
      <section className="container mx-auto px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-6">
              OCPP 2.0.1 Monitoring Platform
            </Badge>

            <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Know the real status of your EV charge points.
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Watchborne helps EV charging installers monitor charging stations
              across multiple sites in real time.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Book a Demo</Link>
              </Button>
            </div>
          </div>

          {/* DASHBOARD PREVIEW */}
          <div className="mt-20">
            <div className="border shadow-2xl">
              <div className="p-0">
                <div className="grid md:grid-cols-3">
                  {/* Sidebar */}
                  <div className="border-r bg-muted/30 p-6">
                    <div className="text-sm font-medium text-muted-foreground">
                      Sites
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="rounded-lg border bg-background p-4">
                        <div className="font-medium">Paris HQ</div>
                        <div className="mt-2 text-sm text-green-600">
                          14 Online
                        </div>
                      </div>

                      <div className="rounded-lg border bg-background p-4">
                        <div className="font-medium">Lyon</div>
                        <div className="mt-2 text-sm text-orange-500">
                          1 Offline
                        </div>
                      </div>

                      <div className="rounded-lg border bg-background p-4">
                        <div className="font-medium">Marseille</div>
                        <div className="mt-2 text-sm text-green-600">
                          8 Online
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="col-span-2 p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Fleet Overview</h3>

                      <Badge>Live</Badge>
                    </div>

                    <div className="space-y-4">
                      {[
                        {
                          id: "CP-001",
                          status: "Available",
                          color: "bg-green-500",
                        },
                        {
                          id: "CP-002",
                          status: "Charging",
                          color: "bg-blue-500",
                        },
                        {
                          id: "CP-003",
                          status: "Faulted",
                          color: "bg-red-500",
                        },
                        {
                          id: "CP-004",
                          status: "Offline",
                          color: "bg-orange-500",
                        },
                      ].map((cp) => (
                        <div
                          key={cp.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div className="font-medium">{cp.id}</div>

                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${cp.color}`}
                            />
                            <span className="text-sm">{cp.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr />

      {/* FEATURES */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Built for EV charging installers
          </h2>

          <p className="mt-4 text-muted-foreground">
            Focus on operating your infrastructure, not chasing charger status.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div key={feature.title}>
                <div className="p-6">
                  <Icon className="mb-4 h-6 w-6" />

                  <h3 className="mb-2 font-semibold">{feature.title}</h3>

                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <hr />

      {/* MVP FEATURES */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold">Included today</h2>

          <p className="mt-4 text-muted-foreground">
            Everything required to supervise a fleet of charging stations.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
          {[
            "Charge Point Management",
            "Connection State Tracking",
            "Real-Time Dashboard",
            "Event History",
            "Offline Detection",
            "Multi-Site Organization",
          ].map((item) => (
            <div key={item}>
              <div className="flex items-center gap-3 p-5">
                <ShieldCheck className="h-5 w-5" />
                <span>{item}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr />

      {/* ROADMAP */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border bg-muted/30 p-10">
          <Badge className="mb-4">Roadmap</Badge>

          <h2 className="text-3xl font-bold">What’s coming next</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {roadmap.map((item) => (
              <div key={item} className="rounded-xl border bg-background p-4">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 pb-24">
        <div className="rounded-3xl border bg-primary px-8 py-16 text-primary-foreground">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold">Stop guessing.</h2>

            <p className="mt-4 text-lg opacity-90">
              Know the status of every charger in real time.
            </p>

            <Button size="lg" variant="secondary" className="mt-8">
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
