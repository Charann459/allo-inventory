import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    await prisma.reservation.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.warehouse.deleteMany();

    const warehouseA = await prisma.warehouse.create({
        data: { name: "Mumbai Central", location: "Mumbai, MH" },
    });

    const warehouseB = await prisma.warehouse.create({
        data: { name: "Delhi North", location: "Delhi, DL" },
    });

    const product1 = await prisma.product.create({
        data: { name: "Wireless Headphones", sku: "WH-001", price: 2999, description: "Premium noise-cancelling headphones" },
    });

    const product2 = await prisma.product.create({
        data: { name: "Mechanical Keyboard", sku: "MK-002", price: 4999, description: "RGB mechanical keyboard" },
    });

    const product3 = await prisma.product.create({
        data: { name: "USB-C Hub", sku: "UC-003", price: 1499, description: "7-in-1 USB-C hub" },
    });

    const product4 = await prisma.product.create({
        data: { name: "Webcam HD", sku: "WC-004", price: 3499, description: "1080p HD webcam" },
    });

    await prisma.inventory.createMany({
        data: [
            { productId: product1.id, warehouseId: warehouseA.id, totalUnits: 10, reservedUnits: 0 },
            { productId: product1.id, warehouseId: warehouseB.id, totalUnits: 5, reservedUnits: 0 },
            { productId: product2.id, warehouseId: warehouseA.id, totalUnits: 3, reservedUnits: 0 },
            { productId: product2.id, warehouseId: warehouseB.id, totalUnits: 8, reservedUnits: 0 },
            { productId: product3.id, warehouseId: warehouseA.id, totalUnits: 1, reservedUnits: 0 },
            { productId: product3.id, warehouseId: warehouseB.id, totalUnits: 15, reservedUnits: 0 },
            { productId: product4.id, warehouseId: warehouseA.id, totalUnits: 7, reservedUnits: 0 },
            { productId: product4.id, warehouseId: warehouseB.id, totalUnits: 2, reservedUnits: 0 },
        ],
    });

    console.log("✅ Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });