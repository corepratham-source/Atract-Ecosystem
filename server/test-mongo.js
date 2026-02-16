const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('No MONGO_URI in environment. Copy server/.env.example to .env and set MONGO_URI');
  process.exit(1);
}

(async () => {
  try {
    console.log('Testing MongoDB connection to:', mongoUri.replace(/:[^:@]+@/, ':*****@'));
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB test connection succeeded');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('MongoDB test connection failed:');
    console.error(err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
})();
