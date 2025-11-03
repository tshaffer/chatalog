import type { Subject, Topic, NotePreview } from '@shared/types';

export interface TopicWithNotes extends Topic {
  notes: NotePreview[];
}
export interface SubjectWithTopics extends Subject {
  topics: TopicWithNotes[];
}

// Static sample data (replace with API later)
export const MOCK_HIERARCHY: SubjectWithTopics[] = [
  {
    _id: 'sub-ai',
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    topics: [
      {
        _id: 'top-prompt',
        subjectId: 'sub-ai',
        name: 'Prompt Engineering',
        slug: 'prompt-engineering',
        notes: [
          {
            _id: 'note-0001',
            title: 'Designing Effective Prompts',
            summary: 'Guidelines to reduce cognitive load in prompts.',
            tags: ['AIUX', 'PromptDesign'],
            updatedAt: new Date().toISOString()
          },
          {
            _id: 'note-0002',
            title: 'Attention Span in Conversational UI',
            summary: 'Patterns for sustaining focus in chat flows.',
            tags: ['AIUX', 'Attention'],
            updatedAt: new Date().toISOString()
          }
        ]
      },
      {
        _id: 'top-personas',
        subjectId: 'sub-ai',
        name: 'ChatGPT Personas',
        slug: 'chatgpt-personas',
        notes: [
          {
            _id: 'note-0003',
            title: 'Persona Guardrails',
            summary: 'How to balance creativity and reliability.',
            tags: ['Personas'],
            updatedAt: new Date().toISOString()
          }
        ]
      }
    ]
  }
];
