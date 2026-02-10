import Sidebar from "../components/Sidebar";
import "../styles/dashboard.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Legend
} from "chart.js";

import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Legend
);

export default function DashboardPage() {
    const user = JSON.parse(localStorage.getItem("user"));
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        activeFilms: 0,
        partners: 0,
        bookingsThisMonth: 0,
        activePartners: 0
    });

    const [charts, setCharts] = useState({
        bookingsByMonth: [],
        partnerActivity: []
    });

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`)
            .then(res => res.json())
            .then(setStats);

        fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/charts`)
            .then(res => res.json())
            .then(setCharts);
    }, []);

    const bookingChartData = {
        labels: charts.bookingsByMonth.map(b => `Mjesec ${b.mjesec}`),
        datasets: [
            {
                label: "Bookinzi",
                data: charts.bookingsByMonth.map(b => b.total),
                borderColor: "#2563eb",
                backgroundColor: "#2563eb",
                pointBackgroundColor: "#2563eb",
                tension: 0.4
            }
        ]
    };

    const partnerChartData = {
        labels: charts.partnerActivity.map(p => p.naziv),
        datasets: [
            {
                label: "Bookinzi",
                data: charts.partnerActivity.map(p => p.total),
                backgroundColor: "#2563eb"
            }
        ]
    };

    return (
        <div className="dash-root">
            <Sidebar role={user?.role} />
            <main className="dash-main">
                <h1 className="app-header-title">Dashboard</h1>

                <div className="section-title">Kratka statistika</div>

                <div className="dashboard-row">
                    <div className="dashboard-left">
                        <div className="dash-left-wrap">
                            <div className="stat-grid">
                                <div className="stat-card">
                                    <div className="stat-number">{stats.activeFilms}</div>
                                    <div className="stat-label">Aktivna filma</div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-number">{stats.partners}</div>
                                    <div className="stat-label">Partnera</div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-number">{stats.bookingsThisMonth}</div>
                                    <div className="stat-label">Bookinga ovaj mjesec</div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-number">{stats.activePartners}</div>
                                    <div className="stat-label">Aktivnost Partnera</div>
                                </div>
                            </div>
                        </div>

                        <div className="dash-left-wrap">
                            <div className="charts-grid">
                                <div className="chart-box">
                                    <div className="chart-title">Booking po mjesecu</div>
                                    <Line data={bookingChartData} />
                                </div>

                                <div className="chart-box">
                                    <div className="chart-title">Aktivnost Partnera</div>
                                    <Bar data={partnerChartData} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="quick-actions">
                        <div className="section-title">Quick actions</div>

                        <div
                            className="quick-action-box"
                            onClick={() => navigate("/bookings/add")}
                        >
                            <div className="quick-icon"><span>+</span></div>
                            <span>Dodaj Booking</span>
                        </div>

                        {user?.role === "ADMIN" && (
                            <>
                                <div
                                    className="quick-action-box"
                                    onClick={() => navigate("/movies/add")}
                                >
                                    <div className="quick-icon"><span>+</span></div>
                                    <span>Dodaj Film</span>
                                </div>

                                <div
                                    className="quick-action-box"
                                    onClick={() => navigate("/partners/add")}
                                >
                                    <div className="quick-icon"><span>+</span></div>
                                    <span>Dodaj Partnera</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
