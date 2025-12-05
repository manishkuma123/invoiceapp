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

const upload = require("../config/upload");    

// router.post(
//   "/invoice/add",
//   upload.fields([
//     { name: "signature", maxCount: 1 },
//     { name: "companyStamp", maxCount: 1 }
//   ]),
//   async (req, res) => {
//     try {
//       const {
//         invoiceType,
//         invoiceNumber,
//         clientId,
//         items,
//         total,
//         discount,
//         discountAmount,
//         tax,
//         // taxAmount,
//         roundOff,
//         totalamount,
//         currency,
//         notes,
//         invoiceDate,
//         dueDate,
//         subject,
//         paymentTerms,
//         status
//       } = req.body;

//       // Validate required fields
//       if (!clientId || !items) {
//         return res.status(400).json({
//           success: false,
//           message: "Client ID and items are required"
//         });
//       }

//       // Convert items (string from Postman) to JSON
//       let parsedItems = [];
//       try {
//         parsedItems = JSON.parse(items);
//       } catch (err) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid items JSON"
//         });
//       }

//       // Check client exists
//       const client = await Client.findById(clientId);
//       if (!client) {
//         return res.status(404).json({
//           success: false,
//           message: "Client not found"
//         });
//       }

//       // TAX ID validation
//       let taxId = null;
//       if (tax) {
//         const taxRecord = await TAX.findById(tax);
//         if (!taxRecord) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid TAX ID"
//           });
//         }
//         taxId = tax;
//       }

//       // ===============================
//       // 📌 File Upload (Cloudinary URLs)
//       // ===============================
//       let signatureUrl = "";
//       let stampUrl = "";

//       if (req.files["signature"]) {
//         signatureUrl = req.files["signature"][0].path; // Cloudinary URL
//       }

//       if (req.files["companyStamp"]) {
//         stampUrl = req.files["companyStamp"][0].path; // Cloudinary URL
//       }

//       // ===============================
//       // 📌 Create Invoice
//       // ===============================
//       const invoice = new Invoice({
//         invoiceType,
//         invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
//         clientId,
//         items: parsedItems,
//         total,
//         discount,
//         discountAmount,
//         tax: taxId,
//         // taxAmount,
//         roundOff,
//         totalamount,
//         currency,
//         notes,
//         invoiceDate,
//         dueDate,
//         subject,
//         paymentTerms,
//         signature: signatureUrl,
//         companyStamp: stampUrl,
//         status
//       });

//       await invoice.save();

//       // Populate client + TAX fields
//       const populatedInvoice = await Invoice.findById(invoice._id)
//         .populate("clientId", "firstName lastName businessName email")
//         .populate("tax", "title percentage");

//       res.status(201).json({
//         success: true,
//         message: "Invoice created successfully",
//         data: populatedInvoice
//       });

//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: "Error creating invoice",
//         error: error.message
//       });
//     }
//   }
// );
// router.get("/invoice/all", async (req, res) => { 
//   try {
//     const invoices = await Invoice.find()
//       .populate("clientId", "firstName lastName businessName email")
//       .populate("tax", "title percentage")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       message: "Invoices fetched successfully",
//       count: invoices.length,
//       data: invoices
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching invoices",
//       error: error.message
//     });
//   }
// });
// router.put(
//   "/invoice/update/:id",
//   upload.fields([
//     { name: "signature", maxCount: 1 },
//     { name: "companyStamp", maxCount: 1 }
//   ]),
//   async (req, res) => {
//     try {
//       const invoiceId = req.params.id;

//       const invoice = await Invoice.findById(invoiceId);
//       if (!invoice) {
//         return res.status(404).json({
//           success: false,
//           message: "Invoice not found"
//         });
//       }

//       let updatedData = { ...req.body };

//       // Handle items JSON (if sent)
//       if (req.body.items) {
//         try {
//           updatedData.items = JSON.parse(req.body.items);
//         } catch (err) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid items JSON"
//           });
//         }
//       }

//       // Validate TAX ID if updating
//       if (req.body.tax) {
//         const taxRecord = await TAX.findById(req.body.tax);
//         if (!taxRecord) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid TAX ID"
//           });
//         }
//       }

//       // File uploads
//       if (req.files["signature"]) {
//         updatedData.signature = req.files["signature"][0].path;
//       }

//       if (req.files["companyStamp"]) {
//         updatedData.companyStamp = req.files["companyStamp"][0].path;
//       }

//       const updatedInvoice = await Invoice.findByIdAndUpdate(
//         invoiceId,
//         updatedData,
//         { new: true }
//       )
//         .populate("clientId")
//         .populate("tax");

//       res.status(200).json({
//         success: true,
//         message: "Invoice updated successfully",
//         data: updatedInvoice
//       });

//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: "Error updating invoice",
//         error: error.message
//       });
//     }
//   }
// );
// router.delete("/invoice/delete/:id", async (req, res) => {
//   try {
//     const invoiceId = req.params.id;

//     const invoice = await Invoice.findByIdAndDelete(invoiceId);

//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         message: "Invoice not found"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Invoice deleted successfully"
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Error deleting invoice",
//       error: error.message
//     });
//   }
// });


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
//       message: 'Invoice deleted successfully',
//       data: invoice
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error deleting invoice',
//       error: error.message
//     });
//   }
// });



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
      { 
        status, 
        paidDate: status === 'paid' ? new Date() : null 
      },
      { new: true }
    )
      .populate('clientId', 'firstName lastName businessName email')
      .populate('tax', 'title percentage');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      message: `Invoice status updated to ${status} successfully`,
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






router.post("/invoice/add", upload.fields([
  { name: "signature", maxCount: 1 },
  { name: "companyStamp", maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      invoiceType,
      invoiceNumber,
      clientId,
      itemType,
      items,
      total,
      discount,
      discountAmount,
      tax,
      taxvalue,
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

    // Basic validation
    if (!items) {
      return res.status(400).json({
        success: false,
        message: "Client ID, item type, and items are required"
      });
    }

    // Parse items JSON
    let parsedItems = [];
    try {
      parsedItems = JSON.parse(items);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid items JSON"
      });
    }

    // Validate client
    const client = await Client.findOne({ 
      _id: clientId, 
      userId: req.user.userId 
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    // Validate tax if provided
    let taxId = null;
    if (tax) {
      const taxRecord = await TAX.findOne({ 
        _id: tax, 
        userId: req.user.userId 
      });
      
      if (!taxRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid TAX ID"
        });
      }
      taxId = tax;
    }

    // Handle file uploads
    let signatureUrl = "";
    let stampUrl = "";
    if (req.files["signature"]) {
      signatureUrl = req.files["signature"][0].path;
    }
    if (req.files["companyStamp"]) {
      stampUrl = req.files["companyStamp"][0].path;
    }

    // Check for duplicate invoice number
    const existingInvoice = await Invoice.findOne({ invoiceNumber });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: `Invoice number ${invoiceNumber} already exists`
      });
    }

    // Create invoice - just store the data
    const invoice = new Invoice({
      userId: req.user.userId,
      invoiceType,
      invoiceNumber,
      clientId,
      itemType,
      items: parsedItems,
      total: parseFloat(total) || 0,
      discount: parseFloat(discount) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      tax: taxId,
      taxvalue: parseFloat(taxvalue) || 0,
      roundOff: parseFloat(roundOff) || 0,
      totalamount: parseFloat(totalamount) || 0,
      currency: currency || 'INR',
      notes,
      invoiceDate: invoiceDate || new Date(),
      dueDate,
      subject,
      paymentTerms,
      signature: signatureUrl,
      companyStamp: stampUrl,
      status: status || 'pending'
    });

    await invoice.save();

    // Populate and return
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
});

// module.exports = router;

// const express = require('express');
// const router = express.Router();
// const Invoice = require('../schema/Invoice');
// const Client = require('../schema/Client');
// const TAX = require('../schema/Tax');

// const upload = require("../config/upload");    

// Create invoice - userId added from token automatically
// router.post(
//   "/invoice/add",
//   upload.fields([
//     { name: "signature", maxCount: 1 },
//     { name: "companyStamp", maxCount: 1 }
//   ]),
//   async (req, res) => {
//     try {
//       const {
//         invoiceType,
//         invoiceNumber,
//         clientId,
//         items,
//         total,
//         discount,
//         discountAmount,
//         tax,
//         roundOff,
//         totalamount,
//         currency,
//         notes,
//         invoiceDate,
//         dueDate,
//         subject,
//         paymentTerms,
//         status
//       } = req.body;


//       if (!clientId || !items) {
//         return res.status(400).json({
//           success: false,
//           message: "Client ID and items are required"
//         });
//       }

//       let parsedItems = [];
//       try {
//         parsedItems = JSON.parse(items);
//       } catch (err) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid items JSON"
//         });
//       }


//       const client = await Client.findOne({ 
//         _id: clientId, 
//         userId: req.user.userId 
//       });
      
//       if (!client) {
//         return res.status(404).json({
//           success: false,
//           message: "Client not found or you do not have permission to access it"
//         });
//       }


//       let taxId = null;
//       if (tax) {
//         const taxRecord = await TAX.findOne({ 
//           _id: tax, 
//           userId: req.user.userId 
//         });
        
//         if (!taxRecord) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid TAX ID or you do not have permission to use it"
//           });
//         }
//         taxId = tax;
//       }

//       let signatureUrl = "";
//       let stampUrl = "";

//       if (req.files["signature"]) {
//         signatureUrl = req.files["signature"][0].path;
//       }

//       if (req.files["companyStamp"]) {
//         stampUrl = req.files["companyStamp"][0].path; 
//       }

//       const invoice = new Invoice({
//         userId: req.user.userId, 
//         invoiceType,
//         invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
//         clientId,
//         items: parsedItems,
//         total,
//         discount,
//         discountAmount,
//         tax: taxId,
//         roundOff,
//         totalamount,
//         currency,
//         notes,
//         invoiceDate,
//         dueDate,
//         subject,
//         paymentTerms,
//         signature: signatureUrl,
//         companyStamp: stampUrl,
//         status
//       });

//       await invoice.save();

//       const populatedInvoice = await Invoice.findById(invoice._id)
//         .populate("clientId", "firstName lastName businessName email")
//         .populate("tax", "title percentage");

//       res.status(201).json({
//         success: true,
//         message: "Invoice created successfully",
//         data: populatedInvoice
//       });

//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: "Error creating invoice",
//         error: error.message
//       });
//     }
//   }
// );
// router.post("/invoice/add", upload.fields([
//   { name: "signature", maxCount: 1 },
//   { name: "companyStamp", maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const {
//       invoiceType,
//       invoiceNumber,
//       clientId,
//       items,
//       total,
//       discount,
//       discountAmount,
//       tax,
//       roundOff,
//       totalamount,
//       currency,
//       notes,
//       invoiceDate,
//       dueDate,
//       subject,
//       paymentTerms,
//       status
//     } = req.body;

//     // Ensure clientId and items are provided
//     if (!clientId || !items) {
//       return res.status(400).json({
//         success: false,
//         message: "Client ID and items are required"
//       });
//     }

//     // Parse items JSON
//     let parsedItems = [];
//     try {
//       parsedItems = JSON.parse(items);
//     } catch (err) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid items JSON"
//       });
//     }

//     // Fetch the client from the database
//     const client = await Client.findOne({ 
//       _id: clientId, 
//       userId: req.user.userId 
//     });

//     if (!client) {
//       return res.status(404).json({
//         success: false,
//         message: "Client not found or you do not have permission to access it"
//       });
//     }

//     // Validate TAX ID if provided
//     let taxId = null;
//     if (tax) {
//       const taxRecord = await TAX.findOne({ 
//         _id: tax, 
//         userId: req.user.userId 
//       });
      
//       if (!taxRecord) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid TAX ID or you do not have permission to use it"
//         });
//       }
//       taxId = tax;
//     }

//     // Handle file uploads (signature and company stamp)
//     let signatureUrl = "";
//     let stampUrl = "";
//     if (req.files["signature"]) {
//       signatureUrl = req.files["signature"][0].path;
//     }
//     if (req.files["companyStamp"]) {
//       stampUrl = req.files["companyStamp"][0].path;
//     }

//     // Check if the provided invoiceNumber already exists in the database
//     const existingInvoice = await Invoice.findOne({ invoiceNumber: invoiceNumber });

//     if (existingInvoice) {
//       return res.status(400).json({
//         success: false,
//         message: `Invoice number ${invoiceNumber} already exists. Please choose a different number.`
//       });
//     }

//     // Create the new invoice
//     const invoice = new Invoice({
//       userId: req.user.userId,
//       invoiceType,
//       invoiceNumber,  // Using the provided invoice number
//       clientId,
//       items: parsedItems,
//       total,
//       discount,
//       discountAmount,
//       tax: taxId,
//       roundOff,
//       totalamount,
//       currency,
//       notes,
//       invoiceDate,
//       dueDate,
//       subject,
//       paymentTerms,
//       signature: signatureUrl,
//       companyStamp: stampUrl,
//       status
//     });

//     // Save the invoice to the database
//     await invoice.save();

//     // Populate the invoice with related client and tax data
//     const populatedInvoice = await Invoice.findById(invoice._id)
//       .populate("clientId", "firstName lastName businessName email")
//       .populate("tax", "title percentage");

//     // Return a successful response
//     res.status(201).json({
//       success: true,
//       message: "Invoice created successfully",
//       data: populatedInvoice
//     });

//   } catch (error) {
//     // Handle any errors during the process
//     res.status(400).json({
//       success: false,
//       message: "Error creating invoice",
//       error: error.message
//     });
//   }
// });


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
        itemType,
        items,
        total,
        discountAmount,
        tax,
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

      // Required fields
      if (!clientId || !items || !invoiceNumber) {
        return res.status(400).json({
          success: false,
          message: "Client ID, items, and invoiceNumber are required"
        });
      }

      // Parse items JSON
      let parsedItems = [];
      try {
        parsedItems = JSON.parse(items);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid items JSON"
        });
      }


      const client = await Client.findOne({
        _id: clientId,
        userId: req.user.userId
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found or no permission to access"
        });
      }

      // Validate TAX (optional)
      let taxId = null;
      if (tax) {
        const taxRecord = await TAX.findOne({
          _id: tax,
          userId: req.user.userId
        });

        if (!taxRecord) {
          return res.status(400).json({
            success: false,
            message: "Invalid TAX ID or no permission to use"
          });
        }

        taxId = tax;
      }

      // File upload
      const signatureUrl = req.files?.signature?.[0]?.path || "";
      const stampUrl = req.files?.companyStamp?.[0]?.path || "";

      // Check invoice number uniqueness
      const existingInvoice = await Invoice.findOne({ 
        invoiceNumber, 
        userId: req.user.userId 
      });

      if (existingInvoice) {
        return res.status(400).json({
          success: false,
          message: `Invoice number ${invoiceNumber} already exists`
        });
      }

      // Create the invoice (NO auto-calculation)
      const invoice = new Invoice({
        userId: req.user.userId,
        invoiceType,
        invoiceNumber,       // <-- saved exactly as frontend sends
        clientId,
        itemType,
        items: parsedItems,
        total,               // frontend calculated
        discountAmount,      // frontend calculated
        tax: taxId,
        roundOff,            // frontend calculated
        totalamount,         // frontend calculated
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

      const populatedInvoice = await Invoice.findById(invoice._id)
        .populate("clientId", "firstName lastName businessName email")
        .populate("tax", "title percentage");

      return res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        data: populatedInvoice
      });

    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Error creating invoice",
        error: error.message
      });
    }
  }
);




router.get("/invoice/all", async (req, res) => { 
  try {
    const { page = 1, limit = 10, search, status, startDate, endDate } = req.query;
    
    const query = { userId: req.user.userId }; 
    
   
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    
 
    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query)
      .populate("clientId", "firstName lastName businessName email")
      .populate("tax", "title percentage")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Invoice.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Invoices fetched successfully",
      data: invoices,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalInvoices: count
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching invoices",
      error: error.message
    });
  }
});

// Get single invoice by ID - with ownership check
router.get("/invoice/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId  // ← Ownership check
    })
      .populate("clientId", "firstName lastName businessName email")
      .populate("tax", "title percentage");
    
    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: 'Invoice not found or you do not have permission to access it' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching invoice',
      error: error.message 
    });
  }
});

// Update invoice - with ownership check
router.put(
  "/invoice/update/:id",
  upload.fields([
    { name: "signature", maxCount: 1 },
    { name: "companyStamp", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const invoiceId = req.params.id;

      // Check invoice exists AND belongs to user
      const invoice = await Invoice.findOne({ 
        _id: invoiceId, 
        userId: req.user.userId 
      });
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found or you do not have permission to update it"
        });
      }

      let updatedData = { ...req.body };
      
      // Prevent userId from being modified
      delete updatedData.userId;

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

      // Validate clientId ownership if updating
      if (req.body.clientId) {
        const client = await Client.findOne({ 
          _id: req.body.clientId, 
          userId: req.user.userId 
        });
        
        if (!client) {
          return res.status(400).json({
            success: false,
            message: "Invalid Client ID or you do not have permission to use it"
          });
        }
      }

      // Validate TAX ID ownership if updating
      if (req.body.tax) {
        const taxRecord = await TAX.findOne({ 
          _id: req.body.tax, 
          userId: req.user.userId 
        });
        
        if (!taxRecord) {
          return res.status(400).json({
            success: false,
            message: "Invalid TAX ID or you do not have permission to use it"
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
        { new: true, runValidators: true }
      )
        .populate("clientId", "firstName lastName businessName email")
        .populate("tax", "title percentage");

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

// Delete invoice - with ownership check
router.delete("/invoice/delete/:id", async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const invoice = await Invoice.findOneAndDelete({ 
      _id: invoiceId, 
      userId: req.user.userId  // ← Ownership check
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or you do not have permission to delete it"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      data: invoice
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting invoice",
      error: error.message
    });
  }
});

module.exports = router;
