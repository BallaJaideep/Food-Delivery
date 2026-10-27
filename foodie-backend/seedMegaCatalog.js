import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Restaurant, FoodItem } from './models.js';

dotenv.config();

// 20 Major Cities across India & Global Metros with realistic localities and coordinates
export const CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', postalPrefix: '400', lat: 18.9220, lng: 72.8347 },
  { name: 'Delhi', state: 'NCR', postalPrefix: '110', lat: 28.6139, lng: 77.2090 },
  { name: 'Bangalore', state: 'Karnataka', postalPrefix: '560', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', postalPrefix: '500', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', postalPrefix: '600', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', postalPrefix: '700', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', state: 'Maharashtra', postalPrefix: '411', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', postalPrefix: '380', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', postalPrefix: '302', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', postalPrefix: '226', lat: 26.8467, lng: 80.9462 },
  { name: 'Chandigarh', state: 'Punjab & Haryana', postalPrefix: '160', lat: 30.7333, lng: 76.7794 },
  { name: 'Kochi', state: 'Kerala', postalPrefix: '682', lat: 9.9312, lng: 76.2673 },
  { name: 'Goa', state: 'Goa', postalPrefix: '403', lat: 15.2993, lng: 74.1240 },
  { name: 'Indore', state: 'Madhya Pradesh', postalPrefix: '452', lat: 22.7196, lng: 75.8577 },
  { name: 'Bhopal', state: 'Madhya Pradesh', postalPrefix: '462', lat: 23.2599, lng: 77.4126 },
  { name: 'Coimbatore', state: 'Tamil Nadu', postalPrefix: '641', lat: 11.0168, lng: 76.9558 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', postalPrefix: '530', lat: 17.6868, lng: 83.2185 },
  { name: 'Surat', state: 'Gujarat', postalPrefix: '395', lat: 21.1702, lng: 72.8311 },
  { name: 'Nagpur', state: 'Maharashtra', postalPrefix: '440', lat: 21.1458, lng: 79.0882 },
  { name: 'Patna', state: 'Bihar', postalPrefix: '800', lat: 25.5941, lng: 85.1376 }
];

// 20 Archetype Themes for each city so every restaurant feels unique
const RESTAURANT_THEMES = [
  {
    prefix: 'Heritage',
    suffix: 'Royal Kitchen',
    cuisines: ['Mughlai', 'North Indian', 'Biryani'],
    desc: 'Grand royal banquet dishes slow-cooked with heritage spices and clay pot charcoal dum.',
    coverImg: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Urban',
    suffix: 'Bistro & Grill',
    cuisines: ['Continental', 'Steaks', 'Salads'],
    desc: 'Artisanal modern bistro plates, oak-grilled skewers, and fresh seasonal harvest bowls.',
    coverImg: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Golden',
    suffix: 'Wok & Dumpling Lounge',
    cuisines: ['Pan-Asian', 'Chinese', 'Dim Sum'],
    desc: 'Fiery wok tosses, authentic handmade dim sum baskets, and Cantonese broth delicacies.',
    coverImg: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Bella',
    suffix: 'Stone Oven Pizzeria',
    cuisines: ['Italian', 'Pizza', 'Pasta'],
    desc: 'Hand-stretched sourdough pizzas blistered in a high-temp woodfired Italian stone kiln.',
    coverImg: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Coastal',
    suffix: 'Bay Seafood Shack',
    cuisines: ['Seafood', 'Coastal', 'Continental'],
    desc: 'Fresh morning catches pan-seared with coastal aromatic herbs and tangy citrus drizzles.',
    coverImg: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Dakshin',
    suffix: 'Tiffin & Dosa House',
    cuisines: ['South Indian', 'Pure Veg', 'Breakfast'],
    desc: 'Crispy golden ghee roasts, fluffy steamed idlis, spicy chutneys, and piping filter coffee.',
    coverImg: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'The Burger',
    suffix: 'Foundry & Smokehouse',
    cuisines: ['Burgers', 'American', 'Fast Food'],
    desc: 'Double smash beef and crispy chicken burgers served with melted sharp cheddar on brioche.',
    coverImg: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Tokyo',
    suffix: 'Ramen & Sushi Bar',
    cuisines: ['Japanese', 'Ramen', 'Sushi'],
    desc: 'Silky 16-hour simmered Tonkotsu noodle bowls, salmon nigiri, and crisp pan-fried gyoza.',
    coverImg: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'El Cantina',
    suffix: 'Taqueria & Grill',
    cuisines: ['Mexican', 'Tacos', 'Burritos'],
    desc: 'Slow braised birria tacos, fresh table-side guacamole, charred fajitas, and warm churros.',
    coverImg: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Green Oasis',
    suffix: 'Mezze & Mediterranean',
    cuisines: ['Mediterranean', 'Healthy Bowls', 'Lebanese'],
    desc: 'Wholesome organic grain bowls, creamy tahini hummus, herb falafel, and freshly baked pita.',
    coverImg: 'https://images.unsplash.com/photo-1540914124281-342587941389?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Sweet Temptation',
    suffix: 'Patisserie & Artisan Cafe',
    cuisines: ['Bakery', 'Desserts', 'Beverages'],
    desc: 'French butter croissants, velvety Basque cheesecakes, and specialty origin roast coffees.',
    coverImg: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Punjab',
    suffix: 'Dhaba Express',
    cuisines: ['North Indian', 'Punjabi', 'Tandoor'],
    desc: 'Smoky clay tandoor naans, creamy butter chicken, Amritsari kulchas, and rich lassi.',
    coverImg: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Dragon Express',
    suffix: 'Noodle & Bao Street',
    cuisines: ['Chinese', 'Street Food', 'Asian'],
    desc: 'Spicy Dan Dan street noodles, fluffy steamed chicken bao buns, and sizzling spring rolls.',
    coverImg: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Siam Garden',
    suffix: 'Thai Bistro',
    cuisines: ['Thai', 'Curry', 'Asian'],
    desc: 'Aromatic coconut green curries, tangy Pad Thai noodles, and fresh lemongrass soups.',
    coverImg: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Flame & Charcoal',
    suffix: 'Barbecue Pit',
    cuisines: ['Barbecue', 'Grill', 'Kebabs'],
    desc: 'Smoked briskets, spicy glazed tandoori wings, and charcoal grilled meat platters.',
    coverImg: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'The Healthy Table',
    suffix: 'Salad & Juice Bar',
    cuisines: ['Healthy Bowls', 'Salads', 'Vegan'],
    desc: 'Cold-pressed immune juices, nutrient-dense superfood grain salads, and avocado toasts.',
    coverImg: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Little Napoli',
    suffix: 'Trattoria & Pasta',
    cuisines: ['Italian', 'Pasta', 'European'],
    desc: 'Fresh handmade tagliatelle, slow-simmered bolognese ragu, and creamy panna cotta.',
    coverImg: 'https://images.unsplash.com/photo-1621996346565-e3d5d628178c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Kolkata Kathi',
    suffix: 'Rolls & Mughlai',
    cuisines: ['Street Food', 'Rolls', 'Bengali'],
    desc: 'Flaky parathas rolled with spiced tandoori fillings, chopped onions, and lime green chutney.',
    coverImg: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Chai & Co.',
    suffix: 'Street Snacks Cafe',
    cuisines: ['Beverages', 'Street Food', 'Snacks'],
    desc: 'Adrak Elaichi kulhad chai, crispy hot samosas, bun maska, and Mumbai vada pav.',
    coverImg: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    prefix: 'Artisan Gelato',
    suffix: 'Dessert Studio',
    cuisines: ['Desserts', 'Ice Cream', 'Bakery'],
    desc: 'Handcrafted Italian style small-batch gelatos, waffle sundaes, and molten lava cakes.',
    coverImg: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80'
  }
];

// 16 Standard Signature Dishes per restaurant theme so each has 15+ rich items with HD images
const MASTER_DISH_TEMPLATES = [
  // Starters
  {
    nameTmpl: '{City} Crispy Truffle Paneer Cubes',
    desc: 'Golden fried fresh cottage cheese glazed with roasted spices and truffle oil drizzle.',
    price: 240, category: 'Starters', isVegetarian: true, prep: 12,
    img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Charcoal Smoked Chicken Skewers',
    desc: 'Tender chicken marinated in cracked coriander, hung curd, and deghi red chili.',
    price: 290, category: 'Starters', isVegetarian: false, prep: 15,
    img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Crispy Veg Dim Sum Baskets (6 pcs)',
    desc: 'Steamed delicate dumplings packed with water chestnuts, carrots, and wild mushrooms.',
    price: 210, category: 'Starters', isVegetarian: true, prep: 15,
    img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Golden Calamari Rings with Aioli',
    desc: 'Crisp tempura squid rings dusted with sea salt and served with tangy lemon garlic mayo.',
    price: 320, category: 'Starters', isVegetarian: false, prep: 14,
    img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Crispy Corn & Water Chestnut Salt & Pepper',
    desc: 'Wok tossed sweet corn and crisp chestnuts in cracked pepper, ginger, and scallions.',
    price: 190, category: 'Starters', isVegetarian: true, prep: 10,
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
  },
  // Main Course
  {
    nameTmpl: '{City} Special Dum Biryani Pot',
    desc: 'Fragrant aged Basmati rice cooked on slow coal embers with whole spices and fresh herbs.',
    price: 380, category: 'Main Course', isVegetarian: false, prep: 25,
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Shahi Malai Kofta Curry with Butter Naan',
    desc: 'Melt-in-mouth cottage cheese dumplings simmered in a velvety cashew tomato gravy.',
    price: 310, category: 'Main Course', isVegetarian: true, prep: 20,
    img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Woodfired Artisanal Margherita Pizza',
    desc: 'San Marzano plum tomato sauce, whole fresh fior di latte, and torn Genovese sweet basil.',
    price: 350, category: 'Main Course', isVegetarian: true, prep: 18,
    img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Double Smashed Prime Bacon Burger',
    desc: 'Two juicy seared beef patties, melted sharp cheddar, caramelized onions, and burger sauce.',
    price: 370, category: 'Main Course', isVegetarian: false, prep: 18,
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Sizzling Chili Garlic Dan Dan Noodles',
    desc: 'Hand-stretched wheat noodles tossed with spicy chili oil, crushed peanuts, and fresh bok choy.',
    price: 280, category: 'Main Course', isVegetarian: true, prep: 16,
    img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Creamy Black Truffle Tagliatelle',
    desc: 'Fresh handmade pasta tossed in rich wild forest mushroom cream and 24-month parmesan.',
    price: 390, category: 'Main Course', isVegetarian: true, prep: 20,
    img: 'https://images.unsplash.com/photo-1621996346565-e3d5d628178c?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Mediterranean Harvest Quinoa Bowl',
    desc: 'Superfood quinoa, ripe Haas avocado, Kalamata olives, cucumbers, cherry tomatoes, and feta.',
    price: 260, category: 'Healthy Bowls', isVegetarian: true, prep: 15,
    img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
  },
  // Beverages
  {
    nameTmpl: 'Chilled Alphonso Mango Thick Shake',
    desc: 'Fresh pureed Ratnagiri Alphonso mangoes churned with rich dairy cream and pistachios.',
    price: 150, category: 'Beverages', isVegetarian: true, prep: 6,
    img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Artisanal Single-Origin Cold Brew Coffee',
    desc: 'Slow steeped for 18 hours using single-estate Arabica beans from the Western Ghats.',
    price: 140, category: 'Beverages', isVegetarian: true, prep: 5,
    img: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80'
  },
  // Desserts
  {
    nameTmpl: 'Molten Belgian Chocolate Lava Soufflé',
    desc: 'Warm soft centered 70% dark Belgian chocolate cake served with vanilla bean gelato.',
    price: 190, category: 'Desserts', isVegetarian: true, prep: 12,
    img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80'
  },
  {
    nameTmpl: 'Authentic Venetian Espresso Tiramisu',
    desc: 'Savoiardi biscuits dipped in dark espresso layered with rich mascarpone zabaglione.',
    price: 210, category: 'Desserts', isVegetarian: true, prep: 8,
    img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80'
  }
];

export async function populateMegaCatalog() {
  console.log('[Mega Seed] Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Mega Seed] Connected.');

  let owner = await User.findOne({ email: 'owner@foodie.local' });
  if (!owner) {
    owner = await User.findOne({ role: 'RESTAURANT_OWNER' }) || await User.findOne({});
  }
  if (!owner) {
    throw new Error('No user found to assign as restaurant owner.');
  }

  console.log(`[Mega Seed] Owner resolved: ${owner.name} (${owner._id})`);

  let totalRestaurantsCreated = 0;
  let totalDishesCreated = 0;

  for (const cityObj of CITIES) {
    console.log(`\n======================================================`);
    console.log(`Processing City: ${cityObj.name} (${cityObj.state})`);
    console.log(`======================================================`);

    for (let i = 0; i < RESTAURANT_THEMES.length; i++) {
      const theme = RESTAURANT_THEMES[i];
      const restName = `${theme.prefix} ${cityObj.name} ${theme.suffix}`;

      let restaurant = await Restaurant.findOne({
        name: restName,
        'address.city': cityObj.name
      });

      const streetName = `${10 + i * 4} Boulevard, Sector ${i + 1}`;
      const postalCode = `${cityObj.postalPrefix}00${(i + 1).toString().padStart(2, '0')}`;
      const rating = Number((4.3 + (i % 7) * 0.1).toFixed(1));
      const totalReviews = 60 + (i * 19);

      if (!restaurant) {
        restaurant = await Restaurant.create({
          name: restName,
          description: `${theme.desc} Serving exclusive recipes in ${cityObj.name}.`,
          owner: owner._id,
          cuisine: theme.cuisines,
          address: {
            street: streetName,
            city: cityObj.name,
            state: cityObj.state,
            postalCode
          },
          phone: `+91 98${(i + 10).toString().padStart(2, '0')}00${cityObj.postalPrefix.slice(0, 2)}`,
          isOpen: true,
          rating,
          totalReviews,
          imageUrl: theme.coverImg
        });
        totalRestaurantsCreated++;
        console.log(`  [+] Created: "${restaurant.name}"`);
      } else {
        restaurant.description = `${theme.desc} Serving exclusive recipes in ${cityObj.name}.`;
        restaurant.cuisine = theme.cuisines;
        restaurant.imageUrl = theme.coverImg;
        restaurant.rating = rating;
        restaurant.isOpen = true;
        await restaurant.save();
        console.log(`  [*] Updated: "${restaurant.name}"`);
      }

      // Generate 16 signature dishes for each restaurant (16 > 15)
      for (const dishTemplate of MASTER_DISH_TEMPLATES) {
        const dishName = dishTemplate.nameTmpl.replace('{City}', cityObj.name);

        let food = await FoodItem.findOne({
          restaurant: restaurant._id,
          name: dishName
        });

        if (!food) {
          food = await FoodItem.create({
            restaurant: restaurant._id,
            name: dishName,
            description: dishTemplate.desc,
            price: dishTemplate.price + (i % 5) * 10,
            category: dishTemplate.category,
            isVegetarian: dishTemplate.isVegetarian,
            preparationTimeMinutes: dishTemplate.prep,
            imageUrl: dishTemplate.img,
            isAvailable: true
          });
          totalDishesCreated++;
        } else {
          food.description = dishTemplate.desc;
          food.price = dishTemplate.price + (i % 5) * 10;
          food.category = dishTemplate.category;
          food.isVegetarian = dishTemplate.isVegetarian;
          food.preparationTimeMinutes = dishTemplate.prep;
          food.imageUrl = dishTemplate.img;
          food.isAvailable = true;
          await food.save();
        }
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`[SEED COMPLETE] Processed all 20 Cities!`);
  console.log(`Total Restaurants in DB: 20 cities * 20 = 400 restaurants.`);
  console.log(`Dishes per restaurant: 16 items.`);
  console.log(`Total HD Food Dishes in DB: 6,400+ items.`);
  console.log(`======================================================\n`);

  await mongoose.disconnect();
}

if (process.argv[1]?.endsWith('seedMegaCatalog.js')) {
  populateMegaCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Mega Seed Error]:', err);
      process.exit(1);
    });
}
