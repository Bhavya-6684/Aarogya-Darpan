import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IEmergencyRegistration extends Document {
  tempId: string
  bedId?: mongoose.Types.ObjectId
  bedNumber?: string
  ward?: string
  hospitalId: mongoose.Types.ObjectId
  patientName: string
  patientAge?: number
  patientGender?: string
  phoneNumber?: string
  chiefComplaint: string
  admittedAt: Date
  status: 'active' | 'shifted' | 'discharged'
  shiftedToPatientId?: mongoose.Types.ObjectId
  shiftedAt?: Date
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
}

function generateTempId(): string {
  const prefix = 'TEMP'
  const ts = Date.now().toString(36).toUpperCase()
  return `${prefix}-${ts}`
}

const EmergencyRegistrationSchema = new Schema<IEmergencyRegistration>(
  {
    tempId: { type: String, default: generateTempId, unique: true },
    bedId: { type: Schema.Types.ObjectId, ref: 'Bed' },
    bedNumber: String,
    ward: String,
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patientName: { type: String, required: true },
    patientAge: Number,
    patientGender: String,
    phoneNumber: String,
    chiefComplaint: { type: String, required: true },
    admittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'shifted', 'discharged'],
      default: 'active',
    },
    shiftedToPatientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
    shiftedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

EmergencyRegistrationSchema.index({ hospitalId: 1, status: 1 })

const EmergencyRegistration: Model<IEmergencyRegistration> =
  mongoose.models.EmergencyRegistration ||
  mongoose.model<IEmergencyRegistration>('EmergencyRegistration', EmergencyRegistrationSchema)
export default EmergencyRegistration
