// Country codes data for phone number selection
export const countryCodes = [
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
  { code: "+36", country: "Hungary", flag: "🇭🇺" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+51", country: "Peru", flag: "🇵🇪" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
];

// Get list of unique country codes
export const getCountryCodes = () => {
  return countryCodes.map(item => ({
    code: item.code,
    country: item.country,
    flag: item.flag,
    display: `${item.flag} ${item.code} ${item.country}`
  }));
};

// Find country by code
export const getCountryByCode = (code) => {
  return countryCodes.find(item => item.code === code);
};

// Validate phone number format (basic validation)
export const validatePhoneNumber = (phoneNumber, countryCode) => {
  if (!phoneNumber) return { isValid: true, message: "" }; // Optional field
  
  // Remove spaces, dashes, and parentheses
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");
  
  // Check if it contains only digits
  if (!/^\d+$/.test(cleanNumber)) {
    return { isValid: false, message: "Phone number should contain only digits" };
  }
  
  // Basic length validation (most phone numbers are 7-15 digits)
  if (cleanNumber.length < 7 || cleanNumber.length > 15) {
    return { isValid: false, message: "Phone number should be 7-15 digits long" };
  }
  
  return { isValid: true, message: "" };
};