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
const placementRouter = require('./routes/placementRoutes');
const progressionRouter = require('./routes/progressionRoutes');

app.use('/user', userRouter);
app.use('/api/placement', placementRouter);
app.use('/api/placement/progression', progressionRouter);

app.use(express.static("public"));

// -------- Error Handler --------
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  console.error(`[Error] ${statusCode} - ${message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({ error: message });
});

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
