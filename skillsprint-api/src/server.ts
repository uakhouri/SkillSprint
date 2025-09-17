import app from './app.js';
import { testConnection } from './config/database.js';

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    console.log('Testing database connection...');
    const connected = await testConnection();

    if (!connected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('\nServer is running!');
      console.log(`Port: ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: Connected to Neon PostgreSQL`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`\nAvailable endpoints:`);
      console.log(`   GET  http://localhost:${PORT}/`);
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/api/tasks`);
      console.log(`   POST http://localhost:${PORT}/api/tasks`);
      console.log(`\nReady to accept requests!\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();