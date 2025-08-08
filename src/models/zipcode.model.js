const mongoose = require('mongoose');

const zipCodeSchema = new mongoose.Schema({
  zip_code: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  county: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'County',
    required: true,
    index: true,
  },
  state: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true,
    index: true,
  },
  default_city: {
    type: String,
    trim: true,
  },
  metro_cbsa: {
    type: String,
    trim: true,
  },
  population: {
    type: Number,
  }
}, { timestamps: true });

const ZipCode = mongoose.model('ZipCode', zipCodeSchema);
module.exports = ZipCode;
