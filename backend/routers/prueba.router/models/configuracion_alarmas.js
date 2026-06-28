const mongoose = require('mongoose');

// Esquema para mantener el contador de autoincrement
const contadorSchema = new mongoose.Schema({
    _id: String,
    secuencia: Number
});

const Contador = mongoose.model('contador_configuracion_alarmas', contadorSchema);

const configuracionAlarmaSchema = mongoose.Schema({

    configuracionAlarmaId: {
        type: Number,
        unique: true,
        sparse: true
    },

    dispositivoId: {
        type: Number,
        required: true
    },

    nombre: {
        type: String,
        required: true
    },

    ubicacion: {
        type: String
    },

    tipoAlarma: {
        type: String,
        required: true
        // CONSUMO_EXCEDIDO
        // PAGO_FACTURA
    },

    habilitada: {
        type: Boolean,
        default: true
    },

    mensaje: {
        type: String
    },

    prioridad: {
        type: String
        // BAJA
        // MEDIA
        // ALTA
    },

    /* -------------------------
       CONFIG CONSUMO
    ------------------------- */

    consumoLimite: {
        type: Number
    },

    unidad: {
        type: String
        // kWh
    },

    periodo: {
        type: String
        // DIARIO
        // SEMANAL
        // MENSUAL
    },

    /* -------------------------
       CONFIG FACTURA
    ------------------------- */

    fechaVencimiento: {
        type: Date
    },

    diasAnticipacion: {
        type: Number
    },

    /* -------------------------
       AUDITORIA
    ------------------------- */

    fechaCreacion: {
        type: Date,
        default: Date.now
    },

    fechaActualizacion: {
        type: Date,
        default: Date.now
    }

}, {
    versionKey: false
});

// Middleware pre-save para autoincrement
configuracionAlarmaSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            const contador = await Contador.findByIdAndUpdate(
                'configuracion_alarmas',
                { $inc: { secuencia: 1 } },
                { new: true, upsert: true }
            );
            this.configuracionAlarmaId = contador.secuencia;
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

const ConfiguracionAlarmaModel = mongoose.model(
    'configuracion_alarmas',
    configuracionAlarmaSchema
);

module.exports = ConfiguracionAlarmaModel;