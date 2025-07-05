/**
 * Formats a date string to a more readable format for short display
 */
export const formatDateShort = (dateString: string | null): string => {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Formats a date string to a more readable format with year
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Formats a date string to a relative time format
 */
export const formatTimeAgo = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateString);
};

/**
 * Gets the Tailwind background color class for a programming language
 */
export const getLanguageColor = (language: string | null): string => {
  const colors: Record<string, string> = {
    JavaScript: "bg-yellow-500",
    TypeScript: "bg-blue-500",
    Python: "bg-green-500",
    Java: "bg-red-500",
    Go: "bg-cyan-500",
    Rust: "bg-orange-500",
    "C++": "bg-purple-500",
    "C#": "bg-blue-600",
    PHP: "bg-indigo-500",
    Ruby: "bg-red-600",
    Swift: "bg-orange-600",
    Kotlin: "bg-purple-600",
  };
  return colors[language || ""] || "bg-neutral-500";
};
