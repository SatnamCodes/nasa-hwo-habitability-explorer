import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Grid,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Timeline,
} from '@mui/icons-material';

interface DataQualityMetrics {
  signalToNoise: number;
  dataCompleteness: number;
  calibrationStatus: 'good' | 'warning' | 'error';
  timestamp: string;
}

interface SatelliteDataStreamProps {
  onDataUpdate?: (data: any) => void;
  onQualityAlert?: (alert: string) => void;
}

const SatelliteDataStream: React.FC<SatelliteDataStreamProps> = ({
  onDataUpdate,
  onQualityAlert,
}) => {
  const [metrics, setMetrics] = useState<DataQualityMetrics>({
    signalToNoise: 0,
    dataCompleteness: 0,
    calibrationStatus: 'good',
    timestamp: new Date().toISOString(),
  });

  const [status, setStatus] = useState<'connected' | 'processing' | 'error'>('connected');
  const [alerts, setAlerts] = useState<string[]>([]);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate data stream
      const newMetrics: DataQualityMetrics = {
        signalToNoise: Math.random() * 100,
        dataCompleteness: Math.random() * 100,
        calibrationStatus: Math.random() > 0.9 ? 'warning' : 'good',
        timestamp: new Date().toISOString(),
      };

      setMetrics(newMetrics);

      // Quality checks
      if (newMetrics.signalToNoise < 50) {
        const alert = `Low signal-to-noise ratio detected: ${newMetrics.signalToNoise.toFixed(2)}`;
        setAlerts(prev => [alert, ...prev].slice(0, 5));
        onQualityAlert?.(alert);
      }

      onDataUpdate?.(newMetrics);
    }, 5000);

    return () => clearInterval(interval);
  }, [onDataUpdate, onQualityAlert]);

  const getStatusColor = (status: 'connected' | 'processing' | 'error') => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'processing':
        return 'info';
      case 'error':
        return 'error';
    }
  };

  const getCalibrationIcon = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timeline />
          Satellite Data Stream
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`Status: ${status}`}
            color={getStatusColor(status)}
            size="small"
          />
          <Tooltip title="Refresh connection">
            <IconButton onClick={() => setStatus('processing')}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Signal-to-Noise Ratio</Typography>
          <LinearProgress
            variant="determinate"
            value={metrics.signalToNoise}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="caption" color="text.secondary">
            {metrics.signalToNoise.toFixed(2)}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Data Completeness</Typography>
          <LinearProgress
            variant="determinate"
            value={metrics.dataCompleteness}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="caption" color="text.secondary">
            {metrics.dataCompleteness.toFixed(2)}%
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="subtitle2">Calibration Status:</Typography>
            {getCalibrationIcon(metrics.calibrationStatus)}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>Recent Alerts</Typography>
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
            {alerts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No recent alerts</Typography>
            ) : (
              alerts.map((alert: string, index: number) => (
                <Alert
                  key={index}
                  severity="warning"
                  sx={{ mb: 1, '&:last-child': { mb: 0 } }}
                >
                  {alert}
                </Alert>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SatelliteDataStream;
