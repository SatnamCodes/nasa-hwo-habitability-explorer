import React, { useState, useEffect } from 'react';
import { Button, Slider, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { apiService } from '../../services/api';

type Props = {
    planet: any | null;
    onScore?: (result: any) => void;
    onCountChange?: (count: number | null) => void;
};

const ObservabilityControls: React.FC<Props> = ({ planet, onScore, onCountChange }) => {
    const [diameter, setDiameter] = useState<number>(6);
    const [wavelength, setWavelength] = useState<string>('Visible');
    const [iwa, setIwa] = useState<number>(75);
    const [observableCount, setObservableCount] = useState<number | null>(null);

    useEffect(() => {
        if (!planet) return;
        // auto-score when params change
        const score = async () => {
            try {
                const res = await apiService.scoreObservability(planet, { telescope_diameter_m: diameter, wavelength_band: wavelength, inner_working_angle_mas: iwa });
                onScore && onScore(res);
            } catch (e) {
                console.error('Observability scoring error', e);
            }
        };
        score();
    }, [planet, diameter, wavelength, iwa]);

    // publish params and get observable count whenever parameters change
    useEffect(() => {
        const fn = async () => {
            try {
                const params = { telescope_diameter_m: diameter, wavelength_band: wavelength, inner_working_angle_mas: iwa };
                await apiService.publishParams(params);
                const res = await apiService.getObservableCount({ ...params, threshold: 0.5 });
                const count = res.count ?? null;
                setObservableCount(count);
                onCountChange && onCountChange(count);
            } catch (e) {
                console.error('Observable count error', e);
                setObservableCount(null);
                onCountChange && onCountChange(null);
            }
        };
        fn();
    }, [diameter, wavelength, iwa]);

    return (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
            <Box sx={{ width: 240 }}>
                <div>Telescope diameter (m)</div>
                <Slider value={diameter} min={4} max={8} step={0.1} onChange={(_, v) => setDiameter(v as number)} />
                <div style={{ fontSize: 12, color: '#666' }}>{diameter.toFixed(1)} m</div>
                {observableCount !== null && <div style={{ fontSize: 12, marginTop: 6 }}>Observable: {observableCount}</div>}
            </Box>
            <Box sx={{ width: 200 }}>
                <div>Inner working angle (mas)</div>
                <Slider value={iwa} min={10} max={500} step={5} onChange={(_, v) => setIwa(v as number)} />
            </Box>
            <FormControl sx={{ minWidth: 140 }}>
                <InputLabel id="wavelength-label">Wavelength</InputLabel>
                <Select labelId="wavelength-label" value={wavelength} label="Wavelength" onChange={(e) => setWavelength(e.target.value)}>
                        <MenuItem value={'Visible'}>Visible</MenuItem>
                        <MenuItem value={'NIR'}>Near-IR</MenuItem>
                        <MenuItem value={'Mid-IR'}>Mid-IR</MenuItem>
                </Select>
            </FormControl>
            <Button variant="contained" onClick={async () => {
                try {
                    const params = { telescope_diameter_m: diameter, wavelength_band: wavelength, inner_working_angle_mas: iwa };
                    await apiService.publishParams(params);
                    const res = await apiService.getObservableCount({ ...params, threshold: 0.5 });
                    const count = res.count ?? null;
                    setObservableCount(count);
                    onCountChange && onCountChange(count);
                } catch (e) {
                    console.error('Apply params failed', e);
                }
            }}>Apply</Button>
        </Box>
    );
};

export default ObservabilityControls;
