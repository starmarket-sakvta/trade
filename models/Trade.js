const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
  userA: { type: String, required: true }, // Steam ID of user A
  userB: { type: String, required: true }, // Steam ID of user B
  itemsA: [{ type: String, required: true }], // Items offered by A
  itemsB: [{ type: String, required: true }], // Items offered by B
  balanceA: { type: Number, default: 0 }, // Money added by A
  balanceB: { type: Number, default: 0 }, // Money added by B
  status: { type: String, enum: ["pending", "accepted", "rejected", "completed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Trade", tradeSchema);
