export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const result = await prisma.$transaction(async (tx) => {
            const reservation = await tx.reservation.findUnique({
                where: { id },
            });

            if (!reservation) {
                throw new Error("NOT_FOUND");
            }

            if (reservation.status !== "PENDING") {
                throw new Error("NOT_PENDING");
            }

            if (new Date() > reservation.expiresAt) {
                // Auto-release expired reservation
                await tx.inventory.update({
                    where: {
                        productId_warehouseId: {
                            productId: reservation.productId,
                            warehouseId: reservation.warehouseId,
                        },
                    },
                    data: { reservedUnits: { decrement: reservation.quantity } },
                });

                await tx.reservation.update({
                    where: { id },
                    data: { status: "RELEASED" },
                });

                throw new Error("EXPIRED");
            }

            // Confirm: decrement both totalUnits and reservedUnits
            await tx.inventory.update({
                where: {
                    productId_warehouseId: {
                        productId: reservation.productId,
                        warehouseId: reservation.warehouseId,
                    },
                },
                data: {
                    totalUnits: { decrement: reservation.quantity },
                    reservedUnits: { decrement: reservation.quantity },
                },
            });

            return tx.reservation.update({
                where: { id },
                data: { status: "CONFIRMED" },
                include: { product: true, warehouse: true },
            });
        });

        return NextResponse.json(result);
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
        }
        if (error.message === "EXPIRED") {
            return NextResponse.json({ error: "Reservation has expired" }, { status: 410 });
        }
        if (error.message === "NOT_PENDING") {
            return NextResponse.json({ error: "Reservation is not pending" }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: "Failed to confirm reservation" }, { status: 500 });
    }
}