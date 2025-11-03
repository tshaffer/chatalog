import React from 'react';
import { List, ListSubheader, ListItemButton, ListItemText, Collapse, Divider } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { SubjectWithTopics } from '../mock/hierarchy';

interface Props {
  data: SubjectWithTopics[];
  onSelectNote?: (noteId: string) => void;
}

export default function HierarchySidebar({ data, onSelectNote }: Props) {
  const [openSubjects, setOpenSubjects] = React.useState<Record<string, boolean>>({});
  const [openTopics, setOpenTopics] = React.useState<Record<string, boolean>>({});

  const toggleSubject = (id: string) =>
    setOpenSubjects(s => ({ ...s, [id]: !s[id] }));
  const toggleTopic = (id: string) =>
    setOpenTopics(s => ({ ...s, [id]: !s[id] }));

  return (
    <List
      dense
      subheader={<ListSubheader component="div">Subjects</ListSubheader>}
      sx={{ width: '100%', bgcolor: 'background.paper' }}
    >
      {data.map(sub => (
        <React.Fragment key={sub._id}>
          <ListItemButton onClick={() => toggleSubject(sub._id)}>
            <ListItemText primary={sub.name} />
            {openSubjects[sub._id] ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Collapse in={!!openSubjects[sub._id]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {sub.topics.map(top => (
                <React.Fragment key={top._id}>
                  <ListItemButton sx={{ pl: 3 }} onClick={() => toggleTopic(top._id)}>
                    <ListItemText primary={top.name} />
                    {openTopics[top._id] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>

                  <Collapse in={!!openTopics[top._id]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {top.notes.map(n => (
                        <ListItemButton
                          key={n._id}
                          sx={{ pl: 5 }}
                          onClick={() => onSelectNote?.(n._id)}
                        >
                          <ListItemText primary={n.title} secondary={n.summary} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </React.Fragment>
              ))}
            </List>
          </Collapse>

          <Divider />
        </React.Fragment>
      ))}
    </List>
  );
}
