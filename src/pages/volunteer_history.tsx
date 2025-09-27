import { useEffect, useMemo, useState } from "react";

type EngagementLevel = "Low" | "Medium" | "High" | "Critical";
type ParticipationStatus =
  | "Registered"
  | "Confirmed"
  | "CheckedIn"
  | "NoShow"
  | "Cancelled"
  | "Completed";

type VolunteerHistoryItem = {
  id: string;
  name: string;
  description: string;
  location: string;
  requiredSkills: string[];
  urgency: EngagementLevel;
  eventDate: string;
  status: ParticipationStatus;
  volunteerId?: string;
  volunteerName?: string;
  hours?: number;
  notes?: string;
};

type SortKey = "eventDate" | "name" | "urgency" | "status";
type SortDir = "asc" | "desc";

type VolunteerHistoryParams = {
  page: number;
  pageSize: number;
  sortKey: SortKey;
  sortDir: SortDir;
  search: string;
  filters: {
    urgency: string[];
    status: string[];
    dateFrom?: string;
    dateTo?: string;
  };
};

type VolunteerHistoryResponse = { items: VolunteerHistoryItem[]; total: number };

const ENGAGEMENT_OPTIONS: EngagementLevel[] = ["Low", "Medium", "High", "Critical"];
const STATUS_OPTIONS: ParticipationStatus[] = [
  "Registered",
  "Confirmed",
  "CheckedIn",
  "NoShow",
  "Cancelled",
  "Completed",
];
const TABLE_COLUMNS = [
  { key: "volunteerName", label: "Volunteer" },
  { key: "name", label: "Assignment" },
  { key: "eventDate", label: "Last Activity" },
  { key: "status", label: "Status" },
  { key: "hours", label: "Hours" },
  { key: "requiredSkills", label: "Skills" },
  { key: "location", label: "Location" },
  { key: "description", label: "Notes" },
];

const DEFAULT_SORT_KEY: SortKey = "eventDate";
const DEFAULT_SORT_DIR: SortDir = "desc";

const PAGE_CLASS = "min-h-screen w-full bg-stone-100 px-6 py-8 text-stone-900 md:px-12";
const CARD_CLASS = "rounded-2xl border border-amber-200 bg-white shadow";
const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60";
const PRIMARY_BUTTON = `${BUTTON_BASE} bg-amber-600 text-white hover:bg-amber-500`;
const GHOST_BUTTON = `${BUTTON_BASE} border border-amber-200 bg-white text-amber-600 hover:bg-amber-50`;
const INPUT_CLASS =
  "w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-200 focus:outline-none";


async function fetchVolunteerHistory(params: VolunteerHistoryParams): Promise<VolunteerHistoryResponse> {
  const roster = [ //placeholder data
    {
      volunteerName: "Jordan Smith",
      volunteerId: "vol-001",
      location: "Houston, TX",
      skills: ["skill1", "skill2", "skill3"],
      engagement: "High" as EngagementLevel,
      status: "Confirmed" as ParticipationStatus,
      assignment: "Emergency Shelter Intake",
      hours: 62,
      description:
        "description",
      lastActivity: "2025-02-14",
    },
    {
      volunteerName: "John Smith",
      volunteerId: "vol-002",
      location: "Houston, TX",
      skills: ["skill1", "skill2", "skill3"],
      engagement: "Critical" as EngagementLevel,
      status: "CheckedIn" as ParticipationStatus,
      assignment: "Mobile Wellness Clinic",
      hours: 88,
      description:
        "description",
      lastActivity: "2025-02-11",
    },
    {
      volunteerName: "Miguel Hernandez",
      volunteerId: "vol-003",
      location: "Houston, TX",
      skills: ["skill1", "skill2", "skill3"],
      engagement: "Medium" as EngagementLevel,
      status: "Completed" as ParticipationStatus,
      assignment: "Warehouse Logistics",
      hours: 47,
      description:
        "description",
      lastActivity: "2025-01-29",
    },
    {
      volunteerName: "Jack Lee",
      volunteerId: "vol-004",
      location: "Houston, TX",
      skills: ["skill1", "skill2", "skill3"],
      engagement: "High" as EngagementLevel,
      status: "Registered" as ParticipationStatus,
      assignment: "Neighborhood Outreach Canvassing",
      hours: 33,
      description: "description",
      lastActivity: "2025-02-05",
    },
    {
      volunteerName: "Morgan Davis",
      volunteerId: "vol-005",
      location: "Houston, TX",
      skills: ["skill1", "skill2", "skill3"],
      engagement: "Low" as EngagementLevel,
      status: "NoShow" as ParticipationStatus,
      assignment: "Intake Data QA",
      hours: 12,
      description:
        "description",
      lastActivity: "2025-01-18",
    },
  ];

  const seed: VolunteerHistoryItem[] = Array.from({ length: 30 }, (_, i) => {
    const b = roster[i % roster.length];
    const dt = new Date(b.lastActivity);
    dt.setDate(dt.getDate() - (i % 14) * 2);
    return {
      id: `history-${i + 1}`,
      name: b.assignment,
      description: b.description,
      location: b.location,
      requiredSkills: b.skills,
      urgency: b.engagement,
      eventDate: dt.toISOString().slice(0, 10),
      status: STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(b.status) + (i % 3)) % STATUS_OPTIONS.length],
      volunteerName: b.volunteerName,
      volunteerId: b.volunteerId,
      hours: b.hours + (i % 5) * 2,
      notes: b.description,
    };
  });

  const { search, filters, sortKey, sortDir, page, pageSize } = params;
  const term = search.trim().toLowerCase();
  const filtered = seed.filter((x) => {
    const t =
      !term ||
      x.name.toLowerCase().includes(term) ||
      x.location.toLowerCase().includes(term) ||
      x.description.toLowerCase().includes(term) ||
      (x.volunteerName ?? "").toLowerCase().includes(term);

    const u = !filters.urgency.length || filters.urgency.includes(x.urgency);
    const s = !filters.status.length || filters.status.includes(x.status);
    const df = !filters.dateFrom || new Date(x.eventDate) >= new Date(filters.dateFrom);
    const dt = !filters.dateTo || new Date(x.eventDate) <= new Date(filters.dateTo);

    return t && u && s && df && dt;
  });

  const dir = sortDir === "asc" ? 1 : -1;
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "eventDate")
      return (new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()) * dir;
    if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
    if (sortKey === "urgency") return a.urgency.localeCompare(b.urgency) * dir;
    if (sortKey === "status") return a.status.localeCompare(b.status) * dir;
    return 0;
  });

  const start = (page - 1) * pageSize;
  await new Promise((r) => setTimeout(r, 250)); // tiny delay for UX
  return { items: sorted.slice(start, start + pageSize), total: sorted.length };
}

async function exportVolunteerHistoryCSV(params: VolunteerHistoryParams) {
  console.info("Export CSV with params", params);
  return Promise.resolve();
}

const statusBadge = (s: ParticipationStatus) => {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const m: Record<ParticipationStatus, string> = {
    Registered: `${base} bg-amber-200 text-amber-900`,
    Confirmed: `${base} bg-amber-500 text-white`,
    CheckedIn: `${base} bg-emerald-200 text-emerald-800`,
    Completed: `${base} bg-sky-200 text-sky-900`,
    NoShow: `${base} bg-yellow-200 text-yellow-900`,
    Cancelled: `${base} bg-rose-200 text-rose-900`,
  };
  return m[s] ?? `${base} bg-stone-200 text-stone-800`;
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(
    new Date(`${iso}T00:00:00Z`)
  );

const fmtSkills = (a: string[]) => (a.length <= 3 ? a.join(", ") : `${a[0]}, ${a[1]}, ${a[2]} +${a.length - 3} more`);
const cut = (t: string, n: number) => (t.length <= n ? t : `${t.slice(0, n - 1)}…`);

/* ------------------------------- component ------------------------------ */
export default function VolunteerHistory() {
  const [data, setData] = useState<VolunteerHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [ui, setUi] = useState({ loading: false, error: "", selectedId: "" });

  const [params, setParams] = useState<VolunteerHistoryParams>({
    page: 1,
    pageSize: 10,
    sortKey: DEFAULT_SORT_KEY,
    sortDir: DEFAULT_SORT_DIR,
    search: "",
    filters: { urgency: [], status: [] },
  });

  const hasFilters = useMemo(() => {
    const f = params.filters;
    return !!(params.search.trim() || f.urgency.length || f.status.length || f.dateFrom || f.dateTo);
  }, [params]);

  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));

  useEffect(() => {
    let alive = true;
    setUi((u) => ({ ...u, loading: true, error: "" }));
    fetchVolunteerHistory(params)
      .then((res) => {
        if (!alive) return;
        setData(res.items);
        setTotal(res.total);
      })
      .catch(() => alive && setUi((u) => ({ ...u, error: "Failed to load volunteer history." })))
      .finally(() => alive && setUi((u) => ({ ...u, loading: false })));
    return () => {
      alive = false;
    };
  }, [params]);

  // small helpers
  const set = <K extends keyof VolunteerHistoryParams>(k: K, v: VolunteerHistoryParams[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  const setFilter = <K extends keyof VolunteerHistoryParams["filters"]>(
    k: K,
    v: VolunteerHistoryParams["filters"][K]
  ) => setParams((p) => ({ ...p, page: 1, filters: { ...p.filters, [k]: v } }));

  const toggleFilter = (k: "urgency" | "status", v: string) =>
    setFilter(
      k,
      params.filters[k].includes(v)
        ? params.filters[k].filter((x) => x !== v)
        : [...params.filters[k], v]
    );

  const clearFilters = () =>
    setParams((p) => ({ ...p, page: 1, search: "", filters: { urgency: [], status: [] } }));

  const onPage = (n: number) => set("page", Math.min(Math.max(1, n), totalPages));
  const onPageSize = (n: number) => setParams((p) => ({ ...p, pageSize: n, page: 1 }));

  const exportCSV = () =>
    exportVolunteerHistoryCSV(params).catch(() =>
      setUi((u) => ({ ...u, error: "Failed to export volunteer history." }))
    );

  return (
    <div className={PAGE_CLASS}>
      <header className={`${CARD_CLASS} flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between`}>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Volunteer History</h1>
          <p className="text-base text-stone-500">Track individual volunteer assignments and participation details.</p>
        </div>

        <div className="flex items-center gap-3">
          {hasFilters && (
            <button className={GHOST_BUTTON} onClick={clearFilters}>
              Clear
            </button>
          )}
          <button className={PRIMARY_BUTTON} onClick={exportCSV}>
            Export CSV
          </button>
        </div>
      </header>

      <section className={`${CARD_CLASS} mt-6 flex flex-col gap-6 p-6 lg:p-8`}>
        <div className="grid gap-6 lg:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-stone-700">Search</span>
            <input
              aria-label="Search volunteer history"
              className={INPUT_CLASS}
              placeholder="Search by volunteer, assignment, or location…"
              value={params.search}
              onChange={(e) => setParams((p) => ({ ...p, page: 1, search: e.target.value }))}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-stone-700">Date Range</span>
            <div className="flex items-center gap-3">
              <input
                type="date"
                className={INPUT_CLASS}
                value={params.filters.dateFrom ?? ""}
                onChange={(e) => setFilter("dateFrom", e.target.value || undefined)}
                aria-label="Filter from date"
              />
              <span className="text-sm text-stone-500">to</span>
              <input
                type="date"
                className={INPUT_CLASS}
                value={params.filters.dateTo ?? ""}
                onChange={(e) => setFilter("dateTo", e.target.value || undefined)}
                aria-label="Filter to date"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-stone-700">Engagement Level</span>
            <div className="flex flex-wrap gap-3">
              {ENGAGEMENT_OPTIONS.map((opt) => {
                const on = params.filters.urgency.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleFilter("urgency", opt)}
                    className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                      on ? "border-amber-500 bg-amber-500 text-white" : "border-amber-200 bg-white text-stone-600 hover:bg-amber-50"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-stone-700">Status</span>
            <div className="flex flex-wrap gap-3">
              {STATUS_OPTIONS.map((opt) => {
                const on = params.filters.status.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleFilter("status", opt)}
                    className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                      on ? "border-amber-500 bg-amber-500 text-white" : "border-amber-200 bg-white text-stone-600 hover:bg-amber-50"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className={`${CARD_CLASS} mt-6 flex flex-col gap-6 p-6 lg:p-8`}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
            <span>Showing {data.length} of {total} records</span>
            {ui.selectedId && <span>Selected row: {ui.selectedId}</span>}
          </div>
          {ui.loading && <span className="text-sm text-stone-500">Loading…</span>}
        </header>

        {ui.error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-600 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{ui.error}</span>
              <button className={GHOST_BUTTON} onClick={() => setParams((p) => ({ ...p }))}>Retry</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-amber-200 bg-amber-50">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-amber-100 text-xs uppercase tracking-wider text-amber-800">
              <tr>
                {TABLE_COLUMNS.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ui.loading && (
                <tr>
                  <td colSpan={TABLE_COLUMNS.length} className="px-4 py-10 text-center text-stone-500">
                    Loading volunteer history…
                  </td>
                </tr>
              )}

              {!ui.loading && data.length === 0 && !ui.error && (
                <tr>
                  <td colSpan={TABLE_COLUMNS.length} className="px-4 py-10 text-center text-stone-500">
                    <div className="font-medium text-stone-800">No results</div>
                    <div className="text-sm text-stone-500">Try adjusting filters or search criteria.</div>
                  </td>
                </tr>
              )}

              {!ui.loading &&
                data.map((x) => {
                  const badgeClass = statusBadge(x.status);
                  const isSel = x.id === ui.selectedId;
                  return (
                    <tr
                      key={x.id}
                      onClick={() => setUi((u) => ({ ...u, selectedId: u.selectedId === x.id ? "" : x.id }))}
                      className={`cursor-pointer transition ${isSel ? "bg-amber-100" : "hover:bg-amber-50"}`}
                    >
                      <td className="px-4 py-4 font-semibold text-stone-900">{x.volunteerName}</td>
                      <td className="px-4 py-4 text-stone-600">{x.name}</td>
                      <td className="px-4 py-4 text-stone-600">{fmtDate(x.eventDate)}</td>
                      <td className="px-4 py-4"><span className={badgeClass}>{x.status.replace("CheckedIn", "Checked In")}</span></td>
                      <td className="px-4 py-4 text-stone-600">{x.hours ?? "—"}</td>
                      <td className="px-4 py-4 text-stone-600">{fmtSkills(x.requiredSkills)}</td>
                      <td className="px-4 py-4 text-stone-600">{x.location}</td>
                      <td className="px-4 py-4 text-stone-600">{cut(x.description, 120)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-4 border-t border-amber-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label className="flex flex-col text-sm text-stone-700">
              Rows per page
              <select
                className={`${INPUT_CLASS} mt-1 w-[110px] appearance-none pr-8`}
                value={params.pageSize}
                onChange={(e) => onPageSize(Number(e.target.value))}
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3 text-sm text-stone-700">
            <button className={GHOST_BUTTON} disabled={params.page <= 1} onClick={() => onPage(params.page - 1)}>
              Previous
            </button>
            <span>Page {params.page} of {totalPages}</span>
            <button className={GHOST_BUTTON} disabled={params.page >= totalPages} onClick={() => onPage(params.page + 1)}>
              Next
            </button>
          </div>

          <div className="flex items-center text-sm text-stone-700">
            <span>Selected: {ui.selectedId ? 1 : 0}</span>
          </div>
        </footer>
      </section>
    </div>
  );
}



