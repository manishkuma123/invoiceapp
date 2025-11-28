const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const User = require('../schema/User');
const OTP = require('../schema/Otp');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}


async function sendOTPEmail(email, otp, purpose) {
  const subject = purpose === 'signup' 
    ? 'Your OTP for Signup - Invoice App' 
    : 'Your OTP for Login - Invoice App';
    
  const title = purpose === 'signup' 
    ? 'Welcome! Complete Your Signup' 
    : 'Login Verification';
  
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
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
    await sgMail.send(msg);
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ SendGrid email error:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return false;
  }
}


router.post('/signup/send-otp', async (req, res) => {
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
      email: email.toLowerCase(),
      otp 
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

router.post('/signup/verify-otp', async (req, res) => {
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
        isVerified: newUser.isVerified,
         hasCompletedOrgSetup: newUser.hasCompletedOrgSetup 
      },
      // In your login/signup endpoint, include hasCompletedOrgSetup in response

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

router.post('/signup/resend-otp', async (req, res) => {
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


router.post('/login/send-otp', async (req, res) => {
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
      email: email.toLowerCase(),
      otp // ⚠️ Remove in production
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

router.post('/login/verify-otp', async (req, res) => {
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
        isVerified: user.isVerified,
        hasCompletedOrgSetup: user.hasCompletedOrgSetup 
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

router.post('/login/resend-otp', async (req, res) => {
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



// app.post('/api/auth/signup/send-otp', async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Email is required' 
//       });
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Invalid email format' 
//       });
//     }

//     const existingUser = await User.findOne({ email: email.toLowerCase() });
//     if (existingUser) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Email already registered. Please login instead.' 
//       });
//     }

//     const otp = generateOTP();
//     await OTP.deleteOne({ email: email.toLowerCase() });
//     const otpDoc = new OTP({ 
//       email: email.toLowerCase(), 
//       otp, 
//       purpose: 'signup' 
//     });
//     await otpDoc.save();

//     const emailSent = await sendOTPEmail(email, otp, 'signup');

//     if (!emailSent) {
//       return res.status(500).json({ 
//         success: false,
//         message: 'Failed to send OTP email. Please try again.' 
//       });
//     }

//     res.status(200).json({ 
//       success: true,
//       message: 'OTP sent successfully to your email',
//       email: email.toLowerCase()
//     });

//   } catch (error) {
//     console.error('❌ Send OTP error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error. Please try again later.' 
//     });
//   }
// });
// app.post('/api/auth/login/send-otp', async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Email is required' 
//       });
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Invalid email format' 
//       });
//     }

//     const existingUser = await User.findOne({ email: email.toLowerCase() });
//     if (!existingUser) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Email not registered. Please signup first.' 
//       });
//     }

//     const otp = generateOTP();
//     await OTP.deleteOne({ email: email.toLowerCase() });
//     const otpDoc = new OTP({ 
//       email: email.toLowerCase(), 
//       otp, 
//       purpose: 'login' 
//     });
//     await otpDoc.save();

//     const emailSent = await sendOTPEmail(email, otp, 'login');

//     if (!emailSent) {
//       return res.status(500).json({ 
//         success: false,
//         message: 'Failed to send OTP email. Please try again.' 
//       });
//     }

//     res.status(200).json({ 
//       success: true,
//       message: 'OTP sent successfully to your email',
//       email: email.toLowerCase()
//     });

//   } catch (error) {
//     console.error('❌ Send OTP error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error. Please try again later.' 
//     });
//   }
// });

module.exports = router;

