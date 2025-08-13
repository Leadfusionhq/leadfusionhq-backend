const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  abbreviation: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true,
  }
}, { timestamps: true });

const State = mongoose.model('State', stateSchema);
module.exports = State;
