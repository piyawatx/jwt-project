const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  datetime: { type: String },
  user: { type: String },
  receiver: { type: String },
  userRemain: { type: Number },
  receiverRemain: { type: Number },
  amount: { type: Number },
});

module.exports = mongoose.model("transaction", transactionSchema);
