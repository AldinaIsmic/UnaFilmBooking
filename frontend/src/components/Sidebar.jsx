import { useNavigate, useLocation } from "react-router-dom";
import "../styles/sidebar.css";

export default function Sidebar({ role }) {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const logout = () => {
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <aside className="sidebar">

            {/* TOP ICONS */}
            <div className="sidebar-top">

                {/* DASHBOARD – svi */}
                <button
                    className={`sidebar-btn ${isActive("/admin") || isActive("/referent") ? "active" : ""}`}
                    title="Dashboard"
                    onClick={() => navigate(role === "ADMIN" ? "/admin" : "/referent")}
                >
                    <img src="/icons/home.png" alt="Dashboard" />
                </button>

                {/* PLUS – DODAJ BOOKING – svi */}
                <button
                    className={`sidebar-btn ${isActive("/bookings/add") ? "active" : ""}`}
                    title="Dodaj Booking"
                    onClick={() => navigate("/bookings/add")}
                >
                    <img src="/icons/plus.png" alt="Dodaj Booking" />
                </button>

                {/* PARTNERI – SAMO ADMIN */}
                {role === "ADMIN" && (
                    <button
                        className={`sidebar-btn ${isActive("/partners") ? "active" : ""}`}
                        title="Partneri"
                        onClick={() => navigate("/partners")}
                    >
                        <img src="/icons/users.png" alt="Partneri" />
                    </button>
                )}

                {/* FILMOVI – svi */}
                <button
                    className={`sidebar-btn ${isActive("/movies") ? "active" : ""}`}
                    title="Filmovi"
                    onClick={() => navigate("/movies")}
                >
                    <img src="/icons/movies.png" alt="Filmovi" />
                </button>

                {/* BOOKING LIST – svi */}
                <button
                    className={`sidebar-btn ${isActive("/bookings") ? "active" : ""}`}
                    title="Booking"
                    onClick={() => navigate("/bookings")}
                >
                    <img src="/icons/book.png" alt="Booking" />
                </button>

                {/* KALENDAR – SAMO ADMIN (ako želiš da referent NE vidi) */}
                {role === "ADMIN" && (
                    <button
                        className={`sidebar-btn ${isActive("/calendar") ? "active" : ""}`}
                        title="Kalendar"
                        onClick={() => navigate("/calendar")}
                    >
                        <img src="/icons/calendar.png" alt="Kalendar" />
                    </button>
                )}

                {/* SETTINGS – svi */}
                <button
                    className={`sidebar-btn ${isActive("/settings") ? "active" : ""}`}
                    title="Postavke"
                    onClick={() => navigate("/settings")}
                >
                    <img src="/icons/settings.png" alt="Postavke" />
                </button>

            </div>

            {/* LOGOUT – svi */}
            <div className="sidebar-bottom">
                <button className="sidebar-logout" onClick={logout} title="Logout">
                    <img src="/icons/logout.png" alt="Logout" />
                </button>
            </div>

        </aside>
    );
}
