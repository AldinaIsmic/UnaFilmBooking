import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/movies.css";

export default function MoviesPage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [q, setQ] = useState("");
    const [genre, setGenre] = useState("Svi");
    const [status, setStatus] = useState("Status");

    const [selectedMovie, setSelectedMovie] = useState(null);

    const navigate = useNavigate();

    // ✅ USER + ROLE (NIŠTA DRUGO NE DIRAMO)
    const user = JSON.parse(localStorage.getItem("user"));
    const isAdmin = user?.role === "ADMIN";

    // FETCH MOVIES
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/movies`)
            .then(res => {
                if (!res.ok) throw new Error("Greška pri dohvaćanju filmova");
                return res.json();
            })
            .then(data => {
                setMovies(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const genres = useMemo(() => {
        const unique = Array.from(
            new Set(movies.map(m => m.zanr).filter(Boolean))
        );
        return ["Svi", ...unique.sort()];
    }, [movies]);

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();

        return movies.filter(m => {
            if (genre !== "Svi" && m.zanr !== genre) return false;
            if (status !== "Status" && m.status !== status) return false;

            if (!query) return true;

            return (
                m.naziv.toLowerCase().includes(query) ||
                String(m.godina_distribucije).includes(query) ||
                String(m.trajanje_min).includes(query)
            );
        });
    }, [movies, q, genre, status]);

    const handleDelete = async (id) => {
        if (!window.confirm("Jesi li sigurna da želiš obrisati ovaj film?")) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/movies/${id}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error();

            setMovies(prev => prev.filter(m => m.id !== id));
            setSelectedMovie(null);
        } catch {
            alert("Greška pri brisanju filma");
        }
    };

    const totalRowsToShow = 12;
    const emptyRows = Math.max(0, totalRowsToShow - filtered.length);

    if (loading) return <p style={{ padding: 20 }}>Učitavanje...</p>;
    if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;

    return (
        <div className="movies-page">
            <div className="movies-container">
                <h1 className="movies-title">Filmovi</h1>

                <div className="movies-controls">
                    {/* LIJEVA STRANA */}
                    <div className="movies-left">
                        {isAdmin && (
                            <button
                                className="btn-add"
                                onClick={() => navigate("/movies/add")}
                            >
                                + Dodaj Film
                            </button>
                        )}
                    </div>

                    {/* DESNA STRANA */}
                    <div className="movies-filters">
                        <div className="search-wrap">
                            <svg
                                className="search-ic"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-2a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm7.9 4.6-4.2-4.2 1.4-1.4 4.2 4.2-1.4 1.4Z"
                                    fill="currentColor"
                                />
                            </svg>

                            <input
                                className="search-input"
                                placeholder="Pretraži filmove"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>

                        <div className="select-wrap">
                            <select
                                className="select"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                            >
                                {genres.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                            <span className="caret">▾</span>
                        </div>

                        <div className="select-wrap">
                            <select
                                className="select"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option>Status</option>
                                <option>AKTIVAN</option>
                                <option>ZAVRŠEN</option>
                            </select>
                            <span className="caret">▾</span>
                        </div>
                    </div>
                </div>


                <div className="movies-table">
                    <div className="table-head">
                        <div className="th">Naziv</div>
                        <div className="th">Godina</div>
                        <div className="th">Trajanje</div>
                        <div className="th">Status</div>
                        <div className="th">Detalji</div>
                    </div>

                    <div className="table-body">
                        {filtered.map(m => (
                            <div className="table-row" key={m.id}>
                                <div className="td">{m.naziv}</div>
                                <div className="td">{m.godina_distribucije}</div>
                                <div className="td">{m.trajanje_min} min</div>
                                <div className="td">
                                    <span className="status-pill">{m.status}</span>
                                </div>
                                <div className="td">
                                    <button
                                        className="btn-details"
                                        onClick={() => setSelectedMovie(m)}
                                    >
                                        Detalji
                                    </button>
                                </div>
                            </div>
                        ))}

                        {Array.from({ length: emptyRows }).map((_, i) => (
                            <div className="table-row empty" key={i}>
                                <div className="td">&nbsp;</div>
                                <div className="td"></div>
                                <div className="td"></div>
                                <div className="td"></div>
                                <div className="td"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedMovie && (
                <div className="modal-overlay" onClick={() => setSelectedMovie(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedMovie.naziv}</h2>
                            <button
                                className="modal-close"
                                onClick={() => setSelectedMovie(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <p><strong>Originalni naziv:</strong> {selectedMovie.originalni_naziv}</p>
                            <p><strong>Godina:</strong> {selectedMovie.godina_distribucije}</p>
                            <p><strong>Trajanje:</strong> {selectedMovie.trajanje_min} min</p>
                            <p><strong>Žanr:</strong> {selectedMovie.zanr}</p>
                            <p><strong>Status:</strong> {selectedMovie.status}</p>
                        </div>

                        {isAdmin && (
                            <div className="modal-footer">
                                <button
                                    className="btn-delete"
                                    onClick={() => handleDelete(selectedMovie.id)}
                                >
                                    Izbriši film
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
