import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId
  hospitalId: mongoose.Types.ObjectId
  type: 'OPD' | 'IPD' | 'Emergency' | 'Follow-up'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  scheduledAt: Date
  duration?: number // minutes
  notes?: string
  roomNumber?: string
  chiefComplaint?: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    type: {
      type: String,
      enum: ['OPD', 'IPD', 'Emergency', 'Follow-up'],
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 30 },
    notes: String,
    roomNumber: String,
    chiefComplaint: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

AppointmentSchema.index({ hospitalId: 1, scheduledAt: -1 })
AppointmentSchema.index({ doctorId: 1, scheduledAt: -1 })
AppointmentSchema.index({ patientId: 1, scheduledAt: -1 })

const Appointment: Model<IAppointment> =
  mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema)
export default Appointment
