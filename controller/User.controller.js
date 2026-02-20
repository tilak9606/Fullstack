import User from "../model/User.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerUser = async (req, res) => {
  // get data
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  //validate
  try {
    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // create a user in database
    const user = await User.create({
      name,
      email,
      password,
    });
    console.log(user);

    if (!user) {
      return res.status(400).json({
        message: "User not registered",
      });
    }

    //create a verification token
    const token = crypto.randomBytes(32).toString("hex");
    console.log(token);

    // save token in database
    user.verificationToken = token;

    await user.save();

    // send token as email to user
    // send email
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    // Looking to send emails in production? Check out our Email API/SMTP product!
    // var transport = nodemailer.createTransport({
    //   host: "sandbox.smtp.mailtrap.io",
    //   port: 2525,
    //   auth: {
    //     user: "f31ec0935f4764",
    //     pass: "840aa0c4d33c04",
    //   },
    // });

    const mailOption = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: user.email,
      subject: "Verify your email", // Subject line
      text: `Please click on the following link:
          ${process.env.BASE_URL}/api/v1/users/verify/${token}`,
    };

    await transporter.sendMail(mailOption);

    // send success status to user
    res.status(201).json({
      message: "User registered successfully",
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: "User not registered ",
      error,
      success: false,
    });
  }
};

const verifyUser = async (req, res) => {
  // get token from url
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({
      message: "Invalid token 1",
    });
  }
  // validate
  try {
    // find user based on token
    const user = await User.findOne({ verificationToken: token });

    // if not
    if (!user) {
      return res.status(400).json({
        message: "Invalid token 2",
      });
    }

    // set isVerifies field to true
    user.isVerified = true;

    // remove verification token
    user.verificationToken = undefined;

    // save
    await user.save();

    // return response
    res.status(200).json({
      message: "User verified successfully",
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: "User not verified",
      error,
      success: false,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    console.log(isMatch);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },

      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    };
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {}
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {}
};

const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {});
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {}
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "email is required",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokens = token;
    (user.resetPasswordExpires = Date.now() + 10 * 60 * 1000),
      await user.save();

    // send email
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: user.email,
      subject: "Reset password: ",
      text: `Please click on the following link:
      ${process.env.BASE_URL}/api/v1/users/forgotPassword/${token}`,
    };

    await transporter.sendMail(mailOption);

    res.status(201).json({
      message: "Token sent successfully",
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: "token not sent",
      error,
      success: false,
    });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({
      message: "Invalid token 1",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      message: "pass and confpass are not same",
      success: false,
    });
  }

  try {
    const user = await User.findOne({
      resetPasswordTokens: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid token 2",
      });
    }
    user.password = password;

    user.resetPasswordTokens = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "password reset successfully",
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: "reset not set",
      error,
      success: false,
    });
  }
};

export {
  registerUser,
  verifyUser,
  login,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
};
