// const express = require('express');
// const router = express.Router();
// const Client= require('../schema/Client')
// router.post('/client/add', async (req, res) => {
//   try {
//     const client = new Client(req.body);
//     await client.save();
//     res.status(201).json({
//       success: true,
//       message: 'Client created successfully',
//       data: client
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: 'Error creating client',
//       error: error.message
//     });
//   }
// });

// router.get('/client/access', async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search, status } = req.query;
    
//     const query = {};
//     if (search) {
//       query.$or = [
//         { firstName: { $regex: search, $options: 'i' } },
//         { lastName: { $regex: search, $options: 'i' } },
//         { businessName: { $regex: search, $options: 'i' } },
//         { emailAddress: { $regex: search, $options: 'i' } }
//       ];
//     }
//     if (status) {
//       query.status = status;
//     }
    
//     const clients = await Client.find(query)
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ createdAt: -1 });
    
//     const count = await Client.countDocuments(query);
    
//     res.json({
//       success: true,
//       data: clients,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       totalClients: count
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching clients',
//       error: error.message
//     });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const Client = require('../schema/Client');

// Create client - userId added from token automatically
router.post('/client/add', async (req, res) => {
  try {
    const clientData = {
      ...req.body,
      userId: req.user.userId  // ← Added from JWT token
    };
    
    const client = new Client(clientData);
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

// Get all clients - filtered by userId from token
router.get('/client/access', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    const query = { userId: req.user.userId };  // ← Filter by token userId
    
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

// Get single client by ID - with ownership check
// router.get('/client/:id', async (req, res) => {
//   try {
//     const client = await Client.findOne({
//       _id: req.params.id,
//       userId: req.user.userId  // ← Check ownership
//     });
    
//     if (!client) {
//       return res.status(404).json({
//         success: false,
//         message: 'Client not found or access denied'
//       });
//     }
    
//     res.json({
//       success: true,
//       data: client
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching client',
//       error: error.message
//     });
//   }
// });

// Update client - with ownership check
// Delete client - with ownership check
// router.put('/client/:id', async (req, res) => {
//   try {
//     const client = await Client.findOneAndUpdate(
//       {
//         _id: req.params.id,
//         userId: req.user.userId  // ← Check ownership
//       },
//       req.body,
//       { new: true, runValidators: true }
//     );
    
//     if (!client) {
//       return res.status(404).json({
//         success: false,
//         message: 'Client not found or access denied'
//       });
//     }
    
//     res.json({
//       success: true,
//       message: 'Client updated successfully',
//       data: client
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: 'Error updating client',
//       error: error.message
//     });
//   }
// });

// // Delete client - with ownership check
// router.delete('/client/:id', async (req, res) => {
//   try {
//     const client = await Client.findOneAndDelete({
//       _id: req.params.id,
//       userId: req.user.userId  // ← Check ownership
//     });
    
//     if (!client) {
//       return res.status(404).json({
//         success: false,
//         message: 'Client not found or access denied'
//       });
//     }
    
//     res.json({
//       success: true,
//       message: 'Client deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error deleting client',
//       error: error.message
//     });
//   }
// });

module.exports = router;