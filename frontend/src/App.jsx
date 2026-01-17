import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
    const user = JSON.parse(localStorage.getItem("user"));

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/admin"
                element={
                    user?.role === "ADMIN"
                        ? <DashboardPage />
                        : <Navigate to="/login" replace />
                }
            />

            <Route
                path="/referent"
                element={
                    user?.role === "REFERENT"
                        ? <DashboardPage />
                        : <Navigate to="/login" replace />
                }
            />

            {/* default */}
            <Route
                path="*"
                element={<Navigate to="/login" replace />}
            />
        </Routes>
    );
}
