import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Description,
  Code,
  Architecture,
  Build,
  Security,
  CloudUpload,
  Psychology,
  Public,
  Help,
  ExpandMore,
  Home,
  Launch,
  GitHub,
} from '@mui/icons-material';

const DocumentationPage: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const documentationSections = [
    {
      id: 'quick-start',
      title: 'Quick Start Guides',
      icon: <Description />,
      color: '#2196F3',
      items: [
        { title: 'NASA Evaluation Guide', description: 'Complete setup and evaluation instructions', file: 'deployment/nasa_evaluation_guide.md' },
        { title: 'User Manual', description: 'Complete application usage guide', file: 'user_manual.md' },
        { title: 'Development Setup', description: 'Local development environment setup', file: 'development/setup.md' },
      ]
    },
    {
      id: 'architecture',
      title: 'System Architecture',
      icon: <Architecture />,
      color: '#FF9800',
      items: [
        { title: 'System Overview', description: 'High-level system architecture', file: 'architecture/system_overview.md' },
        { title: 'Frontend Architecture', description: 'React/TypeScript implementation', file: 'architecture/frontend.md' },
        { title: 'Backend Architecture', description: 'FastAPI/Python implementation', file: 'architecture/backend.md' },
      ]
    },
    {
      id: 'features',
      title: 'Features & AI Tools',
      icon: <Psychology />,
      color: '#9C27B0',
      items: [
        { title: 'AI Features', description: '5 specialized AI/ML tools', file: 'features/ai_features.md' },
        { title: 'CSV Upload System', description: 'Enhanced file processing', file: 'features/csv_upload.md' },
        { title: '3D Galaxy Visualization', description: 'Interactive galaxy map', file: 'features/galaxy_map.md' },
      ]
    },
    {
      id: 'api',
      title: 'API Documentation',
      icon: <Code />,
      color: '#4CAF50',
      items: [
        { title: 'API Reference', description: 'Complete endpoint reference', file: 'api/api_reference.md' },
        { title: 'Authentication', description: 'Security implementation', file: 'api/authentication.md' },
        { title: 'Rate Limiting', description: 'Usage policies', file: 'api/rate_limiting.md' },
      ]
    },
    {
      id: 'development',
      title: 'Development',
      icon: <Build />,
      color: '#FF5722',
      items: [
        { title: 'Development Setup', description: 'Local development environment', file: 'development/setup.md' },
        { title: 'Testing Guide', description: 'Unit and integration tests', file: 'development/testing.md' },
        { title: 'Contributing Guidelines', description: 'How to contribute', file: 'CONTRIBUTING.md' },
      ]
    },
    {
      id: 'deployment',
      title: 'Deployment',
      icon: <CloudUpload />,
      color: '#607D8B',
      items: [
        { title: 'Production Deployment', description: 'Enterprise deployment guide', file: 'deployment/deployment.md' },
        { title: 'Docker Configuration', description: 'Containerized deployment', file: 'deployment/docker.md' },
        { title: 'Kubernetes', description: 'Orchestrated deployment', file: 'deployment/kubernetes.md' },
      ]
    },
    {
      id: 'algorithms',
      title: 'Scientific Algorithms',
      icon: <Public />,
      color: '#3F51B5',
      items: [
        { title: 'Habitability Scoring', description: 'CDHS algorithm implementation', file: 'algorithms/habitability_scoring.md' },
        { title: 'HWO Requirements', description: 'NASA mission requirements', file: 'algorithms/hwo_requirements.md' },
        { title: 'ML Methodology', description: 'Machine learning models', file: 'algorithms/ml_methodology.md' },
      ]
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: <Help />,
      color: '#795548',
      items: [
        { title: 'FAQ', description: 'Frequently asked questions', file: 'FAQ.md' },
        { title: 'Troubleshooting', description: 'Common issues and solutions', file: 'troubleshooting/troubleshooting.md' },
        { title: 'Privacy Policy', description: 'Data handling and privacy', file: '../PRIVACY_POLICY.md' },
      ]
    }
  ];

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(selectedSection === sectionId ? null : sectionId);
  };

  const handleDocumentClick = (file: string) => {
    // In a real implementation, this would fetch and display the markdown file
    // For now, we'll open the GitHub link to the file
    const githubBase = 'https://github.com/SatnamCodes/nasa-hwo-habitability-explorer/blob/master/docs/';
    window.open(githubBase + file, '_blank');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <Description sx={{ mr: 0.5 }} fontSize="inherit" />
            Documentation
          </Typography>
        </Breadcrumbs>
        
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          backgroundClip: 'text',
          textFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          NASA HWO Habitability Explorer
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Comprehensive Documentation & User Guides
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item>
            <Chip
              icon={<Description />}
              label="User Manual"
              clickable
              onClick={() => handleDocumentClick('user_manual.md')}
              sx={{ bgcolor: '#E3F2FD', color: '#1976D2' }}
            />
          </Grid>
          <Grid item>
            <Chip
              icon={<Code />}
              label="API Reference"
              clickable
              onClick={() => handleDocumentClick('api/api_reference.md')}
              sx={{ bgcolor: '#E8F5E8', color: '#388E3C' }}
            />
          </Grid>
          <Grid item>
            <Chip
              icon={<Help />}
              label="FAQ"
              clickable
              onClick={() => handleDocumentClick('FAQ.md')}
              sx={{ bgcolor: '#FFF3E0', color: '#F57C00' }}
            />
          </Grid>
          <Grid item>
            <Tooltip title="View on GitHub">
              <IconButton
                onClick={() => window.open('https://github.com/SatnamCodes/nasa-hwo-habitability-explorer', '_blank')}
                sx={{ ml: 1 }}
              >
                <GitHub />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>

      {/* Documentation Sections */}
      <Grid container spacing={3}>
        {documentationSections.map((section) => (
          <Grid item xs={12} md={6} lg={4} key={section.id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: `${section.color}15`,
                      color: section.color,
                      mr: 2,
                    }}
                  >
                    {section.icon}
                  </Box>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    {section.title}
                  </Typography>
                </Box>

                <Accordion 
                  expanded={selectedSection === section.id}
                  onChange={() => handleSectionClick(section.id)}
                  elevation={0}
                  sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{ px: 0, minHeight: 'auto', '& .MuiAccordionSummary-content': { margin: 0 } }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {section.items.length} documents available
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0 }}>
                    <List dense disablePadding>
                      {section.items.map((item, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemButton
                            onClick={() => handleDocumentClick(item.file)}
                            sx={{ 
                              borderRadius: 1,
                              mb: 0.5,
                              '&:hover': {
                                bgcolor: `${section.color}08`,
                              }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Launch fontSize="small" sx={{ color: section.color }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={item.title}
                              secondary={item.description}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Links */}
      <Paper sx={{ mt: 4, p: 3, bgcolor: '#fafafa' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Quick Links
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              For NASA Evaluators:
            </Typography>
            <Box sx={{ ml: 2 }}>
              <Link 
                href="#" 
                onClick={() => handleDocumentClick('deployment/nasa_evaluation_guide.md')}
                sx={{ display: 'block', mb: 1, cursor: 'pointer' }}
              >
                NASA Evaluation Guide
              </Link>
              <Link 
                href="#" 
                onClick={() => handleDocumentClick('deployment/production_deployment.md')}
                sx={{ display: 'block', mb: 1, cursor: 'pointer' }}
              >
                Production Deployment
              </Link>
              <Link 
                href="#" 
                onClick={() => handleDocumentClick('algorithms/hwo_requirements.md')}
                sx={{ display: 'block', cursor: 'pointer' }}
              >
                HWO Mission Requirements
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              For Researchers:
            </Typography>
            <Box sx={{ ml: 2 }}>
              <Link 
                href="#" 
                onClick={() => handleDocumentClick('user_manual.md')}
                sx={{ display: 'block', mb: 1, cursor: 'pointer' }}
              >
                User Manual
              </Link>
              <Link 
                href="#" 
                onClick={() => handleDocumentClick('features/ai_features.md')}
                sx={{ display: 'block', mb: 1, cursor: 'pointer' }}
              >
                AI Features Guide
              </Link>
              <Link 
                href="#" 
                onClick={() => handleDocumentClick('api/api_reference.md')}
                sx={{ display: 'block', cursor: 'pointer' }}
              >
                API Reference
              </Link>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Footer Note */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Documentation is continuously updated. For the latest information, visit our{' '}
          <Link 
            href="https://github.com/SatnamCodes/nasa-hwo-habitability-explorer" 
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repository
          </Link>
          .
        </Typography>
      </Box>
    </Container>
  );
};

export default DocumentationPage;
