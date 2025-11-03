// server/src/data/chatalogData.ts
import type { Subject, Topic, Note } from '../../../shared/src/types';

export const subjects: Subject[] = [
  { _id: 's1', name: 'Development', slug: 'development', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: 's2', name: 'Travel', slug: 'travel', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const topics: Topic[] = [
  { _id: 't1', subjectId: 's1', name: 'React & Redux', slug: 'react-redux', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: 't2', subjectId: 's1', name: 'Databases', slug: 'databases', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: 't3', subjectId: 's2', name: 'Australia', slug: 'australia', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const notes: Note[] = [
  {
    _id: 'n1',
    subjectId: 's1',
    topicId: 't1',
    title: 'Chatalog Sidebar Plan',
    slug: 'chatalog-sidebar-plan',
    markdown: '# Sidebar\n- Static layout\n- Click handling via URL\n',
    summary: 'Static layout + click handling',
    tags: ['ui', 'routing'],
    links: [],
    backlinks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'n2',
    subjectId: 's1',
    topicId: 't2',
    title: 'Mongo Shapes',
    slug: 'mongo-shapes',
    markdown: '```ts\ntransactions: { id, description, startDate, endDate, categoryId }\n```',
    summary: 'Collections + basic schema',
    tags: ['db'],
    links: [],
    backlinks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'n3',
    subjectId: 's2',
    topicId: 't3',
    title: 'Itinerary #2 Merge',
    slug: 'itinerary-2-merge',
    markdown: 'See Day 1–21: Melbourne, Tasmania, Sydney, Noosa, Whitsundays, Port Douglas…',
    summary: 'Integrate T#1 into broader plan',
    tags: ['travel', 'aus'],
    links: [],
    backlinks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
