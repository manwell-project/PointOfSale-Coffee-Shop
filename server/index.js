const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize database (SQLite disabled after migration to Supabase)
// require('./db/init');

// Import routes
const productsRoutes = require('./routes/products');
const stocksRoutes = require('./routes/stocks');
const employeesRoutes = require('./routes/employees');
const authRoutes = require('./routes/auth');
const customersRoutes = require('./routes/customers');
const transactionsRoutes = require('./routes/transactions');
const reportsRoutes = require('./routes/reports');
const discountsRoutes = require('./routes/discounts');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Increase payload limits to allow image data (base64) uploads from client
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from root directory (for frontend)
// Serve static files from root directory (for frontend) with conservative caching rules
const staticOptions = {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const nocacheExt = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.eot'];
    if (nocacheExt.includes(ext)) {
      // Development-friendly: ensure browser requests fresh copies
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // allow caching for other assets briefly
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
};
app.use(express.static(path.join(__dirname, '..'), staticOptions));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DigiCaf API is running' });
});

// API Routes
app.use('/api/products', productsRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/discounts', discountsRoutes);

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.path} not found` });
});

// Error handler middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     ☕ DigiCaf POS Server Started     ║
╚════════════════════════════════════════╝

🚀 Server running at: http://localhost:${PORT}
📊 API endpoint: http://localhost:${PORT}/api
🏠 Frontend: http://localhost:${PORT}

Available endpoints:
  GET    /api/health
  GET/POST/PUT/DELETE /api/products
  GET/PUT /api/stocks
  GET/POST/PUT/DELETE /api/employees
  GET/POST/PUT/DELETE /api/customers
  POST/GET /api/transactions
  GET /api/reports
  GET/POST/PUT/DELETE /api/discounts

Type Ctrl+C to stop the server
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');
  process.exit(0);
});
