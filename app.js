const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes.js");

const artistRoutes = require("./routes/artist.routes");
const categoryRoutes = require("./routes/category.routes");
const artworkRoutes = require("./routes/artwork.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Request logging
app.use(morgan("dev"));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/artists", artistRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/artworks", artworkRoutes);
app.use("/api/v1/admin", adminRoutes);


// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Artfolio API is running",
    timestamp: new Date().toISOString(),
  });
});


module.exports = app;