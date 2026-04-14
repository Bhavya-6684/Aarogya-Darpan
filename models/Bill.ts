import mongoose, { Schema, Document, Model } from 'mongoose'

interface BillItem {
  description: string
  category: 'consultation' | 'procedure' | 'medication' | 'lab' | 'room' | 'other'
  quantity: number
  unitPrice: number
  total: number
}

export interface IBill extends Document {
  patientId: mongoose.Types.ObjectId
  hospitalId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  billNumber: string
  items: BillItem[]
  subtotal: number
  discount: number
  tax: number
  totalAmount: number
  paidAmount: number
  status: 'pending' | 'partial' | 'paid' | 'cancelled'
  paymentMethod?: 'cash' | 'card' | 'UPI' | 'insurance' | 'cheque'
  paymentDate?: Date
  notes?: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BillSchema = new Schema<IBill>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    billNumber: { type: String, required: true, unique: true },
    items: [
      {
        description: { type: String, required: true },
        category: {
          type: String,
          enum: ['consultation', 'procedure', 'medication', 'lab', 'room', 'other'],
          default: 'other',
        },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'UPI', 'insurance', 'cheque'],
    },
    paymentDate: Date,
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

BillSchema.index({ hospitalId: 1, createdAt: -1 })
BillSchema.index({ patientId: 1, createdAt: -1 })

const Bill: Model<IBill> = mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema)
export default Bill
