// In your main server file (app.js or server.js)
const { connectDB } = require('./database');

// Connect to database when app starts
async function startServer() {
  try {
    const dbConnection = await connectDB();
    
    if (!dbConnection) {
      console.log('Running in degraded mode without database');
    }
    
    // Start your server
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();