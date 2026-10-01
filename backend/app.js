const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const sequelize = require("./config/database");
const passport = require("passport");
const initPassport = require("./config/passport.js");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");

const port = process.env.PORT || 5001;
const app = express();

const uploadsDir = path.join(__dirname, "uploads");
const assignmentUploadsDir = path.join(__dirname, "uploads", "assignments");
const submissionUploadsDir = path.join(__dirname, "uploads", "submissions");
const materialUploadsDir = path.join(__dirname, "uploads", "material");
const exportsDir = path.join(__dirname, "exports");
const publicDir = path.join(__dirname, "public");

[
    uploadsDir,
    assignmentUploadsDir,
    submissionUploadsDir,
    materialUploadsDir,
    exportsDir,
    publicDir,
].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

app.use(cors());
app.use(morgan("combined"));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(
    bodyParser.urlencoded({
        limit: "50mb",
        extended: true,
        parameterLimit: 50000,
    })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/images/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/exports", express.static(path.join(__dirname, "exports")));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.use(passport.initialize());
initPassport(passport);

require("./router.js")(app);

// Serve Frontend Build (for Unified Single-Service Deployment)
const frontendDistPath = path.join(__dirname, "..", "Frontend", "collage management system", "dist");
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get("*", (req, res, next) => {
        // Exclude backend API routes and static upload folders
        const apiPrefixes = [
            "/uploads", "/exports", "/images",
            "/Auth", "/Student", "/Faculty", "/ManageStaff", "/Notice",
            "/Course", "/Material", "/Assignment", "/Attendence", "/Result",
            "/Timetable", "/Fees", "/Feedback", "/LeaveRequest", "/Summary", "/admin"
        ];
        if (apiPrefixes.some(prefix => req.path.startsWith(prefix))) {
            return next();
        }
        res.sendFile(path.join(frontendDistPath, "index.html"));
    });
} else {
    app.get("/", (req, res) => {
        res.status(200).json({
            success: true,
            message: "NavNext ERP Backend API is running",
            server: `http://localhost:${port}`,
            uploads: `http://localhost:${port}/uploads/<file>`,
        });
    });
}

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

app.use((error, req, res, next) => {
    console.log("❌ ERROR:", error);
    const status = error.statusCode || 500;
    const message = error.message || "Server Error";

    res.status(status).json({
        success: false,
        message,
    });
});

sequelize
    .sync()
    .then(() => {
        app.listen(port, () => {
            console.log(`✅ Server running on http://localhost:${port}`);
            console.log(`✅ Uploads served at http://localhost:${port}/uploads/<file>`);
            console.log(`✅ Assignment uploads served at http://localhost:${port}/uploads/assignments/<file>`);
        });
    })
    .catch((err) => {
        console.log("❌ DB Sync Error:", err);
    });