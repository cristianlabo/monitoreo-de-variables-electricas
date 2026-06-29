// EXPRESS:
const express = require("express");
const fs = require("fs");
const http = require("http");
const https = require("https");
const app = express();
const errorHandler = require("errorhandler");
const helmet = require("helmet");
const Router = require("express-promise-router");
const config = require("./config");
var cors = require("cors");

const API_ENV = config.services.API;
const SSL_ENV = config.services.SSL;
const registerRoutes = require("./routers");
const router = Router();

// Descomentar para usar mongoDB
require('./storage/database/mongo');
const { startAlarmScheduler } = require("./services/alarmScheduler");
// Descomentar para usar MySQL
// require("./storage/database/mysql");

// CORS: front Vercel + desarrollo local (+ extras por CORS_ORIGINS)
const DEFAULT_CORS_ORIGINS = [
    "https://monitoreo-de-variables-electricas.vercel.app",
    "http://localhost:3001",
];

const extraCorsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : [];

const allowedCorsOrigins = [...DEFAULT_CORS_ORIGINS, ...extraCorsOrigins];

function isAllowedCorsOrigin(origin) {
    if (!origin) return true;
    if (allowedCorsOrigins.includes(origin)) return true;
    if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return true;
    return false;
}

app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedCorsOrigin(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS not allowed: ${origin}`));
        }
    },
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//helmet
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy());
app.use(helmet.frameguard({ action: "deny" }));

router.use(errorHandler());

app.use(router);
//REGISTRO DE RUTAS
registerRoutes(router);

startAlarmScheduler().catch((err) => console.error("Alarm scheduler failed to start:", err));

router.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send(err.message);
});

const host = API_ENV.HOST || "0.0.0.0";
const port = API_ENV.PORT || 3000;
const protocol = SSL_ENV.ENABLED ? "https" : "http";

function onListen() {
    console.log(`API Funcionando... en: ${protocol}://${host}:${port}`);
    if (SSL_ENV.ENABLED) {
        console.log(`SSL activo. Cert: ${SSL_ENV.CERT_PATH}`);
    }
}

if (SSL_ENV.ENABLED) {
    if (!fs.existsSync(SSL_ENV.KEY_PATH) || !fs.existsSync(SSL_ENV.CERT_PATH)) {
        console.error("SSL habilitado pero faltan certificados.");
        console.error(`  KEY:  ${SSL_ENV.KEY_PATH}`);
        console.error(`  CERT: ${SSL_ENV.CERT_PATH}`);
        console.error("Ejecutar: ./scripts/crea_certs_api.sh <IP_DE_LA_VM>");
        process.exit(1);
    }

    const sslOptions = {
        key: fs.readFileSync(SSL_ENV.KEY_PATH),
        cert: fs.readFileSync(SSL_ENV.CERT_PATH),
    };

    https.createServer(sslOptions, app).listen(port, host, onListen);
} else {
    http.createServer(app).listen(port, host, onListen);
}
