import Certificate from '../models/certificate.models.js';
import ActivityLog from '../models/activitylog.models.js';

const getDashboardStatistics = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Last 7 days
    const last7Days = await Certificate.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Last month
    const lastMonth = await Certificate.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Downloaded
    const downloaded = await Certificate.aggregate([
      {
        $match: {
          status: 'downloaded'
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Pending
    const pending = await Certificate.aggregate([
      {
        $match: {
          status: 'pending'
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Category totals
    const categoryStats = await Certificate.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          downloaded: {
            $sum: { $cond: [{ $eq: ['$status', 'downloaded'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    // Bulk generation stats (last 7 days)
    const bulkGeneratedLast7Days = await ActivityLog.aggregate([
      {
        $match: {
          action: 'bulk_created',
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalBulkOperations: { $sum: 1 },
          totalCertificates: { $sum: '$count' }
        }
      }
    ]);

    // Bulk generation stats (last 30 days)
    const bulkGeneratedLastMonth = await ActivityLog.aggregate([
      {
        $match: {
          action: 'bulk_created',
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalBulkOperations: { $sum: 1 },
          totalCertificates: { $sum: '$count' }
        }
      }
    ]);

    // Total bulk downloads
    const bulkDownloads = await ActivityLog.aggregate([
      {
        $match: {
          action: 'bulk_downloaded'
        }
      },
      {
        $group: {
          _id: null,
          totalBulkDownloads: { $sum: 1 },
          totalCertificatesDownloaded: { $sum: '$count' }
        }
      }
    ]);

    // Individual vs Bulk certificate creation ratio
    const creationStats = await Certificate.aggregate([
      {
        $group: {
          _id: null,
          totalCertificates: { $sum: 1 }
        }
      }
    ]);

    const totalBulkCreated = bulkGeneratedLastMonth[0]?.totalCertificates || 0;
    const totalCertificates = creationStats[0]?.totalCertificates || 0;
    const individualCreated = totalCertificates - totalBulkCreated;

    console.log("individual: ", individualCreated);
    console.log("bulk created: ", totalBulkCreated);
    console.log("total certificates: ", totalCertificates);
    

    const formatStats = (data) => {
      const mj = data.find(d => d._id === 'marketing-junction')?.count || 0;
      const c4b = data.find(d => d._id === 'code4bharat')?.count || 0;
      const fsd = data.find(d => d._id === 'FSD')?.count || 0;
      const hr = data.find(d => d._id === 'HR')?.count || 0;
      const bc = data.find(d => d._id === 'BOOTCAMP')?.count || 0;
      const bvoc = data.find(d => d._id === 'BVOC')?.count || 0;
      return {
        total: mj + c4b + fsd + hr + bc + bvoc,
        marketingJunction: mj,
        code4bharat: c4b,
        FSD: fsd,
        HR: hr,
        BOOTCAMP: bc,
        BVOC: bvoc,
      };
    };

    // Format category stats for easier frontend consumption
    const formattedCategories = {
      'marketing-junction': {
        total: 0,
        downloaded: 0,
        pending: 0
      },
      'code4bharat': {
        total: 0,
        downloaded: 0,
        pending: 0
      },
      'FSD': {
        total: 0,
        downloaded: 0,
        pending: 0
      },
      'HR': {
        total: 0,
        downloaded: 0,
        pending: 0
      },
      'BOOTCAMP': {
        total: 0,
        downloaded: 0,
        pending: 0
      },
      'BVOC': {
        total: 0,
        downloaded: 0,
        pending: 0
      },
    };

    categoryStats.forEach(cat => {
      if (formattedCategories[cat._id]) {
        formattedCategories[cat._id] = {
          total: cat.total,
          downloaded: cat.downloaded,
          pending: cat.pending
        };
      }
    });

    res.json({
      success: true,
      data: {
        last7Days: formatStats(last7Days),
        lastMonth: formatStats(lastMonth),
        downloaded: formatStats(downloaded),
        pending: formatStats(pending),
        categories: formattedCategories,
        bulk: {
          last7Days: {
            operations: bulkGeneratedLast7Days[0]?.totalBulkOperations || 0,
            certificates: bulkGeneratedLast7Days[0]?.totalCertificates || 0
          },
          lastMonth: {
            operations: bulkGeneratedLastMonth[0]?.totalBulkOperations || 0,
            certificates: bulkGeneratedLastMonth[0]?.totalCertificates || 0
          },
          downloads: {
            operations: bulkDownloads[0]?.totalBulkDownloads || 0,
            certificates: bulkDownloads[0]?.totalCertificatesDownloaded || 0
          }
        },
        creationRatio: {
          individual: individualCreated,
          bulk: totalBulkCreated,
          total: totalCertificates
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const getActivityLog = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const activities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('adminId', 'username');

    const formattedActivities = activities.map(activity => {
      let action = '';
      let details = '';
      
      switch(activity.action) {
        case 'bulk_created':
          action = 'Bulk Certificate Generation';
          details = `${activity.count} certificates created`;
          break;
        case 'bulk_downloaded':
          action = 'Bulk Certificate Download';
          details = `${activity.count} certificates downloaded`;
          break;
        case 'created':
          action = 'Certificate Created';
          details = activity.userName;
          break;
        case 'downloaded':
          action = 'Certificate Downloaded';
          details = activity.userName;
          break;
        case 'updated':
          action = 'Certificate Updated';
          details = activity.userName;
          break;
        case 'deleted':
          action = 'Certificate Deleted';
          details = activity.userName;
          break;
        default:
          action = `Certificate ${activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}`;
          details = activity.userName;
      }

      return {
        action,
        user: details,
        id: activity.certificateId || '-',
        time: getTimeAgo(activity.timestamp),
        type: activity.action,
        count: activity.count || 1,
        admin: activity.adminId?.username || 'System'
      };
    });

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Helper function to format time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' mins ago';
  
  return 'Just now';
}

export default { getDashboardStatistics, getActivityLog };