import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReserveSchema = z.object({
    productId: z.string(),
    warehouseId: z.string(),
    quantity: z.number().int().positive(),
    idempotencyKey: z.string().optional(),
});

type InventoryRow = {
    id: string;
    totalUnits: number;
    reservedUnits: number;
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = ReserveSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { productId, warehouseId, quantity, idempotencyKey } = parsed.data;

        // Idempotency check
        if (idempotencyKey) {
            const existing = await prisma.reservation.findUnique({
                where: { idempotencyKey },
            });
            if (existing) {
                return NextResponse.json(existing, { status: 200 });
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            // Lock the inventory row with FOR UPDATE to prevent race conditions
            const inventory: InventoryRow[] = await tx.$queryRawUnsafe(
                `SELECT id, "totalUnits", "reservedUnits" FROM "Inventory" WHERE "productId" = $1 AND "warehouseId" = $2 FOR UPDATE`,
                productId,
                warehouseId
            );

            if (!inventory || inventory.length === 0) {
                throw new Error("INVENTORY_NOT_FOUND");
            }

            const inv = inventory[0] as InventoryRow;
            const available = Number(inv.totalUnits) - Number(inv.reservedUnits);

            if (available < quantity) {
                throw new Error("INSUFFICIENT_STOCK");
            }

            await tx.inventory.update({
                where: {
                    productId_warehouseId: { productId, warehouseId },
                },
                data: { reservedUnits: { increment: quantity } },
            });

            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            const reservation = await tx.reservation.create({
                data: {
                    productId,
                    warehouseId,
                    quantity,
                    status: "PENDING",
                    expiresAt,
                    ...(idempotencyKey && { idempotencyKey }),
                },
                include: {
                    product: true,
                    warehouse: true,
                },
            });

            return reservation;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "UNKNOWN";

        if (message === "INSUFFICIENT_STOCK") {
            return NextResponse.json(
                { error: "Not enough stock available" },
                { status: 409 }
            );
        }
        if (message === "INVENTORY_NOT_FOUND") {
            return NextResponse.json(
                { error: "Inventory not found" },
                { status: 404 }
            );
        }
        console.error(error);
        return NextResponse.json(
            { error: "Failed to create reservation" },
            { status: 500 }
        );
    }
}