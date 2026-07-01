require('dotenv').config();

const express = require('express');
const app = express();
const connectDB = require('./config/Db');

const port = process.env.PORT || 3000;

const cors = require("cors");

app.use(cors({
  origin: "*",        // السماح لأي origin
  credentials: true   // للحالات التي تحتاج إرسال cookies أو authorization headers
}));
// -------- Middleware --------
// Parse incoming JSON
app.use(express.json());

// -------- Routes --------
const userRouter = require('./api/User');

app.use('/user', userRouter);

app.use(express.static("public"));

// -------- Start Server --------
async function startServer() {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();
