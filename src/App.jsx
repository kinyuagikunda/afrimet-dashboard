import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

function isActive(st, year) {
  const by = typeof st.begin_year === "number" ? st.begin_year : -9999;
  const ey = typeof st.end_year === "number" ? st.end_year : 9999;
  return by <= year && year <= ey;
}

function activeCountForYear(stations, year) {
  let active = 0;
  for (const s of stations) {
    const by = typeof s.begin_year === "number" ? s.begin_year : -9999;
    const ey = typeof s.end_year === "number" ? s.end_year : 9999;
    if (by <= year && year <= ey) active++;
  }
  return active;
}

export default function App() {
  const [data, setData] = useState(null);
  const [year, setYear] = useState(null);

  // Navigation
  const [page, setPage] = useState("reported"); // reported | stations

  // Search controls (for reported page)
  const [searchBy, setSearchBy] = useState("all"); // all | station | name | country
  const [q, setQ] = useState("");

  const url = import.meta.env.VITE_STATIONS_URL;

  useEffect(() => {
    if (!url) return;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        setData(j);
        setYear(j.default_year);
      })
      .catch((e) => setData({ error: String(e) }));
  }, [url]);

  const stations = data?.stations ?? [];

  const years = useMemo(() => {
    if (!stations.length) return [];
    const ys = new Set();
    for (const s of stations) {
      if (typeof s.begin_year === "number") ys.add(s.begin_year);
      if (typeof s.end_year === "number") ys.add(s.end_year);
    }
    return Array.from(ys).sort((a, b) => a - b);
  }, [stations]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return stations;

    return stations.filter((s) => {
      const station = (s.station_id || "").toLowerCase();
      const name = (s.name || "").toLowerCase();
      const country = (s.country || "").toLowerCase();

      if (searchBy === "station") return station.includes(qq);
      if (searchBy === "name") return name.includes(qq);
      if (searchBy === "country") return country.includes(qq);

      // default: all
      return station.includes(qq) || name.includes(qq) || country.includes(qq);
    });
  }, [stations, q, searchBy]);

  const counts = useMemo(() => {
    if (!filtered.length || !year)
      return { active: 0, inactive: 0, total: filtered.length };
    let a = 0;
    for (const s of filtered) if (isActive(s, year)) a++;
    return { active: a, inactive: filtered.length - a, total: filtered.length };
  }, [filtered, year]);

  const stationActivitySeries = useMemo(() => {
    if (!stations.length) return [];
    const startYear = 1900;
    const endYear = data?.default_year ?? new Date().getUTCFullYear();
    const total = stations.length;

    const series = [];
    for (let y = startYear; y <= endYear; y++) {
      const active = activeCountForYear(stations, y);
      series.push({
        year: y,
        active,
        inactive: total - active,
        total,
      });
    }
    return series;
  }, [stations, data?.default_year]);

  if (!url) {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui" }}>
        <h2>AFRIMET Dashboard</h2>
        <p>
          <b>Missing VITE_STATIONS_URL.</b> Set it via GitHub Secret or{" "}
          <code>.env.local</code>.
        </p>
      </div>
    );
  }

  if (!data) {
    return <div style={{ padding: 16, fontFamily: "system-ui" }}>Loading…</div>;
  }

  if (data.error) {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui" }}>
        <h2>AFRIMET Dashboard</h2>
        <p style={{ color: "crimson" }}>
          Failed to load stations_status.json: {data.error}
        </p>
      </div>
    );
  }

  const MenuItem = ({ id, label }) => {
    const active = page === id;
    return (
      <button
        onClick={() => setPage(id)}
        style={{
          textAlign: "left",
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #e6e6e6",
          background: active ? "#f2f2f2" : "white",
          cursor: "pointer",
          fontWeight: active ? 800 : 600,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "system-ui" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid #eee",
        }}
      >
        <img
          src="/acmad-logo.png"
          alt="ACMAD logo"
          style={{ height: 40, width: "auto" }}
        />
        <div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>
            Afrimet - Africa Hourly - Integrated Surface Database (ISD)
          </div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>
            Generated at <code>{data.generated_at}</code>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 260,
            padding: 14,
            borderRight: "1px solid #eee",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 900, opacity: 0.75 }}>Menu</div>
          <MenuItem id="reported" label="Reported data" />
          <MenuItem id="stations" label="Stations activity since 1900" />
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: 16, maxWidth: 1200 }}>
          {page === "reported" ? (
            <>
              <h3 style={{ marginTop: 0 }}>Reported data</h3>

              {/* KPIs */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    padding: 12,
                    minWidth: 220,
                  }}
                >
                  <div style={{ opacity: 0.7 }}>Active (year {year ?? "-"})</div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>
                    {counts.active}
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    padding: 12,
                    minWidth: 220,
                  }}
                >
                  <div style={{ opacity: 0.7 }}>
                    Inactive (year {year ?? "-"})
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>
                    {counts.inactive}
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    padding: 12,
                    minWidth: 220,
                  }}
                >
                  <div style={{ opacity: 0.7 }}>Total (after filter)</div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>
                    {counts.total}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <label>
                  Year:&nbsp;
                  <select
                    value={year ?? ""}
                    onChange={(e) => setYear(Number(e.target.value))}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Search by:&nbsp;
                  <select
                    value={searchBy}
                    onChange={(e) => setSearchBy(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="station">Station</option>
                    <option value="name">Name</option>
                    <option value="country">Country</option>
                  </select>
                </label>

                <input
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    border: "1px solid #ccc",
                    minWidth: 280,
                  }}
                  placeholder={
                    searchBy === "all"
                      ? "Search station / name / country…"
                      : `Search ${searchBy}…`
                  }
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />

                <button
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #ccc",
                    background: "white",
                    cursor: "pointer",
                  }}
                  onClick={() => setQ("")}
                  disabled={!q}
                  title="Clear search"
                >
                  Clear
                </button>
              </div>

              {/* Table */}
              <div
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#fafafa" }}>
                    <tr>
                      <th style={{ textAlign: "left", padding: 10 }}>Station</th>
                      <th style={{ textAlign: "left", padding: 10 }}>Name</th>
                      <th style={{ textAlign: "left", padding: 10 }}>Country</th>
                      <th style={{ textAlign: "left", padding: 10 }}>Begin</th>
                      <th style={{ textAlign: "left", padding: 10 }}>End</th>
                      <th style={{ textAlign: "left", padding: 10 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 200).map((s) => {
                      const active = year ? isActive(s, year) : false;
                      return (
                        <tr
                          key={s.station_id}
                          style={{ borderTop: "1px solid #eee" }}
                        >
                          <td style={{ padding: 10 }}>
                            <code>{s.station_id}</code>
                          </td>
                          <td style={{ padding: 10 }}>{s.name || "-"}</td>
                          <td style={{ padding: 10 }}>{s.country || "-"}</td>
                          <td style={{ padding: 10 }}>{s.begin_year ?? "-"}</td>
                          <td style={{ padding: 10 }}>{s.end_year ?? "-"}</td>
                          <td style={{ padding: 10, fontWeight: 800 }}>
                            {active ? "Active" : "Inactive"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ padding: 10, opacity: 0.7 }}>
                  Showing first 200 results.
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 style={{ marginTop: 0 }}>Stations activity since 1900</h3>

              <div
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                  background: "white",
                }}
              >
                <div style={{ marginBottom: 8, fontWeight: 800 }}>
                  Active vs Inactive stations (1900 → {data.default_year})
                </div>

                <div style={{ height: 420 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stationActivitySeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="active" dot={false} />
                      <Line type="monotone" dataKey="inactive" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ opacity: 0.75, fontSize: 12, marginTop: 8 }}>
                  Total stations: <b>{stations.length}</b>. Status is computed
                  from begin/end years in the stations metadata.
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
