type IcsBlock = {
  id?: string | null;
  title?: string | null;
  start?: string | null;
  end?: string | null;
  sourceTaskId?: string | null;
};

function formatIsoForICS(isoString?: string | null): string | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }

  return (
    date.getUTCFullYear().toString().padStart(4, '0') +
    (date.getUTCMonth() + 1).toString().padStart(2, '0') +
    date.getUTCDate().toString().padStart(2, '0') +
    'T' +
    date.getUTCHours().toString().padStart(2, '0') +
    date.getUTCMinutes().toString().padStart(2, '0') +
    date.getUTCSeconds().toString().padStart(2, '0') +
    'Z'
  );
}

export function buildICSFromBlocks(blocks: IcsBlock[] | undefined | null): string | null {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PlayBlocks AI//EN'];
  let hasEvent = false;

  for (const block of blocks) {
    const dtStart = formatIsoForICS(block.start ?? undefined);
    const dtEnd = formatIsoForICS(block.end ?? undefined);
    if (!dtStart || !dtEnd) {
      continue;
    }

    const uid =
      block.id && block.id.trim()
        ? block.id
        : `scheduled-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    const summary = (block.title || 'Focus Block').replace(/\n/g, ' ');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    if (block.sourceTaskId) {
      lines.push(`DESCRIPTION:Task ${block.sourceTaskId}`);
    }
    lines.push('END:VEVENT');

    hasEvent = true;
  }

  if (!hasEvent) {
    return null;
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
