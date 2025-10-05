import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, InputAdornment, CircularProgress, Paper, Chip, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import { findingsService, FindingMeta, FindingSearchResult } from '../services/findingsService';

const FindingsPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<FindingMeta[]>([]);
  const [results, setResults] = useState<FindingSearchResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    findingsService.list().then(setList).catch(e => setError(String(e)));
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await findingsService.search(val.trim());
      setResults(res);
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pt: 14, px: { xs: 2, md: 6 }, pb: 10, position: 'relative', maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h3" sx={{ mb: 2, fontWeight: 700, background: 'linear-gradient(90deg,#8ec5fc,#e0c3fc)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        Scientific Findings Repository
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, opacity: 0.85 }}>
        Search across compiled LaTeX analytical reports and notebooks. Type at least 2 characters to begin.
      </Typography>
      <TextField
        fullWidth
        placeholder="Search LaTeX reports (e.g. habitability, stellar flux, classification)"
        value={query}
        onChange={e => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            backdropFilter: 'blur(12px)',
            background: 'rgba(255,255,255,0.08)',
          }
        }}
      />
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {!results && !query && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {list.map(item => (
            <Paper key={item.filename} sx={{ p: 2, flex: '1 1 320px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DescriptionIcon fontSize="small" />
                <Typography fontWeight={600}>{item.title}</Typography>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>{item.filename}</Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {item.sections.slice(0, 6).map(sec => (
                  <Chip key={sec} label={sec} size="small" variant="outlined" />
                ))}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
      {loading && <CircularProgress />}
      {results && !loading && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>{results.matches} documents matched</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {results.results.map(r => (
              <Paper key={r.filename} sx={{ p: 3, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>{r.title}</Typography>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', opacity: 0.6 }}>{r.filename}</Typography>
                {r.snippets.map((s, i) => {
                  const regex = new RegExp(query, 'ig');
                  const parts = s.split(regex);
                  const matches = s.match(regex);
                  return (
                    <Typography key={i} variant="body2" sx={{ mb: 1 }}>
                      {parts.map((p, idx) => (
                        <React.Fragment key={idx}>
                          {p}
                          {matches && idx < matches.length && (
                            <span style={{ background: 'linear-gradient(90deg,#ff9a9e,#fad0c4)', WebkitBackgroundClip: 'text', color: 'transparent', fontWeight: 600 }}>
                              {matches[idx]}
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                      …
                    </Typography>
                  );
                })}
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FindingsPage;
