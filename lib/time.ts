const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// EDITH runs on Delhi time wherever the device or server is.
export function nowIST(at = Date.now()) {
  const iso = new Date(at + IST_OFFSET_MS).toISOString();
  return {
    date: iso.slice(0, 10),
    tomorrow: new Date(at + IST_OFFSET_MS + DAY_MS).toISOString().slice(0, 10),
    time: `${iso.slice(0, 13)}:00`,
  };
}
