import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Typography } from '@mui/material';

interface Planet {
    id: string;
    pl_name: string;
    pl_rade: number;
    pl_masse?: number;
    pl_eqt: number;
    st_teff: number;
    pl_orbper: number;
    sy_dist: number;
    sephi_score: number;
}

interface PlanetListProps {
    planets: Planet[];
    onSelectPlanet: (planetId: string) => void;
}

export const PlanetList = ({ planets, onSelectPlanet }: PlanetListProps): JSX.Element => {
    const columns: GridColDef[] = [
        {
            field: 'pl_name',
            headerName: 'Name',
            width: 150,
        },
        {
            field: 'pl_rade',
            headerName: 'Radius (Earth)',
            width: 130,
            valueFormatter: (value: any) => Number(value).toFixed(2),
        },
        {
            field: 'pl_eqt',
            headerName: 'Temperature (K)',
            width: 130,
            valueFormatter: (value: any) => Number(value).toFixed(0),
        },
        {
            field: 'st_teff',
            headerName: 'Star Temp (K)',
            width: 130,
            valueFormatter: (value: any) => Number(value).toFixed(0),
        },
        {
            field: 'pl_orbper',
            headerName: 'Orbit (days)',
            width: 120,
            valueFormatter: (value: any) => Number(value).toFixed(1),
        },
        {
            field: 'sy_dist',
            headerName: 'Distance (pc)',
            width: 120,
            valueFormatter: (value: any) => Number(value).toFixed(1),
        },
        {
            field: 'sephi_score',
            headerName: 'SEPHI Score',
            width: 130,
            valueFormatter: (value: any) => Number(value).toFixed(3),
            cellClassName: (params: any) => {
                const value = Number(params.value);
                if (value >= 0.7) return 'high-habitability';
                if (value >= 0.5) return 'medium-habitability';
                return 'low-habitability';
            },
        },
    ];

    return (
        <Box sx={{ height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Exoplanet List
            </Typography>
            <Box sx={{
                height: 'calc(100% - 48px)',
                '& .high-habitability': {
                    backgroundColor: 'rgba(0, 255, 0, 0.2)',
                },
                '& .medium-habitability': {
                    backgroundColor: 'rgba(255, 255, 0, 0.2)',
                },
                '& .low-habitability': {
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                },
            }}>
                <DataGrid
                    rows={planets}
                    columns={columns}
                    onRowClick={(params: any) => onSelectPlanet(params.id.toString())}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: 'sephi_score', sort: 'desc' }],
                        },
                    }}
                />
            </Box>
        </Box>
    );
};
