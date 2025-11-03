// src/pages/Home.tsx
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { getAllSubjects, getTopicsForSubject } from '../selectors/chatalogSelectors';

export default function Home() {
  const navigate = useNavigate();
  const subjects = useMemo(() => getAllSubjects(), []);
  const topSubjects = subjects.slice(0, 3);

  return (
    <Box sx={{ py: 2 }}>
      {/* Hero */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Welcome to Chatalog
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Organize notes in a simple hierarchy: <strong>Subject → Topic → Note</strong>.
          Click below to browse your notes or jump straight into a subject.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={Link} to="/s" variant="contained" size="large">
            Open Notes
          </Button>
          <Button component={Link} to="/s/development" variant="outlined" size="large">
            Quick demo (Development)
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Quick links to Subjects/Topics */}
      <Typography variant="overline" color="text.secondary">
        Quick Links
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
        {topSubjects.map((s) => {
          const topics = getTopicsForSubject(s._id).slice(0, 3);
          return (
            <Card key={s._id} variant="outlined" sx={{ minWidth: 260, flex: 1 }}>
              {/* NOT a Link — use onClick navigate to avoid nested <a> */}
              <CardActionArea onClick={() => navigate(`/s/${s.slug}`)}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {s.name}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {topics.map((t) => (
                      <Chip
                        key={t._id}
                        size="small"
                        label={t.name}
                        component={Link}
                        to={`/s/${s.slug}/t/${t.slug}`}
                        clickable
                        onClick={(e) => e.stopPropagation()} // prevent card onClick
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    {topics.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        No topics yet
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Stack>

      <Box sx={{ mt: 4 }}>
        <Typography variant="caption" color="text.secondary">
          Tip: Your selection is encoded in the URL (e.g. <code>/s/&lt;subject&gt;/t/&lt;topic&gt;/n/&lt;note&gt;</code>),
          so refreshes and deep links just work.
        </Typography>
      </Box>
    </Box>
  );
}
