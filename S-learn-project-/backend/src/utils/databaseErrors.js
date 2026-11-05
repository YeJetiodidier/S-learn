const unavailableCodes = new Set([
  "08000",
  "08003",
  "08006",
  "08P01",
  "53300",
  "57P01",
  "57P02",
  "57P03",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "EAI_AGAIN",
]);
const unavailableMessages =
  /connection terminated|connection timeout|could not connect|server closed the connection/i;

export const isDatabaseUnavailable = (error) => {
  for (let current = error; current; current = current.cause) {
    if (
      unavailableCodes.has(current.code) ||
      unavailableMessages.test(current.message || "")
    ) {
      return true;
    }
  }
  return false;
};
