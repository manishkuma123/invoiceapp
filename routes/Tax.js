const express = require('express');
const router = express.Router();
const TAX = require("../schema/Tax");


router.post('/add', async (req, res) => {
  try {
    const tax = new TAX(req.body);
    await tax.save();

    res.status(201).json({
      success: true,
      message: 'Tax created successfully',
      data: tax
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating tax',
      error: error.message
    });
  }
});

router.get('/access/all', async (req, res) => {
  try {
    const taxes = await TAX.find();
    res.status(200).json(taxes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/access/:id', async (req, res) => {
  try {
    const tax = await TAX.findById(req.params.id);
    if (!tax) return res.status(404).json({ message: "Tax not found" });

    res.status(200).json(tax);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.put('/update/:id', async (req, res) => {
  try {
    const tax = await TAX.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tax) return res.status(404).json({ message: "Tax not found" });

    res.status(200).json(tax);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.delete('/delete/:id', async (req, res) => {
  try {
    const tax = await TAX.findByIdAndDelete(req.params.id);
    if (!tax) return res.status(404).json({ message: "Tax not found" });

    res.status(200).json({ message: "Tax deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
