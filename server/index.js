const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize database
require('./db/init');

// Import routes
const productsRoutes = require('./routes/products');
const stocksRoutes = require('./routes/stocks');
const employeesRoutes = require('./routes/employees');
const customersRoutes = require('./routes/customers');
const transactionsRoutes = require('./routes/transactions');
const reportsRoutes = require('./routes/reports');

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from root directory (for frontend)
app.use(express.static(path.join(__dirname, '..')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DigiCaf API is running' });
});

// API Routes
app.use('/api/products', productsRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/reports', reportsRoutes);

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

Type Ctrl+C to stop the server
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');
  process.exit(0);
});
