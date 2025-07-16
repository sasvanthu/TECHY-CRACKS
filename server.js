#!/usr/bin/env node

/**
 * Production server for Digital Catalog AI Agent
 * Serves both backend API and frontend static files
 */

const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Set API key from environment
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCFcKQKkrTMSN8IXDgrt2fow25JJJKFKCQ';

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'TECHY-CRACKS/dist')));

// API routes - proxy to Python backend
app.use('/api', (req, res) => {
  // Start Python backend if not running
  if (!global.pythonBackend) {
    console.log('🐍 Starting Python backend...');
    global.pythonBackend = spawn('python', ['start_backend_with_api.py'], {
      env: { ...process.env, GEMINI_API_KEY: process.env.GEMINI_API_KEY },
      cwd: __dirname
    });
    
    global.pythonBackend.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });
    
    global.pythonBackend.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });
  }
  
  // Proxy request to Python backend
  const proxyUrl = `http://localhost:5001${req.url}`;
  res.redirect(proxyUrl);
});

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'TECHY-CRACKS/dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Digital Catalog AI Agent - Production Server
================================================
🌐 Server running on port ${PORT}
🔗 Access at: http://localhost:${PORT}
🎯 Frontend: Static files served
🔌 Backend: Python API proxied
🔑 API Key: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}
================================================
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  if (global.pythonBackend) {
    global.pythonBackend.kill();
  }
  process.exit(0);
});