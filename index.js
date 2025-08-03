const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./models/db');
connectDB(); // must be called before app.listen


require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

app.use('/api', authRoutes);

app.listen(PORT, () => {
  console.log(`✅ Auth server running on http://localhost:${PORT}`);
});
