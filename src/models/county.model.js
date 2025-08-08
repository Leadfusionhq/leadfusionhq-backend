const mongoose = require('mongoose');

const countySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true,
    index: true,
  },
  fips_code: {
    type: String,
    trim: true,
  }
}, { timestamps: true });

const County = mongoose.model('County', countySchema);
module.exports = County;
