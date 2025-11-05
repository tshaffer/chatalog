// models/Topic.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { applyToJSON } from '../db/toJsonPlugin';

export interface TopicDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  subjectId?: string;
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<TopicDoc>(
  { name: { type: String, required: true, trim: true }, subjectId: { type: String, index: true }, slug: { type: String, index: true } },
  { timestamps: true }
);

TopicSchema.index({ subjectId: 1, name: 1 }, { unique: true });

applyToJSON(TopicSchema);

export const TopicModel = mongoose.model<TopicDoc>('Topic', TopicSchema);
