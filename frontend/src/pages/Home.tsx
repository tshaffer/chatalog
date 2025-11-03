// frontend/src/pages/Home.tsx
import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {
  useGetSubjectsQuery,
  useGetTopicsBySubjectQuery,
} from '../features/api/chatalogApi';

export default function Home() {
  const navigate = useNavigate();
  const { data: subjects = [], isLoading } = useGetSubjectsQuery();

  // show up to three subjects as “quick links”
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
        {isLoading && (
          <>
            <Skeleton variant="rounded" height={140} sx={{ flex: 1, minWidth: 260 }} />
            <Skeleton variant="rounded" height={140} sx={{ flex: 1, minWidth: 260 }} />
            <Skeleton variant="rounded" height={140} sx={{ flex: 1, minWidth: 260 }} />
          </>
        )}
        {!isLoading &&
          topSubjects.map((s) => (
            <SubjectCard key={s._id} subjectId={s._id} subjectSlug={s.slug} subjectName={s.name} />
          ))}
        {!isLoading && topSubjects.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No subjects yet.
          </Typography>
        )}
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

/**
 * Separate component so we can call a hook per subject (legal hook usage).
 * Avoids nested <a> by using onClick navigate for the card, and Link on chips.
 */
const SubjectCard = memo(function SubjectCard(props: {
  subjectId: string;
  subjectSlug: string;
  subjectName: string;
}) {
  const navigate = useNavigate();
  const { data: topics = [], isLoading } = useGetTopicsBySubjectQuery(props.subjectId);

  const chips = topics.slice(0, 3);

  return (
    <Card variant="outlined" sx={{ minWidth: 260, flex: 1 }}>
      {/* NOT a Link: use onClick navigate to avoid nested <a> */}
      <CardActionArea onClick={() => navigate(`/s/${props.subjectSlug}`)}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {props.subjectName}
          </Typography>

          {isLoading ? (
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={80} height={24} />
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {chips.map((t) => (
                <Chip
                  key={t._id}
                  size="small"
                  label={t.name}
                  component={Link}
                  to={`/s/${props.subjectSlug}/t/${t.slug}`}
                  clickable
                  onClick={(e) => e.stopPropagation()} // prevent card onClick
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
              {chips.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  No topics yet
                </Typography>
              )}
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
});
