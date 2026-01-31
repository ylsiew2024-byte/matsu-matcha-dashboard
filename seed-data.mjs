import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Starting seed process...");
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);
  
  try {
    // ============================================
    // SUPPLIERS - Japanese Matcha Farms
    // ============================================
    console.log("📦 Adding suppliers...");
    
    const suppliersData = [
      {
        name: "Marukyu Koyamaen",
        country: "Japan",
        region: "Uji, Kyoto",
        contactName: "Tanaka Hiroshi",
        contactEmail: "tanaka@marukyu.jp",
        contactPhone: "+81-774-20-0909",
        leadTimeDays: 21,
        orderCadenceDays: 30,
        notes: "Premium ceremonial grade specialist. Established 1688.",
        isActive: true,
      },
      {
        name: "Aiya Matcha",
        country: "Japan",
        region: "Nishio, Aichi",
        contactName: "Yamamoto Kenji",
        contactEmail: "yamamoto@aiya.co.jp",
        contactPhone: "+81-563-56-2222",
        leadTimeDays: 28,
        orderCadenceDays: 45,
        notes: "Largest matcha producer in Nishio. Good for bulk orders.",
        isActive: true,
      },
      {
        name: "Ippodo Tea Co.",
        country: "Japan",
        region: "Kyoto",
        contactName: "Suzuki Yuki",
        contactEmail: "suzuki@ippodo-tea.co.jp",
        contactPhone: "+81-75-211-3421",
        leadTimeDays: 25,
        orderCadenceDays: 60,
        notes: "300+ year history. Premium quality, higher prices.",
        isActive: true,
      },
      {
        name: "Kagoshima Green Tea Co.",
        country: "Japan",
        region: "Kagoshima",
        contactName: "Watanabe Akiko",
        contactEmail: "watanabe@kagoshima-tea.jp",
        contactPhone: "+81-99-226-1234",
        leadTimeDays: 30,
        orderCadenceDays: 45,
        notes: "Southern Japan producer. Good value culinary grade.",
        isActive: true,
      },
    ];
    
    for (const supplier of suppliersData) {
      await connection.execute(
        `INSERT INTO suppliers (name, country, region, contactName, contactEmail, contactPhone, leadTimeDays, orderCadenceDays, notes, isActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [supplier.name, supplier.country, supplier.region, supplier.contactName, supplier.contactEmail, supplier.contactPhone, supplier.leadTimeDays, supplier.orderCadenceDays, supplier.notes, supplier.isActive]
      );
    }
    console.log(`✅ Added ${suppliersData.length} suppliers`);
    
    // ============================================
    // MATCHA SKUs
    // ============================================
    console.log("🍵 Adding matcha SKUs...");
    
    const skusData = [
      // Marukyu Koyamaen (supplierId: 1)
      { supplierId: 1, name: "Aoarashi Ceremonial", grade: "ceremonial", qualityTier: 5, isSeasonal: false, description: "Top-tier ceremonial grade, vibrant green color, smooth umami" },
      { supplierId: 1, name: "Kiri no Mori Premium", grade: "premium", qualityTier: 4, isSeasonal: false, description: "Excellent for daily drinking, balanced flavor" },
      { supplierId: 1, name: "Uji Culinary Blend", grade: "culinary", qualityTier: 3, isSeasonal: false, description: "Perfect for lattes and baking" },
      
      // Aiya (supplierId: 2)
      { supplierId: 2, name: "Nishio Supreme", grade: "ceremonial", qualityTier: 5, isSeasonal: true, harvestSeason: "spring", description: "First harvest spring matcha, limited availability" },
      { supplierId: 2, name: "Nishio Premium", grade: "premium", qualityTier: 4, isSeasonal: false, description: "Reliable quality for cafes" },
      { supplierId: 2, name: "Nishio Culinary", grade: "culinary", qualityTier: 3, isSeasonal: false, description: "Bulk culinary grade, great value" },
      { supplierId: 2, name: "Food Grade Matcha", grade: "food_grade", qualityTier: 2, isSeasonal: false, description: "For industrial food production" },
      
      // Ippodo (supplierId: 3)
      { supplierId: 3, name: "Ummon-no-Mukashi", grade: "ceremonial", qualityTier: 5, isSeasonal: false, description: "Ultra-premium, for tea ceremonies" },
      { supplierId: 3, name: "Kan-no-Shiro", grade: "premium", qualityTier: 4, isSeasonal: false, description: "Premium daily matcha" },
      
      // Kagoshima (supplierId: 4)
      { supplierId: 4, name: "Kagoshima Organic", grade: "culinary", qualityTier: 3, isSeasonal: false, description: "JAS Organic certified, clean taste" },
      { supplierId: 4, name: "Kagoshima Value", grade: "food_grade", qualityTier: 2, isSeasonal: false, description: "Budget-friendly for high-volume use" },
    ];
    
    for (const sku of skusData) {
      await connection.execute(
        `INSERT INTO matcha_skus (supplierId, name, grade, qualityTier, isSeasonal, harvestSeason, description, isActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
        [sku.supplierId, sku.name, sku.grade, sku.qualityTier, sku.isSeasonal, sku.harvestSeason || null, sku.description]
      );
    }
    console.log(`✅ Added ${skusData.length} matcha SKUs`);
    
    // ============================================
    // CLIENTS - B2B Cafe & Restaurant Clients
    // ============================================
    console.log("👥 Adding clients...");
    
    const clientsData = [
      { name: "Nana's Green Tea", businessType: "cafe", contactName: "Chen Wei Lin", contactEmail: "wei@nanasgreentea.sg", contactPhone: "+65-9123-4567", address: "313 Somerset, #02-15, Singapore 238895", specialDiscount: "5.00", paymentTerms: "NET30", notes: "Large chain, monthly orders 50kg+" },
      { name: "The Coffee Bean & Tea Leaf", businessType: "cafe", contactName: "Sarah Tan", contactEmail: "sarah.tan@coffeebean.sg", contactPhone: "+65-9234-5678", address: "Multiple locations", specialDiscount: "7.50", paymentTerms: "NET45", notes: "Corporate account, premium products only" },
      { name: "Tsujiri Singapore", businessType: "cafe", contactName: "Yamada Takeshi", contactEmail: "takeshi@tsujiri.sg", contactPhone: "+65-9345-6789", address: "ION Orchard, #B4-25", specialDiscount: "3.00", paymentTerms: "NET30", notes: "Japanese-owned, ceremonial grade focus" },
      { name: "Matchaya", businessType: "cafe", contactName: "Lim Mei Ling", contactEmail: "meiling@matchaya.sg", contactPhone: "+65-9456-7890", address: "111 Somerset Road, #01-02", specialDiscount: "0.00", paymentTerms: "COD", notes: "New client, testing relationship" },
      { name: "Artisan Boulangerie", businessType: "bakery", contactName: "Pierre Dubois", contactEmail: "pierre@artisanboulangerie.sg", contactPhone: "+65-9567-8901", address: "Tanglin Mall, #01-15", specialDiscount: "2.50", paymentTerms: "NET30", notes: "Culinary grade for pastries" },
      { name: "Kyo Matcha Bar", businessType: "restaurant", contactName: "Nakamura Yuki", contactEmail: "yuki@kyomatchabar.sg", contactPhone: "+65-9678-9012", address: "Tanjong Pagar, #01-08", specialDiscount: "4.00", paymentTerms: "NET30", notes: "High-end Japanese restaurant" },
      { name: "Gelato Factory", businessType: "manufacturer", contactName: "Marco Rossi", contactEmail: "marco@gelatofactory.sg", contactPhone: "+65-9789-0123", address: "Woodlands Industrial", specialDiscount: "10.00", paymentTerms: "NET60", notes: "Bulk food grade for ice cream production" },
    ];
    
    for (const client of clientsData) {
      await connection.execute(
        `INSERT INTO clients (name, businessType, contactName, contactEmail, contactPhone, address, specialDiscount, paymentTerms, notes, isActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
        [client.name, client.businessType, client.contactName, client.contactEmail, client.contactPhone, client.address, client.specialDiscount, client.paymentTerms, client.notes]
      );
    }
    console.log(`✅ Added ${clientsData.length} clients`);
    
    // ============================================
    // PRICING
    // ============================================
    console.log("💰 Adding pricing...");
    
    const pricingData = [
      // Marukyu Koyamaen products
      { skuId: 1, costPriceJpy: "28000", exchangeRate: "110.50", shippingFeePerKg: "18.00", importTaxRate: "0.09", sellingPricePerKg: "380.00" }, // Aoarashi Ceremonial
      { skuId: 2, costPriceJpy: "18000", exchangeRate: "110.50", shippingFeePerKg: "15.00", importTaxRate: "0.09", sellingPricePerKg: "260.00" }, // Kiri no Mori
      { skuId: 3, costPriceJpy: "8000", exchangeRate: "110.50", shippingFeePerKg: "12.00", importTaxRate: "0.09", sellingPricePerKg: "120.00" }, // Uji Culinary
      
      // Aiya products
      { skuId: 4, costPriceJpy: "32000", exchangeRate: "110.50", shippingFeePerKg: "18.00", importTaxRate: "0.09", sellingPricePerKg: "420.00" }, // Nishio Supreme
      { skuId: 5, costPriceJpy: "16000", exchangeRate: "110.50", shippingFeePerKg: "15.00", importTaxRate: "0.09", sellingPricePerKg: "240.00" }, // Nishio Premium
      { skuId: 6, costPriceJpy: "7500", exchangeRate: "110.50", shippingFeePerKg: "12.00", importTaxRate: "0.09", sellingPricePerKg: "110.00" }, // Nishio Culinary
      { skuId: 7, costPriceJpy: "4000", exchangeRate: "110.50", shippingFeePerKg: "10.00", importTaxRate: "0.09", sellingPricePerKg: "65.00" }, // Food Grade
      
      // Ippodo products
      { skuId: 8, costPriceJpy: "45000", exchangeRate: "110.50", shippingFeePerKg: "20.00", importTaxRate: "0.09", sellingPricePerKg: "580.00" }, // Ummon-no-Mukashi
      { skuId: 9, costPriceJpy: "22000", exchangeRate: "110.50", shippingFeePerKg: "16.00", importTaxRate: "0.09", sellingPricePerKg: "300.00" }, // Kan-no-Shiro
      
      // Kagoshima products
      { skuId: 10, costPriceJpy: "6500", exchangeRate: "110.50", shippingFeePerKg: "12.00", importTaxRate: "0.09", sellingPricePerKg: "95.00" }, // Kagoshima Organic
      { skuId: 11, costPriceJpy: "3500", exchangeRate: "110.50", shippingFeePerKg: "10.00", importTaxRate: "0.09", sellingPricePerKg: "55.00" }, // Kagoshima Value
    ];
    
    for (const price of pricingData) {
      // Calculate landed cost
      const costSgd = parseFloat(price.costPriceJpy) / parseFloat(price.exchangeRate);
      const shipping = parseFloat(price.shippingFeePerKg);
      const tax = parseFloat(price.importTaxRate);
      const landedCost = (costSgd + shipping) * (1 + tax);
      
      await connection.execute(
        `INSERT INTO pricing (skuId, costPriceJpy, exchangeRate, shippingFeePerKg, importTaxRate, landedCostSgd, sellingPricePerKg, isCurrentPrice) 
         VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
        [price.skuId, price.costPriceJpy, price.exchangeRate, price.shippingFeePerKg, price.importTaxRate, landedCost.toFixed(2), price.sellingPricePerKg]
      );
    }
    console.log(`✅ Added ${pricingData.length} pricing records`);
    
    // ============================================
    // INVENTORY
    // ============================================
    console.log("📊 Adding inventory...");
    
    const inventoryData = [
      { skuId: 1, totalStockKg: "25.500", allocatedStockKg: "8.000", lowStockThresholdKg: "10.000" }, // Aoarashi - healthy stock
      { skuId: 2, totalStockKg: "42.000", allocatedStockKg: "15.000", lowStockThresholdKg: "15.000" }, // Kiri no Mori - good
      { skuId: 3, totalStockKg: "85.000", allocatedStockKg: "30.000", lowStockThresholdKg: "25.000" }, // Uji Culinary - bulk
      { skuId: 4, totalStockKg: "8.000", allocatedStockKg: "5.000", lowStockThresholdKg: "10.000" }, // Nishio Supreme - LOW STOCK!
      { skuId: 5, totalStockKg: "35.000", allocatedStockKg: "12.000", lowStockThresholdKg: "12.000" }, // Nishio Premium
      { skuId: 6, totalStockKg: "120.000", allocatedStockKg: "45.000", lowStockThresholdKg: "30.000" }, // Nishio Culinary - bulk
      { skuId: 7, totalStockKg: "200.000", allocatedStockKg: "80.000", lowStockThresholdKg: "50.000" }, // Food Grade - bulk
      { skuId: 8, totalStockKg: "5.500", allocatedStockKg: "3.000", lowStockThresholdKg: "5.000" }, // Ummon - LOW STOCK!
      { skuId: 9, totalStockKg: "18.000", allocatedStockKg: "6.000", lowStockThresholdKg: "8.000" }, // Kan-no-Shiro
      { skuId: 10, totalStockKg: "65.000", allocatedStockKg: "20.000", lowStockThresholdKg: "20.000" }, // Kagoshima Organic
      { skuId: 11, totalStockKg: "150.000", allocatedStockKg: "60.000", lowStockThresholdKg: "40.000" }, // Kagoshima Value
    ];
    
    for (const inv of inventoryData) {
      await connection.execute(
        `INSERT INTO inventory (skuId, totalStockKg, allocatedStockKg, lowStockThresholdKg) 
         VALUES (?, ?, ?, ?)`,
        [inv.skuId, inv.totalStockKg, inv.allocatedStockKg, inv.lowStockThresholdKg]
      );
    }
    console.log(`✅ Added ${inventoryData.length} inventory records`);
    
    // ============================================
    // CLIENT ORDERS (Recent orders)
    // ============================================
    console.log("📝 Adding client orders...");
    
    const ordersData = [
      // Nana's Green Tea orders
      { clientId: 1, skuId: 2, quantityKg: "10.000", unitPriceSgd: "247.00", status: "delivered", daysAgo: 5 },
      { clientId: 1, skuId: 3, quantityKg: "15.000", unitPriceSgd: "114.00", status: "delivered", daysAgo: 5 },
      { clientId: 1, skuId: 5, quantityKg: "8.000", unitPriceSgd: "228.00", status: "pending", daysAgo: 1 },
      
      // Coffee Bean orders
      { clientId: 2, skuId: 1, quantityKg: "5.000", unitPriceSgd: "351.50", status: "delivered", daysAgo: 10 },
      { clientId: 2, skuId: 2, quantityKg: "12.000", unitPriceSgd: "240.50", status: "confirmed", daysAgo: 3 },
      
      // Tsujiri orders
      { clientId: 3, skuId: 4, quantityKg: "3.000", unitPriceSgd: "407.40", status: "delivered", daysAgo: 7 },
      { clientId: 3, skuId: 8, quantityKg: "2.000", unitPriceSgd: "562.60", status: "pending", daysAgo: 2 },
      
      // Matchaya orders
      { clientId: 4, skuId: 5, quantityKg: "5.000", unitPriceSgd: "240.00", status: "delivered", daysAgo: 14 },
      
      // Artisan Boulangerie orders
      { clientId: 5, skuId: 3, quantityKg: "8.000", unitPriceSgd: "117.00", status: "delivered", daysAgo: 8 },
      { clientId: 5, skuId: 6, quantityKg: "10.000", unitPriceSgd: "107.25", status: "confirmed", daysAgo: 2 },
      
      // Kyo Matcha Bar orders
      { clientId: 6, skuId: 1, quantityKg: "3.000", unitPriceSgd: "364.80", status: "delivered", daysAgo: 12 },
      { clientId: 6, skuId: 9, quantityKg: "5.000", unitPriceSgd: "288.00", status: "pending", daysAgo: 1 },
      
      // Gelato Factory orders (bulk)
      { clientId: 7, skuId: 7, quantityKg: "50.000", unitPriceSgd: "58.50", status: "delivered", daysAgo: 20 },
      { clientId: 7, skuId: 11, quantityKg: "40.000", unitPriceSgd: "49.50", status: "confirmed", daysAgo: 5 },
    ];
    
    for (const order of ordersData) {
      const totalPrice = parseFloat(order.quantityKg) * parseFloat(order.unitPriceSgd);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - order.daysAgo);
      
      await connection.execute(
        `INSERT INTO client_orders (clientId, skuId, quantityKg, unitPriceSgd, totalPriceSgd, orderDate, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [order.clientId, order.skuId, order.quantityKg, order.unitPriceSgd, totalPrice.toFixed(2), orderDate, order.status]
      );
    }
    console.log(`✅ Added ${ordersData.length} client orders`);
    
    // ============================================
    // DEMAND FORECASTS
    // ============================================
    console.log("📈 Adding demand forecasts...");
    
    const forecastsData = [
      { clientId: 1, skuId: 2, forecastMonth: "2026-02", projectedDemandKg: "12.000", confidenceLevel: "85.00" },
      { clientId: 1, skuId: 3, forecastMonth: "2026-02", projectedDemandKg: "18.000", confidenceLevel: "90.00" },
      { clientId: 2, skuId: 1, forecastMonth: "2026-02", projectedDemandKg: "6.000", confidenceLevel: "80.00" },
      { clientId: 3, skuId: 4, forecastMonth: "2026-02", projectedDemandKg: "4.000", confidenceLevel: "75.00" },
      { clientId: 7, skuId: 7, forecastMonth: "2026-02", projectedDemandKg: "55.000", confidenceLevel: "92.00" },
    ];
    
    for (const forecast of forecastsData) {
      await connection.execute(
        `INSERT INTO demand_forecasts (clientId, skuId, forecastMonth, projectedDemandKg, confidenceLevel) 
         VALUES (?, ?, ?, ?, ?)`,
        [forecast.clientId, forecast.skuId, forecast.forecastMonth, forecast.projectedDemandKg, forecast.confidenceLevel]
      );
    }
    console.log(`✅ Added ${forecastsData.length} demand forecasts`);
    
    // ============================================
    // NOTIFICATIONS
    // ============================================
    console.log("🔔 Adding notifications...");
    
    const notificationsData = [
      { type: "low_stock", title: "Low Stock Alert: Nishio Supreme", message: "Nishio Supreme (SKU #4) is below threshold. Current: 8kg, Threshold: 10kg. Consider placing a reorder with Aiya.", severity: "warning" },
      { type: "low_stock", title: "Low Stock Alert: Ummon-no-Mukashi", message: "Ummon-no-Mukashi (SKU #8) is critically low. Current: 5.5kg, Threshold: 5kg. Urgent reorder recommended.", severity: "critical" },
      { type: "price_change", title: "Exchange Rate Update", message: "JPY/SGD exchange rate has moved to 110.50. Consider reviewing pricing for affected products.", severity: "info" },
      { type: "order_reminder", title: "New Order: Tsujiri Singapore", message: "New order received from Tsujiri Singapore for 2kg Ummon-no-Mukashi. Total: SGD 1,125.20", severity: "info" },
    ];
    
    for (const notif of notificationsData) {
      await connection.execute(
        `INSERT INTO notifications (type, title, message, severity, isRead) 
         VALUES (?, ?, ?, ?, false)`,
        [notif.type, notif.title, notif.message, notif.severity]
      );
    }
    console.log(`✅ Added ${notificationsData.length} notifications`);
    
    console.log("\n🎉 Seed completed successfully!");
    console.log("Summary:");
    console.log(`  - ${suppliersData.length} suppliers`);
    console.log(`  - ${skusData.length} matcha SKUs`);
    console.log(`  - ${clientsData.length} clients`);
    console.log(`  - ${pricingData.length} pricing records`);
    console.log(`  - ${inventoryData.length} inventory records`);
    console.log(`  - ${ordersData.length} client orders`);
    console.log(`  - ${forecastsData.length} demand forecasts`);
    console.log(`  - ${notificationsData.length} notifications`);
    
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch(console.error);
