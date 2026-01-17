import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/partners.css";

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [q, setQ] = useState("");
  const [selectedCity, setSelectedCity] = useState("Svi");
  const [status, setStatus] = useState("Status");

  // 🔥 MODAL STATE
  const [selectedPartner, setSelectedPartner] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3000/api/partners")
        .then(res => {
          if (!res.ok) throw new Error("Greška pri dohvaćanju");
          return res.json();
        })
        .then(data => {
          setPartners(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
  }, []);

  const cities = useMemo(() => {
    const unique = Array.from(new Set(partners.map(p => p.grad).filter(Boolean)));
    return ["Svi", ...unique.sort()];
  }, [partners]);

    const handleDelete = async (id) => {
        if (!window.confirm("Da li ste sigurni da želite obrisati partnera?")) return;

        try {
            const res = await fetch(`http://localhost:3000/api/partners/${id}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error();

            setPartners(prev => prev.filter(p => p.id !== id));
            setSelectedPartner(null);
        } catch {
            alert("Greška pri brisanju partnera");
        }
    };

    const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return partners.filter(p => {
      if (selectedCity !== "Svi" && p.grad !== selectedCity) return false;
      if (status === "Aktivan" && !p.active) return false;
      if (status === "Neaktivan" && p.active) return false;

      if (!query) return true;

      return (
          p.naziv.toLowerCase().includes(query) ||
          p.grad.toLowerCase().includes(query) ||
          p.kontakt_osoba.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.telefon.includes(query)
      );
    });
  }, [partners, q, selectedCity, status]);

  if (loading) return <p style={{ padding: 20 }}>Učitavanje...</p>;
  if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;

  return (
      <div className="partners-page">
        <div className="partners-container">
          <h1 className="partners-title">Partneri</h1>

          <div className="partners-controls">
            <button className="btn-add" onClick={() => navigate("/partners/add")}>
              + Dodaj Partnera
            </button>

            <div className="partners-filters">
                <div className="search-wrap">
                    <svg className="search-ic" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-2a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm7.9 4.6-4.2-4.2 1.4-1.4 4.2 4.2-1.4 1.4Z"
                            fill="currentColor"
                        />
                    </svg>

                    <input
                        className="search-input"
                        placeholder="Pretraži partnera"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>

                <div className="select-wrap">
                <select
                    className="select"
                    value={selectedCity}
                    onChange={e => setSelectedCity(e.target.value)}
                >
                  {cities.map(city => (
                      <option key={city}>{city}</option>
                  ))}
                </select>
                <span className="caret">▾</span>
              </div>

              <div className="select-wrap">
                <select
                    className="select"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                >
                  <option>Status</option>
                  <option>Aktivan</option>
                  <option>Neaktivan</option>
                </select>
                <span className="caret">▾</span>
              </div>
            </div>
          </div>

          <div className="partners-table">
            <div className="table-head">
              <div className="th">Naziv</div>
              <div className="th">Grad</div>
              <div className="th">Kontakt Osoba</div>
              <div className="th">Email</div>
              <div className="th">Telefon</div>
              <div className="th">Detalji</div>
            </div>

            <div className="table-body">
              {filtered.map(p => (
                  <div className="table-row" key={p.id}>
                    <div className="td">{p.naziv}</div>
                    <div className="td">{p.grad}</div>
                    <div className="td">{p.kontakt_osoba}</div>
                    <div className="td clip">{p.email}</div>
                    <div className="td">{p.telefon}</div>
                    <div className="td">
                      <button
                          className="btn-details"
                          onClick={() => setSelectedPartner(p)}
                      >
                        Detalji
                      </button>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🔥 MODAL */}
        {selectedPartner && (
            <div className="modal-overlay" onClick={() => setSelectedPartner(null)}>
                <div className="modal-card" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{selectedPartner.naziv}</h2>
                        <button
                            className="modal-close"
                            onClick={() => setSelectedPartner(null)}
                        >
                            ×
                        </button>
                    </div>

                    <div className="modal-body">
                        <p><strong>Grad:</strong> {selectedPartner.grad}</p>
                        <p><strong>Adresa:</strong> {selectedPartner.adresa}</p>
                        <p><strong>Kontakt osoba:</strong> {selectedPartner.kontakt_osoba}</p>
                        <p><strong>Email:</strong> {selectedPartner.email}</p>
                        <p><strong>Telefon:</strong> {selectedPartner.telefon}</p>
                        <p>
                            <strong>Status:</strong>{" "}
                            {selectedPartner.active ? "Aktivan" : "Neaktivan"}
                        </p>

                        {selectedPartner.napomena && (
                            <p><strong>Napomena:</strong> {selectedPartner.napomena}</p>
                        )}
                    </div>

                    {/* ⬇️ FOOTER */}
                    <div className="modal-footer">
                        <button
                            className="btn-delete"
                            onClick={() => handleDelete(selectedPartner.id)}
                        >
                            Izbriši partnera
                        </button>
                    </div>
                </div>
            </div>

        )}
      </div>
  );
}
