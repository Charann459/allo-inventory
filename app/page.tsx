"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";

type InventoryItem = {
    warehouseId: string;
    warehouseName: string;
    location: string;
    totalUnits: number;
    reservedUnits: number;
    availableUnits: number;
};

type Product = {
    id: string;
    name: string;
    sku: string;
    description: string;
    price: number;
    inventory: InventoryItem[];
};

export default function HomePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [reserving, setReserving] = useState<string | null>(null);

    const router = useRouter();

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();

            setProducts(data);
        } catch {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleReserve = async (
        productId: string,
        warehouseId: string
    ) => {
        const key = `${productId}-${warehouseId}`;

        setReserving(key);

        try {
            const res = await fetch("/api/reservations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId,
                    warehouseId,
                    quantity: 1,
                }),
            });

            const data = await res.json();

            if (res.status === 409) {
                toast.error("Not enough stock available.");
                return;
            }

            if (!res.ok) {
                toast.error(
                    data.error || "Failed to reserve item."
                );
                return;
            }

            toast.success(
                "Reserved! Redirecting to checkout..."
            );

            router.push(`/reservation/${data.id}`);
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setReserving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="text-center">
                    <div className="h-14 w-14 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto"></div>

                    <p className="mt-5 text-gray-500 text-lg">
                        Loading inventory...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-10 text-white shadow-2xl">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl"></div>

                <div className="relative z-10">
                    <Badge className="bg-white/20 text-white border-none mb-4">
                        Inventory Reservation System
                    </Badge>

                    <h1 className="text-5xl font-bold tracking-tight">
                        Allo Inventory
                    </h1>

                    <p className="mt-4 text-lg text-blue-100 max-w-2xl leading-relaxed">
                        Real-time multi-warehouse inventory reservation
                        system with concurrency-safe checkout flow,
                        reservation expiry, and stock management.
                    </p>

                    <div className="flex gap-6 mt-8">
                        <div>
                            <p className="text-3xl font-bold">
                                {products.length}
                            </p>

                            <p className="text-blue-100 text-sm">
                                Products
                            </p>
                        </div>

                        <div>
                            <p className="text-3xl font-bold">
                                {products.reduce(
                                    (acc, p) => acc + p.inventory.length,
                                    0
                                )}
                            </p>

                            <p className="text-blue-100 text-sm">
                                Warehouses
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRODUCT GRID */}
            <div className="grid xl:grid-cols-2 gap-8">
                {products.map((product) => (
                    <Card
                        key={product.id}
                        className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden bg-white/90 backdrop-blur"
                    >
                        <CardContent className="p-8 space-y-6">
                            {/* HEADER */}
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                                        {product.name}
                                    </h2>

                                    <p className="text-gray-500 mt-2 leading-relaxed">
                                        {product.description}
                                    </p>
                                </div>

                                <Badge
                                    variant="secondary"
                                    className="rounded-full px-3 py-1 text-xs"
                                >
                                    {product.sku}
                                </Badge>
                            </div>

                            {/* PRICE */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Price
                                    </p>

                                    <h3 className="text-4xl font-bold text-blue-600">
                                        ₹{product.price.toLocaleString()}
                                    </h3>
                                </div>
                            </div>

                            {/* WAREHOUSES */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                                        Available Warehouses
                                    </h4>
                                </div>

                                {product.inventory.map((inv) => (
                                    <div
                                        key={inv.warehouseId}
                                        className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 hover:bg-gray-100/70 transition-all"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <h5 className="font-semibold text-gray-900">
                                                        {inv.warehouseName}
                                                    </h5>

                                                    <p className="text-sm text-gray-500">
                                                        {inv.location}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none rounded-full">
                                                        {inv.availableUnits} Available
                                                    </Badge>

                                                    {inv.reservedUnits > 0 && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="rounded-full"
                                                        >
                                                            {inv.reservedUnits} Reserved
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <Button
                                                className="rounded-xl px-5 shadow-md"
                                                disabled={
                                                    inv.availableUnits === 0 ||
                                                    reserving ===
                                                    `${product.id}-${inv.warehouseId}`
                                                }
                                                onClick={() =>
                                                    handleReserve(
                                                        product.id,
                                                        inv.warehouseId
                                                    )
                                                }
                                            >
                                                {reserving ===
                                                    `${product.id}-${inv.warehouseId}`
                                                    ? "Reserving..."
                                                    : inv.availableUnits === 0
                                                        ? "Out of Stock"
                                                        : "Reserve"}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}