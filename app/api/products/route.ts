import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Lazy expiry cleanup — release expired pending reservations
        const expiredReservations = await prisma.reservation.findMany({
            where: {
                status: "PENDING",
                expiresAt: { lt: new Date() },
            },
        });

        for (const reservation of expiredReservations) {
            await prisma.$transaction([
                prisma.inventory.update({
                    where: {
                        productId_warehouseId: {
                            productId: reservation.productId,
                            warehouseId: reservation.warehouseId,
                        },
                    },
                    data: { reservedUnits: { decrement: reservation.quantity } },
                }),
                prisma.reservation.update({
                    where: { id: reservation.id },
                    data: { status: "RELEASED" },
                }),
            ]);
        }

        const products = await prisma.product.findMany({
            include: {
                inventory: {
                    include: { warehouse: true },
                },
            },
        });

        const result = products.map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            description: product.description,
            price: product.price,
            inventory: product.inventory.map((inv) => ({
                warehouseId: inv.warehouseId,
                warehouseName: inv.warehouse.name,
                location: inv.warehouse.location,
                totalUnits: inv.totalUnits,
                reservedUnits: inv.reservedUnits,
                availableUnits: inv.totalUnits - inv.reservedUnits,
            })),
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}