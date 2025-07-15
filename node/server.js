const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const { authMiddleware } = require('./middlewares/authMiddleware');

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(process.env.FIREBASE_CONFIG),
});

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api/products', authMiddleware, require('./routes/productRoutes'));
app.use('/api/speech', authMiddleware, require('./routes/speechRoutes'));
app.use('/api/generate-description', authMiddleware, require('./routes/descriptionRoutes'));
app.use('/api/upload-image', authMiddleware, require('./routes/imageRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Node.js server running on port ${PORT}`));