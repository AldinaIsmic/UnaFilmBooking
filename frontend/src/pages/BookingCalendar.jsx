import { useEffect, useMemo, useState } from "react";
import "../styles/BookingCalendar.css";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec",
];

const dayHeaders = ["PON", "UTO", "SRI", "ČET", "PET", "SUB", "NED"];

function mondayFirstIndex(date) {
  return (date.getDay() + 6) % 7;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function toKey(dateStr) {
    // uzmi samo YYYY-MM-DD (ako dođe T... odsijeci)
    const s = String(dateStr || "").slice(0, 10); // "2025-12-29"
    const [y, m, d] = s.split("-").map(Number);
    return y * 10000 + m * 100 + d; // 20251229
}

function isBookingOnDay(b, y, m, d) {
    const cellKey = y * 10000 + (m + 1) * 100 + d;

    const fromKey = toKey(b.datum_od);
    const toKeyVal = toKey(b.datum_do);

    return cellKey >= fromKey && cellKey <= toKeyVal; // inclusive: od → do
}

export default function BookingCalendarPage() {
  const [viewDate, setViewDate] = useState(new Date(2025, 11, 1));
  const [film, setFilm] = useState("Svi filmovi");
  const [partner, setPartner] = useState("Svi partneri");
  const [status, setStatus] = useState("Svi statusi");

  const [bookings, setBookings] = useState([]);
  const [hoverDay, setHoverDay] = useState(null); // tooltip for day

  useEffect(() => {
    fetch("http://localhost:3000/api/calendar")
        .then((res) => res.json())
        .then((data) => setBookings(data))
        .catch(() => setBookings([]));
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDays = daysInMonth(year, month);

  const cells = useMemo(() => {
    const offset = mondayFirstIndex(new Date(year, month, 1));
    return Array.from({ length: 42 }, (_, i) => {
      const d = i - offset + 1;
      return d >= 1 && d <= totalDays ? d : null;
    });
  }, [year, month, totalDays]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (film !== "Svi filmovi" && b.film !== film) return false;
      if (partner !== "Svi partneri" && b.partner !== partner) return false;
      if (status !== "Svi statusi" && b.status !== status) return false;
      return true;
    });
  }, [bookings, film, partner, status]);

  const uniqueFilms = useMemo(
      () => [...new Set(bookings.map((b) => b.film))].filter(Boolean),
      [bookings]
  );
  const uniquePartners = useMemo(
      () => [...new Set(bookings.map((b) => b.partner))].filter(Boolean),
      [bookings]
  );

  const prevMonth = () =>
      setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
      setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const goToday = () => {
    const t = new Date();
    setViewDate(new Date(t.getFullYear(), t.getMonth(), 1));
  };

  const resetFilters = () => {
    setFilm("Svi filmovi");
    setPartner("Svi partneri");
    setStatus("Svi statusi");
  };

  const bookingsForDay = (day) =>
      filtered.filter((b) => isBookingOnDay(b, year, month, day));

  return (
      <div className="bc-page">
        <div className="bc-container">
          <h1 className="bc-title">Booking kalendar</h1>

          {/* FILTERS + RESET */}
          <div className="bc-top">
            <div className="bc-filters">
              <div className="bc-filter">
                <div className="bc-label">Film</div>
                <div className="bc-select-wrap">
                  <select
                      className="bc-select"
                      value={film}
                      onChange={(e) => setFilm(e.target.value)}
                  >
                    <option>Svi filmovi</option>
                    {uniqueFilms.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                    ))}
                  </select>
                  <span className="bc-caret">▾</span>
                </div>
              </div>

              <div className="bc-filter">
                <div className="bc-label">Partner</div>
                <div className="bc-select-wrap">
                  <select
                      className="bc-select"
                      value={partner}
                      onChange={(e) => setPartner(e.target.value)}
                  >
                    <option>Svi partneri</option>
                    {uniquePartners.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                    ))}
                  </select>
                  <span className="bc-caret">▾</span>
                </div>
              </div>

              <div className="bc-filter">
                <div className="bc-label">Status</div>
                <div className="bc-select-wrap">
                  <select
                      className="bc-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>Svi statusi</option>
                    <option>POTVRDJENO</option>
                    <option>NA_CEKANJU</option>
                    <option>ODBIJENO</option>
                  </select>
                  <span className="bc-caret">▾</span>
                </div>
              </div>
            </div>

            <button className="bc-reset" onClick={resetFilters}>
              Reset filtera
            </button>
          </div>

          {/* MONTH BAR */}
          <div className="bc-monthbar">
            <div className="bc-week-spacer" />
            <div className="bc-month-controls">
              <button className="bc-circle" onClick={prevMonth} aria-label="Prev">
                ‹
              </button>
              <div className="bc-monthtext">
                {monthNames[month]} {year}
              </div>
              <button className="bc-circle" onClick={nextMonth} aria-label="Next">
                ›
              </button>
              <button className="bc-today" onClick={goToday}>
                Danas
              </button>
            </div>
          </div>

          {/* WEEK HEAD */}
          <div className="bc-weekhead">
            {dayHeaders.map((d) => (
                <div className="bc-weekday" key={d}>
                  {d}
                </div>
            ))}
          </div>

          {/* GRID */}
          <div className="bc-grid">
            {cells.map((day, i) => {
              const dayBookings = day ? bookingsForDay(day) : [];
              const showTooltip = day && hoverDay === day && dayBookings.length > 0;

              return (
                  <div
                      key={i}
                      className={`bc-cell ${day ? "" : "bc-empty"} ${
                          showTooltip ? "bc-cell-hovered" : ""
                      }`}
                      onMouseEnter={() => day && setHoverDay(day)}
                      onMouseLeave={() => setHoverDay(null)}
                  >
                    {day && (
                        <>
                          <div className="bc-daynum">{day}</div>

                            <div className="bc-pills">
                                {dayBookings.slice(0, 2).map((b) => (
                                    <div
                                        key={b.id}
                                        className={`bc-pill bc-${b.status.toLowerCase()}`}
                                    >
                                        {b.film} - {b.partner}
                                    </div>
                                ))}
                            </div>

                            {showTooltip && (
                              <div className="bc-tooltip">
                                <div className="bc-tooltip-title">Bookinzi:</div>
                                {dayBookings.map((b) => (
                                    <div className="bc-tooltip-item" key={b.id}>
                                      • {b.film} - {b.partner}
                                    </div>
                                ))}
                              </div>
                          )}
                        </>
                    )}
                  </div>
              );
            })}
          </div>
        </div>
      </div>
  );
}
