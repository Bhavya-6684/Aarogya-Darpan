import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPatient extends Document {
  userId: mongoose.Types.ObjectId
  hospitalId?: mongoose.Types.ObjectId
  uhid: string
  dob: Date
  gender: string
  bloodGroup?: string
  address?: string
  allergies: string[]
  chronicConditions: string[]
  emergencyContact: {
    name?: string
    relation?: string
    phone?: string
  }
  createdAt: Date
  updatedAt: Date
}

const PatientSchema = new Schema<IPatient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
    uhid: { type: String, required: true, unique: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    bloodGroup: String,
    address: String,
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },
  },
  { timestamps: true }
)

PatientSchema.index({ hospitalId: 1 })

const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema)
export default Patient
