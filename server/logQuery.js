const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;
const ALLOWED_SORT_FIELDS = new Set(['timestamp', 'promptLength', 'ip', 'endpoint']);

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeString(value) {
  const normalized = firstQueryValue(value);
  if (normalized == null) {
    return '';
  }

  return String(normalized).trim();
}

function parseIntegerParam(
  value,
  name,
  { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}
) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return { value: null };
  }

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }

  return { value: parsed };
}

function parseDateParam(value, name) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return { value: null };
  }

  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a valid date or ISO timestamp`);
  }

  return { value: parsed };
}

function parseOffsetParam(value, name) {
  const { value: parsed } = parseIntegerParam(value, name, { min: 0 });
  return { value: parsed };
}

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function encodeCursor(index) {
  return Buffer.from(String(index), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeCursor(cursor) {
  const normalized = cursor.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const decoded = Buffer.from(normalized + padding, 'base64')
    .toString('utf8')
    .trim();
  const parsed = Number(decoded);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('cursor must encode a non-negative integer');
  }

  return parsed;
}

function compareValues(left, right, sortBy) {
  if (sortBy === 'timestamp') {
    return parseTimestamp(left.timestamp) - parseTimestamp(right.timestamp);
  }

  if (sortBy === 'promptLength') {
    return Number(left.promptLength || 0) - Number(right.promptLength || 0);
  }

  return String(left[sortBy] || '').localeCompare(String(right[sortBy] || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function findIndexByTime(logs, timeMs, isStart) {
  if (logs.length === 0) return isStart ? 0 : -1;
  let low = 0;
  let high = logs.length - 1;
  let result = isStart ? 0 : logs.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midTime = Date.parse(logs[mid].timestamp || '');
    if (Number.isNaN(midTime)) {
      if (isStart) low = mid + 1;
      else high = mid - 1;
      continue;
    }
    if (midTime === timeMs) {
      return mid;
    } else if (midTime < timeMs) {
      if (isStart) result = mid + 1;
      low = mid + 1;
    } else {
      if (!isStart) result = mid - 1;
      high = mid - 1;
    }
  }
  return result;
}

export function queryRequestLogs(logs, query = {}) {
  const ip = normalizeString(query.ip);
  const endpoint = normalizeString(query.endpoint);
  const sortBy = normalizeString(query.sortBy) || 'timestamp';
  const sortOrder = normalizeString(query.sortOrder).toLowerCase() || 'desc';
  const cursor = normalizeString(query.cursor);
  const offsetQuery = normalizeString(query.offset);

  if (!ALLOWED_SORT_FIELDS.has(sortBy)) {
    throw new Error(`sortBy must be one of: ${Array.from(ALLOWED_SORT_FIELDS).join(', ')}`);
  }

  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    throw new Error('sortOrder must be either asc or desc');
  }

  if (cursor && offsetQuery) {
    throw new Error('Use either cursor or offset pagination, not both');
  }

  const { value: since } = parseDateParam(query.since, 'since');
  const { value: until } = parseDateParam(query.until, 'until');
  const { value: minPromptLength } = parseIntegerParam(query.minPromptLength, 'minPromptLength', {
    min: 0,
  });
  const { value: maxPromptLength } = parseIntegerParam(query.maxPromptLength, 'maxPromptLength', {
    min: 0,
  });
  const { value: limitValue } = parseIntegerParam(query.limit, 'limit', {
    min: 1,
    max: MAX_PAGE_SIZE,
  });
  const { value: offsetValue } = parseOffsetParam(offsetQuery, 'offset');

  let startIndexBound = 0;
  let endIndexBound = logs.length - 1;

  if (since !== null) {
    startIndexBound = Math.max(startIndexBound, findIndexByTime(logs, since, true));
  }
  if (until !== null) {
    endIndexBound = Math.min(endIndexBound, findIndexByTime(logs, until, false));
  }

  let candidates = logs;
  if (startIndexBound <= endIndexBound && logs.length > 0) {
    candidates = logs.slice(startIndexBound, endIndexBound + 1);
  } else if (startIndexBound > endIndexBound) {
    candidates = [];
  }

  const limit = limitValue ?? DEFAULT_PAGE_SIZE;
  const filtered = candidates.filter((entry) => {
    if (ip && String(entry.ip || '') !== ip) {
      return false;
    }

    if (
      endpoint &&
      !String(entry.endpoint || '')
        .toLowerCase()
        .includes(endpoint.toLowerCase())
    ) {
      return false;
    }

    const promptLength = Number(entry.promptLength || 0);
    if (minPromptLength !== null && promptLength < minPromptLength) {
      return false;
    }

    if (maxPromptLength !== null && promptLength > maxPromptLength) {
      return false;
    }

    return true;
  });

  const direction = sortOrder === 'asc' ? 1 : -1;
  const sorted = [...filtered].sort((left, right) => {
    const baseComparison = compareValues(left, right, sortBy);
    if (baseComparison !== 0) {
      return baseComparison * direction;
    }

    return parseTimestamp(left.timestamp) - parseTimestamp(right.timestamp);
  });

  const startIndex = cursor ? decodeCursor(cursor) : (offsetValue ?? 0);
  if (startIndex > sorted.length) {
    throw new Error('cursor or offset is outside the available result set');
  }

  const pageEntries = sorted.slice(startIndex, startIndex + limit);
  const nextIndex = startIndex + pageEntries.length;
  const hasMore = nextIndex < sorted.length;
  const previousIndex = Math.max(0, startIndex - limit);

  return {
    entries: pageEntries,
    total: sorted.length,
    returned: pageEntries.length,
    limit,
    pagination: {
      mode: cursor ? 'cursor' : 'offset',
      offset: startIndex,
      nextOffset: hasMore ? nextIndex : null,
      previousOffset: startIndex > 0 ? previousIndex : null,
      cursor: cursor || null,
      nextCursor: hasMore ? encodeCursor(nextIndex) : null,
      previousCursor: startIndex > 0 ? encodeCursor(previousIndex) : null,
      hasMore,
    },
    filters: {
      ip: ip || null,
      endpoint: endpoint || null,
      since: since !== null ? new Date(since).toISOString() : null,
      until: until !== null ? new Date(until).toISOString() : null,
      minPromptLength,
      maxPromptLength,
    },
    sort: {
      by: sortBy,
      order: sortOrder,
    },
  };
}
