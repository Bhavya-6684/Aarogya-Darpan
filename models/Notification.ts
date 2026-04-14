import mongoose, { Schema, Document, Model } from 'mongoose'

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId
  type: 'access_request' | 'appointment' | 'prescription' | 'lab_result' | 'bill' | 'general'
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  actionable: boolean
  actionTaken?: 'accepted' | 'denied'
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['access_request', 'appointment', 'prescription', 'lab_result', 'bill', 'general'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    actionable: { type: Boolean, default: false },
    actionTaken: { type: String, enum: ['accepted', 'denied'] },
  },
  { timestamps: true }
)

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 })

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)
export default Notification
