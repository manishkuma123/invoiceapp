const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceType: { type: String },
    invoiceNumber: { type: String, unique: true, required: true },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
        invoiceDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date
    },
    subject: { type: String, default: '' },
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    items: [
      {
        description: { type: String },
        quantity: { type: Number },
     
        itemDiscount: { type: Number, default: 0 }, 
      
      }
    ],
    total: { type: Number, default: 0 },      
    discountAmount: { type: Number, default: 0 },
    tax: {
     type: mongoose.Schema.Types.ObjectId, ref: 'TAX', default: null 
    },
    roundOff: { type: Number, default: 0 },
    totalamount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled', 'draft'],
      default: 'pending'
    },
     userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
      },
    notes: { type: String, default: '' },
    signature: { type: String, default: '' },
    companyStamp: { type: String, default: '' },
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);



// | KEY           | TYPE     | VALUE                                                                |
// | ------------- | -------- | -------------------------------------------------------------------- |
// | invoiceType   | text     | Standard Invoice                                                     |
// | invoiceNumber | text     | INV-1002                                                             |
// | clientId      | text     | 676fd735e1c9a36d8f2f4192                                             |
// | items         | text     | `[{"description":"Service","quantity":1,"rate":1000,"amount":1000}]` |
// | total         | text     | 1000                                                                 |
// | tax           | text     | 67823492ab12fd883019aa45                                             |
// | taxAmount     | text     | 180                                                                  |
// | totalamount   | text     | 1180                                                                 |
// | signature     | **file** | choose file                                                          |
// | companyStamp  | **file** | choose file                                                          |
