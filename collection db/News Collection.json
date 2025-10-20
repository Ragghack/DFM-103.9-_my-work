{
  _id: ObjectId,
  title: String,
  slug: String,
  content: String,
  summary: String,
  category: {
    type: String,
    enum: ['politics', 'economy', 'sports', 'entertainment', 'technology']
  },
  author: { type: ObjectId, ref: 'User' },
  images: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  isBreaking: Boolean,
  featured: Boolean,
  tags: [String],
  location: String,
  sources: [String],
  views: Number,
  scheduleDate: Date,
  createdAt: Date,
  updatedAt: Date
}