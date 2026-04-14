import mongoose, { Schema, Document, Model } from 'mongoose'

interface LabTest {
  name: string
  result?: string
  unit?: string
  referenceRange?: string
  status: 'pending' | 'processing' | 'completed'
  isAbnormal?: boolean
}

export interface ILabReport extends Document {
  patientId: mongoose.Types.ObjectId
  requestedBy: mongoose.Types.ObjectId
  processedBy?: mongoose.Types.ObjectId
  hospitalId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  tests: LabTest[]
  status: 'pending' | 'processing' | 'completed'
  reportUrl?: string
  urgency: 'routine' | 'urgent' | 'stat'
  notes?: string
  collectedAt?: Date
  reportedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const LabReportSchema = new Schema<ILabReport>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    tests: [
      {
        name: { type: String, required: true },
        result: String,
        unit: String,
        referenceRange: String,
        status: {
          type: String,
          enum: ['pending', 'processing', 'completed'],
          default: 'pending',
        },
        isAbnormal: Boolean,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed'],
      default: 'pending',
    },
    reportUrl: String,
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'stat'],
      default: 'routine',
    },
    notes: String,
    collectedAt: Date,
    reportedAt: Date,
  },
  { timestamps: true }
)

LabReportSchema.index({ hospitalId: 1, status: 1 })
LabReportSchema.index({ patientId: 1, createdAt: -1 })

const LabReport: Model<ILabReport> =
  mongoose.models.LabReport || mongoose.model<ILabReport>('LabReport', LabReportSchema)
export default LabReport
