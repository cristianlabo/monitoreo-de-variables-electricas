const mongoose = require('mongoose');

const logsSchema = mongoose.Schema({
    logId: {
        type: Number,
        required: true
    },
    ts: {
        type: Date,
        required: true,
        default: Date.now
    },
    vrms: {
        type: Number
    },
    irms: {
        type: Number
    },
    potencia_activa: {
        type: Number
    },
    potencia_reactiva: {
        type: Number
    },
    potencia_aparente: {
        type: Number
    },
    cos_phi: {
        type: Number
    },
    nodoId: {
        type: Number,
        required: true
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('Logs', logsSchema);