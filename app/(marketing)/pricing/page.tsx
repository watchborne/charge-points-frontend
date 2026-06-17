import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Starter",
    price: "29",
    description: "Perfect for small installations.",
    features: [
      "Up to 25 charge points",
      "Real-time supervision",
      "Offline detection",
      "Multi-site support",
      "Event history",
    ],
  },
  {
    name: "Professional",
    price: "99",
    highlighted: true,
    description: "For growing charging networks.",
    features: [
      "Up to 150 charge points",
      "Everything in Starter",
      "Alerting",
      "Historical analytics",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Large-scale deployments.",
    features: [
      "Unlimited charge points",
      "SSO",
      "Custom integrations",
      "Dedicated support",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="container mx-auto px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Badge>Pricing</Badge>

        <h1 className="mt-6 text-5xl font-bold">Simple pricing.</h1>

        <p className="mt-4 text-lg text-muted-foreground">
          Pay for the number of stations you supervise.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={plan.highlighted ? "border-primary shadow-lg" : ""}
          >
            <div className="p-8">
              {plan.highlighted && <Badge className="mb-4">Most Popular</Badge>}

              <h2 className="text-2xl font-bold">{plan.name}</h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>

              <div className="mt-8">
                {plan.price === "Custom" ? (
                  <span className="text-4xl font-bold">Custom</span>
                ) : (
                  <>
                    <span className="text-5xl font-bold">€{plan.price}</span>

                    <span className="text-muted-foreground">/month</span>
                  </>
                )}
              </div>

              <div className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="h-4 w-4" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className="mt-10 w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                Get Started
              </Button>
            </div>
          </div>
        ))}
      </div>

      <section className="mx-auto mt-24 max-w-4xl">
        <h2 className="mb-10 text-center text-3xl font-bold">
          Frequently Asked Questions
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="font-semibold">Is Watchborne a CSMS?</h3>

            <p className="mt-2 text-muted-foreground">
              No. Watchborne focuses on supervision and monitoring.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">
              Which OCPP versions are supported?
            </h3>

            <p className="mt-2 text-muted-foreground">
              OCPP 2.0.1 today. OCPP 1.6 is planned.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Can I remotely control chargers?</h3>

            <p className="mt-2 text-muted-foreground">
              Remote actions are planned in future releases.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
