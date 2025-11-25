import Category from "../models/category.models.js";

export async function validateCategory(req, res, next) {
  try {
    const category = req.body.category;

    if (!category) {
      return res.status(400).json({ 
        success: false, 
        message: "Category is required" 
      });
    }

    const exists = await Category.findOne({ name: category });

    if (!exists) {
      return res.status(400).json({
        success: false,
        message: `Invalid category: ${category}`
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Category validation failed",
      error: err.message
    });
  }
}
