const mongoose = require('mongoose');

const dispositivoSchema = mongoose.Schema({
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
    topic: {
        type: String,
        require: true
    },
    topicSrvResponse: {
        type: String,
        require: true
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('Dispositivo', dispositivoSchema);