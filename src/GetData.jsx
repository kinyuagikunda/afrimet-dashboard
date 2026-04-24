import { useMemo, useState } from "react";

function isActive(station, year) {
  const begin = Number(station.begin_year);
  const end = station.end_year ? Number(station.end_year) : new Date().getFullYear();

  if (!year) return true;
  return begin <= year && end >= year;
}

function downloadCsv(rows, year) {
  const headers = ["station_id", "name", "country", "begin_year", "end_year", "status"];

  const csv = [
    headers.join(","),
    ...rows.map((s) =>
      [
        s.station_id ?? "",
        s.name ?? "",
        s.country ?? "",
        s.begin_year ?? "",
        s.end_year ?? "",
        year ? (isActive(s, year) ? "Active" : "Inactive") : "",
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `afrimet_filtered_data_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

export default function GetData({ stations = [] }) {
  const currentYear = new Date().getFullYear();

  const countries = useMemo(() => {
    return [...new Set(stations.map((s) => s.country).filter(Boolean))].sort();
  }, [stations]);

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState(currentYear);
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    return stations.filter((s) => {
      const text = `${s.station_id ?? ""} ${s.name ?? ""} ${s.country ?? ""}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCountry = !country || s.country === country;

      const active = isActive(s, Number(year));
      const matchesStatus =
        status === "all" ||
        (status === "active" && active) ||
        (status === "inactive" && !active);

      return matchesSearch && matchesCountry && matchesStatus;
    });
  }, [stations, search, country, year, status]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Get Data</h1>
      <p>Filter station records and download the selected data as CSV.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search station, name, country..."
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={year}
          min="1900"
          max={currentYear}
          onChange={(e) => setYear(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="all">All status</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <button
          onClick={() => downloadCsv(filtered, Number(year))}
          disabled={!filtered.length}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Download CSV
        </button>

        <button
          onClick={() => {
            setSearch("");
            setCountry("");
            setYear(currentYear);
            setStatus("all");
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Reset filters
        </button>

        <strong>{filtered.length}</strong> records selected
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
        <thead>
          <tr>
            {["Station ID", "Name", "Country", "Begin", "End", "Status"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #ddd" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filtered.slice(0, 200).map((s) => (
            <tr key={s.station_id}>
              <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{s.station_id}</td>
              <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{s.name}</td>
              <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{s.country}</td>
              <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{s.begin_year}</td>
              <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{s.end_year || "Present"}</td>
              <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>
                {isActive(s, Number(year)) ? "Active" : "Inactive"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length > 200 && (
        <p style={{ marginTop: 10 }}>
          Showing first 200 records. The CSV download includes all {filtered.length} records.
        </p>
      )}
    </div>
  );
}
