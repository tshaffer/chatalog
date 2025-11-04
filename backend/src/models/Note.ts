import mongoose, { Schema, Document } from 'mongoose';

export interface NoteDoc extends Document {
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

const SourceSchema = new Schema(
  {
    url: { type: String },
    type: { type: String, enum: ['chatworthy', 'clip', 'manual'] },
  },
  { _id: false }
);

const NoteSchema = new Schema<NoteDoc>(
  {
    subjectId: { type: String },
    topicId: { type: String },

    title: { type: String, required: true, default: 'Untitled' },
    slug: { type: String, required: true, index: true },
    markdown: { type: String, required: true, default: '' },
    summary: { type: String },
    tags: { type: [String], default: [] },

    links: { type: [String], default: [] },
    backlinks: { type: [String], default: [] },

    sources: { type: [SourceSchema], default: [] },
  },
  { timestamps: true }
);

export const NoteModel = mongoose.model<NoteDoc>('Note', NoteSchema);
