import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            setError("Pogrešno korisničko ime ili šifra");
            return;
        }

        const user = await res.json();
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", user.token);

        if (user.role === "ADMIN") navigate("/admin");
        else navigate("/referent");
    };

    return (
        <div className="login-root">
            {/* LEFT */}
            <div className="login-left">
                {/* zamijeni src kad ubaciš logo u public ili src/assets */}
                <img className="login-logo" src="/unafilm.png" alt="UNA Film" />
                <div className="login-tagline">Cinema Booking Management System</div>
            </div>

            {/* RIGHT */}
            <div className="login-right">
                <form className="login-card" onSubmit={handleLogin}>
                    <input
                        className="login-input"
                        placeholder="Korisničko ime"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                    />

                    <input
                        className="login-input"
                        placeholder="Šifra"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && <div className="login-error">{error}</div>}

                    <button className="login-button" type="submit">
                        PRIJAVI SE
                    </button>
                </form>
            </div>
        </div>
    );
}
