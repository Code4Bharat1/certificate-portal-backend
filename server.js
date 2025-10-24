// import express from "express";
// // import router from "./router/auth.router.js";
// import dotenv from "dotenv";
// import connectDb from "./config/db.config.js";
// // import errorMiddleware from "./middlewares/error.middleware.js";
// // import cors from "cors";
// // import dashboardRoutes from "./router/dashboard.router.js";
// // import transactionRoutes from "./router/transaction.router.js";
// // import pdfRoutes from "./router/pdf.router.js";

// dotenv.config();
// const app = express();

// // const corsOptions = {
// //     origin: "https://finance-tracker-green-tau.vercel.app",
// //     methods: "GET, POST, PUT, PATCH, DELETE, HEAD",
// //     credentials: true,
// // };

// // app.use(cors(corsOptions));

// app.use(express.json());

// // app.use("/api/auth", router);
// // app.use("/api/auth/dashboard", dashboardRoutes);
// // app.use("/api/auth/transactions", transactionRoutes);
// // app.use("/api/pdf", pdfRoutes);

// // app.use(errorMiddleware);

// const PORT = process.env.PORT;

// connectDb().then(() => {
//     app.listen(PORT, () => {
//         console.log(`server is running at port: ${PORT}`);
//     });
// })


import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import statsRoutes from './routes/stats.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5235;

const allowedOrigins = [
  "https://education.code4bharat.com",
  "http://education.marketiqjunction.com",
  "https://certificate.nexcorealliance.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
