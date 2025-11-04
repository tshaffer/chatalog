import { Schema, model, Document } from 'mongoose';

export interface TopicDoc extends Document {
  subjectId: string;  // store Subject._id as string for simplicity
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<TopicDoc>({
  subjectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, index: true },
}, { timestamps: true });

TopicSchema.index({ subjectId: 1, slug: 1 }, { unique: true });

export const TopicModel = model<TopicDoc>('Topic', TopicSchema);
