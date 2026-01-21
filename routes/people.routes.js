import express from "express";
import { body, validationResult } from "express-validator";
import People from "../models/people.models.js";
import multer from "multer";
import xlsx from "xlsx";
import { authenticate } from "../middleware/auth.middleware.js";
import Student from "../models/users.models.js";
import { validateCategory } from "../middleware/validateCategory.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"));
    }
  },
});

function formatPhone(num) {
  if (!num) return null;
  num = num.toString();

  // Already has +91 or 91 and is 12 digits
  if (num.length === 12 && num.startsWith("91")) {
    return num;
  }

  // If phone is 10 digits, add 91
  if (num.length === 10) {
    return "91" + num;
  }

  return null; // fallback for invalid formats
}

/**
 * @route   POST /api/people
 * @desc    Add a new person
 * @access  Public
 */
router.post(
  "/",
  [
    body("name")
      .notEmpty()
      .trim()
      .withMessage("Name is required")
      .isLength({ max: 50 })
      .withMessage("Name cannot exceed 50 characters"),

    body("phone")
      .notEmpty()
      .withMessage("Phone is required")
      .matches(/^[0-9]{10}$/)
      .withMessage("Phone must be a 10-digit number"),

    validateCategory,

    body("batch").optional().trim(),

    body("email")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage("Email must be valid"),

    body("parentEmail")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage("Parent Email must be valid"),

    body("parentPhone1")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage("Parent Phone 1 must be a 10-digit number"),

    body("parentPhone2")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage("Parent Phone 2 must be a 10-digit number"),

    body("aadhaarCard")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{12}$/)
      .withMessage("Aadhaar card must be exactly 12 digits"),

    body("address")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("Address cannot exceed 200 characters"),

    body("clientEmail1")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage("Client Email 1 must be valid"),

    body("clientEmail2")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage("Client Email 2 must be valid"),

    body("clientPhone1")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage("Client Phone 1 must be a 10-digit number"),

    body("clientPhone2")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage("Client Phone 2 must be a 10-digit number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("❌ Validation errors:", errors.array());
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
          errors: errors.array(),
        });
      }

      const {
        name,
        category,
        batch,
        phone,
        parentPhone1,
        parentPhone2,
        aadhaarCard,
        address,
        email,
        parentEmail,
        clientEmail1,
        clientEmail2,
        clientPhone1,
        clientPhone2,
      } = req.body;

      // console.log("📝 Adding new person:", {
      //   name,
      //   category,
      //   batch,
      //   phone,
      //   hasParentPhone1: !!parentPhone1,
      //   hasParentPhone2: !!parentPhone2,
      //   hasAadhaar: !!aadhaarCard,
      //   hasAddress: !!address,
      //   hasEmail: !!email,
      //   hasParentEmail: !!parentEmail,
      //   hasClientEmail1: !!clientEmail1,
      //   hasClientEmail2: !!clientEmail2,
      //   hasClientPhone1: !!clientPhone1,
      //   hasClientPhone2: !!clientPhone2,
      // });

      // Validate batch for FSD and BVOC
      if (["FSD", "BVOC"].includes(category) && !batch) {
        console.error("❌ Batch required for category:", category);
        return res.status(400).json({
          success: false,
          message: "Batch is required for FSD and BVOC categories",
        });
      }

      // Add country code to phone
      const phoneWithCountryCode = "91" + phone;

      // Check for duplicate phone
      const existing = await People.findOne({ phone: phoneWithCountryCode });
      if (existing) {
        console.error("❌ Duplicate phone number:", phoneWithCountryCode);
        return res.status(400).json({
          success: false,
          message: "Person already exists with this phone number",
        });
      }

      // Prepare person data
      const newPersonData = {
        name: name.trim(),
        category,
        batch: batch || "",
        phone: phoneWithCountryCode,
        disabled: false,
      };

      // Add optional fields if provided
      if (parentPhone1) {
        newPersonData.parentPhone1 = "91" + parentPhone1;
      }
      if (parentPhone2) {
        newPersonData.parentPhone2 = "91" + parentPhone2;
      }
      if (aadhaarCard) {
        newPersonData.aadhaarCard = aadhaarCard;
      }
      if (address) {
        newPersonData.address = address.trim();
      }
      if (email) {
        newPersonData.email = email;
      }
      if (parentEmail) {
        newPersonData.parentEmail = parentEmail;
      }
      if (clientEmail1) {
        newPersonData.clientEmail1 = clientEmail1;
      }
      if (clientEmail2) {
        newPersonData.clientEmail2 = clientEmail2;
      }
      if (clientPhone1) {
        newPersonData.clientPhone1 = "91" + clientPhone1;
      }
      if (clientPhone2) {
        newPersonData.clientPhone2 = "91" + clientPhone2;
      }

      const newPerson = new People(newPersonData);
      await newPerson.save();

      const newStudent = new Student(newPersonData);
      await newStudent.save();

      // console.log("✅ Person added successfully:", newPerson._id);

      res.status(201).json({
        success: true,
        message: "Person added successfully",
        person: {
          _id: newPerson._id,
          name: newPerson.name,
          category: newPerson.category,
          batch: newPerson.batch || "",
          phone: newPerson.phone,
          parentPhone1: newPerson.parentPhone1 || null,
          parentPhone2: newPerson.parentPhone2 || null,
          aadhaarCard: newPerson.aadhaarCard || null,
          address: newPerson.address || null,
          email: newPerson.email || null,
          parentEmail: newPerson.parentEmail || null,
          clientEmail1: newPerson.clientEmail1 || null,
          clientEmail2: newPerson.clientEmail2 || null,
          clientPhone1: newPerson.clientPhone1 || null,
          clientPhone2: newPerson.clientPhone2 || null,
          disabled: newPerson.disabled,
          createdAt: newPerson.createdAt,
          updatedAt: newPerson.updatedAt,
        },
      });
    } catch (error) {
      console.error("❌ Error adding person:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/people
 * @desc    Get all people (with optional filters)
 * @access  Public
 */
// In people.routes.js - Update the GET /api/people route

router.get("/", async (req, res) => {
  try {
    let { category, categories, batch, disabled } = req.query;

    // console.log("📊 Incoming query params:", {
    //   category,
    //   categories,
    //   batch,
    //   disabled,
    // });

    let filter = {};

    // ✅ Handle multiple categories (for IT-Nexcore + Code4Bharat)
    // ✅ Handle multiple categories
    if (categories) {
      try {
        const categoryArray = JSON.parse(categories);
        const normalizedCategories = categoryArray.map((cat) =>
          normalizeCategory(cat)
        );

        // Use $or with case-insensitive match for each
        filter.$or = normalizedCategories.map((cat) => ({
          category: new RegExp(`^${cat}$`, "i"),
        }));

        // console.log(
        //   "🔍 Multiple categories filter (OR):",
        //   normalizedCategories
        // );
      } catch (error) {
        console.error("Error parsing categories:", error);
      }
    }
    // ✅ Handle single category (existing logic)
    else if (category && category !== "all") {
      const normalizedCategory = normalizeCategory(category);
      filter.category = new RegExp(`^${normalizedCategory}$`, "i");
      // console.log("🔍 Single category filter:", normalizedCategory);
    }

    // Add batch filter if provided
    if (batch && batch !== "all") {
      filter.batch = batch;
    }

    // Handle disabled status filter
    if (disabled !== undefined && disabled !== null) {
      filter.disabled = disabled === "true" || disabled === true;
    }

    // console.log("🔍 MongoDB filter:", JSON.stringify(filter, null, 2));

    const people = await People.find(filter).sort({ createdAt: -1 });

    // console.log(`✅ Found ${people.length} people matching filter`);
    // console.log(`📋 Categories in results:`, [
    //   ...new Set(people.map((p) => p.category)),
    // ]);

    // Format data for frontend
    const names = people.map((p) => {
      const phone = p.phone?.toString() || "";

      return {
        _id: p._id,
        name: p.name,
        category: p.category, // Return exact category from DB
        batch: p.batch || "",
        phone: phone ? phone.slice(-10) : null,
        parentPhone1: p.parentPhone1
          ? p.parentPhone1.toString().slice(-10)
          : null,
        parentPhone2: p.parentPhone2
          ? p.parentPhone2.toString().slice(-10)
          : null,
        aadhaarCard: p.aadhaarCard || null,
        address: p.address || null,
        email: p.email || null,
        parentEmail: p.parentEmail || null,
        clientEmail1: p.clientEmail1 || null,
        clientEmail2: p.clientEmail2 || null,
        clientPhone1: p.clientPhone1
          ? p.clientPhone1.toString().slice(-10)
          : null,
        clientPhone2: p.clientPhone2
          ? p.clientPhone2.toString().slice(-10)
          : null,
        disabled: p.disabled || false,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    const enabledCount = names.filter((p) => !p.disabled).length;
    const disabledCount = names.filter((p) => p.disabled).length;

    // console.log("✅ Returning people:", {
    //   total: names.length,
    //   enabled: enabledCount,
    //   disabled: disabledCount,
    //   categories: [...new Set(names.map((p) => p.category))],
    // });

    res.json({
      success: true,
      names,
      data: names,
      count: names.length,
      enabledCount,
      disabledCount,
    });
  } catch (error) {
    console.error("❌ Error fetching people:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Add this helper function at the top of your routes file
function normalizeCategory(category) {
  if (!category) return "";

  const lower = category.toLowerCase().trim();

  // Map all variations to their canonical form
  const categoryMap = {
    "it-nexcore": "IT-Nexcore",
    itnexcore: "IT-Nexcore",
    code4bharat: "Code4Bharat",
    "code 4 bharat": "Code4Bharat",
    "marketing-junction": "marketing-junction",
    marketingjunction: "marketing-junction",
    fsd: "FSD",
    bvoc: "BVOC",
    hr: "HR",
    dm: "DM",
    od: "Operations Department",
    "operations department": "Operations Department",
    operationsdepartment: "Operations Department",
    client: "client",
  };

  return categoryMap[lower] || category;
}

/**
 * @route   PUT /api/people/update-by-name
 * @desc    Update a person by name and phone
 * @access  Public
 */
router.put(
  "/update-by-name",
  [
    body("originalName").notEmpty().withMessage("Original name is required"),
    body("originalPhone").notEmpty().withMessage("Original phone is required"),

    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty")
      .isLength({ max: 50 })
      .withMessage("Name cannot exceed 50 characters"),

    body("phone")
      .optional()
      .matches(/^[0-9]{10}$/)
      .withMessage("Phone must be of 10-digit number"),

    body("email")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage("Email must be valid"),

    body("parentEmail")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage("Parent Email must be valid"),

    body("parentPhone1")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage("Parent Phone 1 must be a 10-digit number"),

    body("parentPhone2")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage("Parent Phone 2 must be a 10-digit number"),

    body("aadhaarCard")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{12}$/)
      .withMessage("Aadhaar card must be exactly 12 digits"),

    body("address")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("Address cannot exceed 200 characters"),

    body("clientEmail1")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage("Client Email 1 must be valid"),

    body("clientEmail2")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage("Client Email 2 must be valid"),

    body("clientPhone1")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage("Client Phone 1 must be a 10-digit number"),

    body("clientPhone2")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage("Client Phone 2 must be a 10-digit number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("❌ Validation errors:", errors.array());
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
          errors: errors.array(),
        });
      }

      const {
        originalName,
        originalPhone,
        name,
        category,
        batch,
        phone,
        parentPhone1,
        parentPhone2,
        aadhaarCard,
        address,
        email,
        parentEmail,
        clientEmail1,
        clientEmail2,
        clientPhone1,
        clientPhone2,
      } = req.body;

      // console.log("📝 Updating person by name:", {
      //   originalName,
      //   originalPhone,
      //   newName: name,
      //   category,
      //   batch,
      //   email,
      //   clientEmail1,
      //   clientEmail2,
      //   hasClientPhone1: !!clientPhone1,
      //   hasClientPhone2: !!clientPhone2,
      // });

      // Validate batch requirement for FSD and BVOC
      if (category && ["FSD", "BVOC"].includes(category) && !batch) {
        console.error("❌ Batch required for category:", category);
        return res.status(400).json({
          success: false,
          message: "Batch is required for FSD and BVOC categories",
        });
      }

      // Format the original phone for query
      const originalPhoneFormatted = formatPhone(originalPhone);

      // Prepare update object
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (category) updateData.category = category;
      if (batch !== undefined) updateData.batch = batch;
      if (email !== undefined) updateData.email = email || null;

      // Update parent email
      if (parentEmail !== undefined) {
        updateData.parentEmail = parentEmail || null;
      }

      // Update phones
      if (phone !== undefined) {
        updateData.phone = formatPhone(phone);
      }

      if (parentPhone1 !== undefined) {
        updateData.parentPhone1 = formatPhone(parentPhone1);
      }

      if (parentPhone2 !== undefined) {
        updateData.parentPhone2 = formatPhone(parentPhone2);
      }

      // Update aadhaar card
      if (aadhaarCard !== undefined) {
        updateData.aadhaarCard = aadhaarCard || null;
      }

      // Update address
      if (address !== undefined) {
        updateData.address = address ? address.trim() : null;
      }

      // Update client fields
      if (clientEmail1 !== undefined) {
        updateData.clientEmail1 = clientEmail1 || null;
      }

      if (clientEmail2 !== undefined) {
        updateData.clientEmail2 = clientEmail2 || null;
      }

      if (clientPhone1 !== undefined) {
        updateData.clientPhone1 = formatPhone(clientPhone1);
      }

      if (clientPhone2 !== undefined) {
        updateData.clientPhone2 = formatPhone(clientPhone2);
      }

      // Use findOneAndUpdate with ORIGINAL phone
      const person = await People.findOneAndUpdate(
        {
          name: originalName,
          phone: originalPhoneFormatted,
        },
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        }
      );

      const student = await Student.findOneAndUpdate(
        {
          name: originalName,
          phone: originalPhoneFormatted,
        },
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!person) {
        return res.status(404).json({
          success: false,
          message: "Person not found with the given name and phone",
        });
      }

      // console.log("✅ Person updated successfully:", person._id);

      res.status(200).json({
        success: true,
        message: "Person updated successfully",
        person: {
          name: person.name,
          category: person.category,
          batch: person.batch || "",
          email: person.email || null,
          parentEmail: person.parentEmail || null,
          phone: person.phone,
          parentPhone1: person.parentPhone1 || null,
          parentPhone2: person.parentPhone2 || null,
          aadhaarCard: person.aadhaarCard || null,
          address: person.address || null,
          clientEmail1: person.clientEmail1 || null,
          clientEmail2: person.clientEmail2 || null,
          clientPhone1: person.clientPhone1 || null,
          clientPhone2: person.clientPhone2 || null,
          disabled: person.disabled,
          createdAt: person.createdAt,
          updatedAt: person.updatedAt,
        },
      });
    } catch (error) {
      console.error("❌ Error updating person:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/people/bulk-upload
 * @desc    Bulk upload people from Excel file
 * @access  Public
 */
router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // console.log("📤 Processing bulk upload...");

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // console.log(`📊 Found ${data.length} rows in Excel file`);

    const successfulUploads = [];
    const failedUploads = [];

    for (const row of data) {
      try {
        // Validate required fields
        if (!row.name || !row.category || !row.phone) {
          failedUploads.push({
            row,
            error: "Missing required fields (name, category, or phone)",
          });
          continue;
        }

        // Validate phone format
        const phoneStr = String(row.phone).replace(/\D/g, "");
        if (phoneStr.length !== 10) {
          failedUploads.push({
            row,
            error: "Phone must be 10 digits",
          });
          continue;
        }

        // Validate category
        if (
          ![
            "IT-Nexcore",
            "marketing-junction",
            "FSD",
            "BVOC",
            "HR",
            "DM",
            "Operations Department",
          ].includes(row.category)
        ) {
          failedUploads.push({
            row,
            error: "Invalid category",
          });
          continue;
        }

        // Validate batch for FSD and BVOC
        if (["FSD", "BVOC"].includes(row.category) && !row.batch) {
          failedUploads.push({
            row,
            error: "Batch is required for FSD and BVOC categories",
          });
          continue;
        }

        const phoneWithCountryCode = "91" + phoneStr;

        // Check for duplicate
        const existing = await People.findOne({ phone: phoneWithCountryCode });
        if (existing) {
          failedUploads.push({
            row,
            error: "Phone number already exists",
          });
          continue;
        }

        // Prepare person data
        const personData = {
          name: String(row.name).trim(),
          category: row.category,
          batch: row.batch || "",
          phone: phoneWithCountryCode,
          disabled: false,
        };

        // Add optional fields
        if (row.email) {
          personData.email = String(row.email).trim();
        }

        if (row.parentEmail) {
          personData.parentEmail = String(row.parentEmail).trim();
        }

        if (row.parentPhone1) {
          const pp1 = String(row.parentPhone1).replace(/\D/g, "");
          if (pp1.length === 10) {
            personData.parentPhone1 = "91" + pp1;
          }
        }

        if (row.parentPhone2) {
          const pp2 = String(row.parentPhone2).replace(/\D/g, "");
          if (pp2.length === 10) {
            personData.parentPhone2 = "91" + pp2;
          }
        }

        if (row.aadhaarCard) {
          const aadhaar = String(row.aadhaarCard).replace(/\D/g, "");
          if (aadhaar.length === 12) {
            personData.aadhaarCard = aadhaar;
          }
        }

        if (row.address) {
          personData.address = String(row.address).trim().substring(0, 200);
        }

        // Add client fields from bulk upload
        if (row.clientEmail1) {
          personData.clientEmail1 = String(row.clientEmail1).trim();
        }

        if (row.clientEmail2) {
          personData.clientEmail2 = String(row.clientEmail2).trim();
        }

        if (row.clientPhone1) {
          const cp1 = String(row.clientPhone1).replace(/\D/g, "");
          if (cp1.length === 10) {
            personData.clientPhone1 = "91" + cp1;
          }
        }

        if (row.clientPhone2) {
          const cp2 = String(row.clientPhone2).replace(/\D/g, "");
          if (cp2.length === 10) {
            personData.clientPhone2 = "91" + cp2;
          }
        }

        // Create person
        const newPerson = new People(personData);
        await newPerson.save();

        successfulUploads.push({
          name: personData.name,
          phone: personData.phone,
        });
      } catch (error) {
        failedUploads.push({
          row,
          error: error.message,
        });
      }
    }

    // console.log(
    //   `✅ Bulk upload completed: ${successfulUploads.length} success, ${failedUploads.length} failed`
    // );

    res.status(200).json({
      success: true,
      message: `Bulk upload completed: ${successfulUploads.length} successful, ${failedUploads.length} failed`,
      count: successfulUploads.length,
      successful: successfulUploads,
      failed: failedUploads,
    });
  } catch (error) {
    console.error("❌ Bulk upload error:", error);
    res.status(500).json({
      success: false,
      message: "Bulk upload failed",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/people/template
 * @desc    Download Excel template for bulk upload
 * @access  Public
 */
router.get("/template", (req, res) => {
  try {
    // console.log("📥 Generating Excel template...");

    // Create template data
    const templateData = [
      {
        name: "John Doe",
        category: "FSD",
        batch: "B-1 (June-2025)",
        phone: "9876543210",
        email: "john@example.com",
        parentEmail: "parent@example.com",
        parentPhone1: "9876543211",
        parentPhone2: "9876543212",
        aadhaarCard: "123456789012",
        address: "123 Main Street, City",
        clientEmail1: "client1@example.com",
        clientEmail2: "client2@example.com",
        clientPhone1: "9876543213",
        clientPhone2: "9876543214",
      },
      {
        name: "Jane Smith",
        category: "BVOC",
        batch: "B-1 2025",
        phone: "9876543215",
        email: "",
        parentEmail: "",
        parentPhone1: "",
        parentPhone2: "",
        aadhaarCard: "",
        address: "",
        clientEmail1: "",
        clientEmail2: "",
        clientPhone1: "",
        clientPhone2: "",
      },
    ];

    // Create worksheet
    const worksheet = xlsx.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 20 }, // name
      { wch: 20 }, // category
      { wch: 20 }, // batch
      { wch: 15 }, // phone
      { wch: 25 }, // email
      { wch: 25 }, // parentEmail
      { wch: 15 }, // parentPhone1
      { wch: 15 }, // parentPhone2
      { wch: 15 }, // aadhaarCard
      { wch: 30 }, // address
      { wch: 25 }, // clientEmail1
      { wch: 25 }, // clientEmail2
      { wch: 15 }, // clientPhone1
      { wch: 15 }, // clientPhone2
    ];

    // Create workbook
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "People Template");

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Set headers
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=people-template.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // console.log("✅ Template generated successfully");
    res.send(buffer);
  } catch (error) {
    console.error("❌ Error generating template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate template",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/people/stats/summary
 * @desc    Get statistics summary
 * @access  Public
 */
router.get("/stats/summary", async (req, res) => {
  try {
    // console.log("📊 Fetching statistics...");

    const total = await People.countDocuments();
    const totalDisabled = await People.countDocuments({ disabled: true });
    const totalEnabled = total - totalDisabled;

    // Count by category
    const categoryStats = await People.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Count by batch
    const batchStats = await People.aggregate([
      {
        $match: {
          category: { $in: ["FSD", "BVOC"] },
          batch: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: { category: "$category", batch: "$batch" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.category": 1, "_id.batch": 1 } },
    ]);

    // Count disabled by category
    const disabledByCategory = await People.aggregate([
      { $match: { disabled: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const withAadhaar = await People.countDocuments({
      aadhaarCard: { $exists: true, $ne: null },
    });

    const withAddress = await People.countDocuments({
      address: { $exists: true, $ne: null },
    });

    const stats = {
      total,
      totalEnabled,
      totalDisabled,
      withAadhaar,
      withAddress,
      byCategory: categoryStats.map((s) => ({
        category: s._id,
        count: s.count,
      })),
      byBatch: batchStats.map((s) => ({
        category: s._id.category,
        batch: s._id.batch,
        count: s.count,
      })),
      disabledByCategory: disabledByCategory.map((s) => ({
        category: s._id,
        count: s.count,
      })),
    };

    // console.log("✅ Statistics fetched successfully");

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/people/:id
 * @desc    Get a single person by ID
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    // console.log("🔍 Fetching person by ID:", req.params.id);

    const person = await People.findById(req.params.id);

    if (!person) {
      console.error("❌ Person not found:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Person not found",
      });
    }

    // console.log("✅ Person found:", person.name);

    res.json({
      success: true,
      person: {
        _id: person._id,
        name: person.name,
        category: person.category,
        batch: person.batch || "",
        phone: person.phone ? person.phone.toString().slice(-10) : null,
        parentPhone1: person.parentPhone1
          ? person.parentPhone1.toString().slice(-10)
          : null,
        parentPhone2: person.parentPhone2
          ? person.parentPhone2.toString().slice(-10)
          : null,
        aadhaarCard: person.aadhaarCard || null,
        address: person.address || null,
        email: person.email || null,
        parentEmail: person.parentEmail || null,
        clientEmail1: person.clientEmail1 || null,
        clientEmail2: person.clientEmail2 || null,
        clientPhone1: person.clientPhone1
          ? person.clientPhone1.toString().slice(-10)
          : null,
        clientPhone2: person.clientPhone2
          ? person.clientPhone2.toString().slice(-10)
          : null,
        disabled: person.disabled || false,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching person:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/people/:id
 * @desc    Toggle disable/enable status of a person
 * @access  Public
 */
router.patch("/:id", async (req, res) => {
  try {
    const { disabled } = req.body;
    const personName = req.params.id;

    // console.log("🔄 Toggle disable request:", {
    //   personName,
    //   newDisabledState: disabled,
    // });

    // Validate disabled field
    if (typeof disabled !== "boolean") {
      console.error("❌ Invalid disabled value:", disabled);
      return res.status(400).json({
        success: false,
        message: "disabled field must be a boolean value",
      });
    }

    const person = await People.findOneAndUpdate(
      { name: personName },
      { $set: { disabled } },
      { new: true, runValidators: true }
    );

    if (!person) {
      console.error("❌ Person not found:", personName);
      return res.status(404).json({
        success: false,
        message: "Person not found",
      });
    }

    const action = disabled ? "disabled" : "enabled";
    //  console.log(`✅ Person ${action} successfully:`, person.name);

    res.status(200).json({
      success: true,
      message: `Person ${action} successfully`,
      person: {
        name: person.name,
        category: person.category,
        batch: person.batch || "",
        phone: person.phone,
        parentPhone1: person.parentPhone1 || null,
        parentPhone2: person.parentPhone2 || null,
        aadhaarCard: person.aadhaarCard || null,
        address: person.address || null,
        email: person.email || null,
        parentEmail: person.parentEmail || null,
        clientEmail1: person.clientEmail1 || null,
        clientEmail2: person.clientEmail2 || null,
        clientPhone1: person.clientPhone1 || null,
        clientPhone2: person.clientPhone2 || null,
        disabled: person.disabled,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error toggling disable status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/people/:id
 * @desc    Delete a person
 * @access  Public
 */
router.delete("/:id", async (req, res) => {
  try {
    // console.log("🗑️ Deleting person:", req.params.id);

    const deleted = await People.findByIdAndDelete(req.params.id);

    if (!deleted) {
      console.error("❌ Person not found:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Person not found",
      });
    }

    const studentDeleted = await Student.findOneAndDelete({
      name: deleted.name,
    });

    // console.log("✅ Person deleted successfully:", deleted.name);

    res.status(200).json({
      success: true,
      message: "Person deleted successfully",
      deletedPerson: {
        name: deleted.name,
        category: deleted.category,
      },
    });
  } catch (error) {
    console.error("❌ Error deleting person:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
