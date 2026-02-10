    require("dotenv").config();
    const fs = require("fs");
    const express = require("express");
    const cors = require("cors");
    const pool = require("./db");
    const bcrypt = require("bcrypt");
    const jwt = require("jsonwebtoken");
    const nodemailer = require("nodemailer");
    const multer = require("multer");

    const upload = multer({ storage: multer.memoryStorage() });

    const app = express();

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

        if (req.method === "OPTIONS") {
            return res.sendStatus(200);
        }

        next();
    });

    app.use(express.json());


    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    app.post(
        "/api/bookings/import-pdf/preview",
        upload.single("pdf"),
        async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ message: "PDF nije poslan" });
                }

                const data = await pdfParse(req.file.buffer);
                const text = data.text;

                console.log("📄 PDF TEXT:\n", text);

                const lines = text
                    .split("\n")
                    .map(l => l.trim())
                    .filter(Boolean);

                if (lines.length === 0) {
                    return res.status(400).json({ message: "PDF je prazan ili nečitljiv" });
                }

                const partner = lines[0];

                const dateMatch = text.match(/od\s+(\d{2}\.\d{2}\.\d{4})/i);
                if (!dateMatch) {
                    return res.status(400).json({ message: "Datum izvještaja nije pronađen" });
                }

                const [d, m, y] = dateMatch[1].split(".");
                const datum = `${y}-${m}-${d}`;

                const film = lines.find(l =>
                    l !== partner &&
                    !/dnevni izvještaj/i.test(l) &&
                    !/una film/i.test(l) &&
                    !/drs/i.test(l) &&
                    !/^\d{2}:\d{2}$/.test(l)
                );

                if (!film) {
                    return res.status(400).json({ message: "Naziv filma nije pronađen" });
                }

                const ticketsMatch = text.match(/Zbroj:\s*(\d+)/i);
                if (!ticketsMatch) {
                    return res.status(400).json({ message: "Broj ulaznica nije pronađen" });
                }

                const broj_karata = Number(ticketsMatch[1]);

                const priceMatch = text.match(/(\d+,\d{2})/);
                if (!priceMatch) {
                    return res.status(400).json({ message: "Cijena karte nije pronađena" });
                }

                const cijena_karte = Number(priceMatch[1].replace(",", "."));

                res.json({
                    preview: [
                        {
                            film,
                            partner,
                            datum_od: datum,
                            datum_do: datum,
                            broj_karata,
                            cijena_karte,
                            status: "POTVRDJENO"
                        }
                    ]
                });

            } catch (err) {
                console.error("PDF PREVIEW ERROR:", err);
                res.status(500).json({ message: "Greška pri obradi PDF-a" });
            }
        }
    );

    const sendEmail = async (subject, text, html = null) => {
        try {
            await transporter.sendMail({
                from: `"UNA Film Booking" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_TO,
                subject,
                text,          
                html: html || undefined
            });
            console.log("📩 Email poslan");
        } catch (err) {
            console.error("❌ Email error:", err.message);
        }
    };

    const normalizeStatus = (status) => {
        if (!status) return "NA_CEKANJU";

        const s = status.toString().toLowerCase();

        if (s.includes("potvr")) return "POTVRDJENO";
        if (s.includes("odbij")) return "ODBIJENO";
        if (s.includes("cek")) return "NA_CEKANJU";

        return "NA_CEKANJU";
    };

    app.get("/", (req, res) => {
        res.json({ message: "UNA Film Distribucija API radi ✅" });
    });

    app.get("/api/test-db", async (req, res) => {
        try {
            const [rows] = await pool.query("SHOW TABLES");
            res.json(rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Greška sa bazom" });
        }
    });

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
                    napomena,
                    IFNULL(active, 1) AS active
                FROM partners
            `);

            res.json(rows);
        } catch (err) {
            console.error("PARTNERS ERROR:", err);
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

            res.json({
                id: user.id,
                username: user.username,
                role: user.role
            });

        } catch (err) {
            console.error("LOGIN ERROR:", err);
            res.status(500).json({
                message: "Greška na serveru"
            });
        }
    });

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
                    status,
                    napomena
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

    app.get("/api/bookings", async (req, res) => {
        try {
            const { userId, role } = req.query;

            let sql = `
            SELECT
                b.id,
                f.naziv AS film,
                p.naziv AS partner,
                DATE_FORMAT(b.datum_od, '%Y-%m-%d') AS datum_od,
                DATE_FORMAT(b.datum_do, '%Y-%m-%d') AS datum_do,
                b.tip_materijala,
                b.status,
                b.broj_karata,
                b.cijena_karte,
                b.created_by AS created_by_id,
                u.username AS created_by,
                DATE(b.created_at) AS created_at
            FROM bookings b
            JOIN films f ON b.film_id = f.id
            JOIN partners p ON b.partner_id = p.id
            LEFT JOIN users u ON b.created_by = u.id
        `;

            const params = [];

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

    app.post("/api/bookings/import", async (req, res) => {
        const rows = req.body;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ message: "Nema podataka za import" });
        }

        try {
            for (const r of rows) {

                const [filmRows] = await pool.query(
                    "SELECT id FROM films WHERE naziv = ?",
                    [r.film]
                );

                if (filmRows.length === 0) {
                    throw new Error(`Film ne postoji: ${r.film}`);
                }

                const film_id = filmRows[0].id;

                const [partnerRows] = await pool.query(
                    "SELECT id FROM partners WHERE naziv = ?",
                    [r.partner]
                );

                if (partnerRows.length === 0) {
                    throw new Error(`Partner ne postoji: ${r.partner}`);
                }

                const partner_id = partnerRows[0].id;

                await pool.query(
                    `INSERT INTO bookings
                (film_id, partner_id, datum_od, datum_do, tip_materijala, status, broj_karata, cijena_karte, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        film_id,
                        partner_id,
                        r.datum_od || null,
                        r.datum_do || null,
                        r.tip_materijala,
                        normalizeStatus(r.status),
                        r.broj_karata,
                        r.cijena_karte,
                        req.user?.id || 1
                    ]
                );
            }

            res.status(201).json({
                message: "Import uspješan",
                imported: rows.length
            });

        } catch (err) {
            console.error("❌ IMPORT ERROR:", err.message);
            res.status(500).json({ message: err.message });
        }
    });

    app.post("/api/bookings/import-report", async (req, res) => {
        console.log("✅ HIT /import-report", req.query);
        console.log("✅ BODY:", req.body);

        const rows = req.body;
        const { userId, role } = req.query;

        if (role !== "REFERENT") {
            return res.status(403).json({
                message: "Samo referent može importovati izvještaj"
            });
        }

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({
                message: "Nema podataka za import"
            });
        }

        try {
            for (const r of rows) {
                if (!r.booking_id) {
                    throw new Error("Nedostaje booking_id");
                }

                if (Number(r.broj_karata) <= 0 || Number(r.cijena_karte) < 0) {
                    throw new Error("Neispravni podaci u XLS fajlu");
                }

                const [[booking]] = await pool.query(
                    `SELECT id, created_by FROM bookings WHERE id = ?`,
                    [r.booking_id]
                );

                if (!booking) {
                    throw new Error(`Booking ne postoji (ID ${r.booking_id})`);
                }

                if (booking.created_by != userId) {
                    throw new Error("Nemaš pravo ažurirati ovaj booking");
                }

                await pool.query(
                    `
                UPDATE bookings
                SET
                    broj_karata = ?,
                    cijena_karte = ?
                WHERE id = ?
                `,
                    [
                        Number(r.broj_karata),
                        Number(r.cijena_karte),
                        r.booking_id
                    ]
                );
            }

            res.status(200).json({
                message: "Izvještaj uspješno importovan",
                updated: rows.length
            });

        } catch (err) {
            console.error("❌ IMPORT REPORT ERROR:", err.message);
            res.status(500).json({
                message: err.message
            });
        }
    });

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

    app.get("/api/calendar", async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT
                    b.id,
                    DATE_FORMAT(b.datum_od, '%Y-%m-%d') AS datum_od,
                    DATE_FORMAT(b.datum_do, '%Y-%m-%d') AS datum_do,
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
                created_by,
                broj_karata,
                cijena_karte
            } = req.body;

            if (!film_id || !partner_id || !datum_od || !datum_do) {
                return res.status(400).json({
                    message: "Nedostaju obavezna polja"
                });
            }
            const safeBrojKarata = Number(broj_karata) || 0;
            const safeCijena = Number(cijena_karte) || 0;

            const [result] = await pool.query(
                `INSERT INTO bookings
            (film_id, partner_id, datum_od, datum_do, tip_materijala, status, napomena, created_by, broj_karata, cijena_karte)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    film_id,
                    partner_id,
                    datum_od,
                    datum_do,
                    tip_materijala,
                    status,
                    napomena || "",
                    created_by,
                    safeBrojKarata,
                    safeCijena
                ]
            );

            res.status(201).json({
                message: "Booking uspješno dodan",
                id: result.insertId
            });

            const [[filmRow]] = await pool.query(
                "SELECT naziv FROM films WHERE id = ?",
                [film_id]
            );


            const [[partnerRow]] = await pool.query(
                "SELECT naziv FROM partners WHERE id = ?",
                [partner_id]
            );

            const [[user]] = await pool.query(
                "SELECT role FROM users WHERE id = ?",
                [created_by]
            );

            if (user?.role === "REFERENT") {
                const emailText = `
📌 NOVI BOOKING DODAN

🎬 Film: ${filmRow?.naziv || "Nepoznato"}
🏢 Partner: ${partnerRow?.naziv || "Nepoznato"}

📅 Period:
- Od: ${datum_od}
- Do: ${datum_do}

📦 Tip materijala: ${tip_materijala || "DCP"}
📌 Status: ${status || "NA ČEKANJU"}
📝 Napomena: ${napomena || "Nema"}
            `;

                sendEmail(
                    "📩 Novi booking dodan",
                    emailText
                ).catch(err =>
                    console.error("EMAIL ERROR:", err.message)
                );
            }

        } catch (err) {
            console.error("ADD BOOKING ERROR:", err);
            res.status(500).json({
                message: "Greška pri spremanju booking-a",
                error: err.message
            });
        }
    });

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

    app.get("/api/dashboard/charts", async (req, res) => {
        try {

            const [bookingsByMonth] = await pool.query(`
                SELECT
                    MONTH(datum_od) AS mjesec,
                    COUNT(*) AS total
                FROM bookings
                GROUP BY MONTH(datum_od)
                ORDER BY mjesec
            `);

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

    app.delete("/api/partners/:id", async (req, res) => {
        const { id } = req.params;

        try {
            const [[partner]] = await pool.query(
                "SELECT id FROM partners WHERE id = ?",
                [id]
            );

            if (!partner) {
                return res.status(404).json({
                    message: "Partner ne postoji"
                });
            }

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

    app.delete("/api/movies/:id", async (req, res) => {
        const { id } = req.params;

        try {
            const [[movie]] = await pool.query(
                "SELECT id FROM films WHERE id = ?",
                [id]
            );

            if (!movie) {
                return res.status(404).json({
                    message: "Film ne postoji"
                });
            }

            const [[used]] = await pool.query(
                "SELECT COUNT(*) AS total FROM bookings WHERE film_id = ?",
                [id]
            );

            if (used.total > 0) {
                return res.status(409).json({
                    message: "Film ima postojeće booking-e i ne može biti obrisan"
                });
            }

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

    app.delete("/api/bookings/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const { userId, role } = req.query;

            const [[booking]] = await pool.query(
                `
                    SELECT
                        b.id,
                        b.created_by,
                        f.naziv AS film_naziv,
                        p.naziv AS partner_naziv,
                        b.datum_od,
                        b.datum_do,
                        b.tip_materijala,
                        b.status,
                        b.napomena
                    FROM bookings b
                             LEFT JOIN films f ON b.film_id = f.id
                             LEFT JOIN partners p ON b.partner_id = p.id
                    WHERE b.id = ?
                `,
                [id]
            );

            if (!booking) {
                return res.status(404).json({ message: "Booking ne postoji" });
            }

            if (role !== "ADMIN" && booking.created_by != userId) {
                return res.status(403).json({
                    message: "Nemaš pravo brisati ovaj booking"
                });
            }

            await pool.query("DELETE FROM bookings WHERE id = ?", [id]);

            res.json({ success: true });

            if (role === "REFERENT" && booking.created_by == userId) {

                const emailText = `
                🗑️ BOOKING OBRISAN
                
                🎬 Film: ${booking.film_naziv || "Nepoznato"}
                🏢 Partner: ${booking.partner_naziv || "Nepoznato"}
                
                📅 Period:
                - Od: ${booking.datum_od}
                - Do: ${booking.datum_do}
                
                📦 Tip materijala: ${booking.tip_materijala}
                📌 Status: ${booking.status}
                📝 Napomena: ${booking.napomena || "Nema"}
            `;

                sendEmail(
                    "🗑️ Booking obrisan",
                    emailText
                ).catch(err =>
                    console.error("EMAIL DELETE ERROR:", err.message)
                );
            }

        } catch (err) {
            console.error("DELETE BOOKING ERROR:", err);
            res.status(500).json({
                message: "Greška pri brisanju booking-a"
            });
        }
    });

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

    if (process.env.DB_INIT === "true") {
    initDatabase();
}

    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Server pokrenut na http://localhost:${PORT}`);
    });
