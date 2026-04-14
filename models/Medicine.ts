import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMedicine extends Document {
  hospitalId: mongoose.Types.ObjectId
  name: string
  genericName: string
  category: string
  manufacturer: string
  batchNumber: string
  expiryDate: Date
  quantity: number
  minStockLevel: number
  unitPrice: number
  sellingPrice: number
  unit: string // tablets, ml, mg, capsules, etc.
  description?: string
  addedBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const MedicineSchema = new Schema<IMedicine>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    category: { type: String, required: true }, // Antibiotic, Painkiller, Antiviral etc.
    manufacturer: { type: String, trim: true },
    batchNumber: { type: String, trim: true },
    expiryDate: { type: Date, required: true },
    quantity: { type: Number, required: true, default: 0 },
    minStockLevel: { type: Number, default: 10 },
    unitPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    unit: { type: String, default: 'tablet' },
    description: String,
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

MedicineSchema.index({ hospitalId: 1, name: 1 })
MedicineSchema.index({ expiryDate: 1 })

const Medicine: Model<IMedicine> =
  mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema)

export default Medicine
