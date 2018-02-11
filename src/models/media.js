import mongoose from 'mongoose'
import config from '../../config'

var tagSchema = new mongoose.Schema({
  name: String
});

const Media = new mongoose.Schema({
  name: { type: String },
  path: { type: String },
  checksum: { type: String },
  type: { type: String, enum: ['PHOTO', 'VIDEO', 'FILE'] },
  size: { type: Number },
  tags: [tagSchema]
})

Media.pre('save', function preSave(next) {
  const media = this
  next(null)
})

export default mongoose.model('media', Media)
export const MediaTypes = {
  PHOTO: 'PHOTO',
  VIDEO: 'VIDEO',
  FILE: 'FILE'
}
