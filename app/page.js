import Link from "next/link";
import Image from "next/image";

const featureCards = [
  {
    title: "Drop in everything",
    description:
      "Paste your class schedules, deadlines, habits, and self-care routines in plain English. PlayBlocks parses and tags each item automatically.",
    icon: "📌",
  },
  {
    title: "Adaptive time blocks",
    description:
      "Our planner defends your buffers, threads in smart breaks, and automatically splits long study sessions so you avoid burnout.",
    icon: "🧠",
  },
  {
    title: "Calendar ready",
    description:
      "One click exports everything back to Google, Apple, or Outlook calendar so your day is always synchronized.",
    icon: "📆",
  },
];

const workflowSteps = [
  {
    title: "Import",
    body: "Upload your existing calendar (.ics) and paste your syllabus. We combine it with your routines and buffers.",
  },
  {
    title: "Tune",
    body: "Set focus hours, max hours per day, and recovery time. Strict or flexible mode—your choice.",
  },
  {
    title: "Plan",
    body: "Generate a smart schedule in seconds, drag-and-drop refinements, then export it back to your calendar.",
  },
];

const socialProof = [
  {
    quote:
      "I used to spend Sunday nights reorganizing my calendar. PlayBlocks gives me a balanced week in under two minutes.",
    name: "Anjali, CS + Design",
    role: "Student & TA, Carnegie Mellon",
  },
  {
    quote:
      "The auto-buffering between workouts, classes, and study blocks is *chef's kiss*. I finally stop over-booking myself.",
    name: "Marc, Dual major",
    role: "Pre-med & Music",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(248,180,216,0.4),_transparent_55%)]" />
      <section className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-20 sm:pt-28">
        <div className="grid-bg relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-pink-200/80 bg-white/80 px-4 py-1 text-xs uppercase tracking-[0.2em] text-rose-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              AI Time Blocking for Student Schedules
            </div>
            <h1 className="text-glow text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl md:text-6xl">
              Drop in your life. <span className="gradient-text">Get back a balanced week.</span>
            </h1>
            <p className="max-w-xl text-base text-slate-600 sm:text-lg">
              PlayBlocks weaves together your classes, workouts, showers, commutes, and deadlines. We protect your resets, add smart breaks, and auto-export polished blocks back to your calendar.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/plan"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-300 via-violet-200 to-sky-200 px-7 py-3 text-sm font-semibold text-violet-900 shadow-lg shadow-rose-200/70 transition hover:-translate-y-0.5"
              >
                Start planning now
                <span aria-hidden>→</span>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-pink-200/80 bg-white/70 px-7 py-3 text-sm font-medium text-slate-600 transition hover:border-violet-200 hover:text-violet-900"
              >
                Explore the workflow
              </a>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {featureCards.map((card) => (
                <div key={card.title} className="glass-panel p-4 text-sm">
                  <div className="mb-2 text-2xl" aria-hidden>
                    {card.icon}
                  </div>
                  <p className="mb-1 text-sm font-semibold text-slate-900">{card.title}</p>
                  <p className="text-slate-600">{card.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel relative overflow-hidden border border-pink-200/60 px-6 py-8 shadow-2xl">
            <div className="pointer-events-none absolute -top-20 -right-10 h-48 w-48 rounded-full bg-rose-200/60 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-sky-200/60 blur-3xl" />
            <div className="relative flex flex-col gap-6">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Today</span>
                <span>PlayBlocks Snapshot</span>
              </div>
              <div className="space-y-3 rounded-2xl border border-pink-200/60 bg-white/90 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">Deep Work — Algorithms</p>
                  <span className="rounded-full bg-emerald-200/70 px-3 py-1 text-xs text-emerald-700">Focus</span>
                </div>
                <p className="text-slate-600">2:00 PM – 3:30 PM · Includes breaks · Fits before CS210 Lab</p>
              </div>
              <div className="space-y-3 rounded-2xl border border-pink-200/60 bg-white/90 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">Commute + Reset</p>
                  <span className="rounded-full bg-sky-200/70 px-3 py-1 text-xs text-sky-700">Protected</span>
                </div>
                <p className="text-slate-600">Added buffer before evening gym. You’ll arrive energized, not rushed.</p>
              </div>
              <div className="rounded-2xl border border-pink-200/60 bg-white/90 p-4 text-sm">
                <p className="font-medium text-slate-900">Auto Export Ready</p>
                <p className="text-slate-600">Download .ics or push to Google Calendar in one tap.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-12 flex flex-col gap-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-400">Why PlayBlocks</p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            A planner that respects <span className="gradient-text">your energy, not just your time.</span>
          </h2>
          <p className="text-slate-600 sm:text-lg">
            Every block factors in recovery, buffers, and context switching so you can stay consistent without burning out.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {featureCards.map((card) => (
            <div key={card.title} className="glass-panel h-full p-6">
              <div className="mb-4 text-3xl" aria-hidden>
                {card.icon}
              </div>
              <p className="mb-2 text-lg font-semibold text-slate-900">{card.title}</p>
              <p className="text-sm text-slate-600">{card.description}</p>
            </div>
          ))}
          <div className="glass-panel relative flex h-full flex-col justify-between overflow-hidden p-6">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-500">
                Built-in guardrails
              </p>
              <h3 className="mb-3 text-2xl font-semibold text-slate-900">
                Breaks and buffers happen automatically.
              </h3>
              <p className="text-sm text-slate-600">
                Tell us how long you need to decompress after class or shower before lab. We’ll protect that time so your schedule feels kind, not punishing.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex h-6 items-center rounded-full bg-emerald-200/70 px-3 text-emerald-700">
                Burnout Guard
              </span>
              <span className="inline-flex h-6 items-center rounded-full bg-sky-200/70 px-3 text-sky-700">
                Adaptive breaks
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-10 lg:grid-cols-[0.55fr_1fr]">
          <div className="glass-panel p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-400">Workflow</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-900">Three smooth steps to reclaim your time.</h3>
            <p className="mt-4 text-sm text-slate-600">
              Import existing commitments, tune your preferences, then generate a schedule. Iterate as you go—drag and drop updates are saved instantly.
            </p>
            <Link
              href="/plan"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-pink-200/80 bg-white/70 px-5 py-2 text-sm font-semibold text-violet-900 transition hover:border-violet-200"
            >
              Open the Planner
              <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="space-y-6">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="glass-panel flex items-start gap-5 p-6">
                <div className="accent-ring inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 via-violet-200 to-sky-200 text-lg font-semibold text-violet-900">
                  {index + 1}
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{step.title}</p>
                  <p className="text-sm text-slate-600">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="glass-panel grid gap-10 p-10 md:grid-cols-[0.7fr_0.3fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-400">Testimonials</p>
            <h3 className="text-3xl font-semibold text-slate-900">Made for ambitious students who don’t want to sacrifice sleep.</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {socialProof.map((item) => (
                <div key={item.name} className="rounded-2xl border border-pink-200/60 bg-white/90 p-4 text-sm text-slate-600">
                  <p className="mb-4 text-slate-700">“{item.quote}”</p>
                  <p className="text-xs uppercase tracking-wide text-rose-400">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 text-sm text-slate-600">
            <div>
              <p className="text-4xl font-semibold text-slate-900">83%</p>
              <p className="text-xs uppercase tracking-[0.25em] text-rose-400">students feel more balanced after one week</p>
            </div>
            <div>
              <p className="text-4xl font-semibold text-slate-900">12 hrs</p>
              <p className="text-xs uppercase tracking-[0.25em] text-rose-400">planning time saved each month</p>
            </div>
            <div>
              <p className="text-4xl font-semibold text-slate-900">4.9/5</p>
              <p className="text-xs uppercase tracking-[0.25em] text-rose-400">avg satisfaction score across alpha cohort</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-32 text-center">
        <div className="glass-panel space-y-6 px-8 py-12">
          <h3 className="text-3xl font-semibold text-slate-900">Ready to reclaim your week?</h3>
          <p className="text-slate-600">
            Drop in your class times, habits, buffers, and upcoming tests. PlayBlocks auto-builds a daily plan with time blocks, smart breaks, and burnout guards—then exports it back to your calendar.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/plan"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-300 via-violet-200 to-sky-200 px-7 py-3 text-sm font-semibold text-violet-900 shadow-lg shadow-rose-200/70 transition hover:-translate-y-0.5"
            >
              Launch the Planner
              <span aria-hidden>→</span>
            </Link>
            <a
              href="mailto:hello@playblocks.ai"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-pink-200/80 bg-white/70 px-7 py-3 text-sm font-medium text-slate-600 transition hover:border-violet-200 hover:text-violet-900"
            >
              Join the beta cohort
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

