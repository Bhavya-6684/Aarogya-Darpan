import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IHospital extends Document {
  name: string
  address: {
    street: string
    city: string
    state: string
    pincode: string
  }
  phone: string
  email: string
  licenseNumber: string
  adminId: mongoose.Types.ObjectId
  departments: string[]
  totalBeds: number
  website?: string
  logo?: string
  createdAt: Date
  updatedAt: Date
}

const HospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true, trim: true },
    address: {
      street: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: String,
    },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    licenseNumber: { type: String, unique: true, sparse: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    departments: [{ type: String }],
    totalBeds: { type: Number, default: 0 },
    website: String,
    logo: String,
  },
  { timestamps: true }
)

const Hospital: Model<IHospital> =
  mongoose.models.Hospital || mongoose.model<IHospital>('Hospital', HospitalSchema)
export default Hospital
