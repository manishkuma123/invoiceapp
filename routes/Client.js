const express = require('express');
const router = express.Router();
const Client= require('../schema/Client')
router.post('/client/add', async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating client',
      error: error.message
    });
  }
});

router.get('/client/access', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { emailAddress: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }
    
    const clients = await Client.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await Client.countDocuments(query);
    
    res.json({
      success: true,
      data: clients,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalClients: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching clients',
      error: error.message
    });
  }
});

module.exports = router;