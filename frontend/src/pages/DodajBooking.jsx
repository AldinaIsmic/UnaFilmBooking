import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/DodajBooking.css";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export default function AddBookingPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const user = JSON.parse(localStorage.getItem("user"));
    const isAdmin = user?.role === "ADMIN";

    const [films, setFilms] = useState([]);
    const [partners, setPartners] = useState([]);

    const [form, setForm] = useState({
        film_id: "",
        partner_id: "",
        datum_od: "",
        datum_do: "",
        tip_materijala: "DCP",
        napomena: "",
        status: "POTVRDJENO"
    });

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/movies`)
            .then(res => res.json())
            .then(setFilms);

        fetch(`${import.meta.env.VITE_API_URL}/api/partners`)
            .then(res => res.json())
            .then(setPartners);
    }, []);

    const onChange = (e) => {
        const { name, value, type } = e.target;
        if (type === "radio") {
            setForm(s => ({ ...s, status: value }));
            return;
        }
        setForm(s => ({ ...s, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!form.film_id || !form.partner_id || !form.datum_od || !form.datum_do) {
            alert("Popuni sva obavezna polja");
            return;
        }

        const payload = {
            film_id: Number(form.film_id),
            partner_id: Number(form.partner_id),
            datum_od: form.datum_od,
            datum_do: form.datum_do,
            tip_materijala: form.tip_materijala,
            status: form.status,
            napomena: form.napomena,
            created_by: user?.id || 1
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error();

            navigate("/bookings");
        } catch {
            alert("Greška pri spremanju booking-a");
        }
    };

    const pages = ["/bookings/add", "/movies/add", "/partners/add"];
    const currentIndex = pages.indexOf(location.pathname);

    const goNext = () => navigate(pages[(currentIndex + 1) % pages.length]);
    const goPrev = () => navigate(pages[(currentIndex - 1 + pages.length) % pages.length]);

    return (
        <div className="ab-page">
            <h1 className="ab-page-title">Dodaj Booking</h1>
            <div className="ab-divider"></div>

            <div className="ab-card">
                <div className="ab-card-top">
                    <div>
                        <div className="ab-kicker">FORMULAR</div>
                        <div className="ab-title">Dodaj Booking</div>
                    </div>
                    <div className="ab-right-tag">Booking</div>
                </div>

                <form onSubmit={onSubmit}>
                    <div className="ab-grid">

                        <div className="ab-field">
                            <label>Odaberi Film</label>
                            <div className="ab-select-wrap">
                                <select
                                    name="film_id"
                                    value={form.film_id}
                                    onChange={onChange}
                                >
                                    <option value="">Film</option>
                                    {films.map(f => (
                                        <option key={f.id} value={f.id}>{f.naziv}</option>
                                    ))}
                                </select>
                                <span className="ab-caret">▾</span>
                            </div>
                        </div>

                        <div className="ab-field">
                            <label>Odaberi Partnera</label>
                            <div className="ab-select-wrap">
                                <select
                                    name="partner_id"
                                    value={form.partner_id}
                                    onChange={onChange}
                                >
                                    <option value="">Partner</option>
                                    {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.naziv}</option>
                                    ))}
                                </select>
                                <span className="ab-caret">▾</span>
                            </div>
                        </div>

                        <div className="ab-field ab-date-field">
                            <label>Datum početka</label>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={form.datum_od ? dayjs(form.datum_od) : null}
                                    format="MM / DD / YYYY"
                                    onChange={(newValue) =>
                                        setForm(s => ({
                                            ...s,
                                            datum_od: newValue ? newValue.format("YYYY-MM-DD") : ""
                                        }))
                                    }
                                    slotProps={{
                                        popper: {
                                            placement: "bottom-end",
                                            disablePortal: true,
                                            className: "ab-datepicker-popper",
                                            modifiers: [
                                                {
                                                    name: "flip",
                                                    enabled: false
                                                },
                                                {
                                                    name: "preventOverflow",
                                                    enabled: true,
                                                    options: {
                                                        padding: 8
                                                    }
                                                }
                                            ],
                                            sx: (theme) => {
                                                const isDark = theme.palette.mode === "dark";

                                                return {
                                                    zIndex: 2000,

                                                    "& .MuiPaper-root": {
                                                        backgroundColor: isDark ? "#020617" : "#ffffff",
                                                        color: isDark ? "#e5e7eb" : "#0f172a",
                                                        borderRadius: "14px",
                                                        border: isDark
                                                            ? "1px solid #1e293b"
                                                            : "1px solid #e5e7eb",
                                                        boxShadow: isDark
                                                            ? "0 25px 50px rgba(0,0,0,.7)"
                                                            : "0 25px 50px rgba(0,0,0,.15)"
                                                    },

                                                    "& .MuiPickersCalendarHeader-label": {
                                                        color: isDark ? "#e5e7eb" : "#0f172a",
                                                        fontWeight: 600
                                                    },

                                                    "& .MuiPickersArrowSwitcher-button": {
                                                        color: isDark ? "#94a3b8" : "#64748b"
                                                    },

                                                    "& .MuiDayCalendar-weekDayLabel": {
                                                        color: isDark ? "#64748b" : "#94a3b8",
                                                        fontWeight: 600
                                                    },

                                                    "& .MuiPickersDay-root": {
                                                        color: isDark ? "#e5e7eb" : "#0f172a",
                                                        borderRadius: "10px"
                                                    },

                                                    "& .MuiPickersDay-root:hover": {
                                                        backgroundColor: isDark ? "#1e293b" : "#e5e7eb"
                                                    },

                                                    "& .MuiPickersDay-today": {
                                                        border: "1px solid #3b82f6"
                                                    },

                                                    "& .MuiPickersDay-root.Mui-selected": {
                                                        backgroundColor: "#3b82f6",
                                                        color: "#ffffff"
                                                    },

                                                    "& .MuiPickersDay-root.Mui-disabled": {
                                                        color: isDark ? "#475569" : "#cbd5e1"
                                                    }
                                                };
                                            }
                                        },

                                        textField: {
                                            fullWidth: true,
                                            placeholder: "MM / DD / YYYY",
                                            InputProps: {
                                                sx: {
                                                    height: "44px",
                                                    borderRadius: "10px",
                                                    fontSize: "14px",
                                                    fontFamily:
                                                        "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
                                                }
                                            },
                                            sx: (theme) => {
                                                const isDark = theme.palette.mode === "dark";

                                                return {
                                                    "& .MuiOutlinedInput-root": {
                                                        height: "44px",
                                                        borderRadius: "10px",
                                                        backgroundColor: isDark ? "#0f172a" : "#ffffff"
                                                    },

                                                    "& .MuiOutlinedInput-input": {
                                                        padding: "0 40px 0 16px",
                                                        color: isDark ? "#e5e7eb" : "#0f172a"
                                                    },

                                                    "& .MuiIconButton-root": {
                                                        color: isDark ? "#94a3b8" : "#6b7280"
                                                    },

                                                    "& .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: isDark ? "#1e293b" : "#e5e7eb"
                                                    },

                                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#3b82f6"
                                                    },

                                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#3b82f6",
                                                        boxShadow: isDark
                                                            ? "0 0 0 3px rgba(59,130,246,.35)"
                                                            : "0 0 0 3px rgba(59,130,246,.12)"
                                                    },

                                                    "& input::placeholder": {
                                                        color: isDark ? "#94a3b8" : "#9ca3af",
                                                        opacity: 1
                                                    }
                                                };
                                            }
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </div>

                        <div className="ab-field ab-date-field">
                            <label>Datum završetka</label>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={form.datum_do ? dayjs(form.datum_do) : null}
                                    format="MM / DD / YYYY"
                                    onChange={(newValue) =>
                                        setForm((s) => ({
                                            ...s,
                                            datum_do: newValue ? newValue.format("YYYY-MM-DD") : "",
                                        }))
                                    }
                                    slotProps={{
                                        popper: {
                                            placement: "bottom-end",
                                            disablePortal: true,
                                            className: "ab-datepicker-popper",
                                            modifiers: [
                                                {
                                                    name: "flip",
                                                    enabled: false
                                                },
                                                {
                                                    name: "preventOverflow",
                                                    enabled: true,
                                                    options: {
                                                        padding: 8
                                                    }
                                                }
                                            ],
                                            sx: (theme) => {
                                                const isDark = theme.palette.mode === "dark";

                                                return {
                                                    zIndex: 2000,

                                                    "& .MuiPaper-root": {
                                                        backgroundColor: isDark ? "#020617" : "#ffffff",
                                                        color: isDark ? "#e5e7eb" : "#0f172a",
                                                        borderRadius: "14px",
                                                        border: isDark ? "1px solid #1e293b" : "1px solid #e5e7eb",
                                                        boxShadow: isDark
                                                            ? "0 25px 50px rgba(0,0,0,.7)"
                                                            : "0 25px 50px rgba(0,0,0,.15)",
                                                    },

                                                    "& .MuiPickersCalendarHeader-label": {
                                                        color: isDark ? "#e5e7eb" : "#0f172a",
                                                        fontWeight: 600,
                                                    },

                                                    "& .MuiPickersArrowSwitcher-button": {
                                                        color: isDark ? "#94a3b8" : "#64748b",
                                                    },

                                                    "& .MuiDayCalendar-weekDayLabel": {
                                                        color: isDark ? "#64748b" : "#94a3b8",
                                                        fontWeight: 600,
                                                    },

                                                    "& .MuiPickersDay-root": {
                                                        color: isDark ? "#e5e7eb" : "#0f172a",
                                                        borderRadius: "10px",
                                                    },

                                                    "& .MuiPickersDay-root:hover": {
                                                        backgroundColor: isDark ? "#1e293b" : "#e5e7eb",
                                                    },

                                                    "& .MuiPickersDay-today": {
                                                        border: "1px solid #3b82f6",
                                                    },

                                                    "& .MuiPickersDay-root.Mui-selected": {
                                                        backgroundColor: "#3b82f6",
                                                        color: "#ffffff",
                                                    },

                                                    "& .MuiPickersDay-root.Mui-disabled": {
                                                        color: isDark ? "#475569" : "#cbd5e1",
                                                    },
                                                };
                                            },
                                        },

                                        textField: {
                                            fullWidth: true,
                                            placeholder: "MM / DD / YYYY",
                                            InputProps: {
                                                sx: {
                                                    height: "44px",
                                                    borderRadius: "10px",
                                                    fontSize: "14px",
                                                    fontFamily:
                                                        "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                                                },
                                            },
                                            sx: (theme) => {
                                                const isDark = theme.palette.mode === "dark";

                                                return {
                                                    "& .MuiOutlinedInput-root": {
                                                        height: "44px",
                                                        borderRadius: "10px",
                                                        backgroundColor: isDark ? "#0f172a" : "#ffffff",
                                                    },

                                                    "& .MuiOutlinedInput-input": {
                                                        padding: "0 40px 0 16px",
                                                        color: isDark ? "#e5e7eb" : "#0f172a",
                                                    },

                                                    "& .MuiIconButton-root": {
                                                        color: isDark ? "#94a3b8" : "#6b7280",
                                                    },

                                                    "& .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: isDark ? "#1e293b" : "#e5e7eb",
                                                    },

                                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#3b82f6",
                                                    },

                                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#3b82f6",
                                                        boxShadow: isDark
                                                            ? "0 0 0 3px rgba(59,130,246,.35)"
                                                            : "0 0 0 3px rgba(59,130,246,.12)",
                                                    },

                                                    "& input::placeholder": {
                                                        color: isDark ? "#94a3b8" : "#9ca3af",
                                                        opacity: 1,
                                                    },
                                                };
                                            },
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </div>

                        <div className="ab-field">
                            <label>Tip materijala</label>
                            <div className="ab-select-wrap">
                                <select
                                    name="tip_materijala"
                                    value={form.tip_materijala}
                                    onChange={onChange}
                                >
                                    <option>DCP</option>
                                    <option>KDM</option>
                                    <option>BluRay</option>
                                </select>
                                <span className="ab-caret">▾</span>
                            </div>
                        </div>

                        <div className="ab-field">
                            <label>Detalji</label>
                            <input
                                name="napomena"
                                value={form.napomena}
                                onChange={onChange}
                                placeholder="Detalji"
                            />
                        </div>

                        <div className="ab-field ab-status">
                            <label>Status</label>
                            <div className="ab-radios">
                                <label className="ab-radio">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="POTVRDJENO"
                                        checked={form.status === "POTVRDJENO"}
                                        onChange={onChange}
                                    />
                                    <span>Potvrdi booking</span>
                                </label>

                                <label className="ab-radio">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="ODBIJENO"
                                        checked={form.status === "ODBIJENO"}
                                        onChange={onChange}
                                    />
                                    <span>Odbij booking</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="ab-footer">
                        <div className="ab-nav">
                            {isAdmin && (
                                <>
                                    <button type="button" className="ab-icon-btn" onClick={goPrev}>◀</button>
                                    <button type="button" className="ab-icon-btn" onClick={goNext}>▶</button>
                                </>
                            )}
                        </div>

                        <div className="ab-actions">
                            <button type="button" className="ab-btn ab-btn-ghost" onClick={() => navigate("/bookings")}>
                                Odustani
                            </button>
                            <button type="submit" className="ab-btn ab-btn-primary">
                                Spremi Booking
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
