const db = require('../config/db');

const Buyer = {

  async getByCrop(crop) {
    const [rows] = await db.query(
      `SELECT * 
       FROM buyers 
       WHERE LOWER(crop) = LOWER(?)`,
      [crop]
    );

    return rows;
  },

  async getAll() {
    const [rows] = await db.query(
      'SELECT * FROM buyers'
    );

    return rows;
  }

};

module.exports = Buyer;