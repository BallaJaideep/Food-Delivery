import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User, Restaurant } from './models.js';

dotenv.config();

async function setupOwnerAndRestaurants() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Setup] Connected to DB.');

  // 1. Ensure owner@gmail.com exists with password Owner@123
  let owner = await User.findOne({ email: 'owner@gmail.com' });
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash('Owner@123', salt);

  if (!owner) {
    owner = await User.create({
      name: 'Restaurant Partner (Swiggy Style)',
      email: 'owner@gmail.com',
      password: hashedPassword,
      role: 'RESTAURANT_OWNER',
      phone: '+91 9876543211',
      isActive: true
    });
    console.log('[+] Created owner@gmail.com:', owner._id);
  } else {
    owner.name = 'Restaurant Partner (Swiggy Style)';
    owner.role = 'RESTAURANT_OWNER';
    owner.password = hashedPassword;
    owner.isActive = true;
    await owner.save();
    console.log('[*] Updated owner@gmail.com with password Owner@123');
  }

  // 2. Also ensure owner@foodie.local is updated with same password
  const oldOwner = await User.findOne({ email: 'owner@foodie.local' });
  if (oldOwner) {
    oldOwner.password = hashedPassword;
    await oldOwner.save();
  }

  // 3. Assign all seeded restaurants to BOTH owner@foodie.local and owner@gmail.com
  // so whether logging in with owner@foodie.local or owner@gmail.com, all restaurants & past orders are fully visible!
  const updateRes = await Restaurant.updateMany({}, {
    $set: {
      owner: oldOwner ? oldOwner._id : owner._id,
      owners: oldOwner ? [oldOwner._id, owner._id] : [owner._id]
    }
  });
  console.log(`[+] Assigned ${updateRes.modifiedCount} restaurants to both owner@foodie.local and owner@gmail.com`);

  const foodieTotal = oldOwner ? await Restaurant.countDocuments({ $or: [{ owner: oldOwner._id }, { owners: oldOwner._id }] }) : 0;
  const gmailTotal = await Restaurant.countDocuments({ $or: [{ owner: owner._id }, { owners: owner._id }] });
  console.log(`[SUCCESS] owner@foodie.local sees ${foodieTotal} restaurants. owner@gmail.com sees ${gmailTotal} restaurants.`);

  await mongoose.disconnect();
  process.exit(0);
}

setupOwnerAndRestaurants().catch(err => {
  console.error('[Error]:', err);
  process.exit(1);
});
