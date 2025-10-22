// src/models/boberdoApiKey.model.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const boberdoApiKeySchema = new mongoose.Schema({
    api_key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        default: 'Boberdoo Global API Key'
    },
    is_active: {
        type: Boolean,
        default: true,
        index: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    last_used_at: {
        type: Date
    },
    total_leads_received: {
        type: Number,
        default: 0
    }
});

// Static method to generate API key
boberdoApiKeySchema.statics.generateApiKey = function() {
    return `bbd_${crypto.randomBytes(32).toString('hex')}`;
};

const BoberdoApiKey = mongoose.model('BoberdoApiKey', boberdoApiKeySchema);

module.exports = BoberdoApiKey;