require("dotenv").config();
const path = require("path");

module.exports = {
    services: {
        API: {
            HOST: process.env.API_HOST || "",
            PORT: process.env.API_PORT || ""
        },
        SSL: {
            ENABLED: process.env.API_SSL_ENABLED === "true",
            KEY_PATH: process.env.API_SSL_KEY_PATH
                || path.join(__dirname, "certs", "api-server.key"),
            CERT_PATH: process.env.API_SSL_CERT_PATH
                || path.join(__dirname, "certs", "api-server.crt"),
        },
        MQTT: {
            USERNAME: process.env.MQTT_USERNAME || "",
            PASSWORD: process.env.MQTT_PASSWORD || "",
            HOST: process.env.MQTT_HOST,
            PORT: process.env.MQTT_PORT
        },
        DATABASE: {
            MONGO: {
                USERNAME: process.env.DB_MONGO_USERNAME || "",
                PASSWORD: process.env.DB_MONGO_PASSWORD || "",
                DBNAME: process.env.DB_MONGO_NAME || "",
                HOST: process.env.DB_MONGO_HOST || "",
                PORT: process.env.DB_MONGO_PORT || ""
            },
            MYSQL: {
                USERNAME: process.env.DB_MYSQL_USERNAME || "",
                PASSWORD: process.env.DB_MYSQL_PASSWORD || "",
                DBNAME: process.env.DB_MYSQL_NAME || "",
                HOST: process.env.DB_MYSQL_HOST || "",
                PORT: process.env.DB_MYSQL_PORT || ""
            }
        }
    },
    ROUTER_PATH: process.env.ROUTER_PATH || "",
    ENVIRONMENT: process.env.ENVIRONMENT || "",
    ALARM: {
        CHECK_INTERVAL_HOURS: Number(process.env.ALARM_CHECK_INTERVAL_HOURS) || 1
    }
}
