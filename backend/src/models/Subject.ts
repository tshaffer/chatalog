import { Schema, model, Document } from 'mongoose';

export interface SubjectDoc extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<SubjectDoc>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });

export const SubjectModel = model<SubjectDoc>('Subject', SubjectSchema);
