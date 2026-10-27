import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Restaurant, FoodItem } from './models.js';

dotenv.config();

const RESTAURANTS_DATA = [
  {
    name: 'Teal Bay Bistro',
    description: 'Modern coastal gourmet dining featuring fresh catches, artisanal pasta, and organic harvest bowls.',
    cuisine: ['Continental', 'Seafood', 'Healthy Bowls', 'Italian'],
    address: { street: '12 Marina Promenade, Harbour Front', city: 'Metro Hub', state: 'Central', postalCode: '400001' },
    phone: '+91 9876543211',
    isOpen: true,
    rating: 4.8,
    totalReviews: 128,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    dishes: [
      {
        name: 'Pan-Seared Atlantic Salmon',
        description: 'Crispy skin salmon filet served over saffron lemon risotto and grilled asparagus.',
        price: 490,
        category: 'Main Course',
        isVegetarian: false,
        preparationTimeMinutes: 25,
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Mediterranean Quinoa Harvest Bowl',
        description: 'Organic quinoa, cherry tomatoes, kalamata olives, Hass avocado, feta, and extra virgin citrus vinaigrette.',
        price: 260,
        category: 'Healthy Bowls',
        isVegetarian: true,
        preparationTimeMinutes: 15,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Truffle Wild Mushroom Fettuccine',
        description: 'Handmade fresh egg fettuccine tossed in a rich black truffle and porcini cream reduction.',
        price: 360,
        category: 'Main Course',
        isVegetarian: true,
        preparationTimeMinutes: 20,
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d628178c?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Classic Coastal Calamari Fritti',
        description: 'Crisp golden squid rings sprinkled with sea salt, smoked paprika, and served with garlic aioli.',
        price: 290,
        category: 'Starters',
        isVegetarian: false,
        preparationTimeMinutes: 15,
        imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Belgian Dark Chocolate Soufflé',
        description: 'Molten Belgian chocolate cake with Madagascar vanilla bean gelato and berry compote.',
        price: 190,
        category: 'Desserts',
        isVegetarian: true,
        preparationTimeMinutes: 18,
        imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    name: 'Urban Wok Lounge',
    description: 'Sizzling wok stir-fries, handcrafted dim sum, and aromatic broth noodles prepared by master wok chefs.',
    cuisine: ['Pan-Asian', 'Chinese', 'Dim Sum', 'Street Food'],
    address: { street: '88 Lotus Lane, Chinatown Square', city: 'Metro Hub', state: 'Central', postalCode: '400001' },
    phone: '+91 9888877777',
    isOpen: true,
    rating: 4.7,
    totalReviews: 215,
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    dishes: [
      {
        name: 'Steamed Crystal Truffle Dim Sum',
        description: 'Translucent parcels packed with wild shiitake, water chestnuts, and black truffle oil drizzle.',
        price: 240,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 15,
        imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Spicy Schezwan Dan Dan Noodles',
        description: 'Springy hand-pulled noodles with crushed peanuts, scallions, bok choy, and chili chili crisp oil.',
        price: 280,
        category: 'Main Course',
        isVegetarian: true,
        preparationTimeMinutes: 18,
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Crispy Kung Pao Chicken',
        description: 'Tender wok-tossed chicken chunks with Sichuan peppers, dry chilies, and crunchy roasted cashews.',
        price: 340,
        category: 'Main Course',
        isVegetarian: false,
        preparationTimeMinutes: 20,
        imageUrl: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Crispy Spring Rolls with Sweet Plum Dip',
        description: 'Golden fried vegetable rolls stuffed with glass noodles, cabbage, and shredded wood ear mushrooms.',
        price: 180,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 12,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Hong Kong Mango Sago Pomelo',
        description: 'Chilled sweet mango puree with soft tapioca pearls and juicy ruby pomelo flakes.',
        price: 150,
        category: 'Desserts',
        isVegetarian: true,
        preparationTimeMinutes: 10,
        imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    name: 'Saffron Royal Biryani & Kebabs',
    description: 'Heritage slow-cooked Dum pukht biryanis, melt-in-mouth seekh kebabs, and rich Mughlai curries.',
    cuisine: ['Mughlai', 'Biryani', 'North Indian', 'Kebabs'],
    address: { street: '24 Nizam Road, Old Palace Enclave', city: 'Metro Hub', state: 'Central', postalCode: '400002' },
    phone: '+91 9811223344',
    isOpen: true,
    rating: 4.9,
    totalReviews: 342,
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    dishes: [
      {
        name: 'Royal Awadhi Dum Mutton Biryani',
        description: 'Fragrant long-grain aged Basmati rice layered with succulent goat meat, saffron milk, and fried onions.',
        price: 480,
        category: 'Main Course',
        isVegetarian: false,
        preparationTimeMinutes: 30,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Nizami Shahi Paneer Biryani',
        description: 'Slow clay-pot dum biryani with marinated cottage cheese cubes, whole spices, and mint leaves.',
        price: 320,
        category: 'Main Course',
        isVegetarian: true,
        preparationTimeMinutes: 25,
        imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Galouti Kebab with Sheermal',
        description: 'Legendary melt-in-the-mouth smoked minced patties infused with 32 rare royal spices.',
        price: 380,
        category: 'Starters',
        isVegetarian: false,
        preparationTimeMinutes: 20,
        imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Paneer Tikka Angara',
        description: 'Charcoal grilled cottage cheese chunks glazed with yogurt, mustard oil, and kashmiri deghi mirch.',
        price: 270,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 18,
        imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Kesari Shahi Phirni',
        description: 'Chilled ground rice pudding cooked with whole milk, saffron strands, pistachios, and silver leaf.',
        price: 130,
        category: 'Desserts',
        isVegetarian: true,
        preparationTimeMinutes: 10,
        imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    name: 'Bella Napoli Woodfired Pizza',
    description: 'Authentic 72-hour cold fermented Neapolitan pizzas blistered in a 480°C Italian stone oven.',
    cuisine: ['Italian', 'Pizza', 'Pasta', 'European'],
    address: { street: '7 Piazza Venezia, Galleria District', city: 'Metro Hub', state: 'Central', postalCode: '400004' },
    phone: '+91 9844332211',
    isOpen: true,
    rating: 4.8,
    totalReviews: 189,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    dishes: [
      {
        name: 'Pizza Margherita D.O.P.',
        description: 'San Marzano tomato sauce, fresh buffalo mozzarella, fragrant Genovese basil, and extra virgin olive oil.',
        price: 360,
        category: 'Main Course',
        isVegetarian: true,
        preparationTimeMinutes: 18,
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Spicy Pepperoni & Hot Honey Pizza',
        description: 'Handcrafted beef and lamb pepperoni slices, fresh fior di latte, and house chili wildflower hot honey.',
        price: 460,
        category: 'Main Course',
        isVegetarian: false,
        preparationTimeMinutes: 20,
        imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Burrata Caprese Bruschetta',
        description: 'Toasted sourdough ciabatta topped with creamy pugliese burrata, heirloom tomatoes, and aged balsamic glaze.',
        price: 270,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 12,
        imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Crispy Truffle Parmesan Fries',
        description: 'Skin-on hand cut fries drizzled with white truffle oil and dusted with 24-month aged Parmigiano-Reggiano.',
        price: 190,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 12,
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Traditional Venetian Tiramisu',
        description: 'Savoiardi ladyfingers soaked in dark espresso and marsala, layered with whipped mascarpone zabaione.',
        price: 210,
        category: 'Desserts',
        isVegetarian: true,
        preparationTimeMinutes: 10,
        imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    name: 'Tokyo Ramen & Bento Bar',
    description: 'Hearty 14-hour simmered Tonkotsu broths, crunchy Chicken Katsu, and handcrafted gyoza dumplings.',
    cuisine: ['Japanese', 'Ramen', 'Sushi', 'Bento'],
    address: { street: '45 Shibuya Corner, Little Tokyo', city: 'Metro Hub', state: 'Central', postalCode: '400003' },
    phone: '+91 9822334455',
    isOpen: true,
    rating: 4.9,
    totalReviews: 290,
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    dishes: [
      {
        name: 'Rich Miso Tonkotsu Ramen',
        description: 'Silky rich broth with springy noodles, braised chashu, nitamago soft egg, nori, and bamboo menma.',
        price: 420,
        category: 'Main Course',
        isVegetarian: false,
        preparationTimeMinutes: 20,
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Crispy Chicken Katsu Curry Bento',
        description: 'Golden panko crusted chicken breast served with sweet Japanese curry sauce, sticky sushi rice, and pickled daikon.',
        price: 360,
        category: 'Main Course',
        isVegetarian: false,
        preparationTimeMinutes: 22,
        imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Pan-Fried Chicken Gyoza (6 pcs)',
        description: 'Crispy bottom Japanese potstickers stuffed with minced chicken, cabbage, ginger, and sesame scallion dip.',
        price: 220,
        category: 'Starters',
        isVegetarian: false,
        preparationTimeMinutes: 15,
        imageUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Steamed Salted Edamame Pods',
        description: 'Young tender whole soybeans steamed with roasted sea salt crystals and chili flakes.',
        price: 140,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 8,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Matcha Green Tea Japanese Mochi Ice Cream',
        description: 'Chewy sweet rice cake skin enclosing creamy Uji Kyoto matcha gelato.',
        price: 160,
        category: 'Desserts',
        isVegetarian: true,
        preparationTimeMinutes: 8,
        imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    name: 'El Fuego Taqueria & Cantina',
    description: 'Vibrant Mexican street cuisine with slow-braised birria tacos, loaded guacamole, and sizzling fajitas.',
    cuisine: ['Mexican', 'Tacos', 'Burritos', 'Street Food'],
    address: { street: '16 Sonora Strip, Sunset Boulevard', city: 'Metro Hub', state: 'Central', postalCode: '400005' },
    phone: '+91 9833445566',
    isOpen: true,
    rating: 4.7,
    totalReviews: 174,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    dishes: [
      {
        name: 'Slow Braised Birria QuesaTacos (3 pcs)',
        description: 'Corn tortillas crisped in chili oil with melted cheese, tender shredded beef, fresh cilantro, onions, and dipping consommé.',
        price: 390,
        category: 'Main Course',
        isVegetarian: false,
        preparationTimeMinutes: 20,
        imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Charred Fajita Burrito Bowl',
        description: 'Mexican lime rice, black beans, grilled bell peppers, guacamole, pico de gallo, and sour cream crema.',
        price: 270,
        category: 'Healthy Bowls',
        isVegetarian: true,
        preparationTimeMinutes: 15,
        imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Molcajete Guacamole & Tortilla Chips',
        description: 'Freshly mashed Haas avocado, serrano peppers, lime juice, cilantro, served with warm house-fried corn chips.',
        price: 210,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 10,
        imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Grilled Chipotle Chicken Quesadilla',
        description: 'Flour tortilla stuffed with chipotle shredded chicken, monterey jack cheese, and roasted corn relish.',
        price: 290,
        category: 'Starters',
        isVegetarian: false,
        preparationTimeMinutes: 15,
        imageUrl: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Crispy Cinnamon Sugar Churros',
        description: 'Golden fried Mexican pastry loops dusted with cinnamon and served with warm dulce de leche dip.',
        price: 160,
        category: 'Desserts',
        isVegetarian: true,
        preparationTimeMinutes: 12,
        imageUrl: 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    name: 'The Burger Foundry & Shake Bar',
    description: 'Smash burgers pressed on hot chrome griddles, buttery toasted brioche, and thick artisanal milkshakes.',
    cuisine: ['Burgers', 'American', 'Fast Food', 'Shakes'],
    address: { street: '33 Ironworks Avenue, Central Market', city: 'Metro Hub', state: 'Central', postalCode: '400001' },
    phone: '+91 9855667788',
    isOpen: true,
    rating: 4.8,
    totalReviews: 260,
    imageUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
    dishes: [
      {
        name: 'Double Truffle Smash Beef Burger',
        description: 'Two smashed prime beef patties with melted aged cheddar, caramelized shallots, and house truffle mayo on toasted brioche.',
        price: 360,
        category: 'Main Course',
        isVegetarian: false,
        preparationTimeMinutes: 18,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Crispy Nashville Hot Chicken Burger',
        description: 'Buttermilk fried chicken breast dipped in spiced cayenne oil with house slaw and dill pickles.',
        price: 310,
        category: 'Main Course',
        isVegetarian: false,
        preparationTimeMinutes: 18,
        imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Crispy Halloumi & Portobello Veg Burger',
        description: 'Thick grilled halloumi slice, roasted balsamic portobello cap, baby spinach, and chipotle aioli.',
        price: 290,
        category: 'Main Course',
        isVegetarian: true,
        preparationTimeMinutes: 15,
        imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Crispy Golden Onion Rings & Secret Dip',
        description: 'Jumbo sweet onions beer-battered and fried until crisp, served with our signature smoky burger sauce.',
        price: 150,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 12,
        imageUrl: 'https://images.unsplash.com/photo-1639024471285-05c7426e2e50?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Salted Caramel Crunch Thickshake',
        description: 'Churned vanilla soft serve blended with sea-salt butter caramel, crushed pretzels, and whipped cream.',
        price: 180,
        category: 'Beverages',
        isVegetarian: true,
        preparationTimeMinutes: 8,
        imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    name: 'Madras Spices & Dosa Bhavan',
    description: 'Crispy paper ghee roasts, fluffy steamed idlis, spicy Chettinad curries, and authentic filter kaapi.',
    cuisine: ['South Indian', 'Chettinad', 'Dosa', 'Pure Veg'],
    address: { street: '5 Temple Road, Heritage Quarter', city: 'Metro Hub', state: 'Central', postalCode: '400006' },
    phone: '+91 9866778899',
    isOpen: true,
    rating: 4.9,
    totalReviews: 410,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80',
    dishes: [
      {
        name: 'Special Mysore Ghee Masala Dosa',
        description: 'Golden fermented crepe smeared with spicy red garlic chutney, spiced potato mash, served with 3 chutneys & sambar.',
        price: 170,
        category: 'Main Course',
        isVegetarian: true,
        preparationTimeMinutes: 15,
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Guntur Spicy Paneer Dosa',
        description: 'Extra crisp dosa loaded with spicy grated Andhra cottage cheese and roasted cumin.',
        price: 210,
        category: 'Main Course',
        isVegetarian: true,
        preparationTimeMinutes: 15,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Crispy Medu Vada Sambar (2 pcs)',
        description: 'Crunchy golden lentil donuts dunked in piping hot drumstick sambar with coconut chutney.',
        price: 110,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 10,
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Mini Ghee Podi Idlis (14 pcs)',
        description: 'Bite-sized steamed rice cakes tossed in aromatic gun powder podi and hot clarified butter.',
        price: 140,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 10,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Traditional Kumbakonam Degree Filter Kaapi',
        description: 'Rich frothy South Indian chicory blend coffee served piping hot in traditional brass davarah.',
        price: 65,
        category: 'Beverages',
        isVegetarian: true,
        preparationTimeMinutes: 5,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    name: 'Green Oasis Mezze & Falafel House',
    description: 'Fresh Mediterranean healthy bowls, creamy tahini hummus, herb falafel wraps, and wood-oven pitas.',
    cuisine: ['Mediterranean', 'Lebanese', 'Healthy Bowls', 'Vegan'],
    address: { street: '9 Cedar Walk, Green Park Boulevard', city: 'Metro Hub', state: 'Central', postalCode: '400007' },
    phone: '+91 9877889900',
    isOpen: true,
    rating: 4.8,
    totalReviews: 165,
    imageUrl: 'https://images.unsplash.com/photo-1540914124281-342587941389?auto=format&fit=crop&w=1200&q=80',
    dishes: [
      {
        name: 'Signature Grand Mezze Platter',
        description: 'Silky chickpea hummus, smoked baba ganoush, crispy falafel, tabbouleh, stuffed vine leaves, and warm pita.',
        price: 340,
        category: 'Main Course',
        isVegetarian: true,
        preparationTimeMinutes: 18,
        imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Spiced Chicken Shawarma Rice Bowl',
        description: 'Marinated roasted chicken thighs over fragrant turmeric rice with garlic toum sauce and pickled turnips.',
        price: 310,
        category: 'Main Course',
        isVegetarian: false,
        preparationTimeMinutes: 20,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Golden Herb Falafel with Garlic Tahini (6 pcs)',
        description: 'Crunchy chickpea patties blended with coriander, parsley, cumin, and served with velvety tahini.',
        price: 180,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 12,
        imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Crispy Halloumi Fries with Pomegranate Molasses',
        description: 'Golden fried Cypriot sheep cheese batons dusted with zaatar and drizzled with tart pomegranate glaze.',
        price: 240,
        category: 'Starters',
        isVegetarian: true,
        preparationTimeMinutes: 12,
        imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Pistachio Honey Baklava (3 pcs)',
        description: 'Crisp layers of delicate filo pastry drenched in honey blossom syrup and crushed Antep pistachios.',
        price: 160,
        category: 'Desserts',
        isVegetarian: true,
        preparationTimeMinutes: 8,
        imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    name: 'Sweet Haven Bakery & Patisserie',
    description: 'French viennoiserie, buttery layered croissants, specialty roasted coffees, and decadent entremets.',
    cuisine: ['Bakery', 'Desserts', 'Café', 'Continental'],
    address: { street: '18 Rue Rose, Artisan Lane', city: 'Metro Hub', state: 'Central', postalCode: '400001' },
    phone: '+91 9888990011',
    isOpen: true,
    rating: 4.9,
    totalReviews: 312,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    dishes: [
      {
        name: 'Artisan Almond Croissant Double-Baked',
        description: 'Flaky pure French butter croissant filled with almond frangipane cream and topped with toasted almond flakes.',
        price: 180,
        category: 'Bakery',
        isVegetarian: true,
        preparationTimeMinutes: 10,
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Basque Burnt Cheesecake Slice',
        description: 'Caramelized crust with an ultra-creamy, custard-like molten center made with Spanish cream cheese.',
        price: 220,
        category: 'Desserts',
        isVegetarian: true,
        preparationTimeMinutes: 10,
        imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Pain au Chocolat (2 pcs)',
        description: 'Golden puff pastry folds baked with two batons of Belgian semi-sweet dark chocolate.',
        price: 170,
        category: 'Bakery',
        isVegetarian: true,
        preparationTimeMinutes: 10,
        imageUrl: 'https://images.unsplash.com/photo-1549903072-7e6e0bedb7fb?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Avocado Sourdough Toast with Poached Eggs',
        description: 'Toasted artisanal levain sourdough topped with crushed lemon avocado, feta, microgreens, and runny eggs.',
        price: 260,
        category: 'Main Course',
        isVegetarian: false,
        preparationTimeMinutes: 15,
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Single Origin Iced Caramel Macchiato',
        description: 'Freshly pulled double shot of espresso over whole milk, vanilla bean syrup, and sea salt caramel drizzle.',
        price: 150,
        category: 'Beverages',
        isVegetarian: true,
        preparationTimeMinutes: 8,
        imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80'
      }
    ]
  }
];

async function seed10Restaurants() {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected.');

    // Find or create default owner
    let owner = await User.findOne({ email: 'owner@foodie.local' });
    if (!owner) {
      console.log('[Seed] Owner not found, looking for any user...');
      owner = await User.findOne({ role: 'RESTAURANT_OWNER' });
    }
    if (!owner) {
      console.log('[Seed] Fallback to first user in database...');
      owner = await User.findOne({});
    }

    if (!owner) {
      throw new Error('No owner or user found in DB. Please run seed test users first.');
    }

    console.log(`[Seed] Using owner: ${owner.name} (${owner._id})`);

    let restaurantCount = 0;
    let foodCount = 0;

    for (const rData of RESTAURANTS_DATA) {
      const { dishes, ...restFields } = rData;

      let restaurant = await Restaurant.findOne({ name: restFields.name });
      if (!restaurant) {
        restaurant = await Restaurant.create({
          ...restFields,
          owner: owner._id
        });
        console.log(`[+] Created restaurant: ${restaurant.name}`);
      } else {
        restaurant.description = restFields.description;
        restaurant.cuisine = restFields.cuisine;
        restaurant.address = restFields.address;
        restaurant.phone = restFields.phone;
        restaurant.isOpen = restFields.isOpen;
        restaurant.rating = restFields.rating;
        restaurant.totalReviews = restFields.totalReviews;
        restaurant.imageUrl = restFields.imageUrl;
        await restaurant.save();
        console.log(`[*] Updated restaurant: ${restaurant.name}`);
      }
      restaurantCount++;

      // Seed / update dishes for this restaurant
      for (const dish of dishes) {
        let food = await FoodItem.findOne({
          restaurant: restaurant._id,
          name: dish.name
        });

        if (!food) {
          food = await FoodItem.create({
            ...dish,
            restaurant: restaurant._id,
            isAvailable: true
          });
          console.log(`    + Created dish: ${food.name}`);
        } else {
          food.description = dish.description;
          food.price = dish.price;
          food.category = dish.category;
          food.isVegetarian = dish.isVegetarian;
          food.preparationTimeMinutes = dish.preparationTimeMinutes;
          food.imageUrl = dish.imageUrl;
          food.isAvailable = true;
          await food.save();
          console.log(`    * Updated dish: ${food.name}`);
        }
        foodCount++;
      }
    }

    console.log(`\n[SUCCESS] Successfully seeded/updated ${restaurantCount} restaurants and ${foodCount} HD menu dishes!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed10Restaurants();
