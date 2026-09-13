const Buyer = require('../models/buyer');
const Farmer = require('../models/farmer');

const analyzeFarmer = async (req, res) => {
  try {
    const { crop, quantity, location, days_until_harvest } = req.body;

    if (!crop || !quantity || !location || days_until_harvest === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please provide crop, quantity, location, and days_until_harvest.'
      });
    }

    const farmer = Farmer.create({
      crop: crop.trim(),
      quantity,
      location: location.trim(),
      days_until_harvest
    });

    // Get buyers for the farmer's crop
    const buyers = await Buyer.getByCrop(farmer.crop);

    // Keep only buyers who can handle the farmer's quantity
    const suitableBuyers = buyers.filter(
      buyer => Number(buyer.max_quantity) >= farmer.quantity
    );

    // Choose the buyer offering the highest price
    suitableBuyers.sort(
      (a, b) => Number(b.price_per_kg) - Number(a.price_per_kg)
    );

    const recommendation = suitableBuyers.length > 0
      ? suitableBuyers[0]
      : null;

    res.json({
      success: true,
      farmer,
      buyers: suitableBuyers,
      recommendation
    });

  } catch (error) {
    console.error('Analysis error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
};

module.exports = { analyzeFarmer };