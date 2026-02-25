// Allow only letters, spaces, and common name punctuation
export const allowTextOnly = (e) => {
  const regex = /^[A-Za-zÀ-ÿ\s.'-]*$/;

  // if input is invalid
  if (!regex.test(e.data)) {
    e.preventDefault();
  }
};

// Allow only numbers
export const allowNumbersOnly = (e) => {
  const regex = /^[0-9.]$/;

  // Reject anything that is not a digit or a dot
  if (!regex.test(e.data)) {
    e.preventDefault();
    return;
  }

  // Prevent multiple decimals
  if (e.data === "." && e.target.value.includes(".")) {
    e.preventDefault();
  }
};

// ✅ Optional: prevent copy-paste of invalid data (optional)
export const sanitizeInput = (type, value) => {
  if (type === "text") return value.replace(/[^A-Za-zÀ-ÿ\s.'-]/g, "");
  if (type === "number") return value.replace(/[^0-9]/g, "");
  return value;
};

export const searchRequests = (requests, searchTerm) => {
  if (!searchTerm.trim()) return requests;
  return requests.filter((req) =>
    req.requester_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
};

export const formatName = (name) => {
  if (!name) return "";

  return name
    .toLowerCase()
    .split(" ")
    .map((word) => {
      // If it's an initial like "m."
      if (word.length === 2 && word.endsWith(".")) {
        return word.charAt(0).toUpperCase() + ".";
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

export const generateTimeSlots = (start, end, intervalMinutes) => {
  const times = [];
  let current = new Date(`1970-01-01T${start}:00`);
  const endTime = new Date(`1970-01-01T${end}:00`);

  while (current <= endTime) {
    const hours = String(current.getHours()).padStart(2, "0");
    const minutes = String(current.getMinutes()).padStart(2, "0");
    times.push(`${hours}:${minutes}`);

    current.setMinutes(current.getMinutes() + intervalMinutes);
  }

  return times;
};
