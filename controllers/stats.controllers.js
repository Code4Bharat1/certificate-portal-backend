// stats.controllers.js - COMPLETE FILE
import Certificate from "../models/certificate.models.js";
import ActivityLog from "../models/activitylog.models.js";
import Letter from "../models/letter.models.js";
import User from "../models/user.models.js";

export const getDashboardStatistics = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ✅ FIXED: Unified category mapping
    const categoryMapping = {
      "marketing-junction": "marketing-junction",
      marketingjunction: "marketing-junction",
      MarketingJunction: "marketing-junction",
      "it-nexcore": "it-nexcore",
      itnexcore: "it-nexcore",
      code4bharat: "it-nexcore",
      fsd: "fsd",
      FSD: "fsd",
      hr: "hr",
      HR: "hr",
      bootcamp: "bootcamp",
      BOOTCAMP: "bootcamp",
      bvoc: "bvoc",
      BVOC: "bvoc",
      dm: "dm",
      DM: "dm",
      operations: "operations",
      OD: "operations",
      Operations: "operations",
      client: "client",
      Client: "client",
    };

    // ✅ FIXED: Helper to normalize category names
    const normalizeCategory = (category) => {
      return categoryMapping[category] || category.toLowerCase();
    };

    // ✅ FIXED: Merge results with proper normalization
    const mergeAggResults = (certData, letterData) => {
      const map = new Map();

      [...certData, ...letterData].forEach((item) => {
        const normalizedCategory = normalizeCategory(item._id);

        if (!map.has(normalizedCategory)) {
          map.set(normalizedCategory, { _id: normalizedCategory, count: 0 });
        }
        map.get(normalizedCategory).count += item.count;
      });

      return [...map.values()];
    };

    // ------------------- CERTIFICATE + LETTER STATS ------------------- //

    // LAST 7 DAYS
    const certLast7 = await Certificate.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const letterLast7 = await Letter.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const last7Days = mergeAggResults(certLast7, letterLast7);

    // LAST 30 DAYS
    const certLast30 = await Certificate.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const letterLast30 = await Letter.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const lastMonth = mergeAggResults(certLast30, letterLast30);

    // DOWNLOADED
    const certDownloaded = await Certificate.aggregate([
      { $match: { status: "downloaded" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const letterDownloaded = await Letter.aggregate([
      { $match: { status: "downloaded" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const downloaded = mergeAggResults(certDownloaded, letterDownloaded);

    // PENDING
    const certPending = await Certificate.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const letterPending = await Letter.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const pending = mergeAggResults(certPending, letterPending);

    // CATEGORY TOTALS (CERT + LETTER)
    const certCategoryStats = await Certificate.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          downloaded: {
            $sum: { $cond: [{ $eq: ["$status", "downloaded"] }, 1, 0] },
          },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        },
      },
    ]);

    const letterCategoryStats = await Letter.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          downloaded: {
            $sum: { $cond: [{ $eq: ["$status", "downloaded"] }, 1, 0] },
          },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        },
      },
    ]);

    // ✅ FIXED: Merge category stats properly
    const categoryStatsArray = [...certCategoryStats, ...letterCategoryStats];
    const categoryStats = categoryStatsArray.reduce((acc, item) => {
      const normalizedKey = normalizeCategory(item._id);

      if (!acc[normalizedKey]) {
        acc[normalizedKey] = { total: 0, downloaded: 0, pending: 0 };
      }
      acc[normalizedKey].total += item.total;
      acc[normalizedKey].downloaded += item.downloaded;
      acc[normalizedKey].pending += item.pending;
      return acc;
    }, {});

    // ------------------- BULK CERTIFICATE STATS ------------------- //

    const bulkGeneratedLast7Days = await ActivityLog.aggregate([
      { $match: { action: "bulk_created", timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: null,
          totalBulkOperations: { $sum: 1 },
          totalCertificates: { $sum: "$count" },
        },
      },
    ]);

    const bulkGeneratedLastMonth = await ActivityLog.aggregate([
      {
        $match: { action: "bulk_created", timestamp: { $gte: thirtyDaysAgo } },
      },
      {
        $group: {
          _id: null,
          totalBulkOperations: { $sum: 1 },
          totalCertificates: { $sum: "$count" },
        },
      },
    ]);

    const bulkDownloads = await ActivityLog.aggregate([
      { $match: { action: "bulk_downloaded" } },
      {
        $group: {
          _id: null,
          totalBulkDownloads: { $sum: 1 },
          totalCertificatesDownloaded: { $sum: "$count" },
        },
      },
    ]);

    // ------------------- CREATION RATIO (CERT + LETTER) ------------------- //
    const certCount = await Certificate.countDocuments();
    const letterCount = await Letter.countDocuments();

    const totalBulkCreated = bulkGeneratedLastMonth[0]?.totalCertificates || 0;
    const totalCertificates = certCount + letterCount;
    const individualCreated = Math.max(0, totalCertificates - totalBulkCreated);

    // ✅ FIXED: Format stats with proper calculation
    const formatStats = (data) => {
      const result = {
        total: 0,
        "marketing-junction": 0,
        "it-nexcore": 0,
        fsd: 0,
        hr: 0,
        bootcamp: 0,
        bvoc: 0,
        dm: 0,
        operations: 0,
        client: 0,
      };

      // ✅ Calculate totals properly
      data.forEach((item) => {
        const normalizedKey = normalizeCategory(item._id);

        // Add to total
        result.total += item.count;

        // Add to specific category
        if (result.hasOwnProperty(normalizedKey)) {
          result[normalizedKey] += item.count;
        } else {
          console.warn(
            `⚠️ Unmapped category found: ${item._id} (normalized: ${normalizedKey})`
          );
          // Still add to total even if category is unmapped
        }
      });

      // ✅ Debug log
      console.log("📊 Formatted Stats:", JSON.stringify(result, null, 2));

      return result;
    };

    const formattedStats = {
      last7Days: formatStats(last7Days),
      lastMonth: formatStats(lastMonth),
      downloaded: formatStats(downloaded),
      pending: formatStats(pending),
    };

    // ✅ Debug logs for verification
    console.log("🔍 Raw Data:");
    console.log("Last 7 Days:", last7Days);
    console.log("Last Month:", lastMonth);
    console.log("Downloaded:", downloaded);
    console.log("Pending:", pending);

    res.json({
      success: true,
      data: {
        ...formattedStats,
        categories: categoryStats,
        bulk: {
          last7Days: {
            operations: bulkGeneratedLast7Days[0]?.totalBulkOperations || 0,
            certificates: bulkGeneratedLast7Days[0]?.totalCertificates || 0,
          },
          lastMonth: {
            operations: bulkGeneratedLastMonth[0]?.totalBulkOperations || 0,
            certificates: bulkGeneratedLastMonth[0]?.totalCertificates || 0,
          },
          downloads: {
            operations: bulkDownloads[0]?.totalBulkDownloads || 0,
            certificates: bulkDownloads[0]?.totalCertificatesDownloaded || 0,
          },
        },
        creationRatio: {
          individual: individualCreated,
          bulk: totalBulkCreated,
          total: totalCertificates,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getActivityLog = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const activities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("adminId", "username email name")
      .lean();

    const formattedActivities = activities.map((activity) => {
      let action = "";
      let details = "";

      switch (activity.action) {
        case "bulk_created":
          action = "Bulk Certificate Generation";
          details = `${activity.count} certificates created`;
          break;
        case "bulk_downloaded":
          action = "Bulk Certificate Download";
          details = `${activity.count} certificates downloaded`;
          break;
        case "created":
          action = "Certificate Created";
          details = activity.userName || "User";
          break;
        case "downloaded":
          action = "Certificate Downloaded";
          details = activity.userName || "User";
          break;
        case "updated":
          action = "Certificate Updated";
          details = activity.userName || "User";
          break;
        case "deleted":
          action = "Certificate Deleted";
          details = activity.userName || "User";
          break;
        default:
          action = `Certificate ${
            activity.action.charAt(0).toUpperCase() + activity.action.slice(1)
          }`;
          details = activity.userName || "User";
      }

      return {
        action,
        user: details,
        id: activity.certificateId || "-",
        time: getTimeAgo(activity.timestamp),
        type: activity.action,
        count: activity.count || 1,
        admin: activity.adminId?.name || activity.adminId?.username || "System",
      };
    });

    res.json({
      success: true,
      data: formattedActivities,
    });
  } catch (error) {
    console.error("❌ Get activity log error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";

  return "Just now";
}
