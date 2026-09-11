import { Card, CardBody } from "@olum-video/ui";

const STEPS = [
  { n: "01", title: "Record once", body: "One consent session creates your digital twin — your face and your voice." },
  { n: "02", title: "Send a prompt", body: "Describe what you want to say. We write the script, or record yours as written." },
  { n: "03", title: "Review the cut", body: "We produce and edit it, then send it to you. Two revisions per video, included." },
  { n: "04", title: "Publish", body: "Approve, and it goes out to your channels." },
];

export default function Landing() {
  return (
    <div className="space-y-16">
      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">olum.video</p>
        <h1 className="mt-3 max-w-2xl font-serif text-5xl leading-[1.1]">
          Your digital twin, on camera, every day.
        </h1>
        <p className="mt-5 max-w-prose text-muted">
          Record yourself once. After that, send a prompt and get a finished, edited video back —
          reviewed by a human before it ever reaches you.
        </p>
        {/*
          A plain <a>, deliberately NOT a react-router <Link>.

          The client app is a SEPARATE application at /video — its own bundle,
          its own index.html. <Link> would try to navigate inside THIS app's
          route table, find nothing, and render this app's 404 page. A real
          anchor makes the browser fetch the other app.
        */}
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/video"
            className="rounded bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-accent-2"
          >
            Open the app
          </a>
          <a
            href="/video/welcome/pricing"
            className="rounded border border-subtle px-5 py-2.5 text-sm transition-colors hover:bg-cream"
          >
            See pricing
          </a>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {STEPS.map((step) => (
            <Card key={step.n}>
              <CardBody>
                <p className="font-mono text-xs text-accent">{step.n}</p>
                <p className="mt-2 text-sm text-ink">{step.title}</p>
                <p className="mt-1.5 text-sm text-muted">{step.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-subtle bg-cream px-6 py-8">
        <h2 className="font-serif text-2xl">A person checks every video</h2>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Nothing generated goes straight to you. Every video is reviewed and edited by our team
          first — so what lands in your inbox is something you'd actually publish.
        </p>
      </section>
    </div>
  );
}
