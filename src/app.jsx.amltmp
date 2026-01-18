import { useEffect, useMemo, useState } from "react";

function isActive(st, year) {
  const by = st.begin_year ?? -9999;
  const ey = st.end_year ?? 9999;
  return by <= year && year <= ey;
}

export default function App() {
  const [data, setData] = useState(null);
  const [year, setYear] = useState(null);
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
    return stations.filter((s) => {
      if (!qq) return true;
      return (
        (s.station_id || "").toLowerCase().includes(qq) ||
        (s.name || "").toLowerCase().includes(qq) ||
        (s.country || "").toLowerCase().includes(qq)
      );
    });
  }, [stations, q]);

  const counts = useMemo(() => {
    if (!filtered.length || !year) return { active: 0, inactive: 0, total: filtered.length };
    let a = 0;
    for (const s of filtered) if (isActive(s, year)) a++;
    return { active: a, inactive: filtered.length - a, total: filtered.length };
  }, [filtered, year]);

  if (!url) {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui" }}>
        <h2>AFRIMET Dashboard</h2>
        <p><b>Missing VITE_STATIONS_URL.</b> Set it in <code>.env.local</code>.</p>
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
        <p style={{ color: "crimson" }}>Failed to load stations_status.json: {data.error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 1100, margin: "0 auto" }}>
      <h2>AFRIMET Stations Dashboard</h2>
      <p style={{ opacity: 0.8, marginTop: 0 }}>
        Data generated at: <code>{data.generated_at}</code>
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, minWidth: 220 }}>
          <div style={{ opacity: 0.7 }}>Active</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{counts.active}</div>
        </div>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, minWidth: 220 }}>
          <div style={{ opacity: 0.7 }}>Inactive</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{counts.inactive}</div>
        </div>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, minWidth: 220 }}>
          <div style={{ opacity: 0.7 }}>Total</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{counts.total}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <label>
          Year:&nbsp;
          <select value={year ?? ""} onChange={(e) => setYear(Number(e.target.value))}>
            {years.length ? years.map((y) => <option key={y} value={y}>{y}</option>) : null}
          </select>
        </label>

        <input
          style={{ padding: 8, borderRadius: 10, border: "1px solid #ccc", minWidth: 260 }}
          placeholder="Search station id / name / country…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 14, border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
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
                <tr key={s.station_id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: 10 }}><code>{s.station_id}</code></td>
                  <td style={{ padding: 10 }}>{s.name || "-"}</td>
                  <td style={{ padding: 10 }}>{s.country || "-"}</td>
                  <td style={{ padding: 10 }}>{s.begin_year ?? "-"}</td>
                  <td style={{ padding: 10 }}>{s.end_year ?? "-"}</td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{active ? "Active" : "Inactive"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: 10, opacity: 0.7 }}>
          Showing first 200 results. (We’ll add pagination + map next.)
        </div>
      </div>
    </div>
  );
}
