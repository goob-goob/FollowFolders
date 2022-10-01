const mongoose = require('mongoose')

const AccessSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  expiration: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Access', AccessSchema)
