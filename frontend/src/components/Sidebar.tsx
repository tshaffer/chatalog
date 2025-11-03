import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { List, ListItemButton, ListSubheader, Typography, Divider } from '@mui/material';
import { getAllSubjects, getTopicsForSubject, findSubjectBySlug } from '../selectors/chatalogSelectors';

export default function Sidebar() {
  const { subjectSlug, topicSlug } = useParams();
  const navigate = useNavigate();

  const allSubjects = useMemo(() => getAllSubjects(), []);
  const selectedSubject = useMemo(() => findSubjectBySlug(subjectSlug), [subjectSlug]);
  const topics = useMemo(
    () => getTopicsForSubject(selectedSubject?._id),
    [selectedSubject?._id]
  );

  return (
    <nav aria-label="Chatalog hierarchy" style={{ borderRight: '1px solid #eee', overflow: 'auto' }}>
      <List subheader={<ListSubheader component="div">Subjects</ListSubheader>} dense>
        {allSubjects.map(s => (
          <ListItemButton
            key={s._id}
            selected={s.slug === subjectSlug}
            onClick={() => { const path = `/s/${s.slug}`; navigate(path); }}
          >
            <Typography variant="body2">{s.name}</Typography>
          </ListItemButton>
        ))}
      </List>

      <Divider />

      <List subheader={<ListSubheader component="div">Topics</ListSubheader>} dense>
        {topics.map(t => (
          <ListItemButton
            key={t._id}
            selected={t.slug === topicSlug}
            disabled={!selectedSubject}
            onClick={() => { const path = `/s/${selectedSubject!.slug}/t/${t.slug}`; navigate(path); }}
          >
            <Typography variant="body2">{t.name}</Typography>
          </ListItemButton>
        ))}
      </List>
    </nav>
  );
}
