const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected');

        const user = await User.findOne({ email: 'test@example.com' });
        console.log('User found:', user);

        if (user) {
            const bcrypt = require('bcryptjs');
            const match = await bcrypt.compare('password', user.password);
            console.log('Password match:', match);
        }
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        mongoose.connection.close();
    }
};

test();
