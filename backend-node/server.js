const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const firebase = require('firebase-admin');
const geoip = require('geoip-lite');

dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to create this file
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to determine currency based on location
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const geo = geoip.lookup(ip);
  req.country = geo ? geo.country : 'IN'; // Default to India
  req.currency = req.country === 'IN' ? 'INR' : 'USD';
  next();
});

// Routes will go here

app.get('/', (req, res) => {
  res.send('Node.js backend is running');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
