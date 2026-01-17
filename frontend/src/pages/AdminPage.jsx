import { Navigate } from "react-router-dom";
import DashboardPage from "./DashboardPage";

export default function AdminPage() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return <Navigate to="/" replace />;
    if (user.role !== "ADMIN") return <Navigate to="/referent" replace />;

    return <DashboardPage />;
}
