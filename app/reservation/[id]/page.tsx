"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Reservation = {
  id: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;

  product: {
    name: string;
    price: number;
    sku: string;
  };

  warehouse: {
    name: string;
    location: string;
  };
};

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const reservationId = params.id as string;

  const fetchReservation = async () => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}`);

      if (!res.ok) {
        throw new Error();
      }

      const data = await res.json();
      setReservation(data);
    } catch {
      toast.error("Failed to load reservation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservation();
  }, []);

  useEffect(() => {
    if (!reservation) return;

    const interval = setInterval(() => {
      const expiry = new Date(reservation.expiresAt).getTime();
      const now = Date.now();

      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${minutes}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  const handleConfirm = async () => {
    setProcessing(true);

    try {
      const res = await fetch(
        `/api/reservations/${reservationId}/confirm`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (res.status === 410) {
        toast.error("Reservation expired");
        return;
      }

      if (!res.ok) {
        toast.error(data.error || "Failed to confirm");
        return;
      }

      toast.success("Purchase confirmed");
      setReservation(data);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);

    try {
      const res = await fetch(
        `/api/reservations/${reservationId}/release`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to cancel");
        return;
      }

      toast.success("Reservation cancelled");
      setReservation(data);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        Loading reservation...
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="text-center py-10">
        Reservation not found
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reservation Details</CardTitle>

            <Badge>
              {reservation.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-gray-500">Product</p>
            <h2 className="text-xl font-semibold">
              {reservation.product.name}
            </h2>
          </div>

          <div>
            <p className="text-sm text-gray-500">Warehouse</p>
            <h3 className="font-medium">
              {reservation.warehouse.name}
            </h3>
            <p className="text-gray-500">
              {reservation.warehouse.location}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Reservation expires in
            </p>

            <p className="text-2xl font-bold">
              {timeLeft}
            </p>
          </div>

          {reservation.status === "PENDING" && (
            <div className="flex gap-3">
              <Button
                onClick={handleConfirm}
                disabled={processing}
              >
                Confirm Purchase
              </Button>

              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          )}

          <Button
            variant="secondary"
            onClick={() => router.push("/")}
          >
            Back to Products
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}