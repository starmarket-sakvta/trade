const express = require("express");
const Trade = require("../models/Trade");
const router = express.Router();

// Helper function to validate trade existence
const findTradeById = async (tradeID, res) => {
  const trade = await Trade.findById(tradeID);
  if (!trade) return res.status(404).json({ error: "Trade not found." });
  return trade;
};

// ✅ Create Trade
router.post("/create", async (req, res) => {
  try {
    const { userA, userB, itemsA, itemsB, balanceA, balanceB } = req.body;

    // Prevent duplicate pending trades between same users
    const existingTrade = await Trade.findOne({ 
      userA, 
      userB, 
      status: { $in: ["pending", "accepted"] } 
    });

    if (existingTrade) {
      return res.status(400).json({ error: "An active trade already exists between these users." });
    }

    const trade = new Trade({
      userA,
      userB,
      itemsA,
      itemsB,
      balanceA,
      balanceB,
      status: "pending", // Default status
      createdAt: Date.now(),
    });

    await trade.save();
    res.status(201).json({ message: "Trade offer created!", tradeID: trade._id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create trade." });
  }
});

// ✅ Get All Trades (Filtered by status if query provided)
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const trades = await Trade.find(query);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trades." });
  }
});

// ✅ Accept Trade (Only userB can accept)
router.post("/accept/:tradeID/:userID", async (req, res) => {
  try {
    const trade = await findTradeById(req.params.tradeID, res);
    if (!trade) return;

    if (trade.userB !== req.params.userID) {
      return res.status(403).json({ error: "Only the buyer can accept this trade." });
    }

    if (trade.status !== "pending") {
      return res.status(400).json({ error: "Trade cannot be accepted in its current state." });
    }

    trade.status = "accepted";
    await trade.save();
    res.json({ message: "Trade accepted! Proceed with Steam trade offers." });

  } catch (err) {
    res.status(500).json({ error: "Failed to accept trade." });
  }
});

// ✅ Reject Trade (Only involved users can reject)
router.post("/reject/:tradeID/:userID", async (req, res) => {
  try {
    const trade = await findTradeById(req.params.tradeID, res);
    if (!trade) return;

    if (![trade.userA, trade.userB].includes(req.params.userID)) {
      return res.status(403).json({ error: "Only involved users can reject this trade." });
    }

    if (trade.status !== "pending") {
      return res.status(400).json({ error: "Trade cannot be rejected in its current state." });
    }

    trade.status = "rejected";
    await trade.save();
    res.json({ message: "Trade rejected." });

  } catch (err) {
    res.status(500).json({ error: "Failed to reject trade." });
  }
});

// ✅ Cancel Trade (Only buyer can cancel after 30 minutes)
router.post("/cancel/:tradeID/:userID", async (req, res) => {
  try {
    const trade = await findTradeById(req.params.tradeID, res);
    if (!trade) return;

    const isBuyer = req.params.userID === trade.userB;
    const elapsedTime = (Date.now() - trade.createdAt) / (1000 * 60); // Convert to minutes

    if (!isBuyer) {
      return res.status(403).json({ error: "Only the buyer can cancel this trade." });
    }

    if (elapsedTime < 30) {
      return res.status(403).json({ error: "Cannot cancel yet. Must wait 30 minutes." });
    }

    trade.status = "rejected";
    await trade.save();
    res.json({ message: "Trade canceled by buyer without penalty." });

  } catch (err) {
    res.status(500).json({ error: "Failed to cancel trade." });
  }
});

// ✅ Complete Trade (Only involved users can complete)
router.post("/complete/:tradeID/:userID", async (req, res) => {
  try {
    const trade = await findTradeById(req.params.tradeID, res);
    if (!trade) return;

    if (![trade.userA, trade.userB].includes(req.params.userID)) {
      return res.status(403).json({ error: "Only involved users can complete this trade." });
    }

    if (trade.status !== "accepted") {
      return res.status(400).json({ error: "Trade must be accepted before completion." });
    }

    trade.status = "completed";
    await trade.save();
    res.json({ message: "Trade marked as completed!" });

  } catch (err) {
    res.status(500).json({ error: "Failed to complete trade." });
  }
});

module.exports = router;
