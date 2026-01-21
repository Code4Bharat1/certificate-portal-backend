import Category from "../models/category.models.js";

// middleware/validateCategory.js
// This middleware normalizes and validates category values
// middleware/validateCategory.js

export const validateCategory = (req, res, next) => {
  if (!req.body.category) {
    return res.status(400).json({
      success: false,
      message: "Category is required",
    });
  }

  const categoryLower = req.body.category.toLowerCase().trim();
  
  // Map to exact DB values (case-sensitive)
  const validCategories = {
    "it-nexcore": "IT-Nexcore",
    "itnexcore": "IT-Nexcore",
    "code4bharat": "Code4Bharat",
    "code 4 bharat": "Code4Bharat",
    "marketing-junction": "marketing-junction",
    "marketingjunction": "marketing-junction",
    "fsd": "FSD",
    "bvoc": "BVOC",
    "hr": "HR",
    "dm": "DM",
    "od": "OD",
    "operations department": "OD",
    "operationsdepartment": "OD",
    "client": "client",
  };

  if (!validCategories[categoryLower]) {
    return res.status(400).json({
      success: false,
      message: `Invalid category. Valid categories are: ${Object.keys(validCategories).join(", ")}`,
    });
  }

  // Normalize to match DB schema exactly
  req.body.category = validCategories[categoryLower];
  
  // console.log(`✅ Category normalized: "${req.body.category}"`);
  
  next();
};
