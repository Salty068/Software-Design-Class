import { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = ["Registered", "Confirmed", "CheckedIn", "NoShow", "Cancelled", "Completed"] as const;
type ParticipationStatus = (typeof STATUS_OPTIONS)[number];

type VolunteerHistoryItem = {
  id: string;
  volunteerId: string;
  volunteerName: string;
  assignment: string;
  location: string;
  eventDate: string;
  status: ParticipationStatus;
  hours: number;
};

type SortKey = "eventDate" | "volunteerName" | "assignment" | "status";
type SortDir = "asc" | "desc";

type VolunteerHistoryParams = {
  page: number;
  pageSize: number;
  sortKey: SortKey;
  sortDir: SortDir;
  search: string;
  filters: {
    status: ParticipationStatus[];
    dateFrom?: string;
    dateTo?: string;
  };
};

type VolunteerHistoryResponse = { items: VolunteerHistoryItem[]; total: number };
const TABLE_COLUMNS = [
  { key: "volunteerName", label: "Volunteer" },
  { key: "assignment", label: "Assignment" },
  { key: "eventDate", label: "Last Activity" },
  { key: "status", label: "Status" },
  { key: "hours", label: "Hours" },
  { key: "location", label: "Location" },
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


type ApiSuccess<T> = { data: T };
type ApiError = { error: string };

const HISTORY_ENDPOINT = "/api/volunteer-history";

const readJson = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
};

const handleResponse = async <T,>(res: Response): Promise<T> => {
  const body = await readJson<ApiSuccess<T> | ApiError>(res);
  if (!res.ok) {
    const message = "error" in body && body.error ? body.error : "Request failed.";
    throw new Error(message);
  }
  return "data" in body ? body.data : (undefined as T);
};

async function fetchVolunteerHistory(params: VolunteerHistoryParams): Promise<VolunteerHistoryResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    sortKey: params.sortKey,
    sortDir: params.sortDir,
    search: params.search,
    status: params.filters.status.join(","),
    dateFrom: params.filters.dateFrom ?? "",
    dateTo: params.filters.dateTo ?? "",
  });
  const res = await fetch(`${HISTORY_ENDPOINT}?${query.toString()}`);
  return handleResponse<VolunteerHistoryResponse>(res);
}

async function exportVolunteerHistoryCSV(params: VolunteerHistoryParams) {
  try {
    const data = await fetchVolunteerHistory(params);
    const rows = data.items.map((item) => [
      item.volunteerName,
      item.assignment,
      item.eventDate,
      item.status,
      String(item.hours ?? ""),
      item.location,
    ]);
    const header = ["Volunteer", "Assignment", "Event Date", "Status", "Hours", "Location"];
    const csv = [header, ...rows]
      .map((cols) => cols.map((col) => `"${col.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "volunteer-history.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export volunteer history", error);
    throw error;
  }
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

// component
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
    filters: { status: [] },
  });

  const hasFilters = useMemo(() => {
    const f = params.filters;
    return !!(params.search.trim() || f.status.length || f.dateFrom || f.dateTo);
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

  const toggleStatusFilter = (value: ParticipationStatus) =>
    setFilter(
      "status",
      params.filters.status.includes(value)
        ? params.filters.status.filter((x) => x !== value)
        : [...params.filters.status, value]
    );

  const clearFilters = () =>
    setParams((p) => ({ ...p, page: 1, search: "", filters: { status: [] } }));

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
          <p className="text-base text-stone-500">Track volunteers.</p>
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
            <span className="text-sm font-semibold text-stone-700">Status</span>
            <div className="flex flex-wrap gap-3">
              {STATUS_OPTIONS.map((opt) => {
                const on = params.filters.status.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleStatusFilter(opt)}
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

              {!ui.loading && data.map((x) => {
                  const badgeClass = statusBadge(x.status);
                  const isSel = x.id === ui.selectedId;
                  return (
                    <tr
                      key={x.id}
                      onClick={() => setUi((u) => ({ ...u, selectedId: u.selectedId === x.id ? "" : x.id }))}
                      className={`cursor-pointer transition ${isSel ? "bg-amber-100" : "hover:bg-amber-50"}`}
                    >
                      <td className="px-4 py-4 font-semibold text-stone-900">{x.volunteerName}</td>
                      <td className="px-4 py-4 text-stone-600">{x.assignment}</td>
                      <td className="px-4 py-4 text-stone-600">{fmtDate(x.eventDate)}</td>
                      <td className="px-4 py-4"><span className={badgeClass}>{x.status.replace("CheckedIn", "Checked In")}</span></td>
                      <td className="px-4 py-4 text-stone-600">{x.hours ?? "—"}</td>
                      <td className="px-4 py-4 text-stone-600">{x.location}</td>
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
