const express = require('express');
const router = express.Router();
const TAX = require('../schema/Tax'); 

// CREATE: Add new tax
// router.post('/add', async (req, res) => {
//   try {
//     const existingTax = await TAX.findOne({ title: req.body.title });
//     if (existingTax) {
//       return res.status(400).json({
//         success: false,
//         message: 'A tax with this title already exists'
//       });
//     }

//     const tax = new TAX(req.body);
//     const savedTax = await tax.save();
//     res.status(201).json({ success: true, data: savedTax });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// });

router.post('/add', async (req, res) => {
  try {
    const tax = new TAX(req.body);  
    const savedTax = await tax.save();
    res.status(201).json({ success: true, data: savedTax });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});



router.get('/all', async (req, res) => {
  try {
    const taxes = await TAX.find();
    res.status(200).json(taxes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const tax = await TAX.findById(req.params.id);
    if (!tax) return res.status(404).json({ message: 'Tax not found' });
    res.status(200).json(tax);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/update/:id', async (req, res) => {
  try {
    const updatedTax = await TAX.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTax) return res.status(404).json({ message: 'Tax not found' });
    res.status(200).json(updatedTax);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedTax = await TAX.findByIdAndDelete(req.params.id);
    if (!deletedTax) return res.status(404).json({ message: 'Tax not found' });
    res.status(200).json({ message: 'Tax deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
