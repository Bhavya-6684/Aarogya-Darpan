import mongoose, { Schema, Document, Model } from 'mongoose'

interface Prescription {
  drug: string
  dosage: string
  frequency: string
  duration: string
  route?: string
  instructions?: string
}

interface Vitals {
  bp?: string
  pulse?: number
  temp?: number
  weight?: number
  height?: number
  spO2?: number
  rbs?: number
}

export interface IMedicalRecord extends Document {
  patientId: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  hospitalId: mongoose.Types.ObjectId
  diagnosis: string
  icdCode?: string
  symptoms: string[]
  prescriptions: Prescription[]
  vitals: Vitals
  investigations?: string[]
  followUpDate?: Date
  notes?: string
  attachments?: string[]
  createdAt: Date
  updatedAt: Date
}

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    diagnosis: { type: String, required: true },
    icdCode: String,
    symptoms: [{ type: String }],
    prescriptions: [
      {
        drug: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        route: String,
        instructions: String,
      },
    ],
    vitals: {
      bp: String,
      pulse: Number,
      temp: Number,
      weight: Number,
      height: Number,
      spO2: Number,
      rbs: Number,
    },
    investigations: [{ type: String }],
    followUpDate: Date,
    notes: String,
    attachments: [{ type: String }],
  },
  { timestamps: true }
)

MedicalRecordSchema.index({ patientId: 1, createdAt: -1 })
MedicalRecordSchema.index({ doctorId: 1, createdAt: -1 })

const MedicalRecord: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord ||
  mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema)
export default MedicalRecord
