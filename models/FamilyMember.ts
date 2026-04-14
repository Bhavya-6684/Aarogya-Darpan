import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IFamilyMember extends Document {
  primaryPatientId: mongoose.Types.ObjectId
  name: string
  relation: string
  dob?: Date
  gender?: string
  bloodGroup?: string
  phone?: string
  allergies?: string[]
  chronicConditions?: string[]
  uhid?: string
  linkedPatientId?: mongoose.Types.ObjectId
  createdAt: Date
}

const FamilyMemberSchema = new Schema<IFamilyMember>(
  {
    primaryPatientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    name: { type: String, required: true },
    relation: { type: String, required: true },
    dob: Date,
    gender: String,
    bloodGroup: String,
    phone: String,
    allergies: [String],
    chronicConditions: [String],
    uhid: String,
    linkedPatientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
  },
  { timestamps: true }
)

FamilyMemberSchema.index({ primaryPatientId: 1 })

const FamilyMember: Model<IFamilyMember> =
  mongoose.models.FamilyMember || mongoose.model<IFamilyMember>('FamilyMember', FamilyMemberSchema)
export default FamilyMember
