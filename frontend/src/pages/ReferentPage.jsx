import { Navigate, Outlet } from "react-router-dom";

export default function ReferentPage() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return <Navigate to="/" replace />;
    if (user.role !== "REFERENT") return <Navigate to="/admin" replace />;

    return <Outlet />;
}
