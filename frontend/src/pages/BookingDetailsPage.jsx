import { useParams, useNavigate } from "react-router-dom";
import "../styles/booking-details.css";

const bookings = [
    {
        id: 1,
        film: "Inception",
        partner: "Cinema City",
        start: "2025-01-10",
        end: "2025-01-24",
        material: "DCP",
        status: "Potvrđeno",
        createdBy: "Admin",
        createdAt: "2025-12-16"
    },
    {
        id: 2,
        film: "The Godfather",
        partner: "Multiplex Ekran",
        start: "2025-02-01",
        end: "2025-02-15",
        material: "BluRay",
        status: "Na čekanju",
        createdBy: "Admin",
        createdAt: "2025-12-16"
    }
];

export default function BookingDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const booking = bookings.find(b => b.id === Number(id));

    if (!booking) return <div>Booking nije pronađen</div>;

    return (
        <div className="booking-details-page">

            <div className="details-header">
                <h1>Booking detalji</h1>
                <button onClick={() => navigate(-1)} className="back-btn">
                    ← Nazad
                </button>
            </div>

            <div className="details-grid">
                <div className="details-card">
                    <h3>Osnovno</h3>
                    <p><b>Film:</b> {booking.film}</p>
                    <p><b>Partner:</b> {booking.partner}</p>
                    <p><b>Status:</b> {booking.status}</p>
                </div>

                <div className="details-card">
                    <h3>Period</h3>
                    <p><b>Početak:</b> {booking.start}</p>
                    <p><b>Završetak:</b> {booking.end}</p>
                    <p><b>Materijal:</b> {booking.material}</p>
                </div>

                <div className="details-card">
                    <h3>Kreiranje</h3>
                    <p><b>Kreirao:</b> {booking.createdBy}</p>
                    <p><b>Datum:</b> {booking.createdAt}</p>
                    <p><b>ID:</b> {booking.id}</p>
                </div>
            </div>

        </div>
    );
}
