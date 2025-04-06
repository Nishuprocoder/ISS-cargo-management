const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve frontend files from "public" directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
console.log("Serving frontend from:", publicPath);

// ✅ Backend API routes
const cargoRoutes = require('./cargoController');
app.use('/', cargoRoutes);

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
