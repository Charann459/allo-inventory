import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Clear old data
    await prisma.inventory.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.product.deleteMany();
    await prisma.warehouse.deleteMany();

    // Warehouses
    const mumbai = await prisma.warehouse.create({
        data: {
            name: "Mumbai Central",
            location: "Mumbai, MH",
        },
    });

    const delhi = await prisma.warehouse.create({
        data: {
            name: "Delhi North",
            location: "Delhi, DL",
        },
    });

    // Products
    const headphones = await prisma.product.create({
        data: {
            name: "Wireless Headphones",
            sku: "WH-001",
            description: "Premium noise-cancelling headphones",
            price: 2999,
        },
    });

    const keyboard = await prisma.product.create({
        data: {
            name: "Mechanical Keyboard",
            sku: "MK-002",
            description: "RGB mechanical keyboard",
            price: 4999,
        },
    });

    // Inventory
    await prisma.inventory.createMany({
        data: [
            {
                productId: headphones.id,
                warehouseId: mumbai.id,
                totalUnits: 10,
            },
            {
                productId: headphones.id,
                warehouseId: delhi.id,
                totalUnits: 5,
            },
            {
                productId: keyboard.id,
                warehouseId: mumbai.id,
                totalUnits: 8,
            },
        ],
    });

    console.log("✅ Database seeded successfully");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });