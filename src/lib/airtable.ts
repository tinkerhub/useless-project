// Only ever imported from Route Handlers and Server Components (never a "use client" file) -
// it reads AIRTABLE_API_KEY, which must not reach the browser bundle.
//
// Each competition (see src/lib/competitions.ts) writes to its own table in this base, rather
// than sharing one table filtered by a "Competition" field - this token couldn't add options to
// a shared singleSelect field (Airtable rejected both a schema PATCH and a typecast write with a
// permissions error), and a table per competition sidesteps that entirely.
//
// On the Team plan's 100,000 calls/month, straight polling would be fine, but the tag-based
// invalidation costs nothing extra and is strictly better: listVisibleSubmissions is tagged per
// table, and the submit route calls revalidateTag right after a successful write, so a new
// submission shows up on /submissions immediately rather than waiting for the next revalidate
// window. The revalidate window below is just a freshness fallback, not a rate-limit workaround.
const BASE_ID = "appaBOqq1WfYxlJGJ";

function apiKey() {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) throw new Error("AIRTABLE_API_KEY is not set");
  return key;
}

export function submissionsTag(tableId: string) {
  return `airtable-submissions-${tableId}`;
}

export type SubmissionFields = {
  Name: string;
  Campus: string;
  "Submission Link": string;
  Notes?: string;
};

// Airtable's 5 requests/second-per-base throttle returns 429 on a burst (e.g. several people
// submitting at once); a short retry with backoff smooths that over instead of dropping the
// submission outright. Write conflicts/bad requests (4xx other than 429) fail immediately.
async function fetchWithRetry(url: string, init: RequestInit, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 || attempt === attempts) return res;
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  throw new Error("unreachable");
}

export async function createSubmission(tableId: string, fields: SubmissionFields) {
  const res = await fetchWithRetry(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: { ...fields, Status: "Pending", "Submitted At": new Date().toISOString() },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable create failed (${res.status}): ${body}`);
  }

  return res.json();
}

export type VisibleSubmission = {
  id: string;
  name: string;
  campus: string;
  link: string;
};

// Used by /submissions to show submitted reels. Shows everything except explicitly rejected entries -
// submissions go live right away, and "Status" in Airtable is only there as a way to hide a bad
// one (mark it Rejected) rather than a required approval gate. Fails soft (empty array) rather
// than throwing, so a missing/misconfigured API key doesn't take the page down.
export async function listVisibleSubmissions(tableId: string): Promise<VisibleSubmission[]> {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    filterByFormula: `{Status} != "Rejected"`,
    "sort[0][field]": "Submitted At",
    "sort[0][direction]": "desc",
  });

  try {
    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}?${params}`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 60, tags: [submissionsTag(tableId)] },
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.records ?? [])
      .filter((record: { fields: Record<string, string> }) => record.fields.Name && record.fields["Submission Link"])
      .map((record: { id: string; fields: Record<string, string> }) => ({
        id: record.id,
        name: record.fields.Name ?? "",
        campus: record.fields.Campus ?? "",
        link: record.fields["Submission Link"] ?? "",
      }));
  } catch {
    return [];
  }
}
