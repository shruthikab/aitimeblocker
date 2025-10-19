"use client";

import { useEffect, useMemo, useState } from "react";
import {
  defaultPreferences,
  exportScheduleToICS,
  fetchEvents,
  fetchScheduledBlocks,
  fetchTasks,
  generatePlan,
  savePreferences,
  saveScheduledBlocks,
  saveTasks,
} from "../../src/lib/api";
import { buildICSFromBlocks } from "../../src/lib/ics";
import { format } from "date-fns";

const STEP_META = [
  {
    title: "Upload your calendar",
    subtitle: "Bring in your existing commitments with a .ics file.",
  },
  {
    title: "Log assignments & exams",
    subtitle: "Capture upcoming deadlines so the AI can plan around them.",
  },
  {
    title: "Generate your AI schedule",
    subtitle: "Let AWS Bedrock stitch everything into a balanced plan.",
  },
];

function parseICS(text) {
  const events = [];
  const blocks = text.split(/BEGIN:VEVENT/).slice(1);
  const matchLine = (s, key) => {
    const re = new RegExp(key + ".*:(.+)");
    const m = s.match(re);
    return m ? m[1].trim() : null;
  };

  const toISO = (s) => {
    if (!s) return null;
    const cleaned = s.replace(/\r?\n/g, "");
    const m = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (m) {
      const [, y, mo, d, hh, mm, ss] = m;
      return new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss)).toISOString();
    }
    const parsed = new Date(cleaned);
    return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
  };

  for (const block of blocks) {
    const summary = matchLine(block, "SUMMARY") || "Untitled";
    const dtstart = matchLine(block, "DTSTART");
    const dtend = matchLine(block, "DTEND");
    events.push({
      id: `ics-${events.length}-${Date.now()}`,
      title: summary,
      start: toISO(dtstart),
      end: toISO(dtend),
    });
  }
  return events.filter((event) => event.start && event.end);
}

function createBlankTask() {
  return {
    id: `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: "",
    type: "assignment",
    duration: 60,
    deadline: null,
    deadlineInput: "",
    notes: "",
  };
}

function normalizeTask(task) {
  const deadlineIso = task?.deadline ?? null;
  let deadlineInput = typeof task?.deadlineInput === "string" ? task.deadlineInput : "";

  if (!deadlineInput && deadlineIso) {
    const parsed = new Date(deadlineIso);
    if (!Number.isNaN(parsed.valueOf())) {
      deadlineInput = format(parsed, "yyyy-MM-dd");
    }
  }

  return {
    ...task,
    deadline: deadlineIso,
    deadlineInput,
  };
}

function minutesToTimeStr(mins) {
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatTimeRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
}


export default function PlanPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [statusMessage, setStatusMessage] = useState("Load a calendar to begin.");

  const [icsFileName, setIcsFileName] = useState("");
  const [icsEvents, setIcsEvents] = useState([]);
  const [icsStatus, setIcsStatus] = useState("idle");
  const [isUploading, setIsUploading] = useState(false);

  const [existingEvents, setExistingEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [scheduledBlocks, setScheduledBlocks] = useState([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");
  const [generationError, setGenerationError] = useState("");

  // lightweight working-hours slider (minutes from midnight)
  const [workStartMin, setWorkStartMin] = useState(9 * 60);
  const [workEndMin, setWorkEndMin] = useState(17 * 60);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const [events, savedTasks, savedSchedule] = await Promise.all([
          fetchEvents(),
          fetchTasks(),
          fetchScheduledBlocks(),
        ]);

        if (events?.length) {
          const formatted = events.map((event) => ({
            id: event.uid || event.id,
            title: event.title || event.summary,
            start: event.start,
            end: event.end,
          }));
          setExistingEvents(formatted);
          setStatusMessage(`Imported ${formatted.length} calendar events`);
        }

        if (savedTasks?.length) {
          setTasks(savedTasks.map(normalizeTask));
        }

        if (savedSchedule?.length) {
          setScheduledBlocks(savedSchedule);
          setGenerationMessage(`Loaded ${savedSchedule.length} scheduled blocks from your last plan.`);
        }
      } catch (error) {
        console.error("Failed to load workspace", error);
        setStatusMessage("We couldn't load your previous data. Start fresh with a new upload.");
      }
    };

    loadWorkspace();
  }, []);

  useEffect(() => {
    if (!tasks.length) return;
    const handle = setTimeout(() => {
      saveTasks(tasks).catch((error) => console.error("Failed to save tasks", error));
    }, 400);
    return () => clearTimeout(handle);
  }, [tasks]);

  const groupedSchedule = useMemo(() => {
    if (!scheduledBlocks.length) return [];
    const groups = scheduledBlocks.reduce((acc, block) => {
      const dateKey = format(new Date(block.start), "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(block);
      return acc;
    }, {});

    return Object.entries(groups)
      .map(([dateKey, blocks]) => ({
        dateKey,
        label: format(new Date(blocks[0].start), "EEEE, MMM d"),
        blocks: blocks
          .slice()
          .sort((a, b) => new Date(a.start).valueOf() - new Date(b.start).valueOf()),
      }))
      .sort((a, b) => new Date(a.dateKey).valueOf() - new Date(b.dateKey).valueOf());
  }, [scheduledBlocks]);

  const handleFileSelection = async (file) => {
    if (!file) return;
    setIcsStatus("reading");
    try {
      const text = await file.text();
      const parsed = parseICS(text);
      if (!parsed.length) {
        setIcsStatus("error");
        alert("We couldn't detect events in that file. Try another .ics export.");
        return;
      }
      setIcsEvents(parsed);
      setIcsFileName(file.name);
      setIcsStatus("ready");
      setStatusMessage(`Ready to import ${parsed.length} events from ${file.name}`);
    } catch (error) {
      console.error("Failed to parse .ics", error);
      setIcsStatus("error");
      alert("We couldn't read that .ics file. Please export again and retry.");
    }
  };

  const uploadCalendar = async () => {
    if (!icsEvents.length) {
      alert("Load a .ics file first");
      return;
    }
    setIsUploading(true);
    setIcsStatus("uploading");
    try {
      const res = await fetch("/api/import-ics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: icsEvents }),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      const refreshedEvents = await fetchEvents();
      let totalImported = icsEvents.length;
      if (refreshedEvents?.length) {
        const formatted = refreshedEvents.map((event) => ({
            id: event.uid || event.id,
            title: event.title || event.summary,
            start: event.start,
            end: event.end,
        }));
        setExistingEvents(formatted);
        totalImported = formatted.length;
      }

      setIcsStatus("uploaded");
      setStatusMessage(`Calendar imported! ${totalImported} events ready.`);
    } catch (error) {
      console.error("Upload failed", error);
      setIcsStatus("error");
      alert(error.message || "Upload failed. Try again in a moment.");
    } finally {
      setIsUploading(false);
    }
  };

  const addTask = () => {
    setTasks((prev) => [...prev, createBlankTask()]);
  };

  const updateTask = (id, field, value) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, [field]: value } : task)));
  };

  const handleDeadlineChange = (id, value) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;

        const next = {
          ...task,
          deadlineInput: value,
        };

        if (!value) {
          next.deadline = null;
          return next;
        }

        if (value.length === 10) {
          const parsed = new Date(value);
          if (!Number.isNaN(parsed.valueOf())) {
            next.deadline = parsed.toISOString();
          }
        }

        return next;
      })
    );
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setGenerationError("");
    setGenerationMessage("Calling AWS Bedrock to craft your timeline...");

    try {
      const calendarEvents = existingEvents.length ? existingEvents : icsEvents;
      // Merge in working-hours from the lightweight slider so the plan generator
      // receives the user's preferred daily window.
      const prefs = {
        ...defaultPreferences(),
        workHoursStart: minutesToTimeStr(workStartMin),
        workHoursEnd: minutesToTimeStr(workEndMin),
      };

      // Persist preferences so backend read via /preferences matches slider
      try {
        await savePreferences({
          ...prefs,
        });
      } catch (err) {
        console.warn('Failed to persist preferences before generatePlan', err);
      }

      const response = await generatePlan(
        tasks,
        prefs,
        calendarEvents,
        new Date().toISOString(),
        new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
      );

      const scheduled = response?.scheduledBlocks || response?.blocks || [];
      if (!scheduled.length) {
        throw new Error(response?.error || "Bedrock returned an empty plan.");
      }

      const normalized = scheduled.map((block, index) => ({
        id: block.id || `scheduled-${index}-${Date.now()}`,
        title: block.title,
        start: block.start,
        end: block.end,
        sourceTaskId: block.sourceTaskId || null,
      }));

      setScheduledBlocks(normalized);
      setGenerationMessage(response?.message || `Scheduled ${normalized.length} focused blocks.`);
      await saveScheduledBlocks(normalized);
    } catch (error) {
      console.error("Plan generation failed", error);
      setGenerationError(error.message || "We couldn't generate a plan. Try again.");
      setGenerationMessage("");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadICS = async () => {
    try {
      let icsContent = null;

      try {
        icsContent = await exportScheduleToICS();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!scheduledBlocks.length || !message?.includes("No scheduled blocks")) {
          throw error;
        }
      }

      if (!icsContent && scheduledBlocks.length) {
        icsContent = buildICSFromBlocks(scheduledBlocks);
      }

      if (!icsContent) {
        throw new Error("No scheduled blocks to export yet. Generate a plan first.");
      }

      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "playblocks-schedule.ics";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nothing to export yet";
      alert(message);
    }
  };

  const canAdvanceFromStep = (step) => {
    if (step === 1) return existingEvents.length > 0 || icsEvents.length > 0;
    if (step === 2) return tasks.some((task) => task.title.trim().length > 0);
    return true;
  };

  return (
    <div className="relative min-h-screen pb-28 pt-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(248,180,216,0.35),_transparent_60%)]" />
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6">
        <header className="glass-panel border border-pink-200/60 p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-rose-400">PlayBlocks AI workflow</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Import your world. Bedrock handles the rest.
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Upload your calendar, list the major deadlines on your radar, then press one button to generate a balanced plan powered by AWS Bedrock.
              </p>
            </div>
            <div className="rounded-2xl border border-pink-200/60 bg-white/90 px-4 py-3 text-xs text-slate-600">
              {statusMessage}
            </div>
          </div>
          <div className="mt-6 grid gap-4 text-sm text-slate-500 md:grid-cols-3">
            {STEP_META.map((step, index) => {
              const isActive = currentStep === index + 1;
              return (
                <div
                  key={step.title}
                  className={`rounded-xl border px-4 py-3 transition ${
                    isActive ? "border-rose-300 bg-rose-200/50" : "border-pink-200/60 bg-white/80"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-rose-400">Step {index + 1}</p>
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-500">{step.subtitle}</p>
                </div>
              );
            })}
          </div>
        </header>

        <section className="glass-panel border border-pink-200/60 p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 text-slate-600">
                <h2 className="text-2xl font-semibold text-slate-900">Upload your .ics calendar</h2>
                <p>
                  Export your classes or existing schedule from Google, Apple, or Outlook Calendar. We'll pull it in so the AI never double-books you.
                </p>
              </div>

              <div className="rounded-2xl border border-pink-200/60 bg-white/80 p-6">
                <label
                  htmlFor="ics-file"
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-rose-200 bg-white/70 px-6 py-10 text-center transition hover:border-rose-300"
                >
                  <span className="text-sm font-semibold text-rose-400">Choose .ics file</span>
                  <span className="text-xs text-slate-500">Drag & drop or click to select</span>
                  <input
                    id="ics-file"
                    type="file"
                    accept=".ics"
                    className="hidden"
                    onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
                  />
                </label>
                {icsFileName && (
                  <p className="mt-3 text-sm text-slate-500">
                    Loaded <span className="font-medium text-slate-700">{icsFileName}</span> with {icsEvents.length} events.
                  </p>
                )}

                {icsEvents.length > 0 && (
                  <div className="mt-6 max-h-52 overflow-y-auto rounded-xl bg-white/60 p-4 text-sm">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-rose-400">
                      Preview ({icsEvents.length})
                    </p>
                    <ul className="space-y-2 text-slate-600">
                      {icsEvents.slice(0, 12).map((event) => (
                        <li key={event.id} className="rounded-lg border border-pink-200/60 bg-white/80 p-3">
                          <p className="font-medium text-slate-900">{event.title}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(event.start), "EEE, MMM d • h:mm a")} → {format(new Date(event.end), "h:mm a")}
                          </p>
                        </li>
                      ))}
                      {icsEvents.length > 12 && (
                        <li className="text-xs text-slate-400">…and {icsEvents.length - 12} more</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-rose-400">
                    Status: {icsStatus}
                  </div>
                  <button
                    onClick={uploadCalendar}
                    disabled={isUploading || !icsEvents.length}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-300 via-violet-200 to-sky-200 px-5 py-2 text-sm font-semibold text-violet-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploading ? "Uploading…" : "Add to workspace"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-pink-200/60 bg-white/70 p-4 text-xs text-slate-500">
                Tip: Need a sample file? Export any calendar view as .ics. We only read the time, title, and duration of each event.
              </div>

              {/* lightweight working hours slider (non-persistent) */}
              <div className="rounded-xl border border-pink-200/60 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Working hours (optional)</p>
                <p className="mt-1 text-xs text-slate-500">Use the sliders to set the daily window where you prefer scheduled blocks.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-rose-400">Start</label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={1439}
                        step={15}
                        value={workStartMin}
                        onChange={(e) => setWorkStartMin(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="w-24 text-right text-sm text-slate-600">{`${String(Math.floor(workStartMin/60)).padStart(2,'0')}:${String(workStartMin%60).padStart(2,'0')}`}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-rose-400">End</label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={1439}
                        step={15}
                        value={workEndMin}
                        onChange={(e) => setWorkEndMin(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="w-24 text-right text-sm text-slate-600">{`${String(Math.floor(workEndMin/60)).padStart(2,'0')}:${String(workEndMin%60).padStart(2,'0')}`}</div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">Note: This is a lightweight slider only—no Bedrock integration. It will influence client-side scheduling when generating a plan.</p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 text-slate-600">
                <h2 className="text-2xl font-semibold text-slate-900">List your assignments, exams, and milestones</h2>
                <p>
                  The more context you provide, the smarter the plan. Include due dates, estimate how long you want to spend, and add notes for Bedrock.
                </p>
              </div>

              <div className="space-y-4">
                {tasks.length === 0 && (
                  <div className="rounded-xl border border-pink-200/60 bg-white/70 p-5 text-sm text-slate-500">
                    No tasks yet. Click “Add an item” to log your first assignment or exam.
                  </div>
                )}

                {tasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-pink-200/60 bg-white/80 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wider text-rose-400">Title</label>
                          <input
                            type="text"
                            value={task.title}
                            onChange={(event) => updateTask(task.id, "title", event.target.value)}
                            className="mt-1 w-full rounded-lg border border-pink-200/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="Biology midterm, Design sprint, Project submission…"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-rose-400">Type</label>
                            <select
                              value={task.type}
                              onChange={(event) => updateTask(task.id, "type", event.target.value)}
                              className="mt-1 w-full rounded-lg border border-pink-200/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                            >
                              <option value="assignment">Assignment</option>
                              <option value="midterm">Midterm</option>
                              <option value="exam">Exam</option>
                              <option value="project">Project</option>
                              <option value="presentation">Presentation</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                              Effort (minutes)
                            </label>
                            <input
                              type="number"
                              min={15}
                              step={15}
                              value={task.duration}
                              onChange={(event) =>
                                updateTask(task.id, "duration", Number(event.target.value) || 0)
                              }
                              className="mt-1 w-full rounded-lg border border-pink-200/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                            />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                              Due date
                            </label>
                            <input
                              type="date"
                              value={task.deadlineInput || ""}
                              onChange={(event) => handleDeadlineChange(task.id, event.target.value)}
                              className="mt-1 w-full rounded-lg border border-pink-200/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-rose-400">Notes</label>
                            <input
                              type="text"
                              value={task.notes || ""}
                              onChange={(event) => updateTask(task.id, "notes", event.target.value)}
                              className="mt-1 w-full rounded-lg border border-pink-200/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                              placeholder="Include rubrics, focus areas, or reminders"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTask(task.id)}
                        className="self-start rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={addTask}
                  className="inline-flex items-center gap-2 rounded-full border border-pink-200/80 bg-white/70 px-5 py-2 text-sm font-semibold text-violet-900 transition hover:border-violet-200"
                >
                  + Add an item
                </button>
                <p className="text-xs uppercase tracking-[0.25em] text-rose-400">
                  {tasks.length} logged
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 text-slate-600">
                <h2 className="text-2xl font-semibold text-slate-900">Generate your AI schedule</h2>
                <p>
                  We bundle your calendar events and deadlines, then call an AWS Bedrock model to craft a plan that protects buffers and spreads the workload.
                </p>
              </div>

              <div className="rounded-2xl border border-pink-200/60 bg-white/80 p-6">
                <button
                  onClick={handleGeneratePlan}
                  disabled={isGenerating || tasks.length === 0}
                  className="w-full rounded-full bg-gradient-to-r from-rose-300 via-violet-200 to-sky-200 px-6 py-3 text-sm font-semibold text-violet-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating ? "Querying Bedrock…" : "Generate schedule with AWS Bedrock"}
                </button>
                {generationMessage && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    ✅ {generationMessage}
                  </div>
                )}
                {generationError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    ❌ {generationError}
                  </div>
                )}
              </div>

              {scheduledBlocks.length > 0 && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Scheduled Blocks</p>
                      <p className="text-xs text-slate-500">
                        Drag & drop editing coming soon—right now you can tweak duration or regenerate for a fresh plan.
                      </p>
                    </div>
                    <button
                      onClick={downloadICS}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      ⬇️ Download .ics
                    </button>
                  </div>

                  <div className="space-y-4">
                    {groupedSchedule.map((group) => (
                      <div key={group.dateKey} className="rounded-2xl border border-pink-200/60 bg-white/80 p-5">
                        <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                        <div className="mt-3 space-y-3">
                          {group.blocks.map((block) => (
                            <div key={block.id} className="rounded-xl border border-pink-200/60 bg-white/70 p-4">
                              <p className="font-medium text-slate-900">{block.title}</p>
                              <p className="text-xs text-slate-500">{formatTimeRange(block.start, block.end)}</p>
                              {block.sourceTaskId && (
                                <p className="mt-1 text-xs text-slate-400">Linked task: {block.sourceTaskId}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <nav className="flex flex-wrap items-center justify-between gap-4">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}
            className="inline-flex items-center gap-2 rounded-full border border-pink-200/80 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Back
          </button>
          <button
            disabled={currentStep === STEP_META.length || !canAdvanceFromStep(currentStep)}
            onClick={() => setCurrentStep((step) => Math.min(STEP_META.length, step + 1))}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-300 via-violet-200 to-sky-200 px-5 py-2 text-sm font-semibold text-violet-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next step →
          </button>
        </nav>
      </div>
    </div>
  );
}

