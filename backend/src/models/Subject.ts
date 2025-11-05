// models/Subject.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { applyToJSON } from '../db/toJsonPlugin';

export interface SubjectDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<SubjectDoc>(
  { name: { type: String, required: true, trim: true, unique: true }, slug: { type: String, index: true } },
  { timestamps: true }
);

applyToJSON(SubjectSchema);

export const SubjectModel = mongoose.model<SubjectDoc>('Subject', SubjectSchema);
