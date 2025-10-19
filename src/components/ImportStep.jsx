"use client";
import { useEffect, useState } from "react";
import { fetchPreferences, savePreferences } from "@/lib/api";

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

export default function ImportStep() {
  // Temporary dev marker to confirm this component is loaded in the browser
  useEffect(() => {
    console.log('DEV: rendering src/components/ImportStep.jsx');
  }, []);
  const [fileName, setFileName] = useState(null);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('idle');
  // Working hours preferences
  const [enforceWorkingHours, setEnforceWorkingHours] = useState(false);
  const [workHoursStartMin, setWorkHoursStartMin] = useState(19 * 60);
  const [workHoursEndMin, setWorkHoursEndMin] = useState(21 * 60);
  const [prefsStatus, setPrefsStatus] = useState('idle');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const prefs = await fetchPreferences();
        if (!mounted) return;
        if (prefs) {
          if (typeof prefs.mode !== 'undefined') {
            // keep existing shape but only read working hours keys
          }
          if (prefs.workHoursStart) {
            const mins = timeStrToMinutes(prefs.workHoursStart);
            if (!isNaN(mins)) setWorkHoursStartMin(mins);
          }
          if (prefs.workHoursEnd) {
            const mins = timeStrToMinutes(prefs.workHoursEnd);
            if (!isNaN(mins)) setWorkHoursEndMin(mins);
          }
          if (typeof prefs.enforceWorkingHours !== 'undefined') setEnforceWorkingHours(!!prefs.enforceWorkingHours);
        }
      } catch (err) {
        // ignore - defaults stay
      }
    })();
    return () => { mounted = false; };
  }, []);

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
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Upload failed');
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

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

  return (
    <section className="w-full max-w-xl p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">Import .ics</h3>
      <input
        aria-label="Upload ICS file"
        type="file"
        accept=".ics"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {fileName && <p className="text-sm text-gray-600">Loaded: {fileName}</p>}

      <div className="mt-3 space-y-2">
        <h4 className="font-medium">Preview ({events.length})</h4>
        {events.length === 0 && <p className="text-sm text-gray-500">No events parsed yet.</p>}
        <ul className="list-disc pl-5">
          {events.map((ev, i) => (
            <li key={i} className="text-sm">
              <strong>{ev.title}</strong>
              {ev.start && <span> — {new Date(ev.start).toLocaleString()}</span>}
              {ev.end && <span> to {new Date(ev.end).toLocaleString()}</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 p-4 border rounded bg-gray-50">
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
        {prefsStatus === 'saved' && <p className="text-xs text-green-600 mt-2">Preferences saved.</p>}
        {prefsStatus === 'error' && <p className="text-xs text-red-600 mt-2">Failed to save preferences.</p>}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="px-3 py-1 border rounded bg-slate-100"
          onClick={upload}
          disabled={events.length === 0 || status === 'uploading'}
        >
          Upload to backend
        </button>
        <button
          className="px-3 py-1 border rounded"
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
  );
}
