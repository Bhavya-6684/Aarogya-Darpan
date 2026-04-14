import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IBed extends Document {
  hospitalId: mongoose.Types.ObjectId
  ward: string
  bedNumber: string
  type: 'general' | 'ICU' | 'HDU' | 'private' | 'pediatric'
  status: 'available' | 'occupied' | 'maintenance'
  patientId?: mongoose.Types.ObjectId
  admittedAt?: Date
  floor?: string
  dailyRate?: number
  createdAt: Date
  updatedAt: Date
}

const BedSchema = new Schema<IBed>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    ward: { type: String, required: true },
    bedNumber: { type: String, required: true },
    type: {
      type: String,
      enum: ['general', 'ICU', 'HDU', 'private', 'pediatric'],
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available',
    },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
    admittedAt: Date,
    floor: String,
    dailyRate: { type: Number, default: 0 },
  },
  { timestamps: true }
)

BedSchema.index({ hospitalId: 1, status: 1 })
BedSchema.index({ hospitalId: 1, ward: 1 })

const Bed: Model<IBed> = mongoose.models.Bed || mongoose.model<IBed>('Bed', BedSchema)
export default Bed
