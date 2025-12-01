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
    req.requester_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};
