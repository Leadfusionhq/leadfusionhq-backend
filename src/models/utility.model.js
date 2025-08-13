const mongoose = require('mongoose');

const utilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true,
    index: true,
  }
}, { timestamps: true });


const Utility = mongoose.model('Utility', utilitySchema);
module.exports = Utility;
