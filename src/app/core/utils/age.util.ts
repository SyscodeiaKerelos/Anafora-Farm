/**
 * Returns a human-readable age string from a birth date to now.
 * Examples: "45 days", "2 years 3 months", "1 month"
 */
export function getAgeFromBirthDate(birthDate: Date | null): string | null {
  if (!birthDate || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
    return null;
  }
  const now = new Date();
  if (birthDate > now) {
    return null;
  }
  const totalDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  if (totalDays < 30) {
    return totalDays <= 1 ? (totalDays === 1 ? '1 day' : '0 days') : `${totalDays} days`;
  }
  if (totalDays < 365) {
    const months = Math.floor(totalDays / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const months = Math.floor(remainingDays / 30);
  if (months === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }
  const y = years === 1 ? '1 year' : `${years} years`;
  const m = months === 1 ? '1 month' : `${months} months`;
  return `${y} ${m}`;
}
