export interface BookingSlot {
  dateStr: string;
  hour: number;
  formattedDate: string;
  formattedTime: string;
}

export interface BookingRequestBody {
  name: string;
  phone: string;
  slots: BookingSlot[];
}

export interface BookingResponse {
  success?: boolean;
  error?: string;
}

export const BOOKING_CONFIG = {
  WORKING_HOURS: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] as const,
  MAX_SLOTS: 3,
  MIN_NAME_LENGTH: 1,
  MIN_CONTACT_LENGTH: 3,
  API_ENDPOINT: "/api/booking",
} as const;

export async function sendBookingRequest(data: BookingRequestBody): Promise<BookingResponse> {
  const res = await fetch(BOOKING_CONFIG.API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to send");
  }

  return res.json().catch(() => ({ success: true }));
}
