import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AdminLayout() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <Sidebar role={user.role} />
            <div style={{ flex: 1, marginLeft: 80, padding: 24, overflow: "auto" }}>
                <Outlet />
            </div>
        </div>
    );
}
