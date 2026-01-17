import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";
import "./styles/dark-theme.css";

import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import ReferentPage from "./pages/ReferentPage";
import PartnersPage from "./pages/PartnersPage";
import MoviesPage from "./pages/MoviesPage";
import BookingsPage from "./pages/BookingsPage";
import SettingsPage from "./pages/SettingsPage";
import DodajBooking from "./pages/DodajBooking";
import BookingCalendar from "./pages/BookingCalendar";
import DodajFilm from "./pages/DodajFilm";
import DodajPartnera from "./pages/DodajPartnera";

import AdminLayout from "./layouts/AdminLayout";
import DashboardPage from "./pages/DashboardPage";

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.body.classList.add("theme-dark");
} else {
    document.body.classList.remove("theme-dark");
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <Routes>

            {/* LOGIN */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* SVE SA SIDEBAROM */}
            <Route element={<AdminLayout />}>

                <Route path="/admin" element={<AdminPage />}>
                    <Route index element={<DashboardPage />} />
                </Route>

                <Route path="/referent" element={<ReferentPage />}>
                    <Route index element={<DashboardPage />} />
                </Route>

                <Route path="/partners" element={<PartnersPage />} />
                <Route path="/movies" element={<MoviesPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/bookings/add" element={<DodajBooking />} />
                <Route path="/movies/add" element={<DodajFilm />} />
                <Route path="/partners/add" element={<DodajPartnera />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/calendar" element={<BookingCalendar />} />

            </Route>

        </Routes>
    </BrowserRouter>
);
