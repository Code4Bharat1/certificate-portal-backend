import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['marketing-junction', 'code4bharat']
  },
  course: {
    type: String,
    required: true,
    enum: [
      // code4bharat courses
      'Full Stack Certificate (MERN Stack)',
      'JavaScript Developer Certificate',
      'Advanced React Developer Certificate',
      'Node.js and Express.js Specialist Certificate',
      'MongoDB Professional Certificate',
      'Git & Version Control Expert Certificate',
      'Frontend Development Pro Certificate',
      'Backend Development Specialist Certificate',
      'Web Development Project Certificate',
      'Advanced Web Development Capstone Certificate',
      // marketing-junction courses
      'Digital Marketing Specialist Certificate',
      'Advanced SEO Specialist Certificate',
      'Social Media Marketing Expert Certificate',
      'Full Stack Digital Marketer Certificate',
      'AI-Powered Digital Marketing Specialist Certificate'
    ]
  },
  issueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'downloaded'],
    default: 'pending'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add this after the course field definition
certificateSchema.path('course').validate(function(course) {
  const code4bharatCourses = [
    'Full Stack Certificate (MERN Stack)',
    'JavaScript Developer Certificate',
    'Advanced React Developer Certificate',
    'Node.js and Express.js Specialist Certificate',
    'MongoDB Professional Certificate',
    'Git & Version Control Expert Certificate',
    'Frontend Development Pro Certificate',
    'Backend Development Specialist Certificate',
    'Web Development Project Certificate',
    'Advanced Web Development Capstone Certificate'
  ];
  
  const marketingJunctionCourses = [
    'Digital Marketing Specialist Certificate',
    'Advanced SEO Specialist Certificate',
    'Social Media Marketing Expert Certificate',
    'Full Stack Digital Marketer Certificate',
    'AI-Powered Digital Marketing Specialist Certificate'
  ];
  
  if (this.category === 'code4bharat') {
    return code4bharatCourses.includes(course);
  } else if (this.category === 'marketing-junction') {
    return marketingJunctionCourses.includes(course);
  }
  return false;
}, 'Course does not match the selected category');

// Update the updatedAt timestamp before saving
certificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Certificate', certificateSchema);