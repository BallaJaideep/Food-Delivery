import express from 'express';
import { User, Order, Restaurant, FoodItem, SurplusReservation } from './models.js';
import { verifyAuth, requireRole } from './auth.js';
import { sendSuccess, sendError, uploadImageToCloudinary } from './utils.js';

const router = express.Router();

// =========================================================================
// PART A: DELIVERY PARTNER FLEET MANAGEMENT (PHASE 9)
// =========================================================================

// 1. RIDER AVAILABILITY & OPERATIONAL STATE TOGGLE
router.patch(['/rider/availability', '/riders/availability'], verifyAuth, requireRole('DELIVERY_PARTNER', 'ADMIN'), async (req, res) => {
  try {
    const { isAvailable, vehicleType } = req.body;

    if (isAvailable === undefined && !vehicleType) {
      return sendError(res, 400, 'Please provide isAvailable boolean or vehicleType.');
    }

    const rider = await User.findById(req.user._id);
    if (!rider) {
      return sendError(res, 404, 'Rider profile not found.');
    }

    if (!rider.deliveryPartnerDetails) {
      rider.deliveryPartnerDetails = {};
    }

    if (isAvailable !== undefined) {
      rider.deliveryPartnerDetails.isAvailable = Boolean(isAvailable);
    }

    if (vehicleType) {
      const allowedVehicles = ['BICYCLE', 'MOTORBIKE', 'SCOOTER', 'CAR'];
      if (!allowedVehicles.includes(vehicleType.toUpperCase())) {
        return sendError(res, 400, `Invalid vehicle type. Allowed: ${allowedVehicles.join(', ')}`);
      }
      rider.deliveryPartnerDetails.vehicleType = vehicleType.toUpperCase();
    }

    await rider.save();

    return sendSuccess(res, 200, 'Rider operational state updated successfully', {
      riderId: rider._id,
      name: rider.name,
      isAvailable: rider.deliveryPartnerDetails.isAvailable,
      vehicleType: rider.deliveryPartnerDetails.vehicleType
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update rider availability', error.message);
  }
});

// 2. RIDER PROFILE & OPERATIONAL DASHBOARD STATUS
router.get('/rider/profile', verifyAuth, requireRole('DELIVERY_PARTNER'), async (req, res) => {
  try {
    const activeDeliveriesCount = await Order.countDocuments({
      deliveryPartner: req.user._id,
      orderStatus: { $in: ['ASSIGNED', 'PICKED_UP', 'READY_FOR_PICKUP'] }
    });

    const completedDeliveriesCount = await Order.countDocuments({
      deliveryPartner: req.user._id,
      orderStatus: 'DELIVERED'
    });

    return sendSuccess(res, 200, 'Rider profile retrieved', {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        deliveryPartnerDetails: req.user.deliveryPartnerDetails
      },
      stats: {
        activeDeliveries: activeDeliveriesCount,
        completedDeliveries: completedDeliveriesCount
      }
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve rider profile', error.message);
  }
});

// 3. LIST AVAILABLE RIDERS (ADMIN / RESTAURANT OWNER)
router.get('/riders/available', verifyAuth, requireRole('ADMIN', 'RESTAURANT_OWNER'), async (req, res) => {
  try {
    // Return all active delivery partners so kitchen managers can view the fleet
    // Online riders are prioritized at the top
    const allRiders = await User.find({
      role: 'DELIVERY_PARTNER',
      isActive: true
    })
      .select('name email phone deliveryPartnerDetails')
      .sort({ 'deliveryPartnerDetails.isAvailable': -1, name: 1 })
      .lean();

    return sendSuccess(res, 200, 'Available delivery partners retrieved', {
      count: allRiders.length,
      riders: allRiders
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve available riders', error.message);
  }
});

// 4. ASSIGN DELIVERY PARTNER TO ORDER (ADMIN / RESTAURANT OWNER)
router.post('/orders/:orderId/assign', verifyAuth, requireRole('ADMIN', 'RESTAURANT_OWNER'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryPartnerId } = req.body;

    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid order ID format.');
    }

    if (!deliveryPartnerId || !deliveryPartnerId.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Valid deliveryPartnerId is required.');
    }

    const order = await Order.findById(orderId).populate('restaurant');
    if (!order) {
      return sendError(res, 404, 'Order not found.');
    }

    if (req.user.role === 'RESTAURANT_OWNER') {
      const isOwner = order.restaurant?.owner?.toString() === req.user._id.toString() ||
        (order.restaurant?.owners && order.restaurant.owners.some(o => o.toString() === req.user._id.toString()));
      if (!isOwner) {
        return sendError(res, 403, 'Forbidden: You do not own the restaurant for this order.');
      }
    }

    const nonAssignableStatuses = ['DELIVERED', 'CANCELLED', 'REJECTED'];
    if (nonAssignableStatuses.includes(order.orderStatus)) {
      return sendError(
        res,
        400,
        `Cannot assign delivery partner to an order in "${order.orderStatus}" state.`
      );
    }

    if (order.deliveryPartner && order.deliveryPartner.toString() === deliveryPartnerId.toString()) {
      return sendError(
        res,
        400,
        'Duplicate assignment rejected: This delivery partner is already assigned to this order.'
      );
    }

    const partner = await User.findById(deliveryPartnerId);
    if (!partner || partner.role !== 'DELIVERY_PARTNER' || !partner.isActive) {
      return sendError(res, 404, 'Delivery partner not found or is inactive.');
    }

    // Assign rider directly to order
    order.deliveryPartner = partner._id;
    if (['READY_FOR_PICKUP', 'PLACED', 'ACCEPTED', 'PREPARING'].includes(order.orderStatus)) {
      order.orderStatus = 'ASSIGNED';
    }

    await order.save();

    return sendSuccess(res, 200, `Order ${order.orderNumber} successfully assigned to ${partner.name}`, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      assignedPartner: {
        id: partner._id,
        name: partner.name,
        phone: partner.phone,
        vehicleType: partner.deliveryPartnerDetails.vehicleType
      }
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to assign delivery partner', error.message);
  }
});

// 5. RIDER'S ASSIGNED DELIVERIES (STRICT DATA ISOLATION)
router.get('/rider/deliveries', verifyAuth, requireRole('DELIVERY_PARTNER'), async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 10 } = req.query;

    const filter = { deliveryPartner: req.user._id };

    if (status === 'active') {
      filter.orderStatus = { $in: ['ASSIGNED', 'READY_FOR_PICKUP', 'PICKED_UP'] };
    } else if (status === 'completed') {
      filter.orderStatus = 'DELIVERED';
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    const [deliveries, total] = await Promise.all([
      Order.find(filter)
        .populate('restaurant', 'name address phone')
        .populate('customer', 'name phone')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Order.countDocuments(filter)
    ]);

    return sendSuccess(res, 200, 'Assigned deliveries retrieved successfully', {
      total,
      page: pageNumber,
      deliveries
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch assigned deliveries', error.message);
  }
});

// 6. RIDER STATUS TRANSITION (PICKED_UP / DELIVERED)
router.patch('/rider/orders/:orderId/status', verifyAuth, requireRole('DELIVERY_PARTNER'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid order ID format.');
    }

    if (!status || !['PICKED_UP', 'DELIVERED'].includes(status.toUpperCase())) {
      return sendError(res, 400, 'Valid status ("PICKED_UP" or "DELIVERED") is required.');
    }

    const targetStatus = status.toUpperCase();
    const order = await Order.findById(orderId);

    if (!order) {
      return sendError(res, 404, 'Order not found.');
    }

    if (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        403,
        'Forbidden: You are not assigned to this delivery and cannot update its status.'
      );
    }

    if (targetStatus === 'PICKED_UP') {
      if (!['ASSIGNED', 'READY_FOR_PICKUP'].includes(order.orderStatus)) {
        return sendError(
          res,
          400,
          `Cannot mark PICKED_UP: Current order status is "${order.orderStatus}". Must be "ASSIGNED" or "READY_FOR_PICKUP".`
        );
      }
    } else if (targetStatus === 'DELIVERED') {
      if (order.orderStatus !== 'PICKED_UP') {
        return sendError(
          res,
          400,
          `Cannot mark DELIVERED: Current order status is "${order.orderStatus}". Order must be "PICKED_UP" first.`
        );
      }
    }

    order.orderStatus = targetStatus;
    await order.save();

    return sendSuccess(res, 200, `Order status successfully updated to ${targetStatus}`, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      codCollectionStatus: order.codCollectionStatus
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update delivery status', error.message);
  }
});

// 7. RIDER DELIVERY HISTORY
router.get('/rider/history', verifyAuth, requireRole('DELIVERY_PARTNER'), async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(50, parseInt(limit, 10) || 15));
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {
      deliveryPartner: req.user._id,
      orderStatus: 'DELIVERED'
    };

    const [history, total] = await Promise.all([
      Order.find(filter)
        .populate('restaurant', 'name address')
        .populate('customer', 'name phone')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Order.countDocuments(filter)
    ]);

    let totalDeliveredValue = 0;
    history.forEach(o => {
      totalDeliveredValue += o.totalAmount;
    });

    return sendSuccess(res, 200, 'Rider delivery history retrieved', {
      totalCompletedDeliveries: total,
      totalDeliveredValue: Math.round(totalDeliveredValue * 100) / 100,
      page: pageNumber,
      history
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch rider history', error.message);
  }
});

// =========================================================================
// PART B: SURPLUS-FOOD RESCUE & RESERVATIONS (PHASE 10)
// =========================================================================

// 8. CREATE A SURPLUS FOOD LISTING (RESTAURANT OWNER / ADMIN)
router.post('/surplus', verifyAuth, requireRole('RESTAURANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const restaurantId = req.body.restaurant || req.body.restaurantId;
    const name = req.body.name;
    const description = req.body.description;
    const originalPrice = req.body.originalPrice;
    const discountedPrice = req.body.discountedPrice !== undefined ? req.body.discountedPrice : req.body.discountPrice;
    const quantity = req.body.quantity !== undefined ? req.body.quantity : req.body.quantityAvailable;
    const availableMinutes = req.body.availableMinutes || (req.body.availableHours ? Number(req.body.availableHours) * 60 : 120);
    const category = req.body.category || 'Surplus Meals';
    const isVegetarian = req.body.isVegetarian !== undefined ? req.body.isVegetarian : false;
    const imageUrl = req.body.imageUrl;

    if (!restaurantId || !name || originalPrice === undefined || discountedPrice === undefined || quantity === undefined) {
      return sendError(res, 400, 'Please provide restaurant, name, originalPrice, discountedPrice, and quantity.');
    }

    if (Number(discountedPrice) >= Number(originalPrice)) {
      return sendError(res, 400, 'discountedPrice must be lower than originalPrice for surplus rescue listings.');
    }

    if (Number(quantity) < 1) {
      return sendError(res, 400, 'Quantity must be at least 1.');
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return sendError(res, 404, 'Restaurant not found.');
    }

    const isOwner = restaurant.owner?.toString() === req.user._id.toString() ||
      (restaurant.owners && restaurant.owners.some(o => o.toString() === req.user._id.toString()));
    if (req.user.role === 'RESTAURANT_OWNER' && !isOwner) {
      return sendError(res, 403, 'Forbidden: You do not own this restaurant.');
    }

    const expiryTime = new Date(Date.now() + Number(availableMinutes) * 60 * 1000);
    const uploadedImage = imageUrl ? await uploadImageToCloudinary(imageUrl) : '';

    const surplusItem = await FoodItem.create({
      restaurant: restaurantId,
      name: `[Surplus] ${name.trim()}`,
      description: description ? description.trim() : 'Fresh surplus prepared food listed to prevent waste.',
      price: Number(discountedPrice),
      category: category.trim(),
      isAvailable: true,
      isVegetarian: Boolean(isVegetarian),
      imageUrl: uploadedImage || '',
      isSurplus: true,
      surplusOriginalPrice: Number(originalPrice),
      surplusQuantityAvailable: Number(quantity),
      surplusAvailableUntil: expiryTime
    });

    return sendSuccess(res, 201, 'Surplus food listing published successfully to reduce food waste', {
      foodItem: surplusItem,
      discountPercent: Math.round(((originalPrice - discountedPrice) / originalPrice) * 100),
      pickupDeadline: expiryTime,
      foodSafetyNotice: 'Listings follow local food handling safety guidelines. Please consume promptly.'
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to create surplus listing', error.message);
  }
});

// 9. DISCOVER ACTIVE SURPLUS FOOD LISTINGS (PUBLIC / CUSTOMER)
router.get('/surplus', async (req, res) => {
  try {
    const { restaurant, category, maxPrice, isVegetarian } = req.query;

    // Filter strictly for active, unexpired surplus with quantity remaining
    const query = {
      isSurplus: true,
      isAvailable: true,
      surplusQuantityAvailable: { $gt: 0 },
      surplusAvailableUntil: { $gt: new Date() }
    };

    if (restaurant && restaurant.match(/^[0-9a-fA-F]{24}$/)) {
      query.restaurant = restaurant;
    }

    if (category) {
      query.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    if (maxPrice !== undefined) {
      query.price = { $lte: Number(maxPrice) };
    }

    if (isVegetarian !== undefined) {
      query.isVegetarian = isVegetarian === 'true' || isVegetarian === true;
    }

    const items = await FoodItem.find(query)
      .populate('restaurant', 'name address phone rating isOpen')
      .sort({ surplusAvailableUntil: 1 })
      .lean();

    const formattedListings = items.map(item => {
      const discountPercent = item.surplusOriginalPrice
        ? Math.round(((item.surplusOriginalPrice - item.price) / item.surplusOriginalPrice) * 100)
        : 0;
      const minutesRemaining = Math.max(
        0,
        Math.round((new Date(item.surplusAvailableUntil) - new Date()) / (1000 * 60))
      );
      return {
        ...item,
        discountPercent: `${discountPercent}% OFF`,
        minutesRemaining: `${minutesRemaining} mins left to rescue`
      };
    });

    return sendSuccess(res, 200, 'Active surplus food rescue listings retrieved', {
      count: formattedListings.length,
      listings: formattedListings
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch surplus food listings', error.message);
  }
});

// 10. CUSTOMER VIEW MY SURPLUS RESERVATIONS
router.get('/surplus/my-reservations', verifyAuth, async (req, res) => {
  try {
    const reservations = await SurplusReservation.find({ customer: req.user._id })
      .populate('restaurant', 'name address phone')
      .populate('foodItem', 'name price imageUrl')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Customer surplus reservations retrieved', {
      count: reservations.length,
      reservations
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch customer surplus reservations', error.message);
  }
});

// 11. RESERVE SURPLUS FOOD (ATOMIC OVERSELLING & EXPIRY PROTECTION)
router.post('/surplus/:id/reserve', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1 } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid surplus food item ID.');
    }

    const reserveQty = parseInt(quantity, 10);
    if (isNaN(reserveQty) || reserveQty < 1) {
      return sendError(res, 400, 'Quantity must be a positive integer greater than or equal to 1.');
    }

    // 1. Check if item exists and is surplus
    const foodItem = await FoodItem.findById(id);
    if (!foodItem || !foodItem.isSurplus) {
      return sendError(res, 404, 'Surplus food item not found or is not listed as surplus.');
    }

    // 2. Check Expiry
    if (new Date() >= new Date(foodItem.surplusAvailableUntil)) {
      return sendError(
        res,
        400,
        'This surplus food rescue listing has already expired and can no longer be reserved.'
      );
    }

    // 3. Atomic Reservation & Overselling Protection
    // Deducts quantity atomically only if available quantity >= requested quantity and unexpired
    const updatedFood = await FoodItem.findOneAndUpdate(
      {
        _id: id,
        isSurplus: true,
        surplusQuantityAvailable: { $gte: reserveQty },
        surplusAvailableUntil: { $gt: new Date() }
      },
      {
        $inc: { surplusQuantityAvailable: -reserveQty }
      },
      { new: true }
    );

    if (!updatedFood) {
      return sendError(
        res,
        400,
        `Overselling prevented: Requested quantity (${reserveQty}) exceeds available surplus (Only ${foodItem.surplusQuantityAvailable} left).`
      );
    }

    // Generate unique pickup claim code
    const claimCode = `SURP-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = Math.round(foodItem.price * reserveQty * 100) / 100;

    const reservation = await SurplusReservation.create({
      customer: req.user._id,
      foodItem: foodItem._id,
      restaurant: foodItem.restaurant,
      foodName: foodItem.name,
      quantity: reserveQty,
      pricePerUnit: foodItem.price,
      totalAmount,
      status: 'RESERVED',
      pickupDeadline: foodItem.surplusAvailableUntil,
      claimCode
    });

    return sendSuccess(res, 201, 'Surplus meal reserved successfully for rescue pickup', {
      reservationId: reservation._id,
      claimCode: reservation.claimCode,
      foodName: reservation.foodName,
      quantityReserved: reservation.quantity,
      totalAmount: reservation.totalAmount,
      pickupDeadline: reservation.pickupDeadline,
      remainingSurplusAtRestaurant: updatedFood.surplusQuantityAvailable,
      status: reservation.status
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to reserve surplus food item', error.message);
  }
});

// 12. RESTAURANT OWNER: VIEW ACTIVE SURPLUS INVENTORY & RESERVATIONS
router.get('/surplus/restaurant/active', verifyAuth, requireRole('RESTAURANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const myRestaurants = await Restaurant.find({
      $or: [{ owner: req.user._id }, { owners: req.user._id }]
    }).select('_id');
    const restIds = myRestaurants.map(r => r._id);

    const [activeListings, pendingReservations] = await Promise.all([
      FoodItem.find({
        restaurant: { $in: restIds },
        isSurplus: true,
        surplusAvailableUntil: { $gt: new Date() }
      }).sort({ surplusAvailableUntil: 1 }),
      SurplusReservation.find({
        restaurant: { $in: restIds },
        status: 'RESERVED'
      }).populate('customer', 'name phone').sort({ createdAt: -1 })
    ]);

    return sendSuccess(res, 200, 'Restaurant surplus operations dashboard', {
      activeListingsCount: activeListings.length,
      activeListings,
      pendingReservationsCount: pendingReservations.length,
      pendingReservations
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch restaurant surplus dashboard', error.message);
  }
});

// 13. RESTAURANT VERIFIES AND CLAIMS SURPLUS PICKUP AT COUNTER
router.patch('/surplus/reservations/:id/claim', verifyAuth, requireRole('RESTAURANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { claimCode } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid reservation ID.');
    }

    if (!claimCode) {
      return sendError(res, 400, 'Customer claimCode is required to verify counter pickup.');
    }

    const reservation = await SurplusReservation.findById(id).populate('restaurant');
    if (!reservation) {
      return sendError(res, 404, 'Surplus reservation not found.');
    }

    const isOwner = reservation.restaurant?.owner?.toString() === req.user._id.toString() ||
      (reservation.restaurant?.owners && reservation.restaurant.owners.some(o => o.toString() === req.user._id.toString()));
    if (req.user.role === 'RESTAURANT_OWNER' && !isOwner) {
      return sendError(res, 403, 'Forbidden: You do not own the restaurant for this reservation.');
    }

    if (reservation.status !== 'RESERVED') {
      return sendError(res, 400, `Cannot claim: Reservation is already in "${reservation.status}" state.`);
    }

    if (reservation.claimCode !== claimCode.trim().toUpperCase()) {
      return sendError(res, 400, 'Invalid claimCode provided. Verification failed.');
    }

    reservation.status = 'CLAIMED';
    await reservation.save();

    return sendSuccess(res, 200, `Surplus meal ${reservation.foodName} successfully claimed at counter`, {
      reservationId: reservation._id,
      status: reservation.status,
      claimedAt: new Date()
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to claim surplus reservation', error.message);
  }
});

// 14. CANCEL SURPLUS RESERVATION & RESTORE QUANTITY
router.patch('/surplus/reservations/:id/cancel', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid reservation ID.');
    }

    const reservation = await SurplusReservation.findById(id);
    if (!reservation) {
      return sendError(res, 404, 'Surplus reservation not found.');
    }

    const isCustomer = reservation.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomer && !isAdmin) {
      return sendError(res, 403, 'Forbidden: You can only cancel your own reservations.');
    }

    if (reservation.status !== 'RESERVED') {
      return sendError(res, 400, `Cannot cancel reservation in "${reservation.status}" state.`);
    }

    reservation.status = 'CANCELLED';
    await reservation.save();

    // Restore available surplus inventory atomically
    await FoodItem.findByIdAndUpdate(reservation.foodItem, {
      $inc: { surplusQuantityAvailable: reservation.quantity }
    });

    return sendSuccess(res, 200, 'Surplus reservation cancelled and inventory restored', {
      reservationId: reservation._id,
      status: reservation.status
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to cancel surplus reservation', error.message);
  }
});

// =========================================================================
// PART C: ADMINISTRATIVE MANAGEMENT & REPORTING (PHASE 12)
// =========================================================================

// 15. ADMIN PLATFORM OVERVIEW & METRICS
router.get('/admin/overview', verifyAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalRestaurants,
      totalOrders,
      totalSurplusListings,
      totalRiders,
      ordersAgg
    ] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments(),
      Order.countDocuments(),
      FoodItem.countDocuments({ isSurplus: true }),
      User.countDocuments({ role: 'DELIVERY_PARTNER' }),
      Order.aggregate([
        {
          $group: {
            _id: '$codCollectionStatus',
            count: { $sum: 1 },
            totalValue: { $sum: '$totalAmount' }
          }
        }
      ])
    ]);

    const financialSummary = {
      grossPlatformOrderValue: 0,
      codPendingCollection: 0,
      codCollectedByRiders: 0,
      codReconciled: 0,
      codCancelled: 0
    };

    ordersAgg.forEach(item => {
      financialSummary.grossPlatformOrderValue += item.totalValue;
      if (item._id === 'PENDING_COLLECTION') financialSummary.codPendingCollection = item.totalValue;
      if (item._id === 'COLLECTED') financialSummary.codCollectedByRiders = item.totalValue;
      if (item._id === 'RECONCILED') financialSummary.codReconciled = item.totalValue;
      if (item._id === 'CANCELLED') financialSummary.codCancelled = item.totalValue;
    });

    Object.keys(financialSummary).forEach(k => {
      financialSummary[k] = Math.round(financialSummary[k] * 100) / 100;
    });

    return sendSuccess(res, 200, 'Admin platform overview metrics retrieved', {
      platformStats: {
        totalUsers,
        totalRestaurants,
        totalOrders,
        totalSurplusListings,
        activeDeliveryPartners: totalRiders
      },
      financialSummary,
      paymentMethod: 'Cash on Delivery (COD) Only'
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch platform overview', error.message);
  }
});

// 16. ADMIN USER MANAGEMENT (PAGINATED, ROLE FILTER, SEARCH)
router.get('/admin/users', verifyAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 15 } = req.query;

    const query = {};
    if (role) query.role = role.toUpperCase();
    if (isActive !== undefined) query.isActive = isActive === 'true' || isActive === true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(50, parseInt(limit, 10) || 15));
    const skip = (pageNumber - 1) * limitNumber;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      User.countDocuments(query)
    ]);

    return sendSuccess(res, 200, 'Users retrieved successfully for administrative oversight', {
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber) || 1,
      users
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve users', error.message);
  }
});

// 17. ADMIN TOGGLE USER ACCOUNT STATE (ACTIVATE / DEACTIVATE)
router.patch('/admin/users/:userId/status', verifyAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid user ID format.');
    }

    if (isActive === undefined) {
      return sendError(res, 400, 'isActive boolean is required.');
    }

    // Protection: Admin cannot deactivate own account
    if (userId.toString() === req.user._id.toString() && isActive === false) {
      return sendError(res, 400, 'Action blocked: Administrator cannot deactivate their own account.');
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    user.isActive = Boolean(isActive);
    await user.save();

    return sendSuccess(res, 200, `User account ${user.email} is now ${user.isActive ? 'ACTIVE' : 'DEACTIVATED'}`, {
      userId: user._id,
      email: user.email,
      isActive: user.isActive
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update user status', error.message);
  }
});

// 18. ADMIN RESTAURANT OVERSIGHT (TOGGLE OPERATIONAL AVAILABILITY)
router.patch('/admin/restaurants/:restaurantId/status', verifyAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { isOpen } = req.body;

    if (!restaurantId.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid restaurant ID format.');
    }

    if (isOpen === undefined) {
      return sendError(res, 400, 'isOpen boolean is required.');
    }

    const restaurant = await Restaurant.findById(restaurantId).populate('owner', 'name email');
    if (!restaurant) {
      return sendError(res, 404, 'Restaurant not found.');
    }

    restaurant.isOpen = Boolean(isOpen);
    await restaurant.save();

    return sendSuccess(res, 200, `Restaurant ${restaurant.name} operational status updated to ${restaurant.isOpen ? 'OPEN' : 'CLOSED'}`, {
      restaurantId: restaurant._id,
      name: restaurant.name,
      owner: restaurant.owner.email,
      isOpen: restaurant.isOpen
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update restaurant status', error.message);
  }
});

// 19. ADMIN GLOBAL ORDER MONITORING (PAGINATED, STATUS FILTER)
router.get('/admin/orders', verifyAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { orderStatus, codCollectionStatus, page = 1, limit = 15 } = req.query;

    const query = {};
    if (orderStatus) query.orderStatus = orderStatus.toUpperCase();
    if (codCollectionStatus) query.codCollectionStatus = codCollectionStatus.toUpperCase();

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(50, parseInt(limit, 10) || 15));
    const skip = (pageNumber - 1) * limitNumber;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email phone')
        .populate('restaurant', 'name phone')
        .populate('deliveryPartner', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Order.countDocuments(query)
    ]);

    return sendSuccess(res, 200, 'Admin global order feed retrieved', {
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber) || 1,
      orders
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve admin order feed', error.message);
  }
});

// 20. ADMIN SURPLUS MODERATION (DELETE / REMOVE NON-COMPLIANT SURPLUS)
router.delete('/admin/surplus/:id', verifyAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid surplus item ID.');
    }

    const item = await FoodItem.findOne({ _id: id, isSurplus: true });
    if (!item) {
      return sendError(res, 404, 'Surplus listing not found.');
    }

    await FoodItem.findByIdAndDelete(id);

    return sendSuccess(res, 200, `Surplus listing "${item.name}" moderated and deleted by administrator`, {
      deletedItemId: id
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to moderate surplus listing', error.message);
  }
});

// 21. EARNINGS & COD RECONCILIATION ANALYTICS (DAY, WEEK, MONTH, YEAR)
router.get('/analytics/earnings', verifyAuth, async (req, res) => {
  try {
    const { role, _id } = req.user;
    const now = new Date();

    // Time window boundaries
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Build base filter based on requester role
    const baseFilter = {};
    if (role === 'RESTAURANT_OWNER') {
      const myRestaurants = await Restaurant.find({
        $or: [{ owner: _id }, { owners: _id }]
      }).select('_id');
      const restIds = myRestaurants.map(r => r._id);
      baseFilter.restaurant = { $in: restIds };
    } else if (role === 'DELIVERY_PARTNER') {
      baseFilter.deliveryPartner = _id;
    }

    // Helper aggregator function
    const computeMetricsForRange = async (startDate) => {
      const query = {
        ...baseFilter,
        createdAt: { $gte: startDate }
      };

      const orders = await Order.find(query).select(
        'totalAmount subtotal deliveryFee tax restaurantPayout adminCommission riderPayout codCollectionStatus createdAt'
      );

      let totalOrders = orders.length;
      let totalGrossCod = 0;
      let reconciledOrdersCount = 0;
      let reconciledGross = 0;
      let restaurantPayout = 0;
      let adminCommission = 0;
      let riderPayout = 0;
      let pendingReconciliation = 0;

      orders.forEach(o => {
        totalGrossCod += o.totalAmount || 0;
        if (o.codCollectionStatus === 'RECONCILED') {
          reconciledOrdersCount += 1;
          reconciledGross += o.totalAmount || 0;

          const itemSub = o.subtotal || Math.max(0, o.totalAmount - (o.deliveryFee || 0) - (o.tax || 0));
          const restVal = o.restaurantPayout || (Math.round(itemSub * 0.85 * 100) / 100);
          const riderVal = o.riderPayout || (o.deliveryFee > 0 ? o.deliveryFee : 40);
          const adminVal = o.adminCommission || (Math.round((o.totalAmount - restVal - riderVal) * 100) / 100);

          restaurantPayout += restVal;
          riderPayout += riderVal;
          adminCommission += Math.max(0, adminVal);
        } else if (o.codCollectionStatus === 'COLLECTED' || o.codCollectionStatus === 'PENDING_COLLECTION') {
          pendingReconciliation += o.totalAmount || 0;
        }
      });

      return {
        totalOrders,
        reconciledOrdersCount,
        totalGrossCod: Math.round(totalGrossCod * 100) / 100,
        reconciledGross: Math.round(reconciledGross * 100) / 100,
        pendingReconciliation: Math.round(pendingReconciliation * 100) / 100,
        restaurantPayout: Math.round(restaurantPayout * 100) / 100,
        adminCommission: Math.round(adminCommission * 100) / 100,
        riderPayout: Math.round(riderPayout * 100) / 100,
        // Specific user's actual earned take-home:
        myEarnings: Math.round(
          (role === 'RESTAURANT_OWNER' ? restaurantPayout :
           role === 'DELIVERY_PARTNER' ? riderPayout :
           adminCommission) * 100
        ) / 100
      };
    };

    const [today, thisWeek, thisMonth, thisYear, allTime] = await Promise.all([
      computeMetricsForRange(startOfDay),
      computeMetricsForRange(startOfWeek),
      computeMetricsForRange(startOfMonth),
      computeMetricsForRange(startOfYear),
      computeMetricsForRange(new Date(0))
    ]);

    return sendSuccess(res, 200, 'Earnings and collection analytics retrieved successfully', {
      userRole: role,
      periods: {
        today,
        thisWeek,
        thisMonth,
        thisYear,
        allTime
      }
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch earnings analytics', error.message);
  }
});

export default router;

