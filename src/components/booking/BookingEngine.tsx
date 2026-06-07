"use client";

import { useState } from "react";
import { format, startOfToday, isBefore, isToday, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Service } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { JsonValue } from "@prisma/client/runtime/library";

// Helper to safely extract service name from JSON field
function getServiceName(name: JsonValue | null): string {
  if (!name) return "Service";
  if (typeof name === "string") return name;
  if (typeof name === "object" && name !== null) {
    const obj = name as Record<string, unknown>;
    if (typeof obj.en === "string") return obj.en;
    if (typeof obj.ar === "string") return obj.ar;
    const first = Object.values(obj).find((v) => typeof v === "string");
    if (first) return first as string;
  }
  return "Service";
}

interface BookingEngineProps {
  businessId: string;
  services: Service[];
}

// Generate time slots from 9 AM to 5 PM in 30‑min intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 17; hour++) {
    slots.push(`${hour}:00`);
    if (hour !== 17) slots.push(`${hour}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export function BookingEngine({ businessId, services }: BookingEngineProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services[0]?.id || "",
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBooking = async () => {
    if (
      !selectedDate ||
      !selectedTime ||
      !selectedServiceId ||
      !customerName ||
      !customerPhone
    ) {
      toast.error("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    const [hour, minute] = selectedTime.split(":");
    const startTime = new Date(selectedDate);
    startTime.setHours(parseInt(hour), parseInt(minute), 0);

    const service = services.find((s) => s.id === selectedServiceId);
    const endTime = new Date(
      startTime.getTime() + (service?.durationMins || 30) * 60000,
    );

    // TODO: call API to create appointment
    console.log({
      businessId,
      selectedServiceId,
      startTime,
      endTime,
      customerName,
      customerPhone,
    });
    toast.success("Appointment requested! (API integration pending)");
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={{ before: startOfToday() }}
              className="mx-auto"
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle>Select Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const slotDateTime = new Date(selectedDate);
                const [hour, minute] = slot.split(":");
                slotDateTime.setHours(parseInt(hour), parseInt(minute), 0);
                const isPast =
                  isBefore(slotDateTime, new Date()) && !isToday(selectedDate);
                return (
                  <Button
                    key={slot}
                    variant={selectedTime === slot ? "default" : "outline"}
                    onClick={() => setSelectedTime(slot)}
                    disabled={isPast}
                    className="text-sm"
                  >
                    {slot}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Selection & Customer Details */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Service</label>
            <select
              className="w-full border rounded-md p-2"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              {services.map((s) => {
                const serviceName = getServiceName(s.name);
                const price = Number(s.price); // convert Decimal to number
                return (
                  <option key={s.id} value={s.id}>
                    {serviceName} - ${price.toFixed(2)}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              className="w-full border rounded-md p-2"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full border rounded-md p-2"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>
          <Button
            onClick={handleBooking}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Booking..." : "Book Appointment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
