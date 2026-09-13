const Farmer = {

  create(data) {
    return {
      crop: String(data.crop).trim(),
      quantity: Number(data.quantity),
      location: String(data.location).trim(),
      days_until_harvest: Number(data.days_until_harvest)
    };
  }

};

module.exports = Farmer;