import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx-js-style";
import "../styles/bookings.css";

const formatDate = (d) =>
    d ? new Date(d).toISOString().split("T")[0] : "";

const formatStatus = (s) => {
    if (s === "POTVRDJENO") return "Potvrđeno";
    if (s === "NA_CEKANJU") return "Na čekanju";
    if (s === "ODBIJENO") return "Odbijeno";
    return s;
};

// 🟦 EXCEL HEADER STYLE
const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4472C4" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
    },
};

export default function BookingsPage() {
    const navigate = useNavigate();

    // 🔐 USER
    const user = JSON.parse(localStorage.getItem("user"));
    const isAdmin = user?.role === "ADMIN";

    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({});
    const [selected, setSelected] = useState(null);

    const [filmFilter, setFilmFilter] = useState("Svi");
    const [partnerFilter, setPartnerFilter] = useState("Svi");

    // =========================
    // FETCH BOOKINGS + STATS (ROLE BASED)
    // =========================
    const fetchData = () => {
        fetch(
            `${import.meta.env.VITE_API_URL}/api/bookings?userId=${user.id}&role=${user.role}`
        )
            .then((res) => res.json())
            .then(setBookings);

        fetch(
            `${import.meta.env.VITE_API_URL}/api/bookings/stats?userId=${user.id}&role=${user.role}`
        )
            .then((res) => res.json())
            .then(setStats);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const films = useMemo(
        () => ["Svi", ...new Set(bookings.map((b) => b.film))],
        [bookings]
    );

    const partners = useMemo(
        () => ["Svi", ...new Set(bookings.map((b) => b.partner))],
        [bookings]
    );

    const filtered = useMemo(() => {
        return bookings.filter(
            (b) =>
                (filmFilter === "Svi" || b.film === filmFilter) &&
                (partnerFilter === "Svi" || b.partner === partnerFilter)
        );
    }, [bookings, filmFilter, partnerFilter]);

    // =========================
    // DELETE BOOKING (ADMIN ONLY)
    // =========================
    const handleDeleteBooking = async (id) => {


        if (!window.confirm("Da li ste sigurni da želite izbrisati booking?"))
            return;

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bookings/${id}?userId=${user.id}&role=${user.role}`,
                {
                    method: "DELETE",
                }
            );


            if (!res.ok) {
                alert("Greška pri brisanju booking-a");
                return;
            }

            setBookings((prev) => prev.filter((b) => b.id !== id));
            setSelected(null);
            fetchData();
        } catch {
            alert("Greška pri komunikaciji sa serverom");
        }
    };

    // =========================
    // EXPORT TO EXCEL (ADMIN ONLY)
    // =========================
    const handleExportBooking = (b) => {
        if (!isAdmin) return;

        // ===== STILOVI =====
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
            fill: { fgColor: { rgb: "3b82f6" } }, // tamno plava
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
            },
        };

        const cellStyle = {
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
            },
        };

        const statusStyle = {
            ...cellStyle,
            font: { bold: true },
            fill:
                b.status === "POTVRDJENO"
                    ? { fgColor: { rgb: "C6EFCE" } }
                    : b.status === "ODBIJENO"
                        ? { fgColor: { rgb: "FFC7CE" } }
                        : { fgColor: { rgb: "FFEB9C" } },
        };

        // ===== SHEET =====
        const ws = {
            A1: { v: "Film", s: headerStyle },
            B1: { v: "Partner", s: headerStyle },
            C1: { v: "Datum početka", s: headerStyle },
            D1: { v: "Datum završetka", s: headerStyle },
            E1: { v: "Materijal", s: headerStyle },
            F1: { v: "Status", s: headerStyle },
            G1: { v: "Kreirao", s: headerStyle },
            H1: { v: "Kreirano", s: headerStyle },

            A2: { v: b.film, s: cellStyle },
            B2: { v: b.partner, s: cellStyle },
            C2: { v: formatDate(b.datum_od), s: cellStyle },
            D2: { v: formatDate(b.datum_do), s: cellStyle },
            E2: { v: b.tip_materijala, s: cellStyle },
            F2: { v: formatStatus(b.status), s: statusStyle },
            G2: { v: b.created_by, s: cellStyle },
            H2: { v: formatDate(b.created_at), s: cellStyle },

            "!ref": "A1:H2",

            // ===== ŠIRINE KOLONA =====
            "!cols": [
                { wch: 20 },
                { wch: 22 },
                { wch: 18 },
                { wch: 18 },
                { wch: 14 },
                { wch: 14 },
                { wch: 16 },
                { wch: 16 },
            ],

            // ===== VISINA REDOVA =====
            "!rows": [
                { hpt: 28 }, // header
                { hpt: 24 }, // data
            ],
        };

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Booking");

        XLSX.writeFile(wb, `booking_${b.film}_${b.partner}.xlsx`);
    };




    return (
        <div className="bookings-page">
            <div className="bookings-container">
                <h1 className="page-title">Booking</h1>

                {/* STATS */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-number">{stats.total}</div>
                        <div className="stat-label">Ukupno booking-a</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.confirmed}</div>
                        <div className="stat-label">Potvrđeni</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.rejected}</div>
                        <div className="stat-label">Odbijeni</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.waiting}</div>
                        <div className="stat-label">Na čekanju</div>
                    </div>
                </div>

                {/* CONTROLS */}
                {/* CONTROLS */}<div className="bookings-controls">
                <button
                    className="btn-primary"
                    onClick={() => navigate("/bookings/add")}
                >
                    + Dodaj Booking
                </button>

                {isAdmin && (
                    <div className="controls-right">
                        <div className="filter-select-wrap">
                            <select
                                className="filter-select"
                                value={filmFilter}
                                onChange={(e) => setFilmFilter(e.target.value)}
                            >
                                {films.map((f) => (
                                    <option key={f} value={f}>
                                        {f}
                                    </option>
                                ))}
                            </select>
                            <span className="select-caret">▼</span>
                        </div>

                        <div className="filter-select-wrap">
                            <select
                                className="filter-select"
                                value={partnerFilter}
                                onChange={(e) => setPartnerFilter(e.target.value)}
                            >
                                {partners.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                            <span className="select-caret">▼</span>
                        </div>
                    </div>
                )}
            </div>



                {/* TABLE */}
                <div className="booking-table-wrapper">
                    <div className="booking-table-head">
                        <div>Film</div>
                        <div>Partner</div>
                        <div>Početak</div>
                        <div>Kraj</div>
                        <div>Materijal</div>
                        <div>Status</div>
                        <div>Kreirao</div>
                        <div>Kreirano</div>
                        <div>Detalji</div>
                    </div>

                    <div className="booking-table-body">
                        {filtered.map((b) => (
                            <div className="booking-row" key={b.id}>
                                <div>{b.film}</div>
                                <div>{b.partner}</div>
                                <div>{formatDate(b.datum_od)}</div>
                                <div>{formatDate(b.datum_do)}</div>
                                <div>{b.tip_materijala}</div>
                                <div
                                    className={`status ${
                                        b.status === "POTVRDJENO"
                                            ? "confirmed"
                                            : b.status === "NA_CEKANJU"
                                                ? "pending"
                                                : "rejected"
                                    }`}
                                >
                                    {formatStatus(b.status)}
                                </div>
                                <div>{b.created_by}</div>
                                <div>{formatDate(b.created_at)}</div>
                                <div>
                                    <button className="btn-details" onClick={() => setSelected(b)}>
                                        Detalji
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selected.film}</h2>
                            <button className="modal-close" onClick={() => setSelected(null)}>
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <p>
                                <strong>Partner:</strong> {selected.partner}
                            </p>
                            <p>
                                <strong>Od:</strong> {formatDate(selected.datum_od)}
                            </p>
                            <p>
                                <strong>Do:</strong> {formatDate(selected.datum_do)}
                            </p>
                            <p>
                                <strong>Status:</strong> {formatStatus(selected.status)}
                            </p>
                        </div>

                        <div className="modal-footer">
                            {isAdmin && (
                                <button
                                    className="btn-export"
                                    onClick={() => handleExportBooking(selected)}
                                >
                                    Export u Excel
                                </button>
                            )}

                            {(isAdmin || selected.created_by_id === user.id) && (
                                <button
                                    className="btn-delete"
                                    onClick={() => handleDeleteBooking(selected.id)}
                                >
                                    Izbriši booking
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
