import express from 'express';
import { Trade } from '../models/Trade';
import { Trade as TradeDTO } from '@tradetaper/shared-dto';

const router = express.Router();

// Get all trades
router.get('/', async (req, res) => {
  try {
    const trades = await Trade.find().sort({ entryTime: -1 });
    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trades', error });
  }
});

// Get trade by ID
router.get('/:id', async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    res.json(trade);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trade', error });
  }
});

// Create new trade
router.post('/', async (req, res) => {
  try {
    const tradeData: TradeDTO = req.body;
    const trade = new Trade(tradeData);
    await trade.save();
    res.status(201).json(trade);
  } catch (error) {
    res.status(400).json({ message: 'Error creating trade', error });
  }
});

// Update trade
router.put('/:id', async (req, res) => {
  try {
    const tradeData: Partial<TradeDTO> = req.body;
    const trade = await Trade.findByIdAndUpdate(
      req.params.id,
      tradeData,
      { new: true, runValidators: true }
    );
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    res.json(trade);
  } catch (error) {
    res.status(400).json({ message: 'Error updating trade', error });
  }
});

// Delete trade
router.delete('/:id', async (req, res) => {
  try {
    const trade = await Trade.findByIdAndDelete(req.params.id);
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting trade', error });
  }
});

export default router; 