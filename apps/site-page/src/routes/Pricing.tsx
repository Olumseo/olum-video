import { Card, CardBody, CardHeader } from "@olum-video/ui";

const PLANS = [
  {
    name: "Premium Video",
    tagline: "The video product on its own.",
    points: [
      "One video per day",
      "Two revisions per video",
      "Human editing on every video",
      "Publish to your connected channels",
    ],
    featured: false,
  },
  {
    name: "Ultimate",
    tagline: "Everything olum.ai does, plus video.",
    points: [
      "Everything in Premium Video",
      "Full olum.ai search-visibility suite",
      "One account, one login",
      "Priority support",
    ],
    featured: true,
  },
];

export default function Pricing() {
  return (
    <div>
      <h1 className="font-serif text-4xl">Pricing</h1>
      <p className="mt-3 max-w-prose text-muted">
        Already on olum.ai? Add video to your account — nothing you have today changes.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={plan.featured ? "border-accent/50" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm text-ink">{plan.name}</h2>
                {plan.featured && (
                  <span className="font-mono text-[11px] uppercase tracking-widest text-accent">
                    Most complete
                  </span>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-muted">{plan.tagline}</p>
              <ul className="mt-4 space-y-2">
                {plan.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm">
                    <span aria-hidden className="text-accent">
                      ·
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <a
                href="/video"
                className="mt-6 inline-block rounded bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-accent-2"
              >
                Get started
              </a>
            </CardBody>
          </Card>
        ))}
      </div>

      <p className="mt-8 max-w-prose text-xs text-muted">
        A revision is a change you ask for after seeing the cut. Fixes we make on our own — quality
        problems, mistakes on our side — never count against your two.
      </p>
    </div>
  );
}
