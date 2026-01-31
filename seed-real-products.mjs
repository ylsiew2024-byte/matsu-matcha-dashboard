import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🍵 Updating Matsu Matcha Dashboard with Real Products...\n');

// First, clear existing sample data
console.log('Clearing sample data...');
await connection.execute('DELETE FROM client_orders');
await connection.execute('DELETE FROM demand_forecasts');
await connection.execute('DELETE FROM inventory');
await connection.execute('DELETE FROM pricing');
await connection.execute('DELETE FROM matcha_skus');
await connection.execute('DELETE FROM suppliers');
await connection.execute('DELETE FROM clients');
console.log('✓ Sample data cleared\n');

// Insert Matsu Matcha as the main supplier (since it's their own brand)
console.log('Adding Matsu Matcha supplier...');
await connection.execute(`
  INSERT INTO suppliers (name, contactPerson, email, phone, country, region, paymentTerms, leadTimeDays, rating, notes, isActive)
  VALUES 
    ('Matsu Matcha', 'Matsu Team', 'hello@matsumatcha.com', '+65 9XXX XXXX', 'Japan', 'Uji & Joyo', 'Net 30', 14, 5.0, 'Own brand - Ultra Premium Matcha. 100% handpicked, 40 days shaded, stone milled.', true),
    ('翠華園 Suikaen', 'Suikaen Artisans', 'suikaen@matsumatcha.com', '+81 XXX XXXX', 'Japan', 'Nara', 'Net 30', 21, 5.0, 'Traditional chasen and teaware artisans. Handcrafted bamboo whisks.', true)
`);
console.log('✓ Suppliers added\n');

// Insert real Matsu Matcha products
console.log('Adding Matsu Matcha products...');

// Premium Ceremonial Matcha Series
await connection.execute(`
  INSERT INTO products (name, sku, grade, cultivar, origin, description, weightGrams, isActive)
  VALUES 
    ('Ume 梅', 'MM-UME-30', 'Ceremonial', 'Asahi & Samidori Blend', 'Uji, Kyoto', '100% Hand Picked, 100% First Flush, 40 Days Shaded, Stone Milled. Entry-level premium ceremonial grade.', 30, true),
    ('Cho Ro Sui 朝露翠', 'MM-CRS-30', 'Ceremonial', 'Asahi & Samidori Blend', 'Uji, Kyoto', '100% Hand Picked, 100% First Flush, 40 Days Shaded, Stone Milled. Morning dew emerald - elevated umami.', 30, true),
    ('Saemidori Competition Grade', 'MM-SAEMI-30', 'Competition', 'Saemidori', 'Uji, Kyoto', 'Single cultivar Saemidori. Competition grade with exceptional sweetness and vibrant green color.', 30, true),
    ('Honzu Asahi Competition Grade', 'MM-ASAHI-30', 'Competition', 'Honzu Asahi', 'Uji, Kyoto', 'Single cultivar Honzu Asahi. Traditional shading method (honzu). Rich umami with complex depth.', 30, true),
    ('Najirushi Premium Ceremonial (10g)', 'MM-NAJI-10', 'Ceremonial', 'Najirushi', 'Joyo, Kyoto', 'Premium ceremonial grade. 10g tasting size. Perfect for sampling.', 10, true),
    ('Samidori Competition (10g)', 'MM-SAMI-10', 'Competition', 'Samidori', 'Uji, Kyoto', 'Competition grade Samidori cultivar. 10g tasting size.', 10, true),
    ('Uji Hikari Competition (10g)', 'MM-UJHI-10', 'Competition', 'Uji Hikari', 'Uji, Kyoto', 'Rare Uji Hikari cultivar. Competition grade. 10g tasting size.', 10, true),
    ('Honzu Asahi Competition (10g)', 'MM-ASAHI-10', 'Competition', 'Honzu Asahi', 'Uji, Kyoto', 'Traditional honzu shading. Competition grade. 10g tasting size.', 10, true),
    ('Saemidori Competition (10g)', 'MM-SAEMI-10', 'Competition', 'Saemidori', 'Uji, Kyoto', 'Sweet and vibrant Saemidori. Competition grade. 10g tasting size.', 10, true)
`);

// Matcha Latte Series
await connection.execute(`
  INSERT INTO products (name, sku, grade, cultivar, origin, description, weightGrams, isActive)
  VALUES 
    ('Suisho 翠初 Latte Series 00', 'MM-LATTE-00', 'Latte Grade', 'Blend', 'Uji, Kyoto', 'Entry-level latte grade. Perfect for daily matcha lattes with milk.', 30, true),
    ('Ryokuun 緑雲 Latte Series 01', 'MM-LATTE-01', 'Latte Grade', 'Blend', 'Uji, Kyoto', 'Green cloud - balanced flavor profile for lattes. Smooth and creamy.', 30, true),
    ('Seiha 青波 Latte Series 02', 'MM-LATTE-02', 'Latte Grade', 'Blend', 'Uji, Kyoto', 'Blue wave - more pronounced matcha flavor. Holds up well with oat milk.', 30, true),
    ('Samidori Kun さみどり薫 Latte Series 03', 'MM-LATTE-03', 'Premium Latte', 'Samidori', 'Uji, Kyoto', 'Single cultivar Samidori for lattes. Premium latte experience.', 30, true)
`);

// Cultivar Blending Experience Set
await connection.execute(`
  INSERT INTO products (name, sku, grade, cultivar, origin, description, weightGrams, isActive)
  VALUES 
    ('Cultivar Blending Set (5 Cultivars)', 'MM-BLEND-SET', 'Competition', 'Mixed (5 Cultivars)', 'Uji, Kyoto', 'In Harmony & Balance - Set of 5 different cultivars for blending exploration.', 50, true),
    ('The MATSU(RI) Set 祭り', 'MM-MATSURI', 'Mixed', 'Mixed', 'Uji, Kyoto', 'Festival set - curated selection of Matsu Matcha best sellers.', 90, true)
`);

// Teawares (from Suikaen)
await connection.execute(`
  INSERT INTO products (name, sku, grade, cultivar, origin, description, weightGrams, isActive)
  VALUES 
    ('Suikaen Chasen Komorebi 木漏れ日', 'SK-CHASEN-KMB', 'Teaware', 'N/A', 'Nara, Japan', 'Limited Edition bamboo chasen. Komorebi (sunlight through leaves) design.', 0, true),
    ('Suikaen Chasen & Chashaku Bundle', 'SK-BUNDLE-01', 'Teaware', 'N/A', 'Nara, Japan', 'Complete set: bamboo whisk and scoop. Perfect starter kit.', 0, true),
    ('Suikaen Kazuho Chasen Purple Bamboo', 'SK-CHASEN-PB', 'Teaware', 'N/A', 'Nara, Japan', 'Traditional Kazuho style chasen in rare purple bamboo.', 0, true),
    ('Suikaen Chasen Yui 結 Green', 'SK-YUI-GRN', 'Teaware', 'N/A', 'Nara, Japan', 'Yui (connection) series chasen in green.', 0, true),
    ('Suikaen Chasen Yui 結 Navy', 'SK-YUI-NVY', 'Teaware', 'N/A', 'Nara, Japan', 'Yui (connection) series chasen in navy.', 0, true),
    ('Suikaen Chasen Yui 結 Pink', 'SK-YUI-PNK', 'Teaware', 'N/A', 'Nara, Japan', 'Yui (connection) series chasen in pink.', 0, true),
    ('Suikaen Katakuchi Chawan Tomoe 巴 White', 'SK-CHAWAN-WHT', 'Teaware', 'N/A', 'Nara, Japan', 'Glass chawan with pouring spout. Tomoe design in white.', 0, true),
    ('Suikaen Katakuchi Chawan Umi 海 Blue', 'SK-CHAWAN-BLU', 'Teaware', 'N/A', 'Nara, Japan', 'Glass chawan with pouring spout. Umi (sea) design in blue.', 0, true),
    ('Suikaen Katakuchi Chawan Sora 宙 Purple', 'SK-CHAWAN-PRP', 'Teaware', 'N/A', 'Nara, Japan', 'Glass chawan with pouring spout. Sora (sky) design in purple.', 0, true),
    ('Suikaen Shiratake Chashaku', 'SK-CHASHAKU-01', 'Teaware', 'N/A', 'Nara, Japan', 'Traditional bamboo tea scoop. Handcrafted.', 0, true),
    ('Chasen Ring by HitoHuku', 'HH-RING-01', 'Accessory', 'N/A', 'Japan', 'Chasen holder ring. Keeps your whisk in perfect shape.', 0, true)
`);

console.log('✓ Products added\n');

// Get product and supplier IDs
const [products] = await connection.execute('SELECT id, name, sku FROM products');
const [suppliers] = await connection.execute('SELECT id, name FROM suppliers');

const matsuSupplierId = suppliers.find(s => s.name === 'Matsu Matcha').id;
const suikaenSupplierId = suppliers.find(s => s.name === '翠華園 Suikaen').id;

// Add pricing (SGD prices from website, with JPY cost estimates for B2B)
console.log('Adding pricing data...');

const pricingData = [
  // Premium Ceremonial Series
  { sku: 'MM-UME-30', retailSGD: 49.00, costJPY: 2500, supplierId: matsuSupplierId },
  { sku: 'MM-CRS-30', retailSGD: 59.00, costJPY: 3200, supplierId: matsuSupplierId },
  { sku: 'MM-SAEMI-30', retailSGD: 75.00, costJPY: 4500, supplierId: matsuSupplierId },
  { sku: 'MM-ASAHI-30', retailSGD: 89.00, costJPY: 5500, supplierId: matsuSupplierId },
  // 10g Tasting Sizes
  { sku: 'MM-NAJI-10', retailSGD: 37.00, costJPY: 2000, supplierId: matsuSupplierId },
  { sku: 'MM-SAMI-10', retailSGD: 37.00, costJPY: 2000, supplierId: matsuSupplierId },
  { sku: 'MM-UJHI-10', retailSGD: 37.00, costJPY: 2000, supplierId: matsuSupplierId },
  { sku: 'MM-ASAHI-10', retailSGD: 37.00, costJPY: 2000, supplierId: matsuSupplierId },
  { sku: 'MM-SAEMI-10', retailSGD: 37.00, costJPY: 2000, supplierId: matsuSupplierId },
  // Latte Series
  { sku: 'MM-LATTE-00', retailSGD: 25.00, costJPY: 1200, supplierId: matsuSupplierId },
  { sku: 'MM-LATTE-01', retailSGD: 35.00, costJPY: 1800, supplierId: matsuSupplierId },
  { sku: 'MM-LATTE-02', retailSGD: 39.00, costJPY: 2100, supplierId: matsuSupplierId },
  { sku: 'MM-LATTE-03', retailSGD: 55.00, costJPY: 3000, supplierId: matsuSupplierId },
  // Sets
  { sku: 'MM-BLEND-SET', retailSGD: 175.00, costJPY: 9500, supplierId: matsuSupplierId },
  { sku: 'MM-MATSURI', retailSGD: 199.00, costJPY: 11000, supplierId: matsuSupplierId },
  // Teawares (Suikaen)
  { sku: 'SK-CHASEN-KMB', retailSGD: 169.00, costJPY: 9000, supplierId: suikaenSupplierId },
  { sku: 'SK-BUNDLE-01', retailSGD: 127.00, costJPY: 6500, supplierId: suikaenSupplierId },
  { sku: 'SK-CHASEN-PB', retailSGD: 95.00, costJPY: 5000, supplierId: suikaenSupplierId },
  { sku: 'SK-YUI-GRN', retailSGD: 150.00, costJPY: 8000, supplierId: suikaenSupplierId },
  { sku: 'SK-YUI-NVY', retailSGD: 150.00, costJPY: 8000, supplierId: suikaenSupplierId },
  { sku: 'SK-YUI-PNK', retailSGD: 150.00, costJPY: 8000, supplierId: suikaenSupplierId },
  { sku: 'SK-CHAWAN-WHT', retailSGD: 220.00, costJPY: 12000, supplierId: suikaenSupplierId },
  { sku: 'SK-CHAWAN-BLU', retailSGD: 220.00, costJPY: 12000, supplierId: suikaenSupplierId },
  { sku: 'SK-CHAWAN-PRP', retailSGD: 250.00, costJPY: 14000, supplierId: suikaenSupplierId },
  { sku: 'SK-CHASHAKU-01', retailSGD: 35.00, costJPY: 1800, supplierId: suikaenSupplierId },
  { sku: 'HH-RING-01', retailSGD: 45.00, costJPY: 2200, supplierId: suikaenSupplierId },
];

const exchangeRate = 0.0088; // JPY to SGD (approximate)
const shippingPerUnit = 2.50; // SGD
const importTaxRate = 0.07; // 7% GST

for (const item of pricingData) {
  const product = products.find(p => p.sku === item.sku);
  if (!product) continue;
  
  const costSGD = item.costJPY * exchangeRate;
  const landedCost = costSGD + shippingPerUnit + (costSGD * importTaxRate);
  const margin = ((item.retailSGD - landedCost) / item.retailSGD) * 100;
  
  await connection.execute(`
    INSERT INTO pricing (productId, supplierId, costPriceJpy, exchangeRate, shippingCost, importTax, landedCostSgd, sellingPriceSgd, marginPercent, effectiveDate, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), true)
  `, [product.id, item.supplierId, item.costJPY, exchangeRate, shippingPerUnit, costSGD * importTaxRate, landedCost, item.retailSGD, margin]);
}

console.log('✓ Pricing added\n');

// Add inventory
console.log('Adding inventory data...');

const inventoryData = [
  // Available products
  { sku: 'MM-UME-30', qty: 50, allocated: 15, status: 'in_stock' },
  { sku: 'MM-CRS-30', qty: 35, allocated: 10, status: 'in_stock' },
  { sku: 'MM-SAEMI-30', qty: 25, allocated: 8, status: 'in_stock' },
  { sku: 'MM-ASAHI-30', qty: 20, allocated: 5, status: 'in_stock' },
  // 10g sizes - limited stock
  { sku: 'MM-NAJI-10', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'MM-SAMI-10', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'MM-UJHI-10', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'MM-ASAHI-10', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'MM-SAEMI-10', qty: 0, allocated: 0, status: 'out_of_stock' },
  // Latte Series
  { sku: 'MM-LATTE-00', qty: 80, allocated: 25, status: 'in_stock' },
  { sku: 'MM-LATTE-01', qty: 45, allocated: 15, status: 'in_stock' },
  { sku: 'MM-LATTE-02', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'MM-LATTE-03', qty: 0, allocated: 0, status: 'out_of_stock' },
  // Sets
  { sku: 'MM-BLEND-SET', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'MM-MATSURI', qty: 0, allocated: 0, status: 'out_of_stock' },
  // Teawares
  { sku: 'SK-CHASEN-KMB', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'SK-BUNDLE-01', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'SK-CHASEN-PB', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'SK-YUI-GRN', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'SK-YUI-NVY', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'SK-YUI-PNK', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'SK-CHAWAN-WHT', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'SK-CHAWAN-BLU', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'SK-CHAWAN-PRP', qty: 0, allocated: 0, status: 'out_of_stock' },
  { sku: 'SK-CHASHAKU-01', qty: 12, allocated: 3, status: 'in_stock' },
  { sku: 'HH-RING-01', qty: 30, allocated: 5, status: 'in_stock' },
];

for (const item of inventoryData) {
  const product = products.find(p => p.sku === item.sku);
  if (!product) continue;
  
  const lowStockThreshold = item.sku.includes('LATTE') ? 20 : 10;
  
  await connection.execute(`
    INSERT INTO inventory (productId, supplierId, quantityKg, allocatedKg, lowStockThreshold, status, lastUpdated)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `, [product.id, matsuSupplierId, item.qty, item.allocated, lowStockThreshold, item.status]);
}

console.log('✓ Inventory added\n');

// Add B2B clients (Singapore cafes and restaurants)
console.log('Adding B2B clients...');

await connection.execute(`
  INSERT INTO clients (name, contactPerson, email, phone, address, businessType, paymentTerms, creditLimit, notes, isActive)
  VALUES 
    ('Nana\\'s Green Tea Singapore', 'Operations Team', 'sg@nanas-greentea.com', '+65 6XXX XXXX', 'Jewel Changi Airport', 'Cafe Chain', 'Net 30', 15000.00, 'Japanese cafe chain. High volume matcha latte orders.', true),
    ('Common Man Coffee Roasters', 'Purchasing Manager', 'orders@commonmancoffee.com', '+65 6XXX XXXX', 'Martin Road', 'Specialty Cafe', 'Net 15', 8000.00, 'Premium specialty cafe. Interested in competition grade.', true),
    ('PS.Cafe', 'F&B Director', 'fnb@pscafe.com', '+65 6XXX XXXX', 'Dempsey Hill', 'Restaurant Group', 'Net 30', 20000.00, 'Upscale cafe group. Multiple outlets.', true),
    ('Plain Vanilla Bakery', 'Owner', 'hello@plainvanilla.com.sg', '+65 9XXX XXXX', 'Tiong Bahru', 'Bakery', 'Net 15', 5000.00, 'Artisan bakery. Uses matcha for pastries.', true),
    ('Hvala', 'Head Chef', 'team@hvala.com.sg', '+65 6XXX XXXX', 'Chijmes', 'Japanese Cafe', 'Net 30', 12000.00, 'Japanese-inspired cafe. Premium matcha focus.', true),
    ('The Halia', 'Executive Chef', 'reservations@thehalia.com', '+65 6XXX XXXX', 'Singapore Botanic Gardens', 'Fine Dining', 'Net 30', 10000.00, 'Fine dining restaurant. Matcha desserts.', true),
    ('Matchaya', 'Founder', 'hello@matchaya.sg', '+65 9XXX XXXX', 'Bugis', 'Matcha Specialty', 'Net 15', 8000.00, 'Dedicated matcha cafe. High volume.', true),
    ('Kki Sweets', 'Pastry Chef', 'orders@kkisweets.com', '+65 6XXX XXXX', 'Millenia Walk', 'Patisserie', 'Net 15', 6000.00, 'Japanese-style patisserie. Premium ingredients.', true)
`);

console.log('✓ B2B clients added\n');

// Get client IDs
const [clients] = await connection.execute('SELECT id, name FROM clients');

// Add some sample orders
console.log('Adding sample orders...');

const orderData = [
  { clientName: 'Nana\'s Green Tea Singapore', sku: 'MM-LATTE-01', qty: 20, status: 'delivered' },
  { clientName: 'Nana\'s Green Tea Singapore', sku: 'MM-LATTE-00', qty: 30, status: 'delivered' },
  { clientName: 'Common Man Coffee Roasters', sku: 'MM-SAEMI-30', qty: 5, status: 'processing' },
  { clientName: 'PS.Cafe', sku: 'MM-UME-30', qty: 15, status: 'delivered' },
  { clientName: 'Plain Vanilla Bakery', sku: 'MM-LATTE-01', qty: 8, status: 'shipped' },
  { clientName: 'Hvala', sku: 'MM-CRS-30', qty: 10, status: 'delivered' },
  { clientName: 'Hvala', sku: 'MM-ASAHI-30', qty: 5, status: 'processing' },
  { clientName: 'The Halia', sku: 'MM-SAEMI-30', qty: 3, status: 'pending' },
  { clientName: 'Matchaya', sku: 'MM-LATTE-00', qty: 25, status: 'delivered' },
  { clientName: 'Matchaya', sku: 'MM-UME-30', qty: 10, status: 'shipped' },
  { clientName: 'Kki Sweets', sku: 'MM-CRS-30', qty: 5, status: 'delivered' },
];

for (const order of orderData) {
  const client = clients.find(c => c.name === order.clientName);
  const product = products.find(p => p.sku === order.sku);
  if (!client || !product) continue;
  
  // Get pricing for this product
  const [[pricing]] = await connection.execute('SELECT sellingPriceSgd FROM pricing WHERE productId = ? LIMIT 1', [product.id]);
  const totalAmount = pricing ? pricing.sellingPriceSgd * order.qty : 0;
  
  await connection.execute(`
    INSERT INTO client_orders (clientId, productId, quantityKg, unitPrice, totalAmount, status, orderDate, deliveryDate, notes)
    VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), ?)
  `, [client.id, product.id, order.qty, pricing?.sellingPriceSgd || 0, totalAmount, order.status, `Order for ${product.name}`]);
}

console.log('✓ Orders added\n');

// Add demand forecasts
console.log('Adding demand forecasts...');

const forecastProducts = products.filter(p => p.sku.startsWith('MM-'));
for (const product of forecastProducts) {
  const client = clients[Math.floor(Math.random() * clients.length)];
  const projectedDemand = Math.floor(Math.random() * 30) + 5;
  const confidence = Math.floor(Math.random() * 30) + 70;
  
  await connection.execute(`
    INSERT INTO demand_forecasts (productId, clientId, forecastMonth, projectedDemandKg, confidenceLevel, notes)
    VALUES (?, ?, DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 MONTH), '%Y-%m-01'), ?, ?, 'AI-generated forecast based on historical patterns')
  `, [product.id, client.id, projectedDemand, confidence]);
}

console.log('✓ Demand forecasts added\n');

// Add notifications
console.log('Adding notifications...');

await connection.execute(`
  INSERT INTO notifications (title, message, type, severity, isRead, createdAt)
  VALUES 
    ('Low Stock Alert: 10g Tasting Sizes', 'All 10g tasting size products are out of stock. Consider reordering from supplier.', 'inventory', 'high', false, NOW()),
    ('New B2B Order: Nana\\'s Green Tea', 'Large order received for Ryokuun Latte Series. 20 units.', 'order', 'medium', false, DATE_SUB(NOW(), INTERVAL 1 DAY)),
    ('Suikaen Teawares Restocking', 'Most Suikaen teawares are currently out of stock. Next shipment expected in 3 weeks.', 'inventory', 'medium', false, DATE_SUB(NOW(), INTERVAL 2 DAY)),
    ('High Demand: Matcha Latte Series', 'Latte series products showing 40% increase in demand. Consider increasing stock levels.', 'forecast', 'medium', true, DATE_SUB(NOW(), INTERVAL 5 DAY)),
    ('Exchange Rate Update', 'JPY/SGD exchange rate has shifted. Review pricing margins.', 'pricing', 'low', true, DATE_SUB(NOW(), INTERVAL 7 DAY))
`);

console.log('✓ Notifications added\n');

console.log('🍵 Matsu Matcha Dashboard updated with real product data!');
console.log('');
console.log('Summary:');
console.log('- 2 Suppliers (Matsu Matcha, Suikaen)');
console.log('- 26 Products (Ceremonial, Competition, Latte, Teawares)');
console.log('- 8 B2B Clients (Singapore cafes & restaurants)');
console.log('- 11 Sample Orders');
console.log('- Pricing with margin calculations');
console.log('- Inventory with stock status');
console.log('');

await connection.end();
