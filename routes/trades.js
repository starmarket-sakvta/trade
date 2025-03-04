const express = require("express");
const Trade = require("../models/Trade");
const router = express.Router();

// ✅ Create Trade
router.post("/create", async (req, res) => {
  try {
    const { userA, userB, itemsA, itemsB, balanceA, balanceB } = req.body;

    const trade = new Trade({ userA, userB, itemsA, itemsB, balanceA, balanceB });
    await trade.save();

    res.status(201).json({ message: "Trade offer created!", tradeID: trade._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create trade." });
  }
});
// ✅ Get All Trades
router.get("/", async (req, res) => {
  try {
    const trades = await Trade.find();
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trades." });
  }
});

// ✅ Accept Trade
router.post("/accept/:tradeID", async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.tradeID);
    if (!trade) return res.status(404).json({ error: "Trade not found." });

    trade.status = "accepted";
    await trade.save();

    res.json({ message: "Trade accepted! Send Steam trade offers now." });
  } catch (err) {
    res.status(500).json({ error: "Failed to accept trade." });
  }
});

// ✅ Reject Trade
router.post("/reject/:tradeID", async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.tradeID);
    if (!trade) return res.status(404).json({ error: "Trade not found." });

    trade.status = "rejected";
    await trade.save();

    res.json({ message: "Trade rejected." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject trade." });
  }
});

// ✅ Cancel Trade (Only Buyer Can Cancel After 30 Min)
router.post("/cancel/:tradeID/:userID", async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.tradeID);
    if (!trade) return res.status(404).json({ error: "Trade not found." });

    const isBuyer = req.params.userID === trade.userB;
    const elapsedTime = (Date.now() - trade.createdAt) / (1000 * 60); // Minutes

    if (isBuyer && elapsedTime >= 30) {
      trade.status = "rejected";
      await trade.save();
      return res.json({ message: "Trade canceled by buyer without penalty." });
    }

    return res.status(403).json({ error: "Cannot cancel yet or not authorized." });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel trade." });
  }
});

// ✅ Complete Trade
router.post("/complete/:tradeID", async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.tradeID);
    if (!trade) return res.status(404).json({ error: "Trade not found." });

    trade.status = "completed";
    await trade.save();

    res.json({ message: "Trade marked as completed!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete trade." });
  }
});

module.exports = router;
