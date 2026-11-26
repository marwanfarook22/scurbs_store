export const whatsappEmoji = {
  wave: String.fromCodePoint(0x1f44b),
  person: String.fromCodePoint(0x1f464),
  phone: String.fromCodePoint(0x1f4de),
  location: String.fromCodePoint(0x1f4cd),
  shopping: String.fromCodePoint(0x1f6cd, 0xfe0f),
  money: String.fromCodePoint(0x1f4b0),
  leaf: String.fromCodePoint(0x1f33f),
};

export function normalizeEgyptianWhatsAppPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  const localNumber = digits.startsWith("0020")
    ? digits.slice(4)
    : digits.startsWith("20")
      ? digits.slice(2)
      : digits.startsWith("0")
        ? digits.slice(1)
        : digits;

  if (!/^1[0125]\d{8}$/.test(localNumber)) {
    throw new Error("Enter a valid Egyptian mobile number.");
  }

  return `20${localNumber}`;
}

export function buildWhatsAppUrl(phone, message) {
  const normalizedPhone = normalizeEgyptianWhatsAppPhone(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
