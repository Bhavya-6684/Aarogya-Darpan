import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAccessRequest extends Document {
  doctorId: mongoose.Types.ObjectId
  doctorName: string
  hospitalName: string
  patientId: mongoose.Types.ObjectId
  patientUserId: mongoose.Types.ObjectId
  status: 'pending' | 'accepted' | 'denied'
  requestedAt: Date
  respondedAt?: Date
  notificationId?: mongoose.Types.ObjectId
  createdAt: Date
}

const AccessRequestSchema = new Schema<IAccessRequest>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String, required: true },
    hospitalName: { type: String, default: '' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'denied'],
      default: 'pending',
    },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: Date,
    notificationId: { type: Schema.Types.ObjectId, ref: 'Notification' },
  },
  { timestamps: true }
)

AccessRequestSchema.index({ patientUserId: 1, status: 1 })
AccessRequestSchema.index({ doctorId: 1 })

const AccessRequest: Model<IAccessRequest> =
  mongoose.models.AccessRequest || mongoose.model<IAccessRequest>('AccessRequest', AccessRequestSchema)
export default AccessRequest
