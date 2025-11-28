// Invoice Management API with Express.js
const express = require('express');
const app = express();
app.use(express.json());

// In-memory database (replace with actual database)
let invoices = [];
let clients = [];
let invoiceCounter = 100001;

// ==================== CLIENT ENDPOINTS ====================

// Get all clients
app.get('/api/clients', (req, res) => {
  res.json({ success: true, data: clients });
});

// Get single client
app.get('/api/clients/:id', (req, res) => {
  const client = clients.find(c => c.id === req.params.id);
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }
  res.json({ success: true, data: client });
});

// Create client
app.post('/api/clients', (req, res) => {
  const { name, email, phone, address, gst } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }
  
  const newClient = {
    id: `CLI-${Date.now()}`,
    name,
    email,
    phone: phone || '',
    address: address || '',
    gst: gst || '',
    createdAt: new Date().toISOString()
  };
  
  clients.push(newClient);
  res.status(201).json({ success: true, data: newClient });
});

// Update client
app.put('/api/clients/:id', (req, res) => {
  const index = clients.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }
  
  clients[index] = { ...clients[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: clients[index] });
});

// Delete client
app.delete('/api/clients/:id', (req, res) => {
  const index = clients.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }
  
  clients.splice(index, 1);
  res.json({ success: true, message: 'Client deleted successfully' });
});

// ==================== INVOICE ENDPOINTS ====================

// Get all invoices with filters
app.get('/api/invoices', (req, res) => {
  let filteredInvoices = [...invoices];
  
  // Filter by status
  if (req.query.status) {
    filteredInvoices = filteredInvoices.filter(inv => inv.status === req.query.status);
  }
  
  // Filter by client
  if (req.query.clientId) {
    filteredInvoices = filteredInvoices.filter(inv => inv.clientId === req.query.clientId);
  }
  
  // Filter by date range
  if (req.query.startDate && req.query.endDate) {
    filteredInvoices = filteredInvoices.filter(inv => {
      const invDate = new Date(inv.invoiceDate);
      return invDate >= new Date(req.query.startDate) && invDate <= new Date(req.query.endDate);
    });
  }
  
  res.json({ success: true, data: filteredInvoices, total: filteredInvoices.length });
});

// Get single invoice
app.get('/api/invoices/:id', (req, res) => {
  const invoice = invoices.find(inv => inv.invoiceNumber === req.params.id);
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }
  res.json({ success: true, data: invoice });
});

// Create invoice
app.post('/api/invoices', (req, res) => {
  const { clientId, invoiceDate, dueDate, items, notes, currency } = req.body;
  
  if (!clientId || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Client and items are required' });
  }
  
  // Calculate totals
  let subtotal = 0;
  items.forEach(item => {
    item.amount = item.quantity * item.rate;
    subtotal += item.amount;
  });
  
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + tax;
  
  const newInvoice = {
    invoiceNumber: `INV-${invoiceCounter++}`,
    clientId,
    invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    items,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    status: 'pending',
    notes: notes || '',
    currency: currency || 'INR',
    createdAt: new Date().toISOString()
  };
  
  invoices.push(newInvoice);
  res.status(201).json({ success: true, data: newInvoice });
});

// Update invoice
app.put('/api/invoices/:id', (req, res) => {
  const index = invoices.findIndex(inv => inv.invoiceNumber === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }
  
  const { items, ...otherUpdates } = req.body;
  
  // Recalculate if items changed
  if (items) {
    let subtotal = 0;
    items.forEach(item => {
      item.amount = item.quantity * item.rate;
      subtotal += item.amount;
    });
    
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    
    invoices[index] = {
      ...invoices[index],
      ...otherUpdates,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      updatedAt: new Date().toISOString()
    };
  } else {
    invoices[index] = { ...invoices[index], ...otherUpdates, updatedAt: new Date().toISOString() };
  }
  
  res.json({ success: true, data: invoices[index] });
});

// Update invoice status
app.patch('/api/invoices/:id/status', (req, res) => {
  const { status } = req.body;
  
  if (!['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  
  const index = invoices.findIndex(inv => inv.invoiceNumber === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }
  
  invoices[index].status = status;
  invoices[index].updatedAt = new Date().toISOString();
  
  res.json({ success: true, data: invoices[index] });
});

// Delete invoice
app.delete('/api/invoices/:id', (req, res) => {
  const index = invoices.findIndex(inv => inv.invoiceNumber === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }
  
  invoices.splice(index, 1);
  res.json({ success: true, message: 'Invoice deleted successfully' });
});

// ==================== DASHBOARD/STATS ENDPOINTS ====================

// Get dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
  
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  
  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.total, 0);
  
  res.json({
    success: true,
    data: {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      pendingAmount: parseFloat(pendingAmount.toFixed(2)),
      totalClients: clients.length
    }
  });
});

// ==================== SERVER ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Invoice API running on port ${PORT}`);
});

module.exports = app;