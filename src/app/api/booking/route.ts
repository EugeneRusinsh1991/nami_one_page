import { NextResponse } from "next/server";

interface BookingSlot {
  dateStr: string;
  hour: number;
  formattedDate: string;
  formattedTime: string;
}

interface BookingRequestBody {
  name: string;
  phone: string;
  slots: BookingSlot[];
}

function parseContact(contact: string): { label: string; icon: string; value: string; link?: string } {
  const trimmed = contact.trim();

  // Instagram URL or handle
  if (trimmed.includes("instagram.com/") || trimmed.includes("instagr.am/")) {
    const handle = trimmed.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
    return {
      label: "Instagram",
      icon: "📸",
      value: `@${handle}`,
      link: `https://instagram.com/${handle}`,
    };
  }

  // Telegram URL or handle with @
  if (trimmed.includes("t.me/")) {
    const handle = trimmed.replace(/^https?:\/\/(www\.)?t\.me\//, "").replace(/\/$/, "");
    return {
      label: "Telegram",
      icon: "✈️",
      value: `@${handle}`,
      link: `https://t.me/${handle}`,
    };
  }

  // Handle starting with @ (check if likely insta or tg, default to TG handle with link)
  if (trimmed.startsWith("@")) {
    const cleanHandle = trimmed.slice(1);
    return {
      label: "Telegram / Instagram",
      icon: "💬",
      value: `@${cleanHandle}`,
      link: `https://t.me/${cleanHandle}`,
    };
  }

  // Check if phone digits
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length >= 7) {
    const formattedTel = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
    return {
      label: "Телефон",
      icon: "📞",
      value: trimmed,
      link: `tel:${formattedTel.replace(/\s+/g, "")}`,
    };
  }

  return {
    label: "Контакт для связи",
    icon: "✉️",
    value: trimmed,
  };
}

export async function POST(request: Request) {
  try {
    const body: BookingRequestBody = await request.json();
    const { name, phone: rawContact, slots } = body;

    if (!name || !rawContact) {
      return NextResponse.json(
        { error: "Пожалуйста, укажите имя и контакт для связи" },
        { status: 400 }
      );
    }

    // Fallback credentials decoded on the server (never exposed to browser client)
    const fallbackToken = Buffer.from(
      "ODkyOTYwNjAwNzpBQUZ3czhqWGU2Nmxoam5hQkFqcTNObk04NUhlUF9JNzVXcw==",
      "base64"
    ).toString("utf-8");
    const fallbackChatId = Buffer.from("LTEwMDM5MjMyMTU2MzQ=", "base64").toString("utf-8");

    const token = process.env.TELEGRAM_BOT_TOKEN || fallbackToken;
    const chatId = process.env.TELEGRAM_CHAT_ID || fallbackChatId;

    const contactInfo = parseContact(rawContact);
    const contactLine = contactInfo.link
      ? `${contactInfo.icon} <b>${contactInfo.label}:</b> <a href="${contactInfo.link}">${contactInfo.value}</a>`
      : `${contactInfo.icon} <b>${contactInfo.label}:</b> ${contactInfo.value}`;

    const formattedSlots =
      slots && slots.length > 0
        ? slots.map((s) => `• <b>${s.formattedDate}</b> в <b>${s.formattedTime}</b>`).join("\n")
        : "<i>Не указано (уточнить у клиента)</i>";

    const message = [
      `⚡ <b>Новая заявка с сайта NAMI PMU</b>`,
      ``,
      `👤 <b>Имя:</b> ${name.trim()}`,
      contactLine,
      ``,
      `🗓 <b>Выбранное время:</b>`,
      formattedSlots,
    ].join("\n");

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return NextResponse.json(
        { error: data?.description || "Ошибка отправки в Telegram" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
