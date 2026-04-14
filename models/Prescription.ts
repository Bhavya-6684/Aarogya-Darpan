import mongoose, { Schema, Document, Model } from 'mongoose'

interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
  route?: string
  instructions?: string
}

export interface IPrescription extends Document {
  patientId: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId
  hospitalId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  tokenNumber: string
  diagnosis: string
  symptoms: string[]
  medicines: Medicine[]
  vitals?: {
    bp?: string
    pulse?: number
    temp?: number
    weight?: number
    spO2?: number
  }
  notes?: string
  followUpDate?: Date
  dispensed: boolean
  dispensedAt?: Date
  dispensedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

function generateToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    tokenNumber: {
      type: String,
      default: generateToken,
      unique: true,
    },
    diagnosis: { type: String, required: true },
    symptoms: [{ type: String }],
    medicines: [
      {
        name: { type: String, required: true },
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
      spO2: Number,
    },
    notes: String,
    followUpDate: Date,
    dispensed: { type: Boolean, default: false },
    dispensedAt: Date,
    dispensedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

PrescriptionSchema.index({ patientId: 1, createdAt: -1 })
PrescriptionSchema.index({ tokenNumber: 1 })
PrescriptionSchema.index({ hospitalId: 1, createdAt: -1 })

const Prescription: Model<IPrescription> =
  mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema)
export default Prescription
