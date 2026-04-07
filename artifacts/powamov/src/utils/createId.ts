function getCryptoObject(): Crypto | null {
  if (typeof globalThis === "undefined" || !("crypto" in globalThis)) {
    return null;
  }

  return globalThis.crypto ?? null;
}

function formatUuidFromBytes(bytes: Uint8Array): string {
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

export function createId(): string {
  const cryptoObject = getCryptoObject();

  if (cryptoObject?.randomUUID) {
    return cryptoObject.randomUUID();
  }

  if (cryptoObject?.getRandomValues) {
    return formatUuidFromBytes(cryptoObject.getRandomValues(new Uint8Array(16)));
  }

  return `fallback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
