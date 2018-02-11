import mongoose from 'mongoose'
import config from '../../config'

var tagSchema = new mongoose.Schema({
  name: String
});

const Media = new mongoose.Schema({
  name: { type: String },
  path: { type: String },
  thumbnail: { type: String },
  checksum: { type: String },
  type: { type: String, enum: ['PHOTO', 'VIDEO', 'FILE'] },
  width: { type: Number },
  height: { type: Number },
  tags: [tagSchema]
}, {
    timestamps: true
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
