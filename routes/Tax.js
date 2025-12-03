// const express = require('express');
// const router = express.Router();
// const TAX = require('../schema/Tax');


// router.post('/add', async (req, res) => {
//   try {
//     const tax = new TAX(req.body);  
//     const savedTax = await tax.save();
//     res.status(201).json({ success: true, data: savedTax });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// });

// router.get('/all', async (req, res) => { 
//   try {
//     const taxes = await TAX.find();
//     res.status(200).json({ success: true, data: taxes });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // GET SINGLE TAX
// router.get('/:id', async (req, res) => {
//   try {
//     const tax = await TAX.findById(req.params.id);
//     if (!tax) return res.status(404).json({ message: 'Tax not found' });
//     res.status(200).json(tax);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // UPDATE
// router.put('/update/:id', async (req, res) => {
//   try {
//     const updatedTax = await TAX.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!updatedTax) return res.status(404).json({ message: 'Tax not found' });
//     res.status(200).json(updatedTax);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // DELETE
// router.delete('/delete/:id', async (req, res) => {
//   try {
//     const deletedTax = await TAX.findByIdAndDelete(req.params.id);
//     if (!deletedTax) return res.status(404).json({ message: 'Tax not found' });
//     res.status(200).json({ message: 'Tax deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const TAX = require('../schema/Tax');

// Create tax - userId added from token automatically
router.post('/add', async (req, res) => {
  try {
    const taxData = {
      ...req.body,
      userId: req.user.userId  // ← Added from JWT token
    };
    
    const tax = new TAX(taxData);
    const savedTax = await tax.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Tax created successfully',
      data: savedTax 
    });
  } catch (err) {
    res.status(400).json({ 
      success: false, 
      message: 'Error creating tax',
      error: err.message 
    });
  }
});

// Get all taxes - filtered by userId from token
router.get('/all', async (req, res) => { 
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    const query = { userId: req.user.userId };  // ← Filter by token userId
    
    // Optional search functionality
    if (search) {
      query.$or = [
        { taxName: { $regex: search, $options: 'i' } },
        { taxType: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    const taxes = await TAX.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await TAX.countDocuments(query);
    
    res.status(200).json({ 
      success: true, 
      data: taxes,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalTaxes: count
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching taxes',
      error: err.message 
    });
  }
});

// Get single tax by ID - with ownership check
router.get('/:id', async (req, res) => {
  try {
    const tax = await TAX.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId  // ← Ownership check
    });
    
    if (!tax) {
      return res.status(404).json({ 
        success: false,
        message: 'Tax not found or you do not have permission to access it' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: tax
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching tax',
      error: err.message 
    });
  }
});

// Update tax - with ownership check
router.put('/update/:id', async (req, res) => {
  try {
    // First check if tax exists and belongs to user
    const existingTax = await TAX.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!existingTax) {
      return res.status(404).json({ 
        success: false,
        message: 'Tax not found or you do not have permission to update it' 
      });
    }
    
    // Prevent userId from being modified
    const { userId, ...updateData } = req.body;
    
    const updatedTax = await TAX.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Tax updated successfully',
      data: updatedTax
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: 'Error updating tax',
      error: err.message 
    });
  }
});

// Delete tax - with ownership check
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedTax = await TAX.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId  // ← Ownership check
    });
    
    if (!deletedTax) {
      return res.status(404).json({ 
        success: false,
        message: 'Tax not found or you do not have permission to delete it' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Tax deleted successfully',
      data: deletedTax
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error deleting tax',
      error: err.message 
    });
  }
});

module.exports = router;