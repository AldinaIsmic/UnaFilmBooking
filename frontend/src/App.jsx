import { useState } from "react";

function App() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        console.log(data);
    };

    return (
        <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <form onSubmit={handleLogin} style={{ width: 300 }}>
                <h2>UNA Film Distribucija</h2>

                <input
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{ width: "100%", marginBottom: 10 }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: "100%", marginBottom: 10 }}
                />

                <button style={{ width: "100%" }}>Login</button>
            </form>
        </div>
    );
}

export default App;
