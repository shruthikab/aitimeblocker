"use client";
import { useEffect, useState } from "react";
import {
  parseTasks,
  generatePlan,
  fetchEvents,
  fetchTasks,
  saveTasks,
  fetchRecurringBlocks,
  saveRecurringBlocks,
  fetchScheduledBlocks,
  saveScheduledBlocks,
  exportScheduleToICS,
  fetchPreferences,
  savePreferences,
} from "@/lib/api";
import { buildICSFromBlocks } from "@/lib/ics";

function parseICS(text) {
  const events = [];
  const blocks = text.split(/BEGIN:VEVENT/).slice(1);
  const matchLine = (s, key) => {
    const re = new RegExp(key + '.*:(.+)');
    const m = s.match(re);
    return m ? m[1].trim() : null;
  };

  const toISO = (s) => {
    if (!s) return null;
    const cleaned = s.replace(/\r?\n/g, '');
    // Basic YYYYMMDDTHHMMSSZ -> ISO
    const m = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (m) {
      const [, y, mo, d, hh, mm, ss] = m;
      return new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss)).toISOString();
    }
    const parsed = new Date(cleaned);
    return isNaN(parsed) ? null : parsed.toISOString();
  };

  for (const b of blocks) {
    const summary = matchLine(b, 'SUMMARY') || 'Untitled';
    const dtstart = matchLine(b, 'DTSTART');
    const dtend = matchLine(b, 'DTEND');
    events.push({ title: summary, start: toISO(dtstart), end: toISO(dtend), raw: b.slice(0,200) });
  }
  return events;
}

const dayNamesFull = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function ImportStep() {
  // Temporary dev marker to confirm this component is loaded in the browser
  useEffect(() => {
    console.log('DEV: rendering components/ImportStep.jsx');
  }, []);
  const [fileName, setFileName] = useState(null);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('idle');
  
  // New state for syllabus parsing
  const [syllabusText, setSyllabusText] = useState('');
  const [parsedTasks, setParsedTasks] = useState([]);
  const [parseStatus, setParseStatus] = useState('idle');
  
  // State for auto-scheduling
  const [scheduledBlocks, setScheduledBlocks] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState('idle');
  const [scheduleMessage, setScheduleMessage] = useState('');

  // Recurring blocks (classes, habits, buffers)
  const [recurringBlocks, setRecurringBlocks] = useState([]);
  const [recurringStatus, setRecurringStatus] = useState('idle');

  // Working hours preferences (stored as minutes from 00:00)
  const [enforceWorkingHours, setEnforceWorkingHours] = useState(false);
  const [workHoursStartMin, setWorkHoursStartMin] = useState(19 * 60);
  const [workHoursEndMin, setWorkHoursEndMin] = useState(21 * 60);
  const [breakMinutes, setBreakMinutes] = useState(15);
  const [prefsStatus, setPrefsStatus] = useState('idle');

  // load persisted data on mount
  useEffect(() => {
    (async () => {
      const [blocks, tasks, schedule] = await Promise.all([
        fetchRecurringBlocks(),
        fetchTasks(),
        fetchScheduledBlocks(),
      ]);
      if (blocks?.length) {
        setRecurringBlocks(blocks);
      }
      if (tasks?.length) {
        setParsedTasks(tasks);
      }
      if (schedule?.length) {
        setScheduledBlocks(schedule);
        setScheduleStatus('done');
        setScheduleMessage('Loaded your last saved plan ✅');
      }
      try {
        const prefs = await fetchPreferences();
        if (prefs) {
          if (prefs.workHoursStart) {
            const mins = timeStrToMinutes(prefs.workHoursStart);
            if (!isNaN(mins)) setWorkHoursStartMin(mins);
          }
          if (prefs.workHoursEnd) {
            const mins = timeStrToMinutes(prefs.workHoursEnd);
            if (!isNaN(mins)) setWorkHoursEndMin(mins);
          }
          if (typeof prefs.enforceWorkingHours !== 'undefined') setEnforceWorkingHours(!!prefs.enforceWorkingHours);
          if (typeof prefs.breakMinutes !== 'undefined') setBreakMinutes(Number(prefs.breakMinutes) || 15);
        }
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  function timeStrToMinutes(t) {
    if (!t || typeof t !== 'string') return NaN;
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return NaN;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    return hh * 60 + mm;
  }

  function minutesToTimeStr(mins) {
    const clamped = Math.max(0, Math.min(24 * 60, Number(mins) || 0));
    const hh = Math.floor(clamped / 60);
    const mm = clamped % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  function getBreakSuggestion(minutes) {
    if (minutes <= 5) return 'Quick stretch or deep breath';
    if (minutes <= 15) return 'Stand up, walk around, hydrate';
    if (minutes <= 30) return 'Short walk or quick review of flashcards';
    return 'Longer rest: light exercise, snack, or power nap';
  }

  const onFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseICS(text);
    setEvents(parsed);
  };

  const upload = async () => {
    setStatus('uploading');
    try {
      const res = await fetch('/api/import-ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      // Read body as text once, then try to parse JSON. This avoids "body stream already read" errors.
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error('Upload: server returned non-JSON response:', {
          status: res.status,
          statusText: res.statusText,
          bodyPreview: text && text.slice(0, 200),
        });
        throw new Error(`Server returned non-JSON response (status ${res.status}). Check console for details.`);
      }

      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      setStatus('done');
    } catch (err) {
      console.error(err);
      // Show a friendly alert so the user knows to check console / network tab
      alert(err.message || 'Upload failed — check the browser console or server logs for details.');
      setStatus('error');
    }
  };
  
  const persistTasks = async (tasksToSave) => {
    try {
      await saveTasks(tasksToSave);
    } catch (error) {
      console.error('Failed to persist tasks', error);
    }
  };

  const handleParseSyllabus = async () => {
    if (!syllabusText.trim()) {
      alert('Please enter syllabus text');
      return;
    }
    
    setParseStatus('parsing');
    try {
      const result = await parseTasks(syllabusText);
      const tasks = (result.tasks || []).map((task, index) => ({
        id: task.id || `task-${Date.now()}-${index}`,
        title: task.title || `Task ${index + 1}`,
        duration: task.duration || 60,
        deadline: task.deadline || null,
        priority: task.priority || 'medium',
        description: task.description || '',
      }));
      setParsedTasks(tasks);
      setParseStatus('done');
      await persistTasks(tasks);
    } catch (err) {
      console.error('Parse error:', err);
      setParseStatus('error');
      alert(err.message || 'Failed to parse tasks');
    }
  };
  
  const handleParseAndSchedule = async () => {
    if (!syllabusText.trim()) {
      alert('Please enter syllabus text with upcoming tests, quizzes, and assignments');
      return;
    }
    
    setParseStatus('parsing');
    setScheduleStatus('idle');
    setScheduledBlocks([]);
    
    try {
      // Step 1: Parse tasks with AI
      const parseResult = await parseTasks(syllabusText);
      const tasks = (parseResult.tasks || []).map((task, index) => ({
        id: task.id || `task-${Date.now()}-${index}`,
        title: task.title || `Task ${index + 1}`,
        duration: task.duration || 60,
        deadline: task.deadline || null,
        priority: task.priority || 'medium',
        description: task.description || '',
      }));
      setParsedTasks(tasks);
      setParseStatus('done');
      await persistTasks(tasks);
      
      if (tasks.length === 0) {
        alert('No tasks found in the text. Try including deadlines like "Assignment 1 due Oct 25" or "Midterm exam on Nov 5"');
        return;
      }
      
      // Step 2: Auto-schedule the tasks
      setScheduleStatus('scheduling');
      
      // Fetch existing events to avoid conflicts
      const existingEvents = await fetchEvents();
      
      // Generate plan with preferences (use slider minutes -> HH:MM)
      const preferences = {
        mode: 'flexi',
        // Always send slider-derived hours to the backend (integrate slider with AI)
        workHoursStart: minutesToTimeStr(workHoursStartMin),
        workHoursEnd: minutesToTimeStr(workHoursEndMin),
        enforceWorkingHours: !!enforceWorkingHours,
        maxHoursPerDay: 8,
        breakMinutes: 15,
        preferredDays: [1, 2, 3, 4, 5], // Mon-Fri
      };

      // Debugging aid: show the prefs and parsed tasks being sent to the generator
      console.log('Auto-schedule: sending generatePlan with preferences', preferences, { tasksCount: tasks.length });
      
      // Set date range (today to 60 days from now)
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      
      const planResult = await generatePlan(tasks, preferences, existingEvents, startDate, endDate);

      const blocks = (planResult.scheduledBlocks || []).map((block, index) => ({
        ...block,
        id: block.id || `scheduled-${Date.now()}-${index}`,
      }));
      setScheduledBlocks(blocks);
      setScheduleStatus('done');
      setScheduleMessage(planResult?.message || `Scheduled ${blocks.length} blocks`);
      await saveScheduledBlocks(blocks);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('scheduled-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (err) {
      console.error('Auto-schedule error:', err);
      setParseStatus('error');
      setScheduleStatus('error');
      alert(err.message || 'Failed to parse and schedule tasks');
    }
  };

  const addRecurringBlock = () => {
    setRecurringBlocks((prev) => [
      ...prev,
      {
        id: `habit-${Date.now()}`,
        title: 'New routine',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        bufferBefore: 0,
        bufferAfter: 0,
      },
    ]);
  };

  const updateRecurringBlock = (id, field, value) => {
    setRecurringBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, [field]: value } : block))
    );
  };

  const removeRecurringBlock = (id) => {
    setRecurringBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const persistRecurring = async () => {
    setRecurringStatus('saving');
    try {
      await saveRecurringBlocks(recurringBlocks);
      setRecurringStatus('saved');
      setTimeout(() => setRecurringStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save recurring blocks', error);
      setRecurringStatus('error');
      setTimeout(() => setRecurringStatus('idle'), 4000);
    }
  };

  const downloadICS = async () => {
    try {
  let icsContent = null;

      try {
        icsContent = await exportScheduleToICS();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!scheduledBlocks.length || !message.includes('No scheduled blocks')) {
          throw error;
        }
      }

      if (!icsContent && scheduledBlocks.length) {
        icsContent = buildICSFromBlocks(scheduledBlocks);
      }

      if (!icsContent) {
        throw new Error('No scheduled blocks to export yet. Generate a plan first.');
      }

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'playblocks-schedule.ics';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nothing to export yet';
      alert(message);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl">
      {/* ICS Import Section */}
      <section className="w-full p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Import Calendar (.ics)</h3>
        <input
          aria-label="Upload ICS file"
          type="file"
          accept=".ics"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="mb-2"
        />
        {fileName && <p className="text-sm text-gray-600">Loaded: {fileName}</p>}

        <div className="mt-3 space-y-2">
          <h4 className="font-medium">Preview ({events.length} events)</h4>
          {events.length === 0 && <p className="text-sm text-gray-500">No events parsed yet.</p>}
          <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
            {events.map((ev, i) => (
              <li key={i} className="text-sm">
                <strong>{ev.title}</strong>
                {ev.start && <span> — {new Date(ev.start).toLocaleString()}</span>}
                {ev.end && <span> to {new Date(ev.end).toLocaleString()}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="px-3 py-1 border rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
            onClick={upload}
            disabled={events.length === 0 || status === 'uploading'}
          >
            Upload to backend
          </button>
          <button
            className="px-3 py-1 border rounded hover:bg-gray-50"
            onClick={() => {
              const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${fileName || 'events'}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download JSON
          </button>
          <div className="ml-auto text-sm text-gray-600">Status: {status}</div>
        </div>
      </section>

      {/* Recurring Routines & Buffers */}
      <section className="w-full p-4 border rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">🧱 Weekly Building Blocks</h3>
            <p className="text-sm text-gray-600">
              Add classes, habits, workouts, commutes, or buffer blocks. We keep them in your calendar and avoid scheduling over them.
            </p>
          </div>
          <button
            onClick={addRecurringBlock}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Add block
          </button>
        </div>

        {recurringBlocks.length === 0 && (
          <p className="text-sm text-gray-500 mb-4">
            No routines yet. Add one to block time for recurring commitments.
          </p>
        )}

        <div className="space-y-4">
          {recurringBlocks.map((block) => (
            <div key={block.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) => updateRecurringBlock(block.id, 'title', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Day</label>
                  <select
                    value={block.dayOfWeek}
                    onChange={(e) => updateRecurringBlock(block.id, 'dayOfWeek', Number(e.target.value))}
                    className="px-3 py-2 border rounded"
                  >
                    {dayNamesFull.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Start</label>
                  <input
                    type="time"
                    value={block.startTime}
                    onChange={(e) => updateRecurringBlock(block.id, 'startTime', e.target.value)}
                    className="px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">End</label>
                  <input
                    type="time"
                    value={block.endTime}
                    onChange={(e) => updateRecurringBlock(block.id, 'endTime', e.target.value)}
                    className="px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Buffer ⏱️ (min)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={block.bufferBefore || 0}
                      onChange={(e) => updateRecurringBlock(block.id, 'bufferBefore', Number(e.target.value))}
                      className="w-20 px-3 py-2 border rounded"
                      placeholder="Before"
                    />
                    <input
                      type="number"
                      min="0"
                      value={block.bufferAfter || 0}
                      onChange={(e) => updateRecurringBlock(block.id, 'bufferAfter', Number(e.target.value))}
                      className="w-20 px-3 py-2 border rounded"
                      placeholder="After"
                    />
                  </div>
                </div>

                <button
                  onClick={() => removeRecurringBlock(block.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={persistRecurring}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={recurringStatus === 'saving'}
          >
            Save weekly blocks
          </button>
          <span className="text-sm text-gray-600">
            Status: {recurringStatus === 'idle' ? 'idle' : recurringStatus}
          </span>
        </div>
      </section>

      {/* Syllabus Parsing Section */}
      <section className="w-full p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-2">📚 Smart Scheduler: Paste Your Syllabus</h3>
        <p className="text-sm text-gray-600 mb-3">
          🎯 Paste your upcoming tests, quizzes, assignments, and deadlines below. 
          AI will automatically extract tasks AND timeblock them in your schedule!
        </p>
      
        <div className="mb-4 p-3 border rounded bg-gray-50">
          <h4 className="font-medium mb-2">Working time preferences</h4>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={enforceWorkingHours} onChange={(e) => setEnforceWorkingHours(e.target.checked)} />
              Enforce working hours
            </label>
            <div className="flex items-center gap-3">
              <div className="text-sm">{minutesToTimeStr(workHoursStartMin)}</div>
              <input
                aria-label="Start hour"
                type="range"
                min="0"
                max="1439"
                value={workHoursStartMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  // enforce at least 30 minutes gap
                  if (v >= workHoursEndMin - 30) {
                    setWorkHoursStartMin(Math.max(0, workHoursEndMin - 30));
                  } else {
                    setWorkHoursStartMin(v);
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                aria-label="End hour"
                type="range"
                min="0"
                max="1439"
                value={workHoursEndMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v <= workHoursStartMin + 30) {
                    setWorkHoursEndMin(Math.min(1439, workHoursStartMin + 30));
                  } else {
                    setWorkHoursEndMin(v);
                  }
                }}
              />
              <div className="text-sm">{minutesToTimeStr(workHoursEndMin)}</div>
            </div>
            <div className="ml-auto">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                onClick={async () => {
                  setPrefsStatus('saving');
                  try {
                    await savePreferences({
                      enforceWorkingHours,
                      workHoursStart: minutesToTimeStr(workHoursStartMin),
                      workHoursEnd: minutesToTimeStr(workHoursEndMin),
                      breakMinutes,
                    });
                    setPrefsStatus('saved');
                    setTimeout(() => setPrefsStatus('idle'), 1500);
                  } catch (err) {
                    console.error('Failed to save prefs', err);
                    setPrefsStatus('error');
                    setTimeout(() => setPrefsStatus('idle'), 2000);
                  }
                }}
              >
                {prefsStatus === 'saving' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm">Suggested break (minutes)</label>
            <input
              type="number"
              min={5}
              max={60}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value) || 15)}
              className="w-24 px-2 py-1 border rounded"
            />
          </div>
          {prefsStatus === 'saved' && <p className="text-xs text-green-600 mt-2">Preferences saved.</p>}
          {prefsStatus === 'error' && <p className="text-xs text-red-600 mt-2">Failed to save preferences.</p>}
        </div>
        
        <textarea
          value={syllabusText}
          onChange={(e) => setSyllabusText(e.target.value)}
          placeholder="Paste your syllabus, assignments, and deadlines here...&#10;&#10;Example:&#10;CS101 - Fall 2025&#10;&#10;Assignment 1: Build calculator app (due Oct 25, 3 hours)&#10;Midterm Exam: Chapters 1-5 (Oct 30) - study for 6 hours&#10;Quiz 1: Variables & Loops (Oct 28)&#10;Final Project: Web app with database (due Nov 15, 10 hours)&#10;Reading: Chapter 6-8 (due Nov 1, 2 hours)"
          className="w-full h-48 p-3 border rounded-md resize-none font-mono text-sm"
          aria-label="Syllabus text input"
        />
        
        <div className="mt-4 flex gap-2 items-center flex-wrap">
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md"
            onClick={handleParseAndSchedule}
            disabled={!syllabusText.trim() || parseStatus === 'parsing' || scheduleStatus === 'scheduling'}
          >
            {parseStatus === 'parsing' && '🤖 Extracting tasks...'}
            {scheduleStatus === 'scheduling' && '📅 Auto-scheduling...'}
            {parseStatus === 'idle' && scheduleStatus === 'idle' && '✨ Parse & Auto-Schedule'}
            {parseStatus === 'done' && scheduleStatus === 'done' && '✅ Scheduled!'}
          </button>
          
          <button
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            onClick={handleParseSyllabus}
            disabled={!syllabusText.trim() || parseStatus === 'parsing'}
          >
            {parseStatus === 'parsing' ? '⏳ Parsing...' : 'Parse Only'}
          </button>
          
          <button
            className="px-3 py-2 border rounded hover:bg-gray-50"
            onClick={() => {
              setSyllabusText('');
              setParsedTasks([]);
              setScheduledBlocks([]);
              setParseStatus('idle');
              setScheduleStatus('idle');
              setScheduleMessage('');
              persistTasks([]);
              void saveScheduledBlocks([]).catch(() => {});
            }}
          >
            Clear
          </button>
          
          <div className="ml-auto text-sm">
            <span className={`font-medium ${
              scheduleStatus === 'done' ? 'text-green-600' : 
              scheduleStatus === 'error' ? 'text-red-600' : 
              scheduleStatus === 'scheduling' ? 'text-blue-600' :
              parseStatus === 'done' ? 'text-green-600' : 
              parseStatus === 'error' ? 'text-red-600' : 
              parseStatus === 'parsing' ? 'text-blue-600' : 
              'text-gray-600'
            }`}>
              {scheduleStatus === 'done' && `✅ ${scheduledBlocks.length} blocks scheduled`}
              {scheduleStatus === 'scheduling' && '📅 Scheduling...'}
              {scheduleStatus === 'error' && '✗ Scheduling failed'}
              {parseStatus === 'done' && scheduleStatus === 'idle' && `✓ ${parsedTasks.length} tasks found`}
              {parseStatus === 'error' && '✗ Parsing failed'}
              {parseStatus === 'parsing' && '⏳ Parsing...'}
              {parseStatus === 'idle' && scheduleStatus === 'idle' && 'Ready'}
            </span>
          </div>
        </div>

        {/* Display Parsed Tasks */}
        {parsedTasks.length > 0 && scheduleStatus === 'idle' && (
          <div className="mt-6 space-y-2">
            <h4 className="font-medium text-base">Extracted Tasks ({parsedTasks.length})</h4>
            <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {parsedTasks.map((task, i) => (
                <div key={i} className="mb-3 pb-3 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm">{task.title}</h5>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        <span>⏱️ {task.duration || 60} min</span>
                        {task.deadline && (
                          <span>📅 Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority === 'low' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {task.priority || 'medium'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 italic">
              Tasks saved! Click "Parse & Auto-Schedule" to timeblock them.
            </p>
          </div>
        )}
        
        {/* Display Scheduled Blocks */}
        {scheduledBlocks.length > 0 && (
          <div id="scheduled-results" className="mt-6 space-y-3 border-t pt-6">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xl text-green-700">🎉 Your Schedule is Ready!</h4>
              <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                {scheduledBlocks.length} time blocks created
              </span>
            </div>
            
            <p className="text-sm text-gray-600">
              ✅ All your assignments, tests, and quizzes have been automatically scheduled in your calendar.
              Here's when you'll work on each task:
            </p>
            
            <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50">
              {scheduledBlocks
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .map((block, i) => {
                  const start = new Date(block.start);
                  const end = new Date(block.end);
                  const dayName = start.toLocaleDateString('en-US', { weekday: 'long' });
                  const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  const endTimeStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  const durationMinutes = block.duration || Math.max(15, (end.getTime() - start.getTime()) / 60000);
                  const durationHrs = Math.round((durationMinutes / 60) * 10) / 10;
                  
                  return (
                    <div key={i} className="mb-4 pb-4 border-b last:border-b-0 last:pb-0 last:mb-0 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">
                              {block.task?.priority === 'high' ? '🔴' :
                               block.task?.priority === 'low' ? '🟢' : '🟡'}
                            </span>
                            <h5 className="font-bold text-base text-gray-900">{block.title}</h5>
                          </div>
                          
                          {block.task?.description && (
                            <p className="text-sm text-gray-600 ml-8 mb-2">{block.task.description}</p>
                          )}
                          
                          <div className="ml-8 flex flex-wrap gap-3 text-sm">
                            <span className="flex items-center gap-1 text-blue-700 font-semibold">
                              📅 {dayName}, {dateStr}
                            </span>
                            <span className="flex items-center gap-1 text-purple-700 font-semibold">
                              ⏰ {timeStr} - {endTimeStr}
                            </span>
                            <span className="flex items-center gap-1 text-gray-600">
                              ⏱️ {durationHrs}h session
                            </span>
                          </div>
                          
                          {block.task?.deadline && (
                            <div className="ml-8 mt-2 text-xs text-red-600 font-medium">
                              🎯 Due: {new Date(block.task.deadline).toLocaleDateString('en-US', { 
                                weekday: 'short', month: 'short', day: 'numeric' 
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Recommend a short break after each block based on breakMinutes */}
                      <div className="ml-8 mt-2 text-xs text-gray-500">
                        Recommended break: {breakMinutes} minutes — {getBreakSuggestion(breakMinutes)}
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
              <p className="text-sm text-gray-600">{scheduleMessage}</p>
              <button
                onClick={downloadICS}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ⬇️ Export to Calendar (.ics)
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h5 className="font-semibold text-blue-900 mb-2">📌 What's Next?</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Your study sessions are optimized to avoid burnout</li>
                <li>✅ Each block includes break time for better focus</li>
                <li>✅ Tasks are scheduled before their deadlines</li>
                <li>✅ Go to the <a href="/plan" className="underline font-semibold">Plan page</a> to view in calendar format</li>
                <li>✅ Drag and drop blocks to adjust your schedule</li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
