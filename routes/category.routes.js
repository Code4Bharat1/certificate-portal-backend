import express from "express";
import Category from "../models/category.models.js";
import People from "../models/people.models.js"; // To check usage before delete

const router = express.Router();

/* -----------------------------------------------
   ADD CATEGORY
------------------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const exists = await Category.findOne({ name: name.trim() });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const newCat = await Category.create({
      name: name.trim(),
      description: description || "",
    });

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      category: newCat,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/* -----------------------------------------------
   GET ALL CATEGORIES
------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, categories });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/* -----------------------------------------------
   DELETE CATEGORY  (With Usage Check)
------------------------------------------------- */
router.delete("/:name", async (req, res) => {
  try {
    const categoryName = req.params.name;

    // Check if category exists
    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if category is in use in People collection
    const peopleUsing = await People.countDocuments({ category: categoryName });
    if (peopleUsing > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete. ${peopleUsing} people are using this category.`,
      });
    }

    // Delete category
    await Category.deleteOne({ name: categoryName });

    res.json({
      success: true,
      message: `Category "${categoryName}" deleted successfully`,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
