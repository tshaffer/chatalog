import type { NotePreview } from '../../../shared/src/types';
import { fetchJSON } from '../lib/fetchJSON';

const API_BASE = '/api/v1';

export async function getNotesSample(): Promise<NotePreview> {
  return fetchJSON<NotePreview>(`${API_BASE}/notes/sample`);
}
