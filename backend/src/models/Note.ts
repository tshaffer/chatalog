// models/Note.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { applyToJSON } from '../db/toJsonPlugin';

export interface NoteDoc extends Document {
  _id: Types.ObjectId;
  subjectId?: string;
  topicId?: string;
  title: string;
  slug: string;
  markdown: string;
  summary?: string;
  tags: string[];
  links: string[];
  backlinks: string[];
  sources?: { url?: string; type?: 'chatworthy'|'clip'|'manual' }[];
  createdAt: Date;
  updatedAt: Date;
}

type Source = { url?: string; type?: 'chatworthy'|'clip'|'manual' };

const SourceSchema = new Schema<Source>(
  { url: String, type: { type: String, enum: ['chatworthy', 'clip', 'manual'] } },
  { _id: false }
);

const NoteSchema = new Schema<NoteDoc>(
  {
    subjectId: { type: String },
    topicId: { type: String },
    title: { type: String, required: true, default: 'Untitled' },
    slug: { type: String, required: true, index: true },
    markdown: { type: String, required: true, default: '' },
    summary: String,
    tags: { type: [String], default: [] },
    links: { type: [String], default: [] },
    backlinks: { type: [String], default: [] },
    sources: { type: [SourceSchema], default: [] },
  },
  { timestamps: true }
);

applyToJSON(NoteSchema);

export const NoteModel = mongoose.model<NoteDoc>('Note', NoteSchema);
