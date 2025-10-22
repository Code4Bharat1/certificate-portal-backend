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

    const formatStats = (data) => {
      const mj = data.find(d => d._id === 'marketing-junction')?.count || 0;
      const c4b = data.find(d => d._id === 'code4bharat')?.count || 0;
      return { total: mj + c4b, marketingJunction: mj, code4bharat: c4b };
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
      }
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
        categories: formattedCategories
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

    const formattedActivities = activities.map(activity => ({
      action: `Certificate ${activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}`,
      user: activity.userName,
      id: activity.certificateId,
      time: getTimeAgo(activity.timestamp),
      type: activity.action
    }));

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