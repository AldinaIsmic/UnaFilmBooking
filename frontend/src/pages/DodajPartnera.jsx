import "../styles/DodajPartnera.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function PartnersAddPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const pages = ["/bookings/add", "/movies/add", "/partners/add"];
    const currentIndex = pages.indexOf(location.pathname);

    const goNext = () =>
        navigate(pages[(currentIndex + 1) % pages.length]);

    const goPrev = () =>
        navigate(pages[(currentIndex - 1 + pages.length) % pages.length]);

    const handleCancel = () => navigate("/partners");

    const [form, setForm] = useState({
        naziv: "",
        grad: "",
        adresa: "",
        kontakt_osoba: "",
        telefon: "",
        email: "",
        status: "",
        napomena: ""
    });

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm(s => ({ ...s, [name]: value }));
    };

    const onSubmit = async () => {
        if (!form.naziv || !form.grad || !form.status) {
            alert("Popuni obavezna polja");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/partners`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (!res.ok) throw new Error("Greška");

            navigate("/partners");
        } catch (err) {
            alert("Greška pri spremanju partnera");
            console.error(err);
        }
    };

    return (
        <div className="page-background add-page-root partners-add-page">
            <div className="page-container">
                <h1 className="page-title">Dodaj Partnera</h1>
                <hr className="page-separator" />

                <div className="add-form-card">
                    <div className="add-form-header">
                        <div>
                            <div className="add-form-subtitle">FORMULAR</div>
                            <div className="add-form-title">Dodaj novog partnera</div>
                        </div>
                        <div className="add-form-breadcrumb">
                            Partneri / Dodaj partnera
                        </div>
                    </div>

                    <div className="add-form-grid">
                        <div className="form-group">
                            <label>Naziv partnera</label>
                            <input
                                name="naziv"
                                value={form.naziv}
                                onChange={onChange}
                                placeholder="npr. Cinema City"
                            />
                        </div>

                        <div className="form-group">
                            <label>Grad</label>
                            <input
                                name="grad"
                                value={form.grad}
                                onChange={onChange}
                                placeholder="npr. Sarajevo"
                            />
                        </div>

                        <div className="form-group">
                            <label>Adresa</label>
                            <input
                                name="adresa"
                                value={form.adresa}
                                onChange={onChange}
                                placeholder="npr. Zmaja od Bosne 12"
                            />
                        </div>

                        <div className="form-group">
                            <label>Kontakt osoba</label>
                            <input
                                name="kontakt_osoba"
                                value={form.kontakt_osoba}
                                onChange={onChange}
                                placeholder="Ime i prezime"
                            />
                        </div>

                        <div className="form-group">
                            <label>Telefon</label>
                            <input
                                name="telefon"
                                value={form.telefon}
                                onChange={onChange}
                                placeholder="npr. 061 123 456"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                name="email"
                                value={form.email}
                                onChange={onChange}
                                placeholder="npr. info@cinemacity.ba"
                            />
                        </div>

                        <div className="form-row-wide">
                            <div className="form-group status-group">
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={onChange}
                                >
                                    <option value="">Odaberi status</option>
                                    <option value="ACTIVE">Aktivan</option>
                                    <option value="INACTIVE">Neaktivan</option>
                                </select>
                            </div>

                            <div className="form-group note-group">
                                <label>Napomena (opcionalno)</label>
                                <textarea
                                    name="napomena"
                                    value={form.napomena}
                                    onChange={onChange}
                                    placeholder="Dodatne informacije o partneru"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="add-form-footer">
                        <div className="footer-left">
                            <button className="pagination-button" onClick={goPrev}>◀</button>
                            <button className="pagination-button" onClick={goNext}>▶</button>
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
                                Spremi Partnera
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
