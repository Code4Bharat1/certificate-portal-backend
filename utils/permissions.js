// utils/permissions.js

/**
 * Check if user is a global admin (superadmin or admin)
 * @param {Array} permissions - Permissions array from backend
 * @returns {boolean}
 */
export function isGlobalAdmin(permissions) {
  if (!Array.isArray(permissions)) return false;

  // Check if user has admin_management permission
  return permissions.includes("admin_management");
}

/**
 * Check if user can access a specific category
 * @param {Array} userPermissions - User's permission array
 * @param {string} categoryKey - Category key to check (e.g., 'it-nexcore')
 * @returns {boolean}
 */
export function canAccessCategory(userPermissions, categoryKey) {
  if (!Array.isArray(userPermissions)) return false;

  // Global admins (those with admin_management) see everything
  if (userPermissions.includes("admin_management")) return true;

  // Direct check - no normalization, no inference
  return userPermissions.includes(categoryKey);
}

/**
 * Check if user can access ANY of the given categories
 * @param {Array} userPermissions - User's permission array
 * @param {Array} categoryKeys - Array of category keys
 * @returns {boolean}
 */
export function canAccessAny(userPermissions, categoryKeys) {
  if (!Array.isArray(userPermissions)) return false;
  if (!Array.isArray(categoryKeys)) return false;

  // Global admins see everything
  if (userPermissions.includes("admin_management")) return true;

  // Check if user has ANY of the required permissions
  return categoryKeys.some((key) => userPermissions.includes(key));
}

/**
 * Check if user can access ALL of the given categories
 * @param {Array} userPermissions - User's permission array
 * @param {Array} categoryKeys - Array of category keys
 * @returns {boolean}
 */
export function canAccessAll(userPermissions, categoryKeys) {
  if (!Array.isArray(userPermissions)) return false;
  if (!Array.isArray(categoryKeys)) return false;

  // Global admins see everything
  if (userPermissions.includes("admin_management")) return true;

  // Check if user has ALL required permissions
  return categoryKeys.every((key) => userPermissions.includes(key));
}

/**
 * Get user permissions from session storage
 * @returns {Array} Permissions array
 */
export function getUserPermissions() {
  if (typeof window === "undefined") return [];

  try {
    const adminData = sessionStorage.getItem("adminData");
    if (!adminData) return [];

    const data = JSON.parse(adminData);
    return data.permissions || [];
  } catch (error) {
    console.error("Error loading permissions:", error);
    return [];
  }
}

/**
 * Get all accessible categories for user
 * @param {Array} userPermissions - User's permission array
 * @returns {Array} Array of accessible category keys
 */
export function getAccessibleCategories(userPermissions) {
  if (!Array.isArray(userPermissions)) return [];

  // Global admins get all categories
  if (userPermissions.includes("admin_management")) {
    return [
      "it-nexcore",
      "fsd",
      "marketing-junction",
      "dm",
      "hr",
      "bootcamp",
      "bvoc",
      "operations",
      "client",
    ];
  }

  // Return exact permissions (no modification)
  return userPermissions;
}

// ============================================
// CATEGORY DEFINITIONS
// ============================================

export const ALL_CATEGORIES = [
  {
    title: "IT-Nexcore / Code4Bharat",
    key: "it-nexcore",
    route: "/certificates/it-nexcore",
    permission: "it-nexcore",
    color: "blue",
  },
  {
    title: "FSD",
    key: "fsd",
    route: "/certificates/fsd",
    permission: "fsd",
    color: "indigo",
  },
  {
    title: "Marketing Junction",
    key: "marketing-junction",
    route: "/certificates/marketing-junction",
    permission: "marketing-junction",
    color: "orange",
  },
  {
    title: "Digital Marketing",
    key: "dm",
    route: "/certificates/dm",
    permission: "dm",
    color: "cyan",
  },
  {
    title: "HR",
    key: "hr",
    route: "/certificates/hr",
    permission: "hr",
    color: "pink",
  },
  {
    title: "Bootcamp",
    key: "bootcamp",
    route: "/certificates/bootcamp",
    permission: "bootcamp",
    color: "purple",
  },
  {
    title: "BVOC",
    key: "bvoc",
    route: "/certificates/bvoc",
    permission: "bvoc",
    color: "teal",
  },
  {
    title: "Operations",
    key: "operations",
    route: "/certificates/operations",
    permission: "operations",
    color: "gray",
  },
  {
    title: "Client",
    key: "client",
    route: "/certificates/client",
    permission: "client",
    color: "emerald",
  },
];

/**
 * Filter categories by user permissions
 * @param {Array} userPermissions - User's permission array
 * @returns {Array} Filtered category objects
 */
export function getVisibleCategories(userPermissions) {
  return ALL_CATEGORIES.filter((category) =>
    canAccessCategory(userPermissions, category.permission)
  );
}
