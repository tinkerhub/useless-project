// Only ever imported from Route Handlers and Server Components (never a "use client" file) -
// it reads METABASE_API_KEY, which must not reach the browser bundle.
const DATABASE_ID = 33; // "TheHubDB" - the Hub app's Postgres database, in Metabase's own IDs.
// The "Useless Projects 3.0" event's id in that database - every project submitted through the
// Hub app for this hackathon carries this event_id, regardless of which venue/date session the
// submitting team was actually at.
const EVENT_ID = 3763;

export type Project = {
  id: number;
  name: string;
  tagline: string | null;
  description: string | null;
  coverImage: string | null;
  projectUrl: string | null;
  sourceCodeUrl: string | null;
  categories: string | null;
  status: string | null;
  teamName: string | null;
  venueName: string | null;
  campusName: string | null;
  createdAt: string | null;
  // "Software" or "Hardware" - projects.type in the source data.
  type: string | null;
};

// event_team → the submitting team's name; event_team.venue_id → event_venue → the specific
// venue that team was assigned to; event_venue.sub_org_id → sub_orgs → that venue's campus. A
// project can lack a team (solo/non-team submission), hence the left joins throughout.
const QUERY = `
  select p.id, p.name, p.tagline, p.description, p.cover_image, p.project_url, p.source_code_url,
         p.categories, p.status, p.created_at, p.type, et.name as team_name, ev.name as venue_name, so.name as campus_name
  from projects p
  left join event_team et on et.id = p.event_team_id
  left join event_venue ev on ev.id = et.venue_id
  left join sub_orgs so on so.id = ev.sub_org_id
  where p.event_id = ${EVENT_ID}
  order by p.created_at desc
`;

// Used by /projects. Fails soft (empty array) rather than throwing, so a missing/misconfigured
// API key or an unreachable Metabase instance doesn't take the page down.
export async function listProjects(): Promise<Project[]> {
  const key = process.env.METABASE_API_KEY;
  const baseUrl = process.env.METABASE_BASE_URL;
  if (!key || !baseUrl) return [];

  try {
    const res = await fetch(`${baseUrl}/api/dataset`, {
      method: "POST",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ database: DATABASE_ID, type: "native", native: { query: QUERY } }),
      // A hackathon showcase page doesn't need to the second - Metabase's dashboard for this same
      // data is a separate consumer hitting the same database, so the less often this re-queries,
      // the less combined load both put on it. 5 minutes is a large cut from the original 60s
      // with no real cost to anyone browsing project submissions.
      next: { revalidate: 300, tags: ["metabase-projects"] },
    });
    if (!res.ok) return [];

    const json = await res.json();
    const cols: { name: string }[] = json?.data?.cols ?? [];
    const rows: unknown[][] = json?.data?.rows ?? [];

    return rows.map((row) => {
      const record: Record<string, unknown> = {};
      cols.forEach((col, i) => (record[col.name] = row[i]));
      return {
        id: record.id as number,
        name: (record.name as string)?.trim() || "Untitled",
        tagline: (record.tagline as string) || null,
        description: (record.description as string) || null,
        coverImage: (record.cover_image as string) || null,
        projectUrl: (record.project_url as string) || null,
        sourceCodeUrl: (record.source_code_url as string) || null,
        categories: (record.categories as string) || null,
        status: (record.status as string) || null,
        teamName: (record.team_name as string) || null,
        venueName: (record.venue_name as string) || null,
        campusName: (record.campus_name as string) || null,
        createdAt: (record.created_at as string) || null,
        type: (record.type as string) || null,
      };
    });
  } catch (error) {
    console.error("Fetching projects from Metabase failed:", error);
    return [];
  }
}
