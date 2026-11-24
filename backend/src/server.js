const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const config = require('./config');
const apiRoutes = require('./routes/api');

// Initialize database schema and seeds if not already done
require('./db/database');
const { runAllSeeds } = require('./db/seeds');
runAllSeeds();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static project storage for generated audio, images, and video preview
app.use('/storage', express.static(config.PATHS.STORAGE));
app.use('/packages', express.static(path.join(config.PATHS.ROOT, 'ByBibleWisdom')));
app.use('/data', express.static(path.join(config.PATHS.ROOT, 'data')));

// Register API routes
app.use('/api', apiRoutes);

// Health check endpoints for immediate uptime confirmation
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'online', time: new Date().toISOString() });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'online', time: new Date().toISOString() });
});

// Serve Frontend production build if available
const frontendDist = path.join(config.PATHS.FRONTEND, 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/storage') && !req.path.startsWith('/data') && !req.path.startsWith('/packages')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    // If a web browser accesses the API port directly, seamlessly redirect to Frontend UI
    if (req.accepts('html')) {
      return res.redirect(`http://localhost:${config.CLIENT_PORT || 3000}`);
    }
    res.json({
      app: 'ByBibleWisdom AI Studio API',
      channel: 'https://www.youtube.com/@ByBibleWisdom',
      status: 'ONLINE',
      version: '1.0.0',
      frontend: `http://localhost:${config.CLIENT_PORT || 3000}`
    });
  });
}

// Start listening on 0.0.0.0 for reliable local IPv4 and IPv6 access
const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  BYBIBLEWISDOM AI STUDIO — SYSTEM ONLINE           `);
  console.log(`  App Dashboard: http://localhost:${config.PORT}     `);
  console.log(`  Frontend UI:   http://localhost:${config.CLIENT_PORT || 3000} `);
  console.log(`  Database:      ${config.PATHS.DB_FILE}            `);
  console.log(`  FFmpeg:        ${config.PATHS.FFMPEG}             `);
  console.log(`====================================================`);
});

module.exports = { app, server };
