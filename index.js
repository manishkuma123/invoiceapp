// const express = require('express');
// const upload = require("./config/upload");
// const User = require('./schema/User'); 
// const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const sgMail = require('@sendgrid/mail');
// const connectDB = require('./config/db'); 
// const Organization  = require('./schema/organization')
// const authRoutes = require('./routes/User');
// const invoicedata = require("./routes/invoiceroutes")
// const organizationrouter = require('./routes/Organization')
// require('dotenv').config();
// const app = express();
// const PORT = process.env.PORT || 6000;
// connectDB()
// const categoryroutes = require('./routes/Category');
// const Category = require("./schema/Category");
// const Clientroutes = require("./routes/Client");
// const taxroutes = require('./routes/Tax')
// app.use(express.json());
// app.use(cors());

// app.use('/api/auth', authRoutes);

// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// async function verifySendGridConfig() {
//   if (!process.env.SENDGRID_API_KEY) {
//     console.error('❌ SENDGRID_API_KEY not found in environment variables');
//     console.log('Please add SENDGRID_API_KEY to your .env file');
//     return false;
//   }
//   if (!process.env.SENDGRID_FROM_EMAIL) {
//     console.error('❌ SENDGRID_FROM_EMAIL not found in environment variables');
//     console.log('Please add SENDGRID_FROM_EMAIL to your .env file');
//     return false;
//   }
//   console.log('✅ SendGrid configuration loaded successfully');
//   console.log(`📧 Emails will be sent from: ${process.env.SENDGRID_FROM_EMAIL}`);
//   return true;
// }
// verifySendGridConfig();
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ 
//       success: false,
//       message: 'Access token required' 
//     });
//   }

//   jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this', (err, user) => {
//     if (err) {
//       if (err.name === 'TokenExpiredError') {
  
//         return res.status(403).json({ 
//           success: false,
//           message: 'Token expired'
//         });
//       } else {
//         // Other errors (invalid signature, malformed token, etc.)
//         return res.status(403).json({ 
//           success: false,
//           message: 'Invalid token'
//         });
//       }
//     }
    
 
//     req.user = user;
//     next();
//   });
// };


// app.use('/api/tax',authenticateToken, taxroutes);
// app.use('/api/organization',organizationrouter)
// app.use('/api' ,  authenticateToken,invoicedata)
// app.post('/api/organization/setup', authenticateToken, upload.fields([
//   { name: "signature", maxCount: 1 },
//   { name: "companySealing", maxCount: 1 },
//   { name: "logo", maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const {
//       organizationName,
//       businessType,
//       state,
//       // location,
//        country,
//       currency,
//       language
//     } = req.body;

//     if (!organizationName) {
//       return res.status(400).json({
//         success: false,
//         message: "Organization name is required"
//       });
//     }
// const userId = req.user.userId;
// const userEmail = req.user.email; // ✅ user's email

// console.log('User ID:', userId);
// console.log('User Email:', userEmail);

//     const existingOrg = await Organization.findOne({ userId: req.user.userId });
//     if (existingOrg) {
//       return res.status(400).json({
//         success: false,
//         message: "Organization already setup for this user"
//       });
//     }

//     const categoryExists = await Category.findOne({ name: businessType });
//     if (!categoryExists) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid businessType: Category not found"
//       });
//     }

//     const signatureUrl = req.files?.signature?.[0]?.path || null;
//     const companySealingUrl = req.files?.companySealing?.[0]?.path || null;
//     const logoUrl = req.files?.logo?.[0]?.path || null;

//     const newOrganization = new Organization({
//       userId: req.user.userId,
//       organizationName,
//       businessType: categoryExists._id, 
//       state,
//       // location,
//        country,
//       currency: currency || "USD",
//       language: language || "English",
//       signature: signatureUrl,
//       companySealing: companySealingUrl,
//       logo: logoUrl,
//       isSetupComplete: true
//     });

//     await newOrganization.save();

    
//    // Import User model
//     await User.findByIdAndUpdate(req.user.userId, {
//       hasCompletedOrgSetup: true
//     });

//     const populatedOrg = await Organization.findById(newOrganization._id)
//       .populate("businessType", "name");

//     res.status(201).json({
//       success: true,
//       message: "Organization setup completed successfully",
//        user: {
//     id: userId,
//     email: userEmail
//   },
//       organization: {
//         id: populatedOrg._id,
//         organizationName: populatedOrg.organizationName,
//         businessType: populatedOrg.businessType?.name,
//         state: populatedOrg.state,
//         // location: populatedOrg.location,
//          country: populatedOrg.country,
//         currency: populatedOrg.currency,
//         language: populatedOrg.language,
//         signature: populatedOrg.signature,          
//         companySealing: populatedOrg.companySealing,
//         logo: populatedOrg.logo                     
//       }
//     });

//   } catch (error) {
//     console.error("❌ Organization setup error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error. Please try again later."
//     });
//   }
// });
// app.use('/api/organization/businesstype/category',authenticateToken, categoryroutes);
// app.use('/uploads', express.static('uploads'));
// app.use('/api', authenticateToken,Clientroutes)
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// app.use((err, req, res, next) => {
//   console.error('❌ Error:', err);
//   res.status(500).json({
//     success: false,
//     message: err.message || 'Internal server error'
//   });
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT} | Email: SendGrid`);
// }); 

// process.on('unhandledRejection', (err) => {
//   console.error('❌ Unhandled Promise Rejection:', err);
//   process.exit(1);
// });

// process.on('uncaughtException', (err) => {
//   console.error('❌ Uncaught Exception:', err);
//   process.exit(1);
// });

const express = require('express');
const upload = require("./config/upload");
const User = require('./schema/User'); 
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const connectDB = require('./config/db'); 
const Organization = require('./schema/organization')
const authRoutes = require('./routes/User');
const invoicedata = require("./routes/invoiceroutes")
const organizationrouter = require('./routes/Organization')
require('dotenv').config();

const app = express();
// const PORT = process.env.PORT || 6000;

connectDB();

const categoryroutes = require('./routes/Category');
const Category = require("./schema/Category");
const Clientroutes = require("./routes/Client");
const taxroutes = require('./routes/Tax');

app.use(express.json());
app.use(cors());

// Nodemailer Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify Nodemailer Config
async function verifyMailerConfig() {
  if (!process.env.EMAIL_USER) {
    console.error('❌ EMAIL_USER not found in environment variables');
    return false;
  }
  if (!process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_PASS not found in environment variables');
    return false;
  }
  try {
    await transporter.verify();
    console.log('✅ Nodemailer configuration loaded successfully');
    console.log(`📧 Emails will be sent from: ${process.env.EMAIL_USER}`);
    return true;
  } catch (error) {
    console.error('❌ Nodemailer verification failed:', error.message);
    return false;
  }
}
verifyMailerConfig();

// Helper function to send emails via Nodemailer
const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${to} | ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Nodemailer email error:', error.message);
    throw error;
  }
};

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this', (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ 
          success: false,
          message: 'Token expired'
        });
      } else {
        return res.status(403).json({ 
          success: false,
          message: 'Invalid token'
        });
      }
    }
    req.user = user;
    next();
  });
};

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/tax', authenticateToken, taxroutes);
app.use('/api/organization', organizationrouter);
app.use('/api', authenticateToken, invoicedata);

// Organization Setup
app.post('/api/organization/setup', authenticateToken, upload.fields([
  { name: "signature", maxCount: 1 },
  { name: "companySealing", maxCount: 1 },
  { name: "logo", maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      organizationName,
      businessType,
      state,
      country,
      currency,
      language
    } = req.body;

    if (!organizationName) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required"
      });
    }

    const userId = req.user.userId;
    const userEmail = req.user.email;

    console.log('User ID:', userId);
    console.log('User Email:', userEmail);

    const existingOrg = await Organization.findOne({ userId: req.user.userId });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: "Organization already setup for this user"
      });
    }

    const categoryExists = await Category.findOne({ name: businessType });
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid businessType: Category not found"
      });
    }

    const signatureUrl = req.files?.signature?.[0]?.path || null;
    const companySealingUrl = req.files?.companySealing?.[0]?.path || null;
    const logoUrl = req.files?.logo?.[0]?.path || null;

    const newOrganization = new Organization({
      userId: req.user.userId,
      organizationName,
      businessType: categoryExists._id,
      state,
      country,
      currency: currency || "USD",
      language: language || "English",
      signature: signatureUrl,
      companySealing: companySealingUrl,
      logo: logoUrl,
      isSetupComplete: true
    });

    await newOrganization.save();

    await User.findByIdAndUpdate(req.user.userId, {
      hasCompletedOrgSetup: true
    });

    // Send welcome email after org setup
    if (userEmail) {
      await sendEmail({
        to: userEmail,
        subject: 'Organization Setup Complete 🎉',
        html: `
          <h2>Welcome, ${organizationName}!</h2>
          <p>Your organization has been successfully set up.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Organization: ${organizationName}</li>
            <li>Country: ${country}</li>
            <li>Currency: ${currency || 'USD'}</li>
            <li>Language: ${language || 'English'}</li>
          </ul>
          <p>You can now start using all features. 🚀</p>
        `,
      });
    }

    const populatedOrg = await Organization.findById(newOrganization._id)
      .populate("businessType", "name");

    res.status(201).json({
      success: true,
      message: "Organization setup completed successfully",
      user: {
        id: userId,
        email: userEmail
      },
      organization: {
        id: populatedOrg._id,
        organizationName: populatedOrg.organizationName,
        businessType: populatedOrg.businessType?.name,
        state: populatedOrg.state,
        country: populatedOrg.country,
        currency: populatedOrg.currency,
        language: populatedOrg.language,
        signature: populatedOrg.signature,
        companySealing: populatedOrg.companySealing,
        logo: populatedOrg.logo
      }
    });

  } catch (error) {
    console.error("❌ Organization setup error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
});

app.use('/api/organization/businesstype/category', authenticateToken, categoryroutes);
app.use('/uploads', express.static('uploads'));
app.use('/api', authenticateToken, Clientroutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT} | Email: Nodemailer`);
// });

const PORT = 6000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});
