const mongoose = require("mongoose")

const userSchema = mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["ADMIN", "USER"],
        default: "USER"
    },

    enabled: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

}, {
    versionKey: false
})

module.exports = mongoose.model("Users", userSchema)