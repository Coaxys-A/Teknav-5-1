export function randomUUID() {
  const c: any = typeof globalThis !== "undefined" ? (globalThis as any).crypto : undefined;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  const arr = new Uint8Array(16);
  if (c?.getRandomValues) {
    c.getRandomValues(arr);
  } else {
    for (let i = 0; i < 16; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `${toHex(arr[0])}${toHex(arr[1])}${toHex(arr[2])}${toHex(arr[3])}-${toHex(arr[4])}${toHex(arr[5])}-${toHex(arr[6])}${toHex(arr[7])}-${toHex(arr[8])}${toHex(arr[9])}-${toHex(arr[10])}${toHex(arr[11])}${toHex(arr[12])}${toHex(arr[13])}${toHex(arr[14])}${toHex(arr[15])}`;
}
