"use client";
import { useState } from "react";

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
  const [fileName, setFileName] = useState(null);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('idle');

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
