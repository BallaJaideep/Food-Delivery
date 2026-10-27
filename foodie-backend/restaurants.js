import express from 'express';
import { Restaurant, FoodItem } from './models.js';
import { verifyAuth, requireRole } from './auth.js';
import { sendSuccess, sendError, uploadImageToCloudinary } from './utils.js';

export const restaurantRouter = express.Router();
export const foodRouter = express.Router();

// =========================================================================
// PART A: RESTAURANT MANAGEMENT ROUTES (restaurantRouter)
// =========================================================================

// 1. GET ALL RESTAURANTS (PUBLIC DISCOVERY & FILTERING)
restaurantRouter.get('/', async (req, res) => {
  try {
    const {
      search,
      cuisine,
      city,
      isOpen,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } }
      ];
    }

    if (cuisine) {
      const cuisineList = cuisine.split(',').map(c => new RegExp(`^${c.trim()}$`, 'i'));
      query.cuisine = { $in: cuisineList };
    }

    if (city) {
      query['address.city'] = { $regex: `^${city.trim()}$`, $options: 'i' };
    }

    if (isOpen !== undefined) {
      query.isOpen = isOpen === 'true' || isOpen === true;
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const [restaurants, total] = await Promise.all([
      Restaurant.find(query)
        .populate('owner', 'name email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Restaurant.countDocuments(query)
    ]);

    return sendSuccess(res, 200, 'Restaurants retrieved successfully', {
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber) || 1,
      limit: limitNumber,
      restaurants
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch restaurants', error.message);
  }
});

// 2. GET AUTHENTICATED OWNER'S RESTAURANTS
restaurantRouter.get('/owner/my-restaurants', verifyAuth, requireRole('RESTAURANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const query = req.user.role === 'ADMIN'
      ? {}
      : { $or: [{ owner: req.user._id }, { owners: req.user._id }] };
    const restaurants = await Restaurant.find(query).sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Owner restaurants retrieved successfully', {
      count: restaurants.length,
      restaurants
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch owner restaurants', error.message);
  }
});

// 3. GET SINGLE RESTAURANT DETAILS (PUBLIC)
restaurantRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid restaurant ID format.');
    }

    const restaurant = await Restaurant.findById(id).populate('owner', 'name email phone');

    if (!restaurant) {
      return sendError(res, 404, 'Restaurant not found.');
    }

    return sendSuccess(res, 200, 'Restaurant details retrieved', { restaurant });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch restaurant details', error.message);
  }
});

// 4. GET A RESTAURANT'S FULL MENU (PUBLIC)
restaurantRouter.get('/:id/menu', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, isVegetarian, isAvailable } = req.query;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid restaurant ID format.');
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return sendError(res, 404, 'Restaurant not found.');
    }

    const query = { restaurant: id };
    if (category) {
      query.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }
    if (isVegetarian !== undefined) {
      query.isVegetarian = isVegetarian === 'true' || isVegetarian === true;
    }
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true' || isAvailable === true;
    }

    const menuItems = await FoodItem.find(query).sort({ category: 1, name: 1 });

    return sendSuccess(res, 200, 'Restaurant menu retrieved successfully', {
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        isOpen: restaurant.isOpen
      },
      count: menuItems.length,
      menuItems
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch restaurant menu', error.message);
  }
});

// 5. CREATE A RESTAURANT (OWNER / ADMIN ONLY)
restaurantRouter.post('/', verifyAuth, requireRole('RESTAURANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { name, description, cuisine, address, phone, imageUrl, isOpen } = req.body;

    if (!name || !address || !address.street || !address.city) {
      return sendError(res, 400, 'Please provide restaurant name and address (street and city are required).');
    }

    let formattedCuisines = [];
    if (Array.isArray(cuisine)) {
      formattedCuisines = cuisine.map(c => c.trim()).filter(Boolean);
    } else if (typeof cuisine === 'string') {
      formattedCuisines = cuisine.split(',').map(c => c.trim()).filter(Boolean);
    }

    const uploadedImage = imageUrl ? await uploadImageToCloudinary(imageUrl) : undefined;

    const newRestaurant = await Restaurant.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      owner: req.user._id,
      cuisine: formattedCuisines,
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state ? address.state.trim() : undefined,
        postalCode: address.postalCode ? address.postalCode.trim() : undefined
      },
      phone: phone ? phone.trim() : undefined,
      imageUrl: uploadedImage,
      isOpen: isOpen !== undefined ? Boolean(isOpen) : true
    });

    return sendSuccess(res, 201, 'Restaurant created successfully', {
      restaurant: newRestaurant
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to create restaurant', error.message);
  }
});

// 6. UPDATE RESTAURANT INFO (OWNER-PROTECTED)
restaurantRouter.patch('/:id', verifyAuth, requireRole('RESTAURANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid restaurant ID format.');
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return sendError(res, 404, 'Restaurant not found.');
    }

    const isOwner = restaurant.owner?.toString() === req.user._id.toString() ||
      (restaurant.owners && restaurant.owners.some(o => o.toString() === req.user._id.toString()));
    if (req.user.role !== 'ADMIN' && !isOwner) {
      return sendError(res, 403, 'Forbidden: You do not own this restaurant and cannot edit it.');
    }

    const { name, description, cuisine, address, phone, imageUrl, isOpen } = req.body;

    if (name) restaurant.name = name.trim();
    if (description !== undefined) restaurant.description = description.trim();
    if (phone !== undefined) restaurant.phone = phone.trim();
    if (imageUrl !== undefined) {
      restaurant.imageUrl = await uploadImageToCloudinary(imageUrl);
    }
    if (isOpen !== undefined) restaurant.isOpen = Boolean(isOpen);

    if (cuisine) {
      if (Array.isArray(cuisine)) {
        restaurant.cuisine = cuisine.map(c => c.trim()).filter(Boolean);
      } else if (typeof cuisine === 'string') {
        restaurant.cuisine = cuisine.split(',').map(c => c.trim()).filter(Boolean);
      }
    }

    if (address) {
      if (address.street) restaurant.address.street = address.street.trim();
      if (address.city) restaurant.address.city = address.city.trim();
      if (address.state !== undefined) restaurant.address.state = address.state.trim();
      if (address.postalCode !== undefined) restaurant.address.postalCode = address.postalCode.trim();
    }

    const updatedRestaurant = await restaurant.save();

    return sendSuccess(res, 200, 'Restaurant updated successfully', {
      restaurant: updatedRestaurant
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update restaurant', error.message);
  }
});

// 7. TOGGLE RESTAURANT OPERATIONAL AVAILABILITY
restaurantRouter.patch('/:id/availability', verifyAuth, requireRole('RESTAURANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid restaurant ID format.');
    }

    if (isOpen === undefined) {
      return sendError(res, 400, 'Please provide boolean isOpen status.');
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return sendError(res, 404, 'Restaurant not found.');
    }

    const isOwner = restaurant.owner?.toString() === req.user._id.toString() ||
      (restaurant.owners && restaurant.owners.some(o => o.toString() === req.user._id.toString()));
    if (req.user.role !== 'ADMIN' && !isOwner) {
      return sendError(res, 403, 'Forbidden: You do not own this restaurant and cannot change its availability.');
    }

    restaurant.isOpen = Boolean(isOpen);
    await restaurant.save();

    return sendSuccess(res, 200, `Restaurant status updated to ${restaurant.isOpen ? 'OPEN' : 'CLOSED'}`, {
      id: restaurant._id,
      name: restaurant.name,
      isOpen: restaurant.isOpen
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update restaurant availability', error.message);
  }
});


// =========================================================================
// PART B: FOOD MENU & DISCOVERY ROUTES (foodRouter)
// =========================================================================

// 1. BUDGET-BASED MEAL DISCOVERY
foodRouter.get('/budget-discovery', async (req, res) => {
  try {
    const { budget, maxPrice, category, isVegetarian, limit = 20 } = req.query;
    const ceilingPrice = Number(budget || maxPrice);

    if (isNaN(ceilingPrice) || ceilingPrice <= 0) {
      return sendError(res, 400, 'Please provide a valid numeric budget or maxPrice parameter greater than 0.');
    }

    const query = {
      price: { $lte: ceilingPrice },
      isAvailable: true
    };

    if (category) {
      query.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    if (isVegetarian !== undefined) {
      query.isVegetarian = isVegetarian === 'true' || isVegetarian === true;
    }

    const meals = await FoodItem.find(query)
      .populate('restaurant', 'name address isOpen rating')
      .sort({ price: 1 })
      .limit(Math.min(50, parseInt(limit, 10) || 20))
      .lean();

    // Attach budget utilization percentage
    const mealsWithSavings = meals.map(item => ({
      ...item,
      budgetCeiling: ceilingPrice,
      savings: Math.max(0, ceilingPrice - item.price),
      budgetUtilizationPercent: Math.round((item.price / ceilingPrice) * 100)
    }));

    return sendSuccess(res, 200, `Found ${mealsWithSavings.length} meals within budget of ${ceilingPrice}`, {
      budget: ceilingPrice,
      count: mealsWithSavings.length,
      meals: mealsWithSavings
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to discover budget meals', error.message);
  }
});

// 2. GET UNIQUE FOOD CATEGORIES
foodRouter.get('/categories', async (req, res) => {
  try {
    const categories = await FoodItem.distinct('category', { isAvailable: true });
    return sendSuccess(res, 200, 'Food categories retrieved successfully', {
      categories: categories.sort()
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch food categories', error.message);
  }
});

// 3. GET ALL FOOD ITEMS (SEARCH & MULTI-FILTER DISCOVERY)
foodRouter.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      isVegetarian,
      isAvailable,
      restaurant,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      const categories = category.split(',').map(c => new RegExp(`^${c.trim()}$`, 'i'));
      query.category = { $in: categories };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    if (isVegetarian !== undefined) {
      query.isVegetarian = isVegetarian === 'true' || isVegetarian === true;
    }

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true' || isAvailable === true;
    }

    if (restaurant && restaurant.match(/^[0-9a-fA-F]{24}$/)) {
      query.restaurant = restaurant;
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skip = (pageNumber - 1) * limitNumber;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      FoodItem.find(query)
        .populate('restaurant', 'name address isOpen rating')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      FoodItem.countDocuments(query)
    ]);

    return sendSuccess(res, 200, 'Food items retrieved successfully', {
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber) || 1,
      limit: limitNumber,
      items
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch food items', error.message);
  }
});

// 4. GET SINGLE FOOD ITEM BY ID
foodRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid food item ID format.');
    }

    const foodItem = await FoodItem.findById(id).populate('restaurant', 'name address isOpen rating');

    if (!foodItem) {
      return sendError(res, 404, 'Food item not found.');
    }

    return sendSuccess(res, 200, 'Food item details retrieved', { foodItem });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch food item details', error.message);
  }
});

// 5. CREATE A FOOD ITEM (OWNER ONLY, STRICT RESTAURANT OWNERSHIP CHECK)
foodRouter.post('/', verifyAuth, requireRole('RESTAURANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const {
      restaurant: restaurantId,
      name,
      description,
      price,
      category,
      isAvailable,
      isVegetarian,
      imageUrl,
      preparationTimeMinutes
    } = req.body;

    if (!restaurantId || !name || price === undefined || !category) {
      return sendError(res, 400, 'Please provide restaurant ID, item name, price, and category.');
    }

    if (isNaN(price) || Number(price) < 0) {
      return sendError(res, 400, 'Price must be a valid number greater than or equal to 0.');
    }

    if (!restaurantId.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid restaurant ID format.');
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return sendError(res, 404, 'Restaurant not found.');
    }

    // Ownership Enforcement: User must own the target restaurant
    const isOwnerCreate = restaurant.owner?.toString() === req.user._id.toString() ||
      (restaurant.owners && restaurant.owners.some(o => o.toString() === req.user._id.toString()));
    if (req.user.role !== 'ADMIN' && !isOwnerCreate) {
      return sendError(res, 403, 'Forbidden: You do not own this restaurant and cannot add menu items to it.');
    }

    const uploadedImage = imageUrl ? await uploadImageToCloudinary(imageUrl) : '';

    const newFoodItem = await FoodItem.create({
      restaurant: restaurantId,
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      category: category.trim(),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      isVegetarian: Boolean(isVegetarian),
      imageUrl: uploadedImage || '',
      preparationTimeMinutes: Number(preparationTimeMinutes) || 20
    });

    return sendSuccess(res, 201, 'Food item created successfully', {
      foodItem: newFoodItem
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to create food item', error.message);
  }
});

// 6. UPDATE A FOOD ITEM (OWNER-PROTECTED)
foodRouter.patch('/:id', verifyAuth, requireRole('RESTAURANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid food item ID format.');
    }

    const foodItem = await FoodItem.findById(id).populate('restaurant');
    if (!foodItem) {
      return sendError(res, 404, 'Food item not found.');
    }

    // Ownership Enforcement
    const isOwnerPatch = foodItem.restaurant?.owner?.toString() === req.user._id.toString() ||
      (foodItem.restaurant?.owners && foodItem.restaurant.owners.some(o => o.toString() === req.user._id.toString()));
    if (req.user.role !== 'ADMIN' && !isOwnerPatch) {
      return sendError(res, 403, 'Forbidden: You do not own the restaurant for this food item.');
    }

    const {
      name,
      description,
      price,
      category,
      isAvailable,
      isVegetarian,
      imageUrl,
      preparationTimeMinutes
    } = req.body;

    if (price !== undefined) {
      if (isNaN(price) || Number(price) < 0) {
        return sendError(res, 400, 'Price must be a valid number greater than or equal to 0.');
      }
      foodItem.price = Number(price);
    }

    if (name) foodItem.name = name.trim();
    if (description !== undefined) foodItem.description = description.trim();
    if (category) foodItem.category = category.trim();
    if (isAvailable !== undefined) foodItem.isAvailable = Boolean(isAvailable);
    if (isVegetarian !== undefined) foodItem.isVegetarian = Boolean(isVegetarian);
    if (preparationTimeMinutes !== undefined) {
      foodItem.preparationTimeMinutes = Number(preparationTimeMinutes);
    }
    if (imageUrl !== undefined) {
      foodItem.imageUrl = await uploadImageToCloudinary(imageUrl);
    }

    const updatedFoodItem = await foodItem.save();

    return sendSuccess(res, 200, 'Food item updated successfully', {
      foodItem: updatedFoodItem
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update food item', error.message);
  }
});

// 7. DELETE A FOOD ITEM (OWNER-PROTECTED)
foodRouter.delete('/:id', verifyAuth, requireRole('RESTAURANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, 'Invalid food item ID format.');
    }

    const foodItem = await FoodItem.findById(id).populate('restaurant');
    if (!foodItem) {
      return sendError(res, 404, 'Food item not found.');
    }

    // Ownership Enforcement
    const isOwnerDelete = foodItem.restaurant?.owner?.toString() === req.user._id.toString() ||
      (foodItem.restaurant?.owners && foodItem.restaurant.owners.some(o => o.toString() === req.user._id.toString()));
    if (req.user.role !== 'ADMIN' && !isOwnerDelete) {
      return sendError(res, 403, 'Forbidden: You do not own the restaurant for this food item.');
    }

    await FoodItem.findByIdAndDelete(id);

    return sendSuccess(res, 200, 'Food item deleted successfully', {
      deletedItemId: id
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to delete food item', error.message);
  }
});

export default restaurantRouter;
