require("dotenv").config();

const router = require("express").Router();
const User = require("../models/User");
const UserVerification = require("../models/UserVerification");
const auth = require("../middleware/authMiddleware");

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const generateCode = require("../middleware/generateCode");

const buildUserTokenPayload = (user, extraClaims = {}) => ({
  id: user._id,
  email: user.email || "",
  name: user.name || "",
  avatar: user.avatar || "",
  level: user.level || "beginner",
  ...extraClaims,
});

const signUserToken = (user, extraClaims = {}, expiresIn = "1d") =>
  jwt.sign(buildUserTokenPayload(user, extraClaims), process.env.JWT_SECRET, {
    expiresIn,
  });

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const getAppBaseUrl = () =>
  (process.env.APP_URL || process.env.PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, "");

const buildSimpleEmail = ({
  title,
  intro,
  code,
  note = "This code expires in 10 minutes.",
  footerLine = "Happy Learning!",
  footerSignature = "The Hadarni Team",
}) => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Hadarni</title>
    </head>
    <body style="margin:0; padding:0; background:#f7f5ff;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#fbfaff 0%,#f7f5ff 100%); padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; background:#ffffff; border-radius:32px; box-shadow:0 24px 80px rgba(91,61,245,0.10); overflow:hidden;">
              <tr>
                <td style="padding:44px 28px 28px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#10143a;">
                  <div style="text-align:center;">
                    <h1 style="margin:0 0 18px; font-size:28px; font-weight:800; color:#10143a;">${title}</h1>
                    <p style="margin:0 auto 28px; font-size:17px; line-height:1.7; color:#5e6484; max-width:560px;">${intro}</p>
                    <div style="max-width:520px; margin:0 auto 18px; padding:28px 20px; background:linear-gradient(180deg, rgba(91,61,245,0.08), rgba(91,61,245,0.05)); border:1px solid rgba(91,61,245,0.08); border-radius:26px;">
                      <div style="font-size:52px; line-height:1; font-weight:800; letter-spacing:0.34em; text-indent:0.34em; color:#5b3df5;">${code}</div>
                    </div>
                    <p style="margin:0 0 24px; font-size:15px; color:#6a7193;"><span style="color:#5b3df5; font-weight:700;">${note}</span></p>
                    <p style="margin:26px auto 0; font-size:15px; line-height:1.8; color:#6a7193; max-width:520px;">If you didn't create an account, you can safely ignore this email.</p>
                    <div style="margin-top:54px; padding-top:28px;">
                      <div style="font-size:18px; font-weight:700; color:#5b3df5;">${footerLine}</div>
                      <div style="font-size:16px; color:#7b82a8;">&mdash; ${footerSignature}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

const buildHadarniPremiumEmail = ({
  title,
  intro,
  code,
  note = "This code expires in 10 minutes.",
  footerLine = "Happy Learning!",
  footerSignature = "The Hadarni Team",
}) => {
  const copyUrl = `${getAppBaseUrl()}/user/copy-code?code=${encodeURIComponent(code)}&brand=Hadarni`;

  return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Hadarni</title>
    </head>
    <body style="margin:0; padding:0; background:#f7f5ff;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#fbfaff 0%,#f7f5ff 100%); padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; background:#ffffff; border-radius:32px; box-shadow:0 24px 80px rgba(91,61,245,0.10); overflow:hidden;">
              <tr>
                <td style="padding:44px 28px 28px; position:relative; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#10143a;">
                  <div style="text-align:center; position:relative; z-index:1;">
                    <h1 style="margin:0 0 18px; font-size:28px; font-weight:800; color:#10143a;">${title}</h1>
                    <p style="max-width:560px; margin:0 auto 28px; font-size:17px; line-height:1.7; color:#5e6484;">${intro}</p>
                    <div style="max-width:520px; margin:0 auto 18px; padding:28px 20px; background:linear-gradient(180deg, rgba(91,61,245,0.08), rgba(91,61,245,0.05)); border:1px solid rgba(91,61,245,0.08); border-radius:26px; box-shadow:0 10px 30px rgba(91,61,245,0.06);">
                      <div style="font-size:14px; font-weight:700; color:#5b3df5; margin-bottom:18px;">Your verification code</div>
                      <div style="font-size:52px; line-height:1; font-weight:800; letter-spacing:0.34em; text-indent:0.34em; color:#5b3df5;">${code}</div>
                    </div>
                    <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#6a7193;"><span style="color:#5b3df5; font-weight:700;">${note}</span></p>
                    <a href="${copyUrl}" style="display:inline-block; min-width:300px; padding:18px 30px; border-radius:18px; background:linear-gradient(135deg,#5b3df5 0%,#7b61ff 100%); color:#ffffff; text-decoration:none; font-size:18px; font-weight:700; box-shadow:0 18px 36px rgba(91,61,245,0.28);">Copy Code</a>
                    <p style="max-width:520px; margin:26px auto 0; font-size:15px; line-height:1.8; color:#6a7193;">If you didn't create an account, you can safely ignore this email.</p>
                    <div style="margin-top:54px; padding-top:28px;">
                      <div style="font-size:18px; font-weight:700; color:#5b3df5; margin-bottom:4px;">${footerLine}</div>
                      <div style="font-size:16px; color:#7b82a8;">&mdash; ${footerSignature}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};

// ================= EMAIL CONFIG =================
const useCustomSmtp = Boolean(process.env.SMTP_HOST);
const transporter = useCustomSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    })
  : nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });

transporter.verify((error, success) => {
  if (error) {
    console.error("Email service error:", error.message);
  } else {
    console.log("Email service is ready");
  }
});

router.get("/copy-code", (req, res) => {
  const code = String(req.query.code || "");
  const brand = String(req.query.brand || "Hadarni");

  if (!code) {
    return res.status(400).send("Missing code");
  }

  const page = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${brand} Code</title>
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body {
          margin: 0; min-height: 100vh; display: grid; place-items: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: radial-gradient(circle at top, rgba(124, 92, 255, 0.12), transparent 38%), linear-gradient(180deg, #fbfaff 0%, #f7f5ff 100%);
          color: #10143a; padding: 24px;
        }
        .card {
          width: min(100%, 460px); background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(91, 61, 245, 0.10); border-radius: 28px;
          box-shadow: 0 24px 80px rgba(91, 61, 245, 0.12); padding: 32px 24px; text-align: center;
        }
        .code {
          margin: 18px 0 24px; padding: 18px 16px; border-radius: 20px;
          background: linear-gradient(180deg, rgba(91,61,245,0.08), rgba(91,61,245,0.05));
          color: #5b3df5; font-size: clamp(32px, 8vw, 52px); font-weight: 800;
          letter-spacing: 0.28em; text-indent: 0.28em; user-select: all;
        }
        .button {
          display: inline-block; width: 100%; padding: 16px 20px; border-radius: 18px;
          background: linear-gradient(135deg, #5b3df5 0%, #7b61ff 100%); color: #fff;
          text-decoration: none; font-size: 16px; font-weight: 700;
          box-shadow: 0 18px 36px rgba(91, 61, 245, 0.28);
        }
        .muted { color: #6a7193; font-size: 14px; line-height: 1.6; }
        .success { color: #5b3df5; font-weight: 700; margin-top: 8px; }
      </style>
    </head>
    <body>
      <main class="card">
        <div style="font-size: 28px; font-weight: 800; margin-bottom: 8px;">${brand}</div>
        <div style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">Your verification code</div>
        <div class="code" id="code">${code}</div>
        <button class="button" id="copyButton">Copy Code</button>
        <p class="success" id="status">Copied automatically.</p>
        <p class="muted" style="margin: 18px 0 0;">If copying does not work, select the code manually.</p>
      </main>
      <script>
        const code = ${JSON.stringify(code)};
        const status = document.getElementById('status');
        document.getElementById('copyButton').addEventListener('click', async (e) => {
          e.preventDefault();
          try { await navigator.clipboard.writeText(code); status.textContent = 'Copied to clipboard.'; }
          catch { status.textContent = 'Copy blocked. Select manually.'; }
        });
        navigator.clipboard.writeText(code).then(() => status.textContent = 'Copied to clipboard.').catch(() => {});
      </script>
    </body>
  </html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(page);
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, avatar, level } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists", type: "email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      avatar: avatar || "",
      level: level || "beginner",
    });

    const savedUser = await newUser.save();

    const codeVerification = generateCode();
    const hashcodeVerification = await bcrypt.hash(codeVerification, 10);

    await new UserVerification({
      userId: savedUser._id,
      code: hashcodeVerification,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
      isRestPassword: false,
    }).save();

    await transporter.sendMail({
      from: `"Hadarni" <${process.env.AUTH_EMAIL}>`,
      to: email,
      subject: "Hadarni verification code",
      html: buildSimpleEmail({
        title: "Verify your email",
        intro:
          "Welcome to Hadarni! Use the verification code below to confirm your email address.",
        code: codeVerification,
      }),
    });

    res.status(200).json({ message: "Verification email sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= VERIFY EMAIL =================
router.post("/verify", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const record = await UserVerification.findOne({ userId: user._id });
    if (!record) {
      return res.status(400).json({ message: "Verification not found" });
    }

    if (record.expiresAt < Date.now()) {
      await UserVerification.deleteOne({ userId: user._id });
      return res.status(400).json({ message: "Code expired" });
    }

    const valid = await bcrypt.compare(code, record.code);
    if (!valid) {
      return res.status(400).json({ message: "Invalid code" });
    }

    await UserVerification.deleteOne({ userId: user._id });

    const token = signUserToken(user, {}, "7d");

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during verification" });
  }
});

router.post("/send-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const thisUser = await User.findOne({ email });
    if (!thisUser) {
      return res.status(400).json({ message: "User not found" });
    }

    await UserVerification.deleteMany({ userId: thisUser._id });

    const codeVerification = Math.floor(100000 + Math.random() * 900000).toString();
    const hashCode = await bcrypt.hash(codeVerification, 10);
    await UserVerification.create({
      userId: thisUser._id,
      code: hashCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
      isResetPassword: true,
    });

    await transporter.sendMail({
      from: `"Hadarni" <${process.env.AUTH_EMAIL}>`,
      to: email,
      subject: "Hadarni verification code",
      html: buildHadarniPremiumEmail({
        title: "Verify your email",
        intro:
          "Use the verification code below to confirm your email address.",
        code: codeVerification,
      }),
    });

    res.status(200).json({ message: "Verification code sent successfully" });
  } catch (err) {
    console.error("Error sending email:", err.message);
    res.status(500).json({ message: "Error sending verification email", error: err.message });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found", type: "email" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Incorrect password", type: "password" });
    }

    const token = signUserToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        level: user.level,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/google", async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ message: "Google sign-in is not configured on the server" });
    }

    const credential = req.body.credential || req.body.token;
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ message: "Google account email is missing" });
    }

    const email = payload.email;
    const googleId = payload.sub;
    const displayName = payload.name || "";
    const picture = payload.picture || "";

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: displayName || email.split("@")[0],
        email,
        password: await bcrypt.hash(googleId, 10),
        avatar: picture || "",
        level: "beginner",
      });
    }

    const token = signUserToken(user, { provider: "google" }, "7d");

    res.status(200).json({
      message: "Google sign-in successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        level: user.level,
      },
    });
  } catch (err) {
    console.error("Google sign-in error:", err.message);
    res.status(400).json({ message: "Google sign-in failed", error: err.message });
  }
});

// ================= FORGET PASSWORD =================
router.post("/forget", async (req, res) => {
  try {
    const { email } = req.body;
    const thisUser = await User.findOne({ email });
    if (!thisUser) {
      return res.status(400).json({ message: "User not found" });
    }

    await UserVerification.deleteMany({ userId: thisUser._id });

    const codeVerification = generateCode();
    const hashCode = await bcrypt.hash(codeVerification, 10);

    await UserVerification.create({
      userId: thisUser._id,
      code: hashCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
      isResetPassword: true,
    });

    await transporter.sendMail({
      from: `"Hadarni" <${process.env.AUTH_EMAIL}>`,
      to: email,
      subject: "Hadarni password reset code",
      html: buildHadarniPremiumEmail({
        title: "Reset your password",
        intro: "Use the verification code below to reset your password.",
        code: codeVerification,
      }),
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/confirm", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const record = await UserVerification.findOne({ userId: user._id });
    if (!record) {
      return res.status(400).json({ message: "Verification not found" });
    }

    if (record.expiresAt < Date.now()) {
      await UserVerification.deleteOne({ userId: user._id });
      return res.status(400).json({ message: "Code expired" });
    }

    const valid = await bcrypt.compare(code, record.code);
    if (!valid) {
      return res.status(400).json({ message: "Invalid code" });
    }

    const token = signUserToken(user, { action: "reset-password" }, "20m");

    await UserVerification.deleteOne({ userId: user._id });

    res.json({ token });
  } catch (err) {
    console.error("Confirm error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ================= CHANGE PASSWORD =================
router.put("/password", auth, async (req, res) => {
  try {
    const { id, action } = req.user;
    const { password, newPassword } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(400).json({ message: "User not found" });

    const hashNewPassword = await bcrypt.hash(newPassword, 10);

    if (action === "reset-password") {
      user.password = hashNewPassword;
      await user.save();
      await UserVerification.deleteMany({ userId: user._id });
    } else {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(400).json({ message: "Incorrect password" });

      user.password = hashNewPassword;
      await user.save();
    }

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= UPDATE USER =================
router.put("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, avatar, level } = req.body;

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (level !== undefined) user.level = level;

    await user.save();

    const token = signUserToken(user);

    res.status(200).json({
      message: "User updated successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        level: user.level,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
