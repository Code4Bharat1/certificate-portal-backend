import mongoose from 'mongoose';

const peopleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['code4bharat', 'marketing-junction', 'fsd', 'bvoc', 'hr'],
      required: true,
    },
    batch: {
      type: String,
      required: false,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/, // validates 10-digit phone number
    },
  },
  { timestamps: true }
);

const People = mongoose.model('People', peopleSchema);
export default People;
