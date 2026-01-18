const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/user');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const adminExists = await User.findOne({ email: 'admin@ngo.com' });

    if (adminExists) {
      console.log('Admin user already exists.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      email: 'admin@ngo.com',
      password: hashedPassword,
    });

    await adminUser.save();
    console.log('Demo admin created successfully!');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedAdmin();
