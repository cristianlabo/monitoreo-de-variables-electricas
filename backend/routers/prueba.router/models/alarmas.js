const mongoose = require('mongoose');

const alarmaSchema = mongoose.Schema({
    alarmaId: {
        type: Number,
        require: true
    },

    dispositivoId: {
        type: Number,
        require: true
    },

    nombre: {
        type: String,
        require: true
    },

    ubicacion: {
        type: String
    },

    tipoAlarma: {
        type: String,
        require: true
        // consumo_excedido
        // factura_vigente
    },

    descripcion: {
        type: String
    },

    consumoActual: {
        type: Number
    },

    consumoLimite: {
        type: Number
    },

    unidad: {
        type: String
    },

    periodo: {
        type: String
        // diario
        // mensual
    },

    fechaVencimiento: {
        type: String
    },

    diasRestantes: {
        type: Number
    },

    estado: {
        type: String,
        default: 'activa'
        // activa
        // resuelta
    },

    fechaEvento: {
        type: Date,
        default: Date.now
    }

}, {
    versionKey: false
});

module.exports = mongoose.model('Alarma', alarmaSchema);