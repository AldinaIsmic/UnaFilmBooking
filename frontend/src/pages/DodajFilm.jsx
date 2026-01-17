import "../styles/DodajFilm.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function DodajFilm() {
    const navigate = useNavigate();
    const location = useLocation();

    const pages = ["/bookings/add", "/movies/add", "/partners/add"];
    const currentIndex = pages.indexOf(location.pathname);

    const goNext = () =>
        navigate(pages[(currentIndex + 1) % pages.length]);

    const goPrev = () =>
        navigate(pages[(currentIndex - 1 + pages.length) % pages.length]);

    const handleCancel = () => navigate("/movies");

    // =========================
    // FORM STATE
    // =========================
    const [form, setForm] = useState({
        naziv: "",
        godina_distribucije: "",
        trajanje_min: "",
        status: "",
        zanr: "",
        napomena: ""
    });

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    // =========================
    // SUBMIT → API
    // =========================
    const onSubmit = async () => {
        if (!form.naziv || !form.godina_distribucije || !form.trajanje_min || !form.status || !form.zanr) {
            alert("Popuni sva obavezna polja");
            return;
        }

        const payload = {
            naziv: form.naziv,
            originalni_naziv: form.naziv,
            trajanje_min: Number(form.trajanje_min),
            godina_distribucije: Number(form.godina_distribucije),
            zanr: form.zanr,
            status: form.status.toUpperCase(),
            napomena: form.napomena || null
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/movies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Greška");

            navigate("/movies");
        } catch (err) {
            alert("Greška pri spremanju filma");
            console.error(err);
        }
    };

    return (
        <div className="page-background movies-add-page add-page-root">
            <div className="page-container">
                {/* PAGE TITLE */}
                <h1 className="page-title">Dodaj film</h1>
                <hr className="page-separator" />

                {/* CARD */}
                <div className="add-form-card">
                    {/* HEADER */}
                    <div className="add-form-header">
                        <div>
                            <div className="add-form-subtitle">FORMULAR</div>
                            <div className="add-form-title">
                                Dodaj novi film u sistem
                            </div>
                        </div>
                        <div className="add-form-breadcrumb">
                            Filmovi / Dodaj film
                        </div>
                    </div>

                    {/* FORM GRID */}
                    <div className="add-form-grid">
                        {/* ROW 1 */}
                        <div className="form-group">
                            <label>Naziv filma</label>
                            <input
                                name="naziv"
                                value={form.naziv}
                                onChange={onChange}
                                placeholder="Unesi naziv filma"
                            />
                        </div>

                        <div className="form-group">
                            <label>Godina</label>
                            <input
                                name="godina_distribucije"
                                value={form.godina_distribucije}
                                onChange={onChange}
                                placeholder="npr. 2024"
                            />
                        </div>

                        {/* ROW 2 */}
                        <div className="form-group">
                            <label>Trajanje</label>
                            <input
                                name="trajanje_min"
                                value={form.trajanje_min}
                                onChange={onChange}
                                placeholder="npr. 120"
                            />
                        </div>

                        <div className="status-genre-group">
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={onChange}
                                >
                                    <option value="" disabled>
                                        Odaberi status
                                    </option>
                                    <option value="AKTIVAN">Aktivan</option>
                                    <option value="ZAVRSEN">Završen</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Žanr</label>
                                <select
                                    name="zanr"
                                    value={form.zanr}
                                    onChange={onChange}
                                >
                                    <option value="" disabled>
                                        Odaberi žanr
                                    </option>
                                    <option>Drama</option>
                                    <option>Komedija</option>
                                    <option>Akcija</option>
                                    <option>Triler</option>
                                    <option>Horor</option>
                                    <option>Sci-Fi</option>
                                </select>
                            </div>
                        </div>

                        {/* ROW 3 */}
                        <div className="form-row-full">
                            <div className="form-group">
                                <label>Opis (opcionalno)</label>
                                <textarea
                                    name="napomena"
                                    value={form.napomena}
                                    onChange={onChange}
                                    placeholder="Kratki opis filma"
                                />
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="add-form-footer">
                        <div className="footer-left">
                            <button
                                className="pagination-button"
                                onClick={goPrev}
                            >
                                ◀
                            </button>
                            <button
                                className="pagination-button"
                                onClick={goNext}
                            >
                                ▶
                            </button>
                        </div>

                        <div className="footer-right">
                            <button
                                className="add-form-secondary-btn"
                                onClick={handleCancel}
                            >
                                Odustani
                            </button>
                            <button
                                className="add-form-primary-btn"
                                onClick={onSubmit}
                            >
                                Spremi Film
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
