import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Link
} from '@mui/material';
import {
  Security,
  Storage,
  Share,
  Visibility,
  Code,
  School,
  Public,
  Lock
} from '@mui/icons-material';

const PrivacyPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Privacy Policy
      </Typography>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Effective Date:</strong> August 23, 2025 | <strong>Last Updated:</strong> August 23, 2025
        </Typography>
      </Alert>

      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'background.default' }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="primary" />
          Overview
        </Typography>
        <Typography variant="body1" paragraph>
          The NASA HWO Habitability Explorer is a scientific research platform designed for 
          exoplanet habitability assessment and mission planning. This Privacy Policy outlines 
          how we collect, use, and protect information when you use our application.
        </Typography>
      </Paper>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Storage color="primary" />
          Information We Collect
        </Typography>
        
        <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
          Data You Provide
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon><Visibility /></ListItemIcon>
            <ListItemText 
              primary="CSV File Uploads" 
              secondary="Exoplanet data files uploaded for analysis" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Visibility /></ListItemIcon>
            <ListItemText 
              primary="Search Queries" 
              secondary="Target names and filtering parameters" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Visibility /></ListItemIcon>
            <ListItemText 
              primary="Usage Preferences" 
              secondary="Display settings and filter configurations" 
            />
          </ListItem>
        </List>

        <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
          Automatically Collected Data
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon><Storage /></ListItemIcon>
            <ListItemText 
              primary="System Information" 
              secondary="Browser type, operating system, screen resolution" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Storage /></ListItemIcon>
            <ListItemText 
              primary="Performance Metrics" 
              secondary="Application response times and error logs" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Storage /></ListItemIcon>
            <ListItemText 
              primary="Session Data" 
              secondary="Temporary data for maintaining application state" 
            />
          </ListItem>
        </List>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lock color="primary" />
          Data Security & Storage
        </Typography>
        
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Your Privacy is Protected:</strong> All data processing occurs locally in your browser. 
            We do not store your files on our servers.
          </Typography>
        </Alert>

        <List>
          <ListItem>
            <ListItemIcon><Lock /></ListItemIcon>
            <ListItemText 
              primary="Local Processing" 
              secondary="All data processing occurs locally in your browser" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Lock /></ListItemIcon>
            <ListItemText 
              primary="No Cloud Storage" 
              secondary="Uploaded files are processed in memory only" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Lock /></ListItemIcon>
            <ListItemText 
              primary="Session-Based" 
              secondary="Data is not permanently stored on our servers" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Lock /></ListItemIcon>
            <ListItemText 
              primary="HTTPS Encryption" 
              secondary="All data transmission is encrypted" 
            />
          </ListItem>
        </List>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Share color="primary" />
          Data Sharing Policy
        </Typography>
        
        <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'error.main', fontWeight: 'bold' }}>
          We DO NOT Share:
        </Typography>
        <List>
          <ListItem sx={{ color: 'error.main' }}>
            <ListItemIcon><Lock color="error" /></ListItemIcon>
            <ListItemText primary="Personal identification information" />
          </ListItem>
          <ListItem sx={{ color: 'error.main' }}>
            <ListItemIcon><Lock color="error" /></ListItemIcon>
            <ListItemText primary="Uploaded scientific data" />
          </ListItem>
          <ListItem sx={{ color: 'error.main' }}>
            <ListItemIcon><Lock color="error" /></ListItemIcon>
            <ListItemText primary="Research results or analysis outputs" />
          </ListItem>
          <ListItem sx={{ color: 'error.main' }}>
            <ListItemIcon><Lock color="error" /></ListItemIcon>
            <ListItemText primary="Usage patterns or behavioral data" />
          </ListItem>
        </List>

        <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'success.main', fontWeight: 'bold' }}>
          Public Information:
        </Typography>
        <List>
          <ListItem sx={{ color: 'success.main' }}>
            <ListItemIcon><Public color="success" /></ListItemIcon>
            <ListItemText primary="Open-source code (available on GitHub)" />
          </ListItem>
          <ListItem sx={{ color: 'success.main' }}>
            <ListItemIcon><School color="success" /></ListItemIcon>
            <ListItemText primary="Documentation and user guides" />
          </ListItem>
          <ListItem sx={{ color: 'success.main' }}>
            <ListItemIcon><Visibility color="success" /></ListItemIcon>
            <ListItemText primary="General application features and capabilities" />
          </ListItem>
        </List>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Code color="primary" />
          Open Source & Transparency
        </Typography>
        
        <Typography variant="body1" paragraph>
          This application is completely open source, providing full transparency about how your data is handled.
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon><Code /></ListItemIcon>
            <ListItemText 
              primary="Source Code Available" 
              secondary={
                <>
                  Full source code inspection available at{' '}
                  <Link 
                    href="https://github.com/SatnamCodes/nasa-hwo-habitability-explorer" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </Link>
                </>
              } 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><School /></ListItemIcon>
            <ListItemText 
              primary="Educational Use" 
              secondary="Suitable for educational and research purposes" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Public /></ListItemIcon>
            <ListItemText 
              primary="NASA Compliance" 
              secondary="Follows NASA software development standards and guidelines" 
            />
          </ListItem>
        </List>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Contact Information
        </Typography>
        
        <Typography variant="body1" paragraph>
          For technical support or questions about this privacy policy:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon><Code /></ListItemIcon>
            <ListItemText 
              primary="GitHub Issues"
              secondary={
                <>
                  Report technical issues at{' '}
                  <Link 
                    href="https://github.com/SatnamCodes/nasa-hwo-habitability-explorer/issues" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    GitHub Issues
                  </Link>
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Public /></ListItemIcon>
            <ListItemText 
              primary="NASA HWO Mission"
              secondary={
                <>
                  Official mission information at{' '}
                  <Link 
                    href="https://www.nasa.gov/hwo" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    NASA Habitable Worlds Observatory
                  </Link>
                </>
              }
            />
          </ListItem>
        </List>
      </Box>

      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Note:</strong> This privacy policy applies specifically to the NASA HWO Habitability Explorer application. 
          For NASA's general privacy practices, please refer to the{' '}
          <Link href="https://www.nasa.gov/privacy/" target="_blank" rel="noopener noreferrer">
            NASA Privacy Policy
          </Link>.
        </Typography>
      </Alert>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 4, textAlign: 'center' }}>
        This application is provided "as is" for scientific and educational purposes. 
        See the MIT License for additional terms.
      </Typography>
    </Container>
  );
};

export default PrivacyPage;
