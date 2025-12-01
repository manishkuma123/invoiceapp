// const express = require('express');
// const router = express.Router();
// const Invoice = require('../schema/Invoice');
// const Client = require('../schema/Client');
// const TAX = require('../schema/Tax');


// router.post('/invoice/add', async (req, res) => {
//   try {
//     const { 
//       invoiceType,
//       clientId, 
//       items, 
//       taxId, 
//       discount, 
//       notes, 
//       invoiceDate, 
//       dueDate, 
//       currency,
//       subject,
//       signature,
//       companyStamp,
//       paymentTerms
//     } = req.body;
    
//     // Validate client exists
//     const client = await Client.findById(clientId);
//     if (!client) {
//       return res.status(404).json({
//         success: false,
//         message: 'Client not found'
//       });
//     }
    
//     // Validate tax if provided
//     let taxRate = 0;
//     let taxDetails = null;
//     if (taxId) {
//       const tax = await TAX.findById(taxId);
//       if (!tax) {
//         return res.status(404).json({
//           success: false,
//           message: 'Tax not found'
//         });
//       }
//       taxRate = tax.percentage;
//       taxDetails = {
//         taxId: tax._id,
//         title: tax.title,
//         percentage: tax.percentage
//       };
//     }
    
//     // Calculate totals
//     let subtotal = 0;
//     const processedItems = items.map(item => {
//       const amount = item.quantity * item.rate;
//       subtotal += amount;
//       return {
//         description: item.description,
//         quantity: item.quantity,
//         rate: item.rate,
//         amount: parseFloat(amount.toFixed(2))
//       };
//     });
    
//     const discountAmount = discount ? (subtotal * discount / 100) : 0;
//     const subtotalAfterDiscount = subtotal - discountAmount;
//     const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
//     const total = subtotalAfterDiscount + taxAmount;
    
//     // Generate invoice number
//     const lastInvoice = await Invoice.findOne().sort({ invoiceNumber: -1 });
//     let invoiceNumber = 'INV-100001';
//     if (lastInvoice && lastInvoice.invoiceNumber) {
//       const lastNum = parseInt(lastInvoice.invoiceNumber.split('-')[1]);
//       invoiceNumber = `INV-${String(lastNum + 1).padStart(6, '0')}`;
//     }
    
//     const invoice = new Invoice({
//       invoiceType: invoiceType || 'Standard Invoice',
//       invoiceNumber,
//       clientId,
//       invoiceDate: invoiceDate || new Date(),
//       dueDate: dueDate || new Date(Date.now() + 30*24*60*60*1000),
//       subject: subject || '',
//       items: processedItems,
//       subtotal: parseFloat(subtotal.toFixed(2)),
//       discount: discount || 0,
//       discountAmount: parseFloat(discountAmount.toFixed(2)),
//       tax: taxDetails,
//       taxAmount: parseFloat(taxAmount.toFixed(2)),
//       total: parseFloat(total.toFixed(2)),
//       currency: currency || 'INR',
//       notes: notes || '',
//       paymentTerms: paymentTerms || '',
//       signature: signature || '',
//       companyStamp: companyStamp || '',
//       status: 'pending'
//     });
    
//     await invoice.save();
    
//     const populatedInvoice = await Invoice.findById(invoice._id)
//       .populate('clientId', 'firstName lastName businessName email')
//       .populate('tax.taxId', 'title percentage');
    
//     res.status(201).json({
//       success: true,
//       message: 'Invoice created successfully',
//       data: populatedInvoice
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: 'Error creating invoice',
//       error: error.message
//     });
//   }
// });

// // READ: Get all invoices with filters and pagination
// router.get('/invoice/access', async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 10, 
//       search, 
//       status, 
//       clientId,
//       startDate,
//       endDate,
//       sortBy = 'createdAt',
//       sortOrder = 'desc'
//     } = req.query;
    
//     const query = {};
    
//     // Search filter
//     if (search) {
//       query.$or = [
//         { invoiceNumber: { $regex: search, $options: 'i' } },
//         { notes: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     // Status filter
//     if (status) {
//       query.status = status;
//     }
    
//     // Client filter
//     if (clientId) {
//       query.clientId = clientId;
//     }
    
//     // Date range filter
//     if (startDate || endDate) {
//       query.invoiceDate = {};
//       if (startDate) query.invoiceDate.$gte = new Date(startDate);
//       if (endDate) query.invoiceDate.$lte = new Date(endDate);
//     }
    
//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
//     const invoices = await Invoice.find(query)
//       .populate('clientId', 'firstName lastName businessName email mobile')
//       .populate('tax.taxId', 'title percentage')
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort(sortOptions);
    
//     const count = await Invoice.countDocuments(query);
    
//     // Calculate summary statistics
//     const totalRevenue = await Invoice.aggregate([
//       { $match: { ...query, status: 'paid' } },
//       { $group: { _id: null, total: { $sum: '$total' } } }
//     ]);
    
//     const pendingAmount = await Invoice.aggregate([
//       { $match: { ...query, status: 'pending' } },
//       { $group: { _id: null, total: { $sum: '$total' } } }
//     ]);
    
//     res.json({
//       success: true,
//       data: invoices,
//       pagination: {
//         totalPages: Math.ceil(count / limit),
//         currentPage: parseInt(page),
//         totalInvoices: count,
//         limit: parseInt(limit)
//       },
//       summary: {
//         totalRevenue: totalRevenue[0]?.total || 0,
//         pendingAmount: pendingAmount[0]?.total || 0
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching invoices',
//       error: error.message
//     });
//   }
// });

// // READ: Get single invoice by ID
// router.get('/invoice/:id', async (req, res) => {
//   try {
//     const invoice = await Invoice.findById(req.params.id)
//       .populate('clientId')
//       .populate('tax.taxId', 'title percentage');
    
//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         message: 'Invoice not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       data: invoice
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching invoice',
//       error: error.message
//     });
//   }
// });

// // READ: Get invoice by invoice number
// router.get('/invoice/number/:invoiceNumber', async (req, res) => {
//   try {
//     const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber })
//       .populate('clientId')
//       .populate('tax.taxId', 'title percentage');
    
//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         message: 'Invoice not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       data: invoice
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching invoice',
//       error: error.message
//     });
//   }
// });

// // UPDATE: Update invoice
// router.put('/invoice/update/:id', async (req, res) => {
//   try {
//     const { items, taxId, discount, ...otherUpdates } = req.body;
    
//     const invoice = await Invoice.findById(req.params.id);
//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         message: 'Invoice not found'
//       });
//     }
    
//     // Recalculate if items, tax, or discount changed
//     if (items || taxId !== undefined || discount !== undefined) {
//       const invoiceItems = items || invoice.items;
//       let subtotal = 0;
      
//       const processedItems = invoiceItems.map(item => {
//         const amount = item.quantity * item.rate;
//         subtotal += amount;
//         return {
//           description: item.description,
//           quantity: item.quantity,
//           rate: item.rate,
//           amount: parseFloat(amount.toFixed(2))
//         };
//       });
      
//       let taxRate = 0;
//       let taxDetails = invoice.tax;
      
//       if (taxId) {
//         const tax = await TAX.findById(taxId);
//         if (!tax) {
//           return res.status(404).json({
//             success: false,
//             message: 'Tax not found'
//           });
//         }
//         taxRate = tax.percentage;
//         taxDetails = {
//           taxId: tax._id,
//           title: tax.title,
//           percentage: tax.percentage
//         };
//       } else if (invoice.tax) {
//         taxRate = invoice.tax.percentage;
//       }
      
//       const discountPercent = discount !== undefined ? discount : invoice.discount;
//       const discountAmount = (subtotal * discountPercent) / 100;
//       const subtotalAfterDiscount = subtotal - discountAmount;
//       const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
//       const total = subtotalAfterDiscount + taxAmount;
      
//       Object.assign(invoice, {
//         ...otherUpdates,
//         items: processedItems,
//         subtotal: parseFloat(subtotal.toFixed(2)),
//         discount: discountPercent,
//         discountAmount: parseFloat(discountAmount.toFixed(2)),
//         tax: taxDetails,
//         taxAmount: parseFloat(taxAmount.toFixed(2)),
//         total: parseFloat(total.toFixed(2))
//       });
//     } else {
//       Object.assign(invoice, otherUpdates);
//     }
    
//     await invoice.save();
    
//     const updatedInvoice = await Invoice.findById(invoice._id)
//       .populate('clientId', 'firstName lastName businessName email')
//       .populate('tax.taxId', 'title percentage');
    
//     res.json({
//       success: true,
//       message: 'Invoice updated successfully',
//       data: updatedInvoice
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: 'Error updating invoice',
//       error: error.message
//     });
//   }
// });

// // UPDATE: Update invoice status
// router.patch('/invoice/status/:id', async (req, res) => {
//   try {
//     const { status } = req.body;
    
//     if (!['pending', 'paid', 'overdue', 'cancelled', 'draft'].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid status. Must be: pending, paid, overdue, cancelled, or draft'
//       });
//     }
    
//     const invoice = await Invoice.findByIdAndUpdate(
//       req.params.id,
//       { status, paidDate: status === 'paid' ? new Date() : null },
//       { new: true }
//     ).populate('clientId', 'firstName lastName businessName email');
    
//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         message: 'Invoice not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       message: 'Invoice status updated successfully',
//       data: invoice
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: 'Error updating invoice status',
//       error: error.message
//     });
//   }
// });

// // DELETE: Delete invoice
// router.delete('/invoice/delete/:id', async (req, res) => {
//   try {
//     const invoice = await Invoice.findByIdAndDelete(req.params.id);
    
//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         message: 'Invoice not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       message: 'Invoice deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error deleting invoice',
//       error: error.message
//     });
//   }
// });

// // ==================== DASHBOARD ENDPOINTS ====================

// // Get dashboard statistics
// router.get('/dashboard/stats', async (req, res) => {
//   try {
//     const totalInvoices = await Invoice.countDocuments();
//     const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
//     const pendingInvoices = await Invoice.countDocuments({ status: 'pending' });
//     const overdueInvoices = await Invoice.countDocuments({ status: 'overdue' });
    
//     const revenueData = await Invoice.aggregate([
//       { $match: { status: 'paid' } },
//       { $group: { _id: null, total: { $sum: '$total' } } }
//     ]);
    
//     const pendingData = await Invoice.aggregate([
//       { $match: { status: 'pending' } },
//       { $group: { _id: null, total: { $sum: '$total' } } }
//     ]);
    
//     const overdueData = await Invoice.aggregate([
//       { $match: { status: 'overdue' } },
//       { $group: { _id: null, total: { $sum: '$total' } } }
//     ]);
    
//     const totalClients = await Client.countDocuments();
    
//     res.json({
//       success: true,
//       data: {
//         totalInvoices,
//         paidInvoices,
//         pendingInvoices,
//         overdueInvoices,
//         totalRevenue: revenueData[0]?.total || 0,
//         pendingAmount: pendingData[0]?.total || 0,
//         overdueAmount: overdueData[0]?.total || 0,
//         totalClients
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching dashboard stats',
//       error: error.message
//     });
//   }
// });

// // Get monthly revenue chart data
// router.get('/dashboard/revenue-chart', async (req, res) => {
//   try {
//     const { year = new Date().getFullYear() } = req.query;
    
//     const monthlyRevenue = await Invoice.aggregate([
//       {
//         $match: {
//           status: 'paid',
//           paidDate: {
//             $gte: new Date(`${year}-01-01`),
//             $lte: new Date(`${year}-12-31`)
//           }
//         }
//       },
//       {
//         $group: {
//           _id: { $month: '$paidDate' },
//           revenue: { $sum: '$total' },
//           count: { $sum: 1 }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]);
    
//     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//     const chartData = months.map((month, index) => {
//       const data = monthlyRevenue.find(item => item._id === index + 1);
//       return {
//         month,
//         revenue: data?.revenue || 0,
//         invoices: data?.count || 0
//       };
//     });
    
//     res.json({
//       success: true,
//       data: chartData
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching revenue chart data',
//       error: error.message
//     });
//   }
// });

// // Get recent invoices for dashboard
// router.get('/dashboard/recent-invoices', async (req, res) => {
//   try {
//     const { limit = 5 } = req.query;
    
//     const recentInvoices = await Invoice.find()
//       .populate('clientId', 'firstName lastName businessName')
//       .sort({ createdAt: -1 })
//       .limit(parseInt(limit));
    
//     res.json({
//       success: true,
//       data: recentInvoices
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching recent invoices',
//       error: error.message
//     });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const Invoice = require('../schema/Invoice');
const Client = require('../schema/Client');
const TAX = require('../schema/Tax');

const upload = require("../config/upload");     // <-- multer-cloudinary


router.post(
  "/invoice/add",
  upload.fields([
    { name: "signature", maxCount: 1 },
    { name: "companyStamp", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        invoiceType,
        invoiceNumber,
        clientId,
        items,
        total,
        discount,
        discountAmount,
        tax,
        // taxAmount,
        roundOff,
        totalamount,
        currency,
        notes,
        invoiceDate,
        dueDate,
        subject,
        paymentTerms,
        status
      } = req.body;

      // Validate required fields
      if (!clientId || !items) {
        return res.status(400).json({
          success: false,
          message: "Client ID and items are required"
        });
      }

      // Convert items (string from Postman) to JSON
      let parsedItems = [];
      try {
        parsedItems = JSON.parse(items);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid items JSON"
        });
      }

      // Check client exists
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found"
        });
      }

      // TAX ID validation
      let taxId = null;
      if (tax) {
        const taxRecord = await TAX.findById(tax);
        if (!taxRecord) {
          return res.status(400).json({
            success: false,
            message: "Invalid TAX ID"
          });
        }
        taxId = tax;
      }

      // ===============================
      // 📌 File Upload (Cloudinary URLs)
      // ===============================
      let signatureUrl = "";
      let stampUrl = "";

      if (req.files["signature"]) {
        signatureUrl = req.files["signature"][0].path; // Cloudinary URL
      }

      if (req.files["companyStamp"]) {
        stampUrl = req.files["companyStamp"][0].path; // Cloudinary URL
      }

      // ===============================
      // 📌 Create Invoice
      // ===============================
      const invoice = new Invoice({
        invoiceType,
        invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
        clientId,
        items: parsedItems,
        total,
        discount,
        discountAmount,
        tax: taxId,
        // taxAmount,
        roundOff,
        totalamount,
        currency,
        notes,
        invoiceDate,
        dueDate,
        subject,
        paymentTerms,
        signature: signatureUrl,
        companyStamp: stampUrl,
        status
      });

      await invoice.save();

      // Populate client + TAX fields
      const populatedInvoice = await Invoice.findById(invoice._id)
        .populate("clientId", "firstName lastName businessName email")
        .populate("tax", "title percentage");

      res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        data: populatedInvoice
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Error creating invoice",
        error: error.message
      });
    }
  }
);




router.get("/invoice/all", async (req, res) => { 
  try {
    const invoices = await Invoice.find()
      .populate("clientId", "firstName lastName businessName email")
      .populate("tax", "title percentage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Invoices fetched successfully",
      count: invoices.length,
      data: invoices
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching invoices",
      error: error.message
    });
  }
});


router.put(
  "/invoice/update/:id",
  upload.fields([
    { name: "signature", maxCount: 1 },
    { name: "companyStamp", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const invoiceId = req.params.id;

      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found"
        });
      }

      let updatedData = { ...req.body };

      // Handle items JSON (if sent)
      if (req.body.items) {
        try {
          updatedData.items = JSON.parse(req.body.items);
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: "Invalid items JSON"
          });
        }
      }

      // Validate TAX ID if updating
      if (req.body.tax) {
        const taxRecord = await TAX.findById(req.body.tax);
        if (!taxRecord) {
          return res.status(400).json({
            success: false,
            message: "Invalid TAX ID"
          });
        }
      }

      // File uploads
      if (req.files["signature"]) {
        updatedData.signature = req.files["signature"][0].path;
      }

      if (req.files["companyStamp"]) {
        updatedData.companyStamp = req.files["companyStamp"][0].path;
      }

      const updatedInvoice = await Invoice.findByIdAndUpdate(
        invoiceId,
        updatedData,
        { new: true }
      )
        .populate("clientId")
        .populate("tax");

      res.status(200).json({
        success: true,
        message: "Invoice updated successfully",
        data: updatedInvoice
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating invoice",
        error: error.message
      });
    }
  }
);

router.delete("/invoice/delete/:id", async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const invoice = await Invoice.findByIdAndDelete(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting invoice",
      error: error.message
    });
  }
});



router.patch('/invoice/status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'paid', 'overdue', 'cancelled', 'draft'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, paid, overdue, cancelled, or draft'
      });
    }
    
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status, paidDate: status === 'paid' ? new Date() : null },
      { new: true }
    ).populate('clientId', 'firstName lastName businessName email');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data: invoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating invoice status',
      error: error.message
    });
  }
});


router.delete('/invoice/delete/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Invoice deleted successfully',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error.message
    });
  }
});

// ==================== DASHBOARD STATS ====================
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalInvoices = await Invoice.countDocuments();
    const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
    const pendingInvoices = await Invoice.countDocuments({ status: 'pending' });
    const overdueInvoices = await Invoice.countDocuments({ status: 'overdue' });
    
    const revenueData = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const pendingData = await Invoice.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const overdueData = await Invoice.aggregate([
      { $match: { status: 'overdue' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const totalClients = await Client.countDocuments();
    
    res.json({
      success: true,
      data: {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalRevenue: revenueData[0]?.total || 0,
        pendingAmount: pendingData[0]?.total || 0,
        overdueAmount: overdueData[0]?.total || 0,
        totalClients
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
});


router.get('/dashboard/revenue-chart', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$paidDate' },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = months.map((month, index) => {
      const data = monthlyRevenue.find(item => item._id === index + 1);
      return {
        month,
        revenue: data?.revenue || 0,
        invoices: data?.count || 0
      };
    });
    
    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue chart data',
      error: error.message
    });
  }
});


router.get('/dashboard/recent-invoices', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const recentInvoices = await Invoice.find()
      .populate('clientId', 'firstName lastName businessName')
      .populate('tax.taxId', 'title percentage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: recentInvoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent invoices',
      error: error.message
    });
  }
});



router.post('/tax/add', async (req, res) => {
  try {
    const { title, percentage } = req.body;
    
    if (!title || percentage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title and percentage are required'
      });
    }
    
    const tax = new TAX({
      title,
      percentage
    });
    
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

// Get All Taxes
router.get('/tax/access', async (req, res) => {
  try {
    const taxes = await TAX.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: taxes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching taxes',
      error: error.message
    });
  }
});

// Get Single Tax
router.get('/tax/:id', async (req, res) => {
  try {
    const tax = await TAX.findById(req.params.id);
    
    if (!tax) {
      return res.status(404).json({
        success: false,
        message: 'Tax not found'
      });
    }
    
    res.json({
      success: true,
      data: tax
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tax',
      error: error.message
    });
  }
});

// Update Tax
router.put('/tax/update/:id', async (req, res) => {
  try {
    const { title, percentage } = req.body;
    
    const tax = await TAX.findByIdAndUpdate(
      req.params.id,
      { title, percentage },
      { new: true, runValidators: true }
    );
    
    if (!tax) {
      return res.status(404).json({
        success: false,
        message: 'Tax not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Tax updated successfully',
      data: tax
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating tax',
      error: error.message
    });
  }
});

// Delete Tax
router.delete('/tax/delete/:id', async (req, res) => {
  try {
    const tax = await TAX.findByIdAndDelete(req.params.id);
    
    if (!tax) {
      return res.status(404).json({
        success: false,
        message: 'Tax not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Tax deleted successfully',
      data: tax
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting tax',
      error: error.message
    });
  }
});

module.exports = router;