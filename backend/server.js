    require("dotenv").config();
    const fs = require("fs");
    const express = require("express");
    const cors = require("cors");
    const pool = require("./db");
    const bcrypt = require("bcrypt");
    const jwt = require("jsonwebtoken");



    const app = express();

    app.use(cors({
        origin: [
            "http://localhost:5173",
            "http://test.unafilm.ba"
        ],
        credentials: true
    }));
    app.use(express.json());

    // TEST ROOT
    app.get("/", (req, res) => {
        res.json({ message: "UNA Film Distribucija API radi ✅" });
    });

    // 🔥 TEST BAZE
    app.get("/api/test-db", async (req, res) => {
        try {
            const [rows] = await pool.query("SHOW TABLES");
            res.json(rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Greška sa bazom" });
        }
    });

    // ==============================
    // PARTNERS – GET ALL
    // ==============================
    app.get("/api/partners", async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT
                    id,
                    naziv,
                    grad,
                    adresa,
                    kontakt_osoba,
                    email,
                    telefon,
                    IFNULL(active, 1) AS active
                FROM partners
            `);

            res.json(rows);
        } catch (err) {
            console.error("PARTNERS ERROR:", err); // 🔥 BITNO
            res.status(500).json({
                message: "Greška pri dohvaćanju partnera",
                error: err.message
            });
        }
    });

    app.post("/login", async (req, res) => {
        const { username, password } = req.body;

        try {
            const [[user]] = await pool.query(
                "SELECT id, username, password_hash, role FROM users WHERE username = ? AND active = 1",
                [username]
            );

            if (!user) {
                return res.status(401).json({
                    message: "Pogrešno korisničko ime ili šifra"
                });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                return res.status(401).json({
                    message: "Pogrešno korisničko ime ili šifra"
                });
            }

            // ❗ nikad ne šaljemo hash nazad
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (err) {
            console.error("LOGIN ERROR:", err);
            res.status(500).json({
                message: "Greška na serveru"
            });
        }
    });



    // ==============================
    // MOVIES – GET ALL
    // ==============================
    app.get("/api/movies", async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT
                    id,
                    naziv,
                    originalni_naziv,
                    trajanje_min,
                    godina_distribucije,
                    zanr,
                    status
                FROM films
            `);

            res.json(rows);
        } catch (err) {
            console.error("MOVIES ERROR:", err);
            res.status(500).json({
                message: "Greška pri dohvaćanju filmova",
                error: err.message
            });
        }
    });

    // ==============================
    // BOOKINGS – GET ALL (JOINED)
    // ==============================
    // ==============================
    // BOOKINGS – GET (ADMIN / REFERENT)
    // ==============================
    app.get("/api/bookings", async (req, res) => {
        try {
            const { userId, role } = req.query;

            let sql = `
            SELECT
                b.id,
                f.naziv AS film,
                p.naziv AS partner,
                b.datum_od,
                b.datum_do,
                b.tip_materijala,
                b.status,
                b.created_by AS created_by_id,
                u.username AS created_by,
                DATE(b.created_at) AS created_at
            FROM bookings b
            JOIN films f ON b.film_id = f.id
            JOIN partners p ON b.partner_id = p.id
            LEFT JOIN users u ON b.created_by = u.id
        `;

            const params = [];

            // 🔐 REFERENT vidi samo svoje
            if (role === "REFERENT") {
                sql += ` WHERE b.created_by = ? `;
                params.push(userId);
            }

            sql += ` ORDER BY b.created_at DESC `;

            const [rows] = await pool.query(sql, params);
            res.json(rows);

        } catch (err) {
            console.error("BOOKINGS ERROR:", err);
            res.status(500).json({
                message: "Greška pri dohvaćanju booking-a"
            });
        }
    });


    // ==============================
    // BOOKINGS – STATS (FIXED)
    // ==============================
    // ==============================
    // BOOKINGS – STATS (ADMIN / REFERENT)
    // ==============================
    app.get("/api/bookings/stats", async (req, res) => {
        try {
            const { userId, role } = req.query;

            let sql = `
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(status = 'POTVRDJENO'), 0) AS confirmed,
                COALESCE(SUM(status = 'ODBIJENO'), 0) AS rejected,
                COALESCE(SUM(status = 'NA_CEKANJU'), 0) AS waiting
            FROM bookings
        `;

            const params = [];

            if (role === "REFERENT") {
                sql += ` WHERE created_by = ? `;
                params.push(userId);
            }

            const [[stats]] = await pool.query(sql, params);
            res.json(stats);

        } catch (err) {
            console.error("BOOKINGS STATS ERROR:", err);
            res.status(500).json({
                message: "Greška pri statistici"
            });
        }
    });

    // ==============================
    // BOOKINGS – CALENDAR DATA
    // ==============================
    app.get("/api/calendar", async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT
                    b.id,
                    b.datum_od,
                    b.datum_do,
                    b.status,
                    b.tip_materijala,
                    f.naziv AS film,
                    p.naziv AS partner
                FROM bookings b
                JOIN films f ON b.film_id = f.id
                JOIN partners p ON b.partner_id = p.id
            `);

            res.json(rows);
        } catch (err) {
            console.error("CALENDAR ERROR:", err);
            res.status(500).json({ message: "Greška pri dohvaćanju kalendara" });
        }
    });

    // ==============================
    // BOOKINGS – CREATE
    // ==============================
    app.post("/api/bookings", async (req, res) => {
        try {
            const {
                film_id,
                partner_id,
                datum_od,
                datum_do,
                tip_materijala,
                status,
                napomena,
                created_by
            } = req.body;

            if (!film_id || !partner_id || !datum_od || !datum_do) {
                return res.status(400).json({
                    message: "Nedostaju obavezna polja"
                });
            }

            const [result] = await pool.query(
                `
                INSERT INTO bookings
                (film_id, partner_id, datum_od, datum_do, tip_materijala, status, napomena, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    film_id,
                    partner_id,
                    datum_od,
                    datum_do,
                    tip_materijala || "DCP",
                    status || "NA_CEKANJU",
                    napomena || null,
                    created_by || 1
                ]
            );

            res.status(201).json({
                message: "Booking uspješno dodan",
                id: result.insertId
            });

        } catch (err) {
            console.error("ADD BOOKING ERROR:", err);
            res.status(500).json({
                message: "Greška pri spremanju booking-a",
                error: err.message
            });
        }
    });

    // ==============================
    // MOVIES – CREATE
    // ==============================
    app.post("/api/movies", async (req, res) => {
        try {
            const {
                naziv,
                originalni_naziv,
                trajanje_min,
                godina_distribucije,
                zanr,
                status,
                napomena
            } = req.body;

            // VALIDACIJA
            if (!naziv || !trajanje_min || !godina_distribucije || !zanr || !status) {
                return res.status(400).json({
                    message: "Nedostaju obavezna polja"
                });
            }

            const [result] = await pool.query(
                `
                INSERT INTO films
                (
                    naziv,
                    originalni_naziv,
                    trajanje_min,
                    godina_distribucije,
                    zanr,
                    status,
                    napomena
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    naziv,
                    originalni_naziv || naziv,
                    trajanje_min,
                    godina_distribucije,
                    zanr,
                    status,
                    napomena || null
                ]
            );

            res.status(201).json({
                message: "Film uspješno dodan",
                id: result.insertId
            });

        } catch (err) {
            console.error("ADD MOVIE ERROR:", err);
            res.status(500).json({
                message: "Greška pri spremanju filma",
                error: err.message
            });
        }
    });

    // ==============================
    // PARTNERS – CREATE
    // ==============================
    app.post("/api/partners", async (req, res) => {
        try {
            const {
                naziv,
                grad,
                adresa,
                kontakt_osoba,
                telefon,
                email,
                status,
                napomena
            } = req.body;

            if (!naziv || !grad || !status) {
                return res.status(400).json({
                    message: "Nedostaju obavezna polja"
                });
            }

            const [result] = await pool.query(
                `
                INSERT INTO partners
                (
                    naziv,
                    grad,
                    adresa,
                    kontakt_osoba,
                    telefon,
                    email,
                    active,
                    napomena
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    naziv,
                    grad,
                    adresa || null,
                    kontakt_osoba || null,
                    telefon || null,
                    email || null,
                    status === "ACTIVE" ? 1 : 0,
                    napomena || null
                ]
            );

            res.status(201).json({
                message: "Partner uspješno dodan",
                id: result.insertId
            });

        } catch (err) {
            console.error("ADD PARTNER ERROR:", err);
            res.status(500).json({
                message: "Greška pri spremanju partnera",
                error: err.message
            });
        }
    });

    // ==============================
    // DASHBOARD – STATS
    // ==============================
    app.get("/api/dashboard/stats", async (req, res) => {
        try {
            const [[films]] = await pool.query(`
                SELECT COUNT(*) AS total
                FROM films
                WHERE status = 'AKTIVAN'
            `);

            const [[partners]] = await pool.query(`
                SELECT COUNT(*) AS total
                FROM partners
            `);

            const [[bookingsMonth]] = await pool.query(`
                SELECT COUNT(*) AS total
                FROM bookings
                WHERE MONTH(datum_od) = MONTH(CURDATE())
                  AND YEAR(datum_od) = YEAR(CURDATE())
            `);

            const [[partnerActivity]] = await pool.query(`
                SELECT COUNT(DISTINCT partner_id) AS total
                FROM bookings
            `);

            res.json({
                activeFilms: films.total,
                partners: partners.total,
                bookingsThisMonth: bookingsMonth.total,
                activePartners: partnerActivity.total
            });

        } catch (err) {
            console.error("DASHBOARD STATS ERROR:", err);
            res.status(500).json({ message: "Greška pri dashboard statistici" });
        }
    });

    app.get("/api/dashboard/bookings-per-month", async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT
                    MONTH(datum_od) AS month,
                    COUNT(*) AS total
                FROM bookings
                GROUP BY MONTH(datum_od)
                ORDER BY month
            `);

            res.json(rows);
        } catch (err) {
            console.error("BOOKINGS PER MONTH ERROR:", err);
            res.status(500).json({ message: "Greška graf booking po mjesecu" });
        }
    });


    app.get("/api/dashboard/partner-activity", async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT
                    p.naziv AS partner,
                    COUNT(b.id) AS total
                FROM partners p
                LEFT JOIN bookings b ON b.partner_id = p.id
                GROUP BY p.id
                ORDER BY total DESC
            `);

            res.json(rows);
        } catch (err) {
            console.error("PARTNER ACTIVITY ERROR:", err);
            res.status(500).json({ message: "Greška graf partnera" });
        }
    });

    // ==============================
    // DASHBOARD – CHART DATA
    // ==============================
    app.get("/api/dashboard/charts", async (req, res) => {
        try {
            // BOOKINGS PO MJESECU
            const [bookingsByMonth] = await pool.query(`
                SELECT
                    MONTH(datum_od) AS mjesec,
                    COUNT(*) AS total
                FROM bookings
                GROUP BY MONTH(datum_od)
                ORDER BY mjesec
            `);

            // AKTIVNOST PARTNERA
            const [partnerActivity] = await pool.query(`
                SELECT
                    p.naziv,
                    COUNT(b.id) AS total
                FROM partners p
                LEFT JOIN bookings b ON b.partner_id = p.id
                GROUP BY p.id
            `);

            res.json({
                bookingsByMonth,
                partnerActivity
            });
        } catch (err) {
            console.error("DASHBOARD CHART ERROR:", err);
            res.status(500).json({ message: "Greška kod grafova" });
        }
    });

    // ==============================
    // PARTNERS – DELETE
    // ==============================
    app.delete("/api/partners/:id", async (req, res) => {
        const { id } = req.params;

        try {
            // ❗ sigurnosna provjera (opciono ali pametno)
            const [[partner]] = await pool.query(
                "SELECT id FROM partners WHERE id = ?",
                [id]
            );

            if (!partner) {
                return res.status(404).json({
                    message: "Partner ne postoji"
                });
            }

            // 🔥 BRISANJE
            await pool.query(
                "DELETE FROM partners WHERE id = ?",
                [id]
            );

            res.json({ success: true });

        } catch (err) {
            console.error("DELETE PARTNER ERROR:", err);
            res.status(500).json({
                message: "Partner već ima postojeće booking-e i ne može se izbrisati"
            });
        }
    });

    // ==============================
    // MOVIES – DELETE
    // ==============================
    app.delete("/api/movies/:id", async (req, res) => {
        const { id } = req.params;

        try {
            // 🔍 da li film postoji
            const [[movie]] = await pool.query(
                "SELECT id FROM films WHERE id = ?",
                [id]
            );

            if (!movie) {
                return res.status(404).json({
                    message: "Film ne postoji"
                });
            }

            // 🔒 provjera da li film ima booking-e
            const [[used]] = await pool.query(
                "SELECT COUNT(*) AS total FROM bookings WHERE film_id = ?",
                [id]
            );

            if (used.total > 0) {
                return res.status(409).json({
                    message: "Film ima postojeće booking-e i ne može biti obrisan"
                });
            }

            // 🗑️ brisanje
            await pool.query(
                "DELETE FROM films WHERE id = ?",
                [id]
            );

            res.json({ success: true });

        } catch (err) {
            console.error("DELETE MOVIE ERROR:", err);
            res.status(500).json({
                message: "Postojeći film ima booking i ne može biti obrisan"
            });
        }
    });

    // ==============================
    // BOOKINGS – DELETE
    // ==============================
    // ==============================
    // BOOKINGS – DELETE (ADMIN or OWNER)
    // ==============================
    // ==============================
    // BOOKINGS – DELETE (ADMIN ili vlasnik)
    // ==============================
    app.delete("/api/bookings/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const { userId, role } = req.query;

            // provjera da li booking postoji
            const [[booking]] = await pool.query(
                "SELECT created_by FROM bookings WHERE id = ?",
                [id]
            );

            if (!booking) {
                return res.status(404).json({ message: "Booking ne postoji" });
            }

            // ako nije admin → mora biti vlasnik
            if (role !== "ADMIN" && booking.created_by != userId) {
                return res.status(403).json({
                    message: "Nemaš pravo brisati ovaj booking"
                });
            }

            await pool.query("DELETE FROM bookings WHERE id = ?", [id]);

            res.json({ success: true });

        } catch (err) {
            console.error("DELETE BOOKING ERROR:", err);
            res.status(500).json({
                message: "Greška pri brisanju booking-a"
            });
        }
    });

    // ==============================
    // DATABASE INIT (AUTO)
    // ==============================
    const path = require("path");

    async function initDatabase() {
        try {
            const initSql = fs.readFileSync(
                path.join(__dirname, "init.sql"),
                "utf8"
            );

            const connection = await pool.getConnection();
            await connection.query(initSql);
            connection.release();

            console.log("✅ Database initialized successfully");

        } catch (err) {
            console.error("❌ Database init error:", err.message);
        }
    }

    // poziv prije starta servera
    if (process.env.DB_INIT === "true") {
    initDatabase();
}

    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server pokrenut na portu ${PORT}`);
    });

    app.get("/health", (req, res) => {
        res.json({ status: "OK", service: "UNA Film API" });
    });

