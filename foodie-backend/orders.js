import express from 'express';
import { Order, FoodItem, Restaurant, GroupOrder } from './models.js';
import { verifyAuth, requireRole } from './auth.js';
import { sendSuccess, sendError } from './utils.js';

const router = express.Router();

/**
 * Standard server-side fee calculations
 */
const calculatePricing = (subtotal) => {
  const deliveryFee = subtotal >= 500 ? 0 : 40;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const totalAmount = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

  return { subtotal, deliveryFee, tax, totalAmount };
};

// Permitted Order Lifecycle State Machine
const ALLOWED_STATUS_TRANSITIONS = {
  PLACED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['ASSIGNED', 'PICKED_UP', 'CANCELLED'],
  ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['DELIVERED'],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
  REJECTED: []   // Terminal state
};

// ==========================================
// 1. CHECKOUT PREVIEW & SERVER-SIDE PRICE CALCULATION
// ==========================================
router.post('/checkout-preview', verifyAuth, async (req, res) => {
  try {
    const { items, restaurant: restaurantId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, 'Cart cannot be empty. Please provide at least one item.');
    }

    if (!restaurantId || !restaurantId.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Valid restaurant ID is required.');
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return sendError(res, 404, 'Restaurant not found.');
    }

    if (!restaurant.isOpen) {
      return sendError(res, 400, `Restaurant "${restaurant.name}" is currently closed and not accepting orders.`);
    }

    let calculatedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (!item.foodItem || !item.foodItem.match(/^[0-9a-fA-F]{24}$/)) {
        return sendError(res, 400, `Invalid foodItem ID: ${item.foodItem}`);
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty < 1) {
        return sendError(res, 400, 'Item quantity must be a positive integer greater than or equal to 1.');
      }

      const dbItem = await FoodItem.findById(item.foodItem);
      if (!dbItem) {
        return sendError(res, 404, `Food item ${item.foodItem} not found in database.`);
      }

      if (dbItem.restaurant.toString() !== restaurantId.toString()) {
        return sendError(
          res,
          400,
          `Item "${dbItem.name}" belongs to a different restaurant. Orders must be from a single restaurant.`
        );
      }

      if (!dbItem.isAvailable) {
        return sendError(res, 400, `Item "${dbItem.name}" is currently unavailable/out of stock.`);
      }

      const itemTotal = dbItem.price * qty;
      calculatedSubtotal += itemTotal;

      verifiedItems.push({
        foodItem: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
        itemTotal
      });
    }

    const pricing = calculatePricing(calculatedSubtotal);

    return sendSuccess(res, 200, 'Cart validated and pricing calculated server-side', {
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        address: restaurant.address,
        isOpen: restaurant.isOpen
      },
      items: verifiedItems,
      pricing: {
        ...pricing,
        paymentMethodAllowed: 'COD (Cash on Delivery Only)'
      }
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to calculate checkout preview', error.message);
  }
});

// ==========================================
// 2. COD RECONCILIATION & AUDIT REPORT (ADMIN / OWNER)
// ==========================================
router.get('/cod/reconciliation-report', verifyAuth, requireRole('ADMIN', 'RESTAURANT_OWNER'), async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'RESTAURANT_OWNER') {
      const myRestaurants = await Restaurant.find({
        $or: [{ owner: req.user._id }, { owners: req.user._id }]
      }).select('_id');
      const restIds = myRestaurants.map(r => r._id);
      filter.restaurant = { $in: restIds };
    }

    const orders = await Order.find(filter)
      .select('orderNumber totalAmount subtotal deliveryFee tax restaurantPayout adminCommission riderPayout orderStatus codCollectionStatus codCollectedAt codReconciledAt createdAt')
      .populate('restaurant', 'name')
      .populate('customer', 'name phone')
      .populate('deliveryPartner', 'name phone')
      .sort({ createdAt: -1 });

    const summary = {
      totalCodOrders: orders.length,
      totalOrderValue: 0,
      pendingCollectionCount: 0,
      pendingCollectionAmount: 0,
      collectedCount: 0,
      collectedAmount: 0,
      reconciledCount: 0,
      reconciledAmount: 0,
      cancelledCount: 0,
      cancelledAmount: 0,
      // 3-Way Reconciled Financial Split
      totalRestaurantPayout: 0,
      totalAdminCommission: 0,
      totalRiderPayout: 0
    };

    orders.forEach(order => {
      summary.totalOrderValue += order.totalAmount;
      if (order.codCollectionStatus === 'PENDING_COLLECTION') {
        summary.pendingCollectionCount += 1;
        summary.pendingCollectionAmount += order.totalAmount;
      } else if (order.codCollectionStatus === 'COLLECTED') {
        summary.collectedCount += 1;
        summary.collectedAmount += order.totalAmount;
      } else if (order.codCollectionStatus === 'RECONCILED') {
        summary.reconciledCount += 1;
        summary.reconciledAmount += order.totalAmount;

        // Tally reconciled splits
        const itemSubtotal = order.subtotal || Math.max(0, order.totalAmount - (order.deliveryFee || 0) - (order.tax || 0));
        const restPayout = order.restaurantPayout || (Math.round(itemSubtotal * 0.85 * 100) / 100);
        const riderPayout = order.riderPayout || (order.deliveryFee > 0 ? order.deliveryFee : 40);
        const adminCut = order.adminCommission || (Math.round((order.totalAmount - restPayout - riderPayout) * 100) / 100);

        summary.totalRestaurantPayout += restPayout;
        summary.totalAdminCommission += Math.max(0, adminCut);
        summary.totalRiderPayout += riderPayout;
      } else if (order.codCollectionStatus === 'CANCELLED') {
        summary.cancelledCount += 1;
        summary.cancelledAmount += order.totalAmount;
      }
    });

    summary.totalOrderValue = Math.round(summary.totalOrderValue * 100) / 100;
    summary.pendingCollectionAmount = Math.round(summary.pendingCollectionAmount * 100) / 100;
    summary.collectedAmount = Math.round(summary.collectedAmount * 100) / 100;
    summary.reconciledAmount = Math.round(summary.reconciledAmount * 100) / 100;
    summary.cancelledAmount = Math.round(summary.cancelledAmount * 100) / 100;
    summary.totalRestaurantPayout = Math.round(summary.totalRestaurantPayout * 100) / 100;
    summary.totalAdminCommission = Math.round(summary.totalAdminCommission * 100) / 100;
    summary.totalRiderPayout = Math.round(summary.totalRiderPayout * 100) / 100;

    return sendSuccess(res, 200, 'COD Reconciliation report generated successfully', {
      summary,
      orders
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to generate COD reconciliation report', error.message);
  }
});

// ==========================================
// 3. RESTAURANT OWNER: GET ORDERS FOR MY RESTAURANTS
// ==========================================
router.get('/restaurant/active', verifyAuth, requireRole('RESTAURANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { status, page = 1, limit = 15 } = req.query;

    let filter = {};
    if (req.user.role === 'RESTAURANT_OWNER') {
      const myRestaurants = await Restaurant.find({
        $or: [{ owner: req.user._id }, { owners: req.user._id }]
      }).select('_id');
      const restIds = myRestaurants.map(r => r._id);
      filter.restaurant = { $in: restIds };
    }

    if (status) {
      filter.orderStatus = status.toUpperCase();
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(50, parseInt(limit, 10) || 15));
    const skip = (pageNumber - 1) * limitNumber;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name phone')
        .populate('restaurant', 'name')
        .populate('deliveryPartner', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Order.countDocuments(filter)
    ]);

    return sendSuccess(res, 200, 'Restaurant orders retrieved successfully', {
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber) || 1,
      orders
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve restaurant orders', error.message);
  }
});

// ==========================================
// 4. GROUP ORDERING (PHASE 11)
// ==========================================

// Discover Currently Open Groups (Allows any user to join without typing code manually)
router.get('/group/open-groups', verifyAuth, async (req, res) => {
  try {
    const openGroups = await GroupOrder.find({
      status: 'OPEN',
      joinDeadline: { $gt: new Date() }
    })
      .populate('creator', 'name')
      .populate('restaurant', 'name address phone isOpen imageUrl')
      .sort({ createdAt: -1 })
      .limit(20);

    return sendSuccess(res, 200, 'Active open group orders retrieved', {
      count: openGroups.length,
      groups: openGroups
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch open group orders', error.message);
  }
});

// A. Create Group Order (Host / Creator)
router.post('/group', verifyAuth, async (req, res) => {
  try {
    const restaurantId = req.body.restaurant || req.body.restaurantId;
    const deadlineMinutes = req.body.deadlineMinutes || req.body.durationMinutes || 45;

    if (!restaurantId || !restaurantId.toString().match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Valid restaurant ID is required.');
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return sendError(res, 404, 'Restaurant not found.');
    }

    if (!restaurant.isOpen) {
      return sendError(res, 400, `Restaurant "${restaurant.name}" is currently closed and not accepting orders.`);
    }

    const minutes = Math.max(5, Math.min(180, parseInt(deadlineMinutes, 10) || 45));
    const joinDeadline = new Date(Date.now() + minutes * 60 * 1000);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const groupCode = `GRP-${Date.now().toString().slice(-4)}-${randomCode}`;

    const newGroup = await GroupOrder.create({
      groupCode,
      creator: req.user._id,
      restaurant: restaurantId,
      status: 'OPEN',
      joinDeadline,
      participants: [
        {
          user: req.user._id,
          name: req.user.name,
          joinedAt: new Date(),
          items: [],
          participantSubtotal: 0
        }
      ],
      groupSubtotal: 0,
      deliveryFee: 40,
      tax: 0,
      totalAmount: 40
    });

    const populatedGroup = await GroupOrder.findById(newGroup._id)
      .populate('creator', 'name email phone')
      .populate('restaurant', 'name address phone isOpen')
      .populate('participants.user', 'name');

    return sendSuccess(res, 201, 'Group order created successfully', {
      group: populatedGroup,
      groupCode: newGroup.groupCode,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name
      },
      creator: {
        id: req.user._id,
        name: req.user.name
      },
      status: newGroup.status,
      joinDeadline: newGroup.joinDeadline,
      shareLink: `/group-order/${newGroup.groupCode}`
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to create group order', error.message);
  }
});

// B. Get Group Order State & Live Calculated Totals
router.get('/group/:groupCode', verifyAuth, async (req, res) => {
  try {
    const { groupCode } = req.params;

    const group = await GroupOrder.findOne({ groupCode: { $regex: new RegExp(`^${groupCode.trim()}$`, 'i') } })
      .populate('creator', 'name email phone')
      .populate('restaurant', 'name address phone isOpen')
      .populate('participants.user', 'name');

    if (!group) {
      return sendError(res, 404, 'Group order not found.');
    }

    // Auto-lock if join deadline has passed
    if (group.status === 'OPEN' && new Date() >= new Date(group.joinDeadline)) {
      group.status = 'LOCKED';
      await group.save();
    }

    return sendSuccess(res, 200, 'Group order details retrieved', { group });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve group order', error.message);
  }
});

// C. Participant Joins Group Order
router.post('/group/:groupCode/join', verifyAuth, async (req, res) => {
  try {
    const { groupCode } = req.params;

    const group = await GroupOrder.findOne({ groupCode: { $regex: new RegExp(`^${groupCode.trim()}$`, 'i') } });
    if (!group) {
      return sendError(res, 404, 'Group order not found.');
    }

    if (group.status !== 'OPEN' || new Date() >= new Date(group.joinDeadline)) {
      return sendError(res, 400, 'Cannot join: Group order joining deadline has passed or group is locked.');
    }

    const alreadyJoined = group.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!alreadyJoined) {
      group.participants.push({
        user: req.user._id,
        name: req.user.name,
        joinedAt: new Date(),
        items: [],
        participantSubtotal: 0
      });
      await group.save();
    }

    const populatedGroup = await GroupOrder.findById(group._id)
      .populate('creator', 'name email phone')
      .populate('restaurant', 'name address phone isOpen')
      .populate('participants.user', 'name');

    return sendSuccess(res, 200, `Successfully joined group order ${groupCode}`, {
      group: populatedGroup,
      groupCode: group.groupCode,
      participantCount: group.participants.length
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to join group order', error.message);
  }
});

// D. Participant Adds / Updates Items (Data Isolation & Server Pricing)
router.put(['/group/:groupCode/items', '/group/:groupCode/item'], verifyAuth, async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return sendError(res, 400, 'Please provide an items array.');
    }

    const group = await GroupOrder.findOne({ groupCode: { $regex: new RegExp(`^${groupCode.trim()}$`, 'i') } });
    if (!group) {
      return sendError(res, 404, 'Group order not found.');
    }

    if (group.status !== 'OPEN' || new Date() >= new Date(group.joinDeadline)) {
      return sendError(res, 400, 'Cannot modify items: Group order joining deadline has passed or group is locked.');
    }

    let participant = group.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      participant = {
        user: req.user._id,
        name: req.user.name,
        joinedAt: new Date(),
        items: [],
        participantSubtotal: 0
      };
      group.participants.push(participant);
    }

    // Verify each item server-side
    let newParticipantSubtotal = 0;
    const verifiedParticipantItems = [];

    for (const item of items) {
      if (!item.foodItem || !item.foodItem.match(/^[0-9a-fA-F]{24}$/)) {
        return sendError(res, 400, `Invalid foodItem ID: ${item.foodItem}`);
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty < 1) {
        return sendError(res, 400, 'Item quantity must be at least 1.');
      }

      const dbItem = await FoodItem.findById(item.foodItem);
      if (!dbItem) {
        return sendError(res, 404, `Food item ${item.foodItem} not found.`);
      }

      if (dbItem.restaurant.toString() !== group.restaurant.toString()) {
        return sendError(res, 400, `Item "${dbItem.name}" does not belong to the group's restaurant.`);
      }

      if (!dbItem.isAvailable) {
        return sendError(res, 400, `Item "${dbItem.name}" is currently unavailable.`);
      }

      const itemTotal = dbItem.price * qty;
      newParticipantSubtotal += itemTotal;

      verifiedParticipantItems.push({
        foodItem: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
        itemTotal
      });
    }

    // Update participant slice
    participant.items = verifiedParticipantItems;
    participant.participantSubtotal = newParticipantSubtotal;

    // Recalculate group totals
    let newGroupSubtotal = 0;
    group.participants.forEach(p => {
      newGroupSubtotal += p.participantSubtotal;
    });

    const pricing = calculatePricing(newGroupSubtotal);
    group.groupSubtotal = pricing.subtotal;
    group.deliveryFee = pricing.deliveryFee;
    group.tax = pricing.tax;
    group.totalAmount = pricing.totalAmount;

    await group.save();

    return sendSuccess(res, 200, 'Participant items updated successfully', {
      groupCode: group.groupCode,
      participantName: req.user.name,
      participantSubtotal: participant.participantSubtotal,
      groupTotals: {
        subtotal: group.groupSubtotal,
        deliveryFee: group.deliveryFee,
        tax: group.tax,
        totalAmount: group.totalAmount
      }
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update group items', error.message);
  }
});

// E. Host Locks Group Order
router.patch('/group/:groupCode/lock', verifyAuth, async (req, res) => {
  try {
    const { groupCode } = req.params;

    const group = await GroupOrder.findOne({ groupCode });
    if (!group) {
      return sendError(res, 404, 'Group order not found.');
    }

    if (group.creator.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Forbidden: Only the group host can lock this group order.');
    }

    if (group.status === 'ORDERED') {
      return sendError(res, 400, 'Group order has already been checked out.');
    }

    group.status = 'LOCKED';
    await group.save();

    return sendSuccess(res, 200, `Group order ${groupCode} is now LOCKED for final checkout`, {
      groupCode: group.groupCode,
      status: group.status,
      totalAmount: group.totalAmount
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to lock group order', error.message);
  }
});

// F. Host Final COD Checkout (Single Responsible Customer)
router.post('/group/:groupCode/checkout', verifyAuth, async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { deliveryAddress, paymentMethod = 'COD', notes } = req.body;

    if (paymentMethod !== 'COD') {
      return sendError(res, 400, 'Group orders strictly accept Cash on Delivery (COD) only.');
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
      return sendError(res, 400, 'Complete delivery address with street and city is required.');
    }

    const group = await GroupOrder.findOne({ groupCode: { $regex: new RegExp(`^${groupCode.trim()}$`, 'i') } });
    if (!group) {
      return sendError(res, 404, 'Group order not found.');
    }

    // Host Authorization check
    if (group.creator.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Forbidden: Only the group host is responsible for final checkout and COD payment.');
    }

    // Duplicate Submission Prevention
    if (group.status === 'ORDERED') {
      return sendError(res, 400, 'Duplicate submission rejected: This group order has already been checked out.');
    }

    // Collect all participant items
    const mergedItems = [];
    group.participants.forEach(p => {
      p.items.forEach(it => {
        mergedItems.push({
          foodItem: it.foodItem,
          name: `${it.name} (${p.name})`,
          price: it.price,
          quantity: it.quantity,
          itemTotal: it.itemTotal
        });
      });
    });

    if (mergedItems.length === 0) {
      return sendError(res, 400, 'Group order cannot be checked out with 0 items.');
    }

    const pricing = calculatePricing(group.groupSubtotal);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-GRP-${Date.now().toString().slice(-4)}-${randomSuffix}`;

    const newOrder = await Order.create({
      orderNumber,
      customer: req.user._id, // Host holds COD financial responsibility
      restaurant: group.restaurant,
      items: mergedItems,
      subtotal: pricing.subtotal,
      deliveryFee: pricing.deliveryFee,
      tax: pricing.tax,
      totalAmount: pricing.totalAmount,
      deliveryAddress: {
        street: deliveryAddress.street.trim(),
        city: deliveryAddress.city.trim(),
        state: deliveryAddress.state ? deliveryAddress.state.trim() : undefined,
        postalCode: deliveryAddress.postalCode ? deliveryAddress.postalCode.trim() : undefined,
        phone: deliveryAddress.phone ? deliveryAddress.phone.trim() : req.user.phone
      },
      orderStatus: 'PLACED',
      paymentMethod: 'COD',
      codCollectionStatus: 'PENDING_COLLECTION',
      notes: notes || `Group order ${groupCode}`,
      isGroupOrder: true,
      groupId: groupCode
    });

    group.status = 'ORDERED';
    group.finalOrder = newOrder._id;
    await group.save();

    return sendSuccess(res, 201, `Group order successfully placed with Cash on Delivery (Host: ${req.user.name})`, {
      order: newOrder,
      groupBreakdown: {
        groupCode: group.groupCode,
        participantCount: group.participants.length,
        participants: group.participants.map(p => ({
          name: p.name,
          itemCount: p.items.length,
          subtotal: p.participantSubtotal
        }))
      }
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to checkout group order', error.message);
  }
});

// ==========================================
// 5. CREATE ORDER (STRICT CASH ON DELIVERY ONLY)
// ==========================================
router.post('/', verifyAuth, async (req, res) => {
  try {
    const {
      restaurant: restaurantId,
      items,
      deliveryAddress,
      paymentMethod = 'COD',
      notes,
      idempotencyKey
    } = req.body;

    if (paymentMethod !== 'COD') {
      return sendError(
        res,
        400,
        `Payment method "${paymentMethod}" is unsupported. This platform strictly accepts Cash on Delivery (COD) only.`
      );
    }

    if (idempotencyKey) {
      const recentDuplicate = await Order.findOne({
        customer: req.user._id,
        notes: `IDEMPOTENCY_${idempotencyKey}`,
        createdAt: { $gt: new Date(Date.now() - 30 * 1000) }
      });
      if (recentDuplicate) {
        return sendSuccess(res, 200, 'Duplicate request prevented. Returning previously placed order.', {
          order: recentDuplicate
        });
      }
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
      return sendError(res, 400, 'Complete delivery address with street and city is required.');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, 'Order must contain at least one food item.');
    }

    if (!restaurantId || !restaurantId.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Valid restaurant ID is required.');
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return sendError(res, 404, 'Restaurant not found.');
    }

    if (!restaurant.isOpen) {
      return sendError(res, 400, `Restaurant "${restaurant.name}" is currently closed and not accepting orders.`);
    }

    // STRICT INTRA-CITY DELIVERY ENFORCEMENT:
    // Food can only be delivered in the same city where the restaurant is located.
    const restaurantCity = (restaurant.address?.city || '').trim().toLowerCase();
    const deliveryCity = (deliveryAddress.city || '').trim().toLowerCase();

    if (restaurantCity && deliveryCity && restaurantCity !== deliveryCity) {
      return sendError(
        res,
        400,
        `Delivery unavailable: "${restaurant.name}" is located in ${restaurant.address.city} and only delivers within ${restaurant.address.city}. Delivery location "${deliveryAddress.city}" is outside our delivery radius.`
      );
    }

    let subtotal = 0;
    const itemSnapshots = [];

    for (const item of items) {
      if (!item.foodItem || !item.foodItem.match(/^[0-9a-fA-F]{24}$/)) {
        return sendError(res, 400, `Invalid foodItem ID: ${item.foodItem}`);
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty < 1) {
        return sendError(res, 400, 'Quantity must be a positive integer greater than or equal to 1.');
      }

      const dbItem = await FoodItem.findById(item.foodItem);
      if (!dbItem) {
        return sendError(res, 404, `Food item ${item.foodItem} no longer exists.`);
      }

      if (dbItem.restaurant.toString() !== restaurantId.toString()) {
        return sendError(
          res,
          400,
          `Item "${dbItem.name}" does not belong to the selected restaurant. Single-restaurant checkout required.`
        );
      }

      if (!dbItem.isAvailable) {
        return sendError(res, 400, `Item "${dbItem.name}" is currently out of stock.`);
      }

      const itemTotal = dbItem.price * qty;
      subtotal += itemTotal;

      itemSnapshots.push({
        foodItem: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
        itemTotal
      });
    }

    const pricing = calculatePricing(subtotal);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    const newOrder = await Order.create({
      orderNumber,
      customer: req.user._id,
      restaurant: restaurantId,
      items: itemSnapshots,
      subtotal: pricing.subtotal,
      deliveryFee: pricing.deliveryFee,
      tax: pricing.tax,
      totalAmount: pricing.totalAmount,
      deliveryAddress: {
        street: deliveryAddress.street.trim(),
        city: deliveryAddress.city.trim(),
        state: deliveryAddress.state ? deliveryAddress.state.trim() : undefined,
        postalCode: deliveryAddress.postalCode ? deliveryAddress.postalCode.trim() : undefined,
        phone: deliveryAddress.phone ? deliveryAddress.phone.trim() : req.user.phone
      },
      orderStatus: 'PLACED',
      paymentMethod: 'COD',
      codCollectionStatus: 'PENDING_COLLECTION',
      notes: idempotencyKey ? `IDEMPOTENCY_${idempotencyKey}` : (notes || undefined)
    });

    return sendSuccess(res, 201, 'Order created successfully with Cash on Delivery', {
      order: newOrder
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to create order', error.message);
  }
});

// ==========================================
// 5. GET CUSTOMER ORDER HISTORY (MY ORDERS)
// ==========================================
router.get(['/my', '/my-orders'], verifyAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: req.user._id };
    if (status) {
      query.orderStatus = status.toUpperCase();
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('restaurant', 'name address phone rating')
        .populate('deliveryPartner', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Order.countDocuments(query)
    ]);

    return sendSuccess(res, 200, 'Customer orders retrieved', {
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber) || 1,
      orders
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve order history', error.message);
  }
});

// ==========================================
// 6. GET SINGLE ORDER DETAILS (ROLE-BASED AUTHORIZATION)
// ==========================================
router.get('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid order ID format.');
    }

    const order = await Order.findById(id)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name address phone owner')
      .populate('deliveryPartner', 'name phone deliveryPartnerDetails');

    if (!order) {
      return sendError(res, 404, 'Order not found.');
    }

    const isCustomerOwner = order.customer._id.toString() === req.user._id.toString();
    const isRestaurantOwner =
      req.user.role === 'RESTAURANT_OWNER' &&
      order.restaurant.owner.toString() === req.user._id.toString();
    const isAssignedRider =
      order.deliveryPartner &&
      order.deliveryPartner._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomerOwner && !isRestaurantOwner && !isAssignedRider && !isAdmin) {
      return sendError(res, 403, 'Forbidden: You are not authorized to view this order.');
    }

    return sendSuccess(res, 200, 'Order details retrieved', { order });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch order details', error.message);
  }
});

// ==========================================
// 7. ORDER LIFECYCLE STATE TRANSITIONS (ROLE-ENFORCED)
// ==========================================
router.patch('/:id/status', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid order ID format.');
    }

    if (!status) {
      return sendError(res, 400, 'Target order status is required.');
    }

    const targetStatus = status.toUpperCase();
    const validStatuses = [
      'ACCEPTED',
      'REJECTED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'ASSIGNED',
      'PICKED_UP',
      'DELIVERED',
      'CANCELLED'
    ];

    if (!validStatuses.includes(targetStatus)) {
      return sendError(res, 400, `Invalid target status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await Order.findById(id).populate('restaurant');
    if (!order) {
      return sendError(res, 404, 'Order not found.');
    }

    const currentStatus = order.orderStatus;

    // Check state machine permitted transitions
    const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      return sendError(
        res,
        400,
        `Invalid status transition from "${currentStatus}" to "${targetStatus}". Permitted next states: [${allowedNext.join(', ')}]`
      );
    }

    // Role-based permission checks:
    const isOwner =
      req.user.role === 'RESTAURANT_OWNER' &&
      order.restaurant.owner.toString() === req.user._id.toString();
    const isAssignedRider =
      req.user.role === 'DELIVERY_PARTNER' &&
      order.deliveryPartner &&
      order.deliveryPartner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    // 1. Kitchen Operations: ACCEPTED, REJECTED, PREPARING, READY_FOR_PICKUP
    const kitchenStatuses = ['ACCEPTED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP'];
    if (kitchenStatuses.includes(targetStatus)) {
      if (!isOwner && !isAdmin) {
        return sendError(
          res,
          403,
          `Forbidden: Only the restaurant owner can transition order to ${targetStatus}.`
        );
      }
    }

    // 2. Rider Doorstep Operations: PICKED_UP, DELIVERED
    const deliveryStatuses = ['PICKED_UP', 'DELIVERED'];
    if (deliveryStatuses.includes(targetStatus)) {
      if (!isAssignedRider && !isAdmin) {
        return sendError(
          res,
          403,
          `Forbidden: Only the assigned delivery partner can transition order to ${targetStatus}.`
        );
      }
    }

    // Apply Transition
    order.orderStatus = targetStatus;

    if (targetStatus === 'REJECTED') {
      order.cancellationReason = reason ? reason.trim() : 'Rejected by restaurant kitchen';
      order.codCollectionStatus = 'CANCELLED';
    }

    await order.save();

    return sendSuccess(res, 200, `Order ${order.orderNumber} transitioned to ${targetStatus}`, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      codCollectionStatus: order.codCollectionStatus,
      cancellationReason: order.cancellationReason
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to transition order status', error.message);
  }
});

// ==========================================
// 7B. ASSIGN DELIVERY PARTNER TO ORDER ALIAS
// ==========================================
router.patch('/:id/assign-rider', verifyAuth, requireRole('ADMIN', 'RESTAURANT_OWNER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryPartnerId } = req.body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid order ID format.');
    }

    if (!deliveryPartnerId || !deliveryPartnerId.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Valid deliveryPartnerId is required.');
    }

    const order = await Order.findById(id).populate('restaurant');
    if (!order) {
      return sendError(res, 404, 'Order not found.');
    }

    if (req.user.role === 'RESTAURANT_OWNER') {
      if (order.restaurant.owner.toString() !== req.user._id.toString()) {
        return sendError(res, 403, 'Forbidden: You do not own the restaurant for this order.');
      }
    }

    const { User } = await import('./models.js');
    const partner = await User.findOne({ _id: deliveryPartnerId, role: 'DELIVERY_PARTNER', isActive: true });
    if (!partner) {
      return sendError(res, 404, 'Active delivery partner not found.');
    }

    order.deliveryPartner = partner._id;
    if (order.orderStatus === 'READY_FOR_PICKUP' || order.orderStatus === 'PLACED' || order.orderStatus === 'ACCEPTED' || order.orderStatus === 'PREPARING') {
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
        phone: partner.phone
      }
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to assign delivery partner', error.message);
  }
});

// ==========================================
// 8. RECORD CASH COLLECTION (DELIVERY PARTNER / ADMIN)
// ==========================================
router.patch('/:id/collect-cod', verifyAuth, requireRole('DELIVERY_PARTNER', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid order ID format.');
    }

    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, 404, 'Order not found.');
    }

    if (
      req.user.role === 'DELIVERY_PARTNER' &&
      order.deliveryPartner &&
      order.deliveryPartner.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, 'Forbidden: You are not the assigned delivery partner for this order.');
    }

    if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'REJECTED') {
      return sendError(
        res,
        400,
        `Invalid state transition: Cannot collect cash for an order with status "${order.orderStatus}".`
      );
    }

    if (order.codCollectionStatus === 'COLLECTED' || order.codCollectionStatus === 'RECONCILED') {
      return sendError(
        res,
        400,
        `Duplicate collection rejected: Cash for this order is already recorded as "${order.codCollectionStatus}".`
      );
    }

    order.codCollectionStatus = 'COLLECTED';
    order.codCollectedAt = new Date();
    order.codCollectedBy = req.user._id;

    await order.save();

    return sendSuccess(res, 200, `Cash of Rs ${order.totalAmount} successfully recorded as COLLECTED`, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      codCollectionStatus: order.codCollectionStatus,
      codCollectedAt: order.codCollectedAt,
      codCollectedBy: req.user._id
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to record cash collection', error.message);
  }
});

// ==========================================
// 9. RECONCILE COD CASH COLLECTION (ADMIN ONLY)
// ==========================================
router.patch('/:id/reconcile-cod', verifyAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid order ID format.');
    }

    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, 404, 'Order not found.');
    }

    if (order.codCollectionStatus === 'RECONCILED') {
      return sendError(res, 400, 'Duplicate reconciliation rejected: This order has already been reconciled.');
    }

    if (order.codCollectionStatus !== 'COLLECTED') {
      return sendError(
        res,
        400,
        `Cannot reconcile: Cash collection is currently in "${order.codCollectionStatus}" status. Physical cash must be marked as COLLECTED first.`
      );
    }

    // Compute 3-way financial split on reconciliation:
    // 1. Restaurant Payout: 85% of items subtotal
    // 2. Rider Payout: 100% of delivery fee (minimum ₹40)
    // 3. Administrator Platform Commission & Margin: 15% of subtotal + taxes + any platform balance
    const itemSubtotal = order.subtotal || Math.max(0, order.totalAmount - (order.deliveryFee || 0) - (order.tax || 0));
    const restCut = Math.round(itemSubtotal * 0.85 * 100) / 100;
    const riderCut = order.deliveryFee > 0 ? order.deliveryFee : 40;
    const adminCut = Math.round((order.totalAmount - restCut - riderCut) * 100) / 100;

    order.restaurantPayout = restCut;
    order.riderPayout = riderCut;
    order.adminCommission = Math.max(0, adminCut);

    order.codCollectionStatus = 'RECONCILED';
    order.codReconciledAt = new Date();
    order.codReconciledBy = req.user._id;

    await order.save();

    return sendSuccess(res, 200, `COD Collection for order ${order.orderNumber} successfully RECONCILED with financial splits computed.`, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      restaurantPayout: order.restaurantPayout,
      adminCommission: order.adminCommission,
      riderPayout: order.riderPayout,
      codCollectionStatus: order.codCollectionStatus,
      codReconciledAt: order.codReconciledAt,
      codReconciledBy: req.user._id
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to reconcile COD collection', error.message);
  }
});

// ==========================================
// 10. CANCEL ORDER (CUSTOMER / OWNER / ADMIN)
// ==========================================
router.patch('/:id/cancel', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by user' } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid order ID format.');
    }

    const order = await Order.findById(id).populate('restaurant');
    if (!order) {
      return sendError(res, 404, 'Order not found.');
    }

    const isCustomer = order.customer.toString() === req.user._id.toString();
    const isOwner =
      req.user.role === 'RESTAURANT_OWNER' &&
      order.restaurant.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomer && !isOwner && !isAdmin) {
      return sendError(res, 403, 'Forbidden: You are not authorized to cancel this order.');
    }

    if (isCustomer && !isAdmin && order.orderStatus !== 'PLACED') {
      return sendError(
        res,
        400,
        `Cannot cancel: Order is already in "${order.orderStatus}" stage. Cancellation is only permitted while status is PLACED.`
      );
    }

    if (order.orderStatus === 'DELIVERED') {
      return sendError(res, 400, 'Cannot cancel an order that has already been DELIVERED.');
    }

    if (order.codCollectionStatus === 'RECONCILED' && !isAdmin) {
      return sendError(res, 400, 'Cannot cancel order after COD cash collection has been fully reconciled.');
    }

    order.orderStatus = 'CANCELLED';
    order.codCollectionStatus = 'CANCELLED';
    order.cancellationReason = reason.trim();

    await order.save();

    return sendSuccess(res, 200, `Order ${order.orderNumber} has been successfully cancelled`, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      codCollectionStatus: order.codCollectionStatus,
      cancellationReason: order.cancellationReason
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to cancel order', error.message);
  }
});

export default router;
