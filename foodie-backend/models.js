import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// ==========================================
// 1. USER SCHEMA
// ==========================================
const addressSchema = new Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Exclude from normal queries for security
    },
    role: {
      type: String,
      enum: {
        values: ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN'],
        message: '{VALUE} is not a valid role'
      },
      default: 'CUSTOMER'
    },
    phone: {
      type: String,
      trim: true
    },
    addresses: [addressSchema],
    isActive: {
      type: Boolean,
      default: true
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    deliveryPartnerDetails: {
      vehicleType: {
        type: String,
        enum: ['BICYCLE', 'MOTORBIKE', 'SCOOTER', 'CAR'],
        default: 'MOTORBIKE'
      },
      isAvailable: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
userSchema.index({ role: 1 });

// ==========================================
// 2. RESTAURANT SCHEMA
// ==========================================
const restaurantSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [120, 'Restaurant name cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Restaurant must belong to an owner user']
    },
    owners: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    cuisine: {
      type: [String],
      default: []
    },
    address: {
      street: { type: String, required: [true, 'Street address is required'], trim: true },
      city: { type: String, required: [true, 'City is required'], trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true }
    },
    phone: {
      type: String,
      trim: true
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ name: 'text', cuisine: 'text' });
restaurantSchema.index({ 'address.city': 1, isOpen: 1 });

// ==========================================
// 3. FOOD ITEM SCHEMA
// ==========================================
const foodItemSchema = new Schema(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Food item must belong to a restaurant']
    },
    name: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
      maxlength: [100, 'Food item name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [400, 'Description cannot exceed 400 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be greater than or equal to 0']
    },
    category: {
      type: String,
      required: [true, 'Category is required (e.g. Starters, Main Course, Beverages, Desserts)'],
      trim: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    isVegetarian: {
      type: Boolean,
      default: false
    },
    imageUrl: {
      type: String,
      default: ''
    },
    preparationTimeMinutes: {
      type: Number,
      default: 20,
      min: 1
    },
    // Surplus Food Rescue Fields (Phase 10)
    isSurplus: {
      type: Boolean,
      default: false
    },
    surplusOriginalPrice: {
      type: Number,
      min: 0
    },
    surplusQuantityAvailable: {
      type: Number,
      default: 0,
      min: 0
    },
    surplusAvailableUntil: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

foodItemSchema.index({ restaurant: 1, category: 1 });
foodItemSchema.index({ price: 1, isAvailable: 1 });
foodItemSchema.index({ isSurplus: 1, surplusAvailableUntil: 1 });

// ==========================================
// 4. ORDER SCHEMA (STRICT CASH ON DELIVERY ONLY)
// ==========================================
const orderItemSnapshotSchema = new Schema(
  {
    foodItem: {
      type: Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    itemTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a customer']
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Order must belong to a restaurant']
    },
    items: {
      type: [orderItemSnapshotSchema],
      validate: [val => val.length > 0, 'Order must contain at least one item']
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      postalCode: { type: String },
      phone: { type: String }
    },
    // Distinct Order Operational Lifecycle
    orderStatus: {
      type: String,
      enum: {
        values: [
          'PLACED',
          'ACCEPTED',
          'PREPARING',
          'READY_FOR_PICKUP',
          'ASSIGNED',
          'PICKED_UP',
          'DELIVERED',
          'CANCELLED',
          'REJECTED'
        ],
        message: '{VALUE} is not a valid order status'
      },
      default: 'PLACED'
    },
    // STRICT CASH ON DELIVERY - No online payment methods allowed
    paymentMethod: {
      type: String,
      enum: {
        values: ['COD'],
        message: 'Payment method must be COD (Cash on Delivery)'
      },
      default: 'COD',
      required: true
    },
    // Distinct COD Financial Collection Lifecycle
    codCollectionStatus: {
      type: String,
      enum: {
        values: ['PENDING_COLLECTION', 'COLLECTED', 'RECONCILED', 'CANCELLED'],
        message: '{VALUE} is not a valid COD collection status'
      },
      default: 'PENDING_COLLECTION'
    },
    codCollectedAt: {
      type: Date
    },
    codCollectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    codReconciledAt: {
      type: Date
    },
    codReconciledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    // Financial Split & Payout Breakdown (Reconciled by Admin)
    restaurantPayout: {
      type: Number,
      default: 0,
      min: 0
    },
    adminCommission: {
      type: Number,
      default: 0,
      min: 0
    },
    riderPayout: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryPartner: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    cancellationReason: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    // Group Ordering Support (Phase 11)
    isGroupOrder: {
      type: Boolean,
      default: false
    },
    groupId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, orderStatus: 1 });
orderSchema.index({ deliveryPartner: 1, orderStatus: 1 });
orderSchema.index({ codCollectionStatus: 1 });

// ==========================================
// 5. SURPLUS RESERVATION SCHEMA (PHASE 10)
// ==========================================
const surplusReservationSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    foodItem: {
      type: Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: true
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true
    },
    foodName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['RESERVED', 'CLAIMED', 'CANCELLED', 'EXPIRED'],
      default: 'RESERVED',
      index: true
    },
    pickupDeadline: {
      type: Date,
      required: true
    },
    claimCode: {
      type: String,
      required: true,
      unique: true
    }
  },
  {
    timestamps: true
  }
);

// ==========================================
// 6. GROUP ORDER SCHEMA (PHASE 11)
// ==========================================
const groupParticipantItemSchema = new Schema(
  {
    foodItem: { type: Schema.Types.ObjectId, ref: 'FoodItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    itemTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const groupParticipantSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    items: [groupParticipantItemSchema],
    participantSubtotal: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const groupOrderSchema = new Schema(
  {
    groupCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    status: {
      type: String,
      enum: ['OPEN', 'LOCKED', 'ORDERED', 'EXPIRED', 'CANCELLED'],
      default: 'OPEN',
      index: true
    },
    joinDeadline: {
      type: Date,
      required: true
    },
    participants: [groupParticipantSchema],
    groupSubtotal: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    finalOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    }
  },
  {
    timestamps: true
  }
);

// Export Models
export const User = model('User', userSchema);
export const Restaurant = model('Restaurant', restaurantSchema);
export const FoodItem = model('FoodItem', foodItemSchema);
export const Order = model('Order', orderSchema);
export const SurplusReservation = model('SurplusReservation', surplusReservationSchema);
export const GroupOrder = model('GroupOrder', groupOrderSchema);

export default {
  User,
  Restaurant,
  FoodItem,
  Order,
  SurplusReservation,
  GroupOrder
};
