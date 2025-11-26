// const express = require('express');
// const cors = require('cors');
// const mongoose =require("mongoose")
// require('dotenv').config();


 
const express = require('express');
const upload = require("./config/upload");
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 6000;
const  categoryroutes = require('./routes/Category')
const Category = require("./schema/Category");
app.use(express.json());
app.use(cors());

app.use('/api/organization/businesstype/category',categoryroutes )
// let db = "mongodb+srv://manishpdotpitchtechnologies_db_user:2PkhDVk8dfnmjMud@cluster0.ihrxtdj.mongodb.net/invoicedata";
let db = "mongodb+srv://manishpdotpitchtechnologies_db_user:2PkhDVk8dfnmjMud@cluster0.ihrxtdj.mongodb.net/invoicedata?retryWrites=true&w=majority";
mongoose.connect(process.env.MONGODB_URI || db)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  otp: { 
    type: String, 
    required: true 
  },
  purpose: { 
    type: String, 
    enum: ['signup', 'login'], 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 600 
  }
});

const OTP = mongoose.model('OTP', otpSchema);


const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },

  isVerified: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const User = mongoose.model('User', userSchema);


const organizationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  organizationName: { 
    type: String, 
    required: true,
    trim: true
  },
  
//   organizationType: { 
//     type: String,
//     trim: true
//   },
//   businessType: { 
//     type: String,
//     trim: true
//   },
    businessType: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

state: { 
    type: String,
    trim: true
  },
  location: { 
    type: String,
    trim: true
  },
  currency: { 
    type: String,
    default: 'USD'
  },
  language: { 
    type: String,
    default: 'English'
  },
  signature: { 
    type: String 
  },
  companySealing: { 
    type: String 
  },
  logo: { 
    type: String 
  },
  isSetupComplete: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Organization = mongoose.model('Organization', organizationSchema);

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Must be App Password
  },
  tls: {
    rejectUnauthorized: false
  }
});


transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
    console.log('Please check EMAIL_USER and EMAIL_PASS environment variables');
  } else {
    console.log('✅ Email server ready to send messages');
  }
});
async function sendOTPEmail(email, otp, purpose) {
  const subject = purpose === 'signup' 
    ? 'Your OTP for Signup - Invoice App' 
    : 'Your OTP for Login - Invoice App';
    
  const title = purpose === 'signup' 
    ? 'Welcome! Complete Your Signup' 
    : 'Login Verification';
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 40px; }
          .otp-box { background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .note { color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice App</h1>
            <p>${title}</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your One-Time Password (OTP) for ${purpose === 'signup' ? 'completing your signup' : 'logging in'} is:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p class="note">
              ⏱️ This code will expire in <strong>10 minutes</strong>.<br>
              🔒 For security reasons, please do not share this code with anyone.<br>
              ❓ If you didn't request this code, please ignore this email.
            </p>
          </div>
         
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return false;
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


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
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};


app.post('/api/auth/signup/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered. Please login instead.' 
      });
    }

    const otp = generateOTP();
    await OTP.deleteOne({ email: email.toLowerCase() });
    const otpDoc = new OTP({ 
      email: email.toLowerCase(), 
      otp, 
      purpose: 'signup' 
    });
    await otpDoc.save();

    const emailSent = await sendOTPEmail(email, otp, 'signup');

    if (!emailSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send OTP email. Please try again.' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'OTP sent successfully to your email',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

app.post('/api/auth/signup/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and OTP are required' 
      });
    }

    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(), 
      purpose: 'signup' 
    });

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.' 
      });
    }

    if (otpRecord.otp !== otp.toString()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP. Please check and try again.' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

   

    const newUser = new User({
      email: email.toLowerCase(),
      
      isVerified: true
    });

    await newUser.save();
    await OTP.deleteOne({ email: email.toLowerCase() });

    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    console.log(`✅ New user created: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        isVerified: newUser.isVerified
      },
      token
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

app.post('/api/auth/signup/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    const otp = generateOTP();

    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { 
        otp, 
        purpose: 'signup', 
        createdAt: Date.now() 
      },
      { upsert: true, new: true }
    );

    const emailSent = await sendOTPEmail(email, otp, 'signup');

    if (!emailSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to resend OTP' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'OTP resent successfully' 
    });

  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

app.post('/api/auth/login/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      return res.status(404).json({ 
        success: false,
        message: 'Email not registered. Please signup first.' 
      });
    }

    const otp = generateOTP();
    await OTP.deleteOne({ email: email.toLowerCase() });
    const otpDoc = new OTP({ 
      email: email.toLowerCase(), 
      otp, 
      purpose: 'login' 
    });
    await otpDoc.save();

    const emailSent = await sendOTPEmail(email, otp, 'login');

    if (!emailSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send OTP email. Please try again.' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'OTP sent successfully to your email',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

app.post('/api/auth/login/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and OTP are required' 
      });
    }

    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(), 
      purpose: 'login' 
    });

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.' 
      });
    }

    if (otpRecord.otp !== otp.toString()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP. Please check and try again.' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    await OTP.deleteOne({ email: email.toLowerCase() });

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      },
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

app.post('/api/auth/login/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      return res.status(404).json({ 
        success: false,
        message: 'Email not registered' 
      });
    }

    const otp = generateOTP();

    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { 
        otp, 
        purpose: 'login', 
        createdAt: Date.now() 
      },
      { upsert: true, new: true }
    );

    const emailSent = await sendOTPEmail(email, otp, 'login');

    if (!emailSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to resend OTP' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'OTP resent successfully' 
    });

  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

app.post('/api/organization/setup', authenticateToken, upload.fields([
  { name: "signature", maxCount: 1 },
  { name: "companySealing", maxCount: 1 },
  { name: "logo", maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      organizationName,
    //   organizationType,

      businessType,
      state,
      location,
      currency,
      language
    } = req.body;

    if (!organizationName) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required"
      });
    }

    const existingOrg = await Organization.findOne({ userId: req.user.userId });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: "Organization already setup for this user"
      });
    }

    const categoryExists = await Category.findById(businessType);
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
    //   organizationType,
      businessType,
      state,
      location,
      currency: currency || "USD",
      language: language || "English",
      signature: signatureUrl,
      companySealing: companySealingUrl,
      logo: logoUrl,
      isSetupComplete: true
    });

    await newOrganization.save();

    const populatedOrg = await Organization.findById(newOrganization._id)
      .populate("businessType", "name");

    res.status(201).json({
      success: true,
      message: "Organization setup completed successfully",
      organization: {
        id: populatedOrg._id,
        organizationName: populatedOrg.organizationName,
        // organizationType: populatedOrg.organizationType,
        businessType: populatedOrg.businessType?.name,
        state: populatedOrg.state,
        location: populatedOrg.location,
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

// app.post('/api/organization/setup', authenticateToken, async (req, res) => {
//   try {
//     const {
//       organizationName,
//       organizationType,
//       businessType,
//       state,
//       location,
//       currency,
//       language,
//       signature,
//       companySealing,
//       logo
//     } = req.body;

//     if (!organizationName) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Organization name is required' 
//       });
//     }

//     const existingOrg = await Organization.findOne({ userId: req.user.userId });
//     if (existingOrg) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Organization already setup for this user' 
//       });
//     }

//     const newOrganization = new Organization({
//       userId: req.user.userId,
//       organizationName,
//       organizationType,
//       businessType,
//       state,
//       location,
//       currency: currency || 'USD',
//       language: language || 'English',
//       signature,
//       companySealing,
//       logo,
//       isSetupComplete: true
//     });

//     await newOrganization.save();

//     console.log(`✅ Organization created for user: ${req.user.email}`);

//     res.status(201).json({
//       success: true,
//       message: 'Organization setup completed successfully',
//       organization: {
//         id: newOrganization._id,
//         organizationName: newOrganization.organizationName,
//         organizationType: newOrganization.organizationType,
//         businessType: newOrganization.businessType,
//         state: newOrganization.state,
//         location: newOrganization.location,
//         currency: newOrganization.currency,
//         language: newOrganization.language
//       }
//     });

//   } catch (error) {
//     console.error('❌ Organization setup error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error. Please try again later.' 
//     });
//   }
// });

app.put('/api/organization/setup', authenticateToken, async (req, res) => {
  try {
    const updateData = req.body;

    const organization = await Organization.findOne({ userId: req.user.userId });

    if (!organization) {
      return res.status(404).json({ 
        success: false,
        message: 'Organization not found. Please setup organization first.' 
      });
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        organization[key] = updateData[key];
      }
    });

    await organization.save();

    console.log(`✅ Organization updated for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      organization
    });

  } catch (error) {
    console.error('❌ Organization update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

app.get('/api/organization/details', authenticateToken, async (req, res) => {
  try {
    const organization = await Organization.findOne({ userId: req.user.userId });

    if (!organization) {
      return res.status(404).json({ 
        success: false,
        message: 'Organization not found. Please setup organization first.' 
      });
    }

    res.status(200).json({
      success: true,
      organization
    });

  } catch (error) {
    console.error('❌ Get organization error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

// ==================== FILE UPLOAD ====================

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { 
//     fileSize: 5 * 1024 * 1024 
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|gif/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);

//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed'));
//     }
//   }
// });

app.post('/api/organization/upload-image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    console.log(`✅ Image uploaded: ${req.file.filename}`);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });

  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

app.use('/uploads', express.static('uploads'));

// ==================== USER ROUTES ====================

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (name) user.name = name;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ==================== START SERVER ====================

// const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║   🚀 Invoice App Server Running           ║
  ║   📡 Port: ${PORT}                        ║
  ║  
  ╚════════════════════════════════════════════╝
  `);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});


// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
