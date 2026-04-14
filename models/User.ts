import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  role: 'patient' | 'hospital_admin' | 'doctor' | 'receptionist' | 'lab_technician' | 'pharmacy'
  hospitalId?: mongoose.Types.ObjectId
  isActive: boolean
  profileImage?: string
  phone?: string
  specialization?: string
  department?: string
  opdFee?: number
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['patient', 'hospital_admin', 'doctor', 'receptionist', 'lab_technician', 'pharmacy'],
      required: true,
    },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
    isActive: { type: Boolean, default: true },
    profileImage: String,
    phone: String,
    specialization: String,
    department: String,
    opdFee: { type: Number, default: 300 },
  },
  { timestamps: true }
)

UserSchema.index({ hospitalId: 1, role: 1 })

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export default User
