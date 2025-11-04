import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { List, ListItemButton, ListSubheader, Typography, Divider } from '@mui/material';
import { useGetSubjectsQuery, useGetTopicsForSubjectQuery } from '../features/subjects/subjectsApi';
import { Topic } from '@shared/types';

export default function Sidebar() {
  const { subjectSlug, topicSlug } = useParams();
  const navigate = useNavigate();

  // All subjects
  const { data: subjects = [], isLoading: sLoading } = useGetSubjectsQuery();

  // Selected subject by slug (client-side)
  const selectedSubject = useMemo(
    () => subjects.find((s) => s.slug === subjectSlug),
    [subjects, subjectSlug]
  );

  // Topics by subject **ID**
  const { data: topics = [], isLoading: tLoading } = useGetTopicsForSubjectQuery(
    selectedSubject?._id ?? '',
    { skip: !selectedSubject?._id }
  );

  return (
    <nav aria-label="Chatalog hierarchy" style={{ borderRight: '1px solid #eee', overflow: 'auto' }}>
      <List subheader={<ListSubheader component="div">Subjects</ListSubheader>} dense>
        {sLoading && <Typography variant="caption" sx={{ px: 2, py: 1 }}>Loading…</Typography>}
        {subjects.map((s) => (
          <ListItemButton
            key={s._id}
            selected={s.slug === subjectSlug}
            onClick={() => navigate(`/s/${s.slug}`)}
          >
            <Typography variant="body2">{s.name}</Typography>
          </ListItemButton>
        ))}
      </List>

      <Divider />

      <List subheader={<ListSubheader component="div">Topics</ListSubheader>} dense>
        {selectedSubject && tLoading && (
          <Typography variant="caption" sx={{ px: 2, py: 1 }}>Loading…</Typography>
        )}
        {topics.map((t: Topic) => (
          <ListItemButton
            key={t._id}
            selected={t.slug === topicSlug}
            disabled={!selectedSubject}
            onClick={() => navigate(`/s/${selectedSubject!.slug}/t/${t.slug}`)}
          >
            <Typography variant="body2">{t.name}</Typography>
          </ListItemButton>
        ))}
      </List>
    </nav>
  );
}
