import mongoose, { Schema, Document } from 'mongoose';

export interface ICallHistory extends Document {
  callId: string;
  caller: string; // User ID
  callee: string; // User ID  
  callType: 'audio' | 'video';
  status: 'completed' | 'missed' | 'declined' | 'failed';
  duration: number; // in seconds
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
}

const callHistorySchema: Schema = new Schema({
  callId: {
    type: String,
    required: true,
    unique: true
  },
  caller: {
    type: String,
    required: true,
    ref: 'User'
  },
  callee: {
    type: String,
    required: true,
    ref: 'User'
  },
  callType: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'missed', 'declined', 'failed'],
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
callHistorySchema.index({ caller: 1, createdAt: -1 });
callHistorySchema.index({ callee: 1, createdAt: -1 });
callHistorySchema.index({ callId: 1 });

export const CallHistoryModel = mongoose.model<ICallHistory>('CallHistory', callHistorySchema);