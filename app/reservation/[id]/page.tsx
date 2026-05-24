"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleReserve = async (productId: string, warehouseId: string) => {
    const key = `${productId}-${warehouseId}`;
    setReserving(key);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error("Not enough stock available for this item.");
        return;
      }

      if (!res.ok) {
        toast.error(data.error || "Failed to reserve item.");
        return;
      }

      toast.success("Reserved! Redirecting to checkout...");
      router.push(`/reservation/${data.id}`);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setReserving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 mt-1">
          Reserve items from your preferred warehouse
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                </div>
                <Badge variant="secondary" className="ml-2 shrink-0">
                  {product.sku}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                ₹{product.price.toLocaleString()}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Available at warehouses:
                </p>
                {product.inventory.map((inv) => (
                  <div
                    key={inv.warehouseId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{inv.warehouseName}</p>
                      <p className="text-xs text-gray-500">{inv.location}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={inv.availableUnits > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {inv.availableUnits} available
                        </Badge>
                        {inv.reservedUnits > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {inv.reservedUnits} reserved
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={
                        inv.availableUnits === 0 ||
                        reserving === `${product.id}-${inv.warehouseId}`
                      }
                      onClick={() => handleReserve(product.id, inv.warehouseId)}
                    >
                      {reserving === `${product.id}-${inv.warehouseId}`
                        ? "Reserving..."
                        : inv.availableUnits === 0
                          ? "Out of Stock"
                          : "Reserve"}
                    </Button>
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