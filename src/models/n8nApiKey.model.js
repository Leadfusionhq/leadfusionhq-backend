// src/models/n8nApiKey.model.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const n8nApiKeySchema = new mongoose.Schema({
    api_key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        default: 'n8n Global API Key'
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
n8nApiKeySchema.statics.generateApiKey = function() {
    return `n8n_${crypto.randomBytes(32).toString('hex')}`;
};

const N8nApiKey = mongoose.model('N8nApiKey', n8nApiKeySchema);

module.exports = N8nApiKey;
