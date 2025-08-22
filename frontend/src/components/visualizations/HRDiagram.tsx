import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface HRDiagramProps {
    data: Array<{
        st_teff: number;
        pl_rade: number;
        sephi_score: number;
        pl_name: string;
    }>;
}

export const HRDiagram: React.FC<HRDiagramProps> = ({ data }) => {
    const chartData = {
        datasets: [
            {
                label: 'Planets',
                data: data.map(planet => ({
                    x: planet.st_teff,
                    y: planet.pl_rade,
                    r: planet.sephi_score * 10, // Size based on habitability score
                    name: planet.pl_name
                })),
                backgroundColor: data.map(planet => 
                    `rgba(${255 * (1 - planet.sephi_score)}, ${255 * planet.sephi_score}, 100, 0.6)`
                ),
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'HR Diagram with Habitability'
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const point = context.raw;
                        return [
                            `Planet: ${point.name}`,
                            `Temperature: ${point.x}K`,
                            `Radius: ${point.y} Earth radii`,
                            `Habitability: ${(point.r / 10).toFixed(2)}`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Stellar Temperature (K)'
                },
                reverse: true, // Higher temperature stars on left
                min: 2000,
                max: 10000
            },
            y: {
                title: {
                    display: true,
                    text: 'Planet Radius (Earth Radii)'
                },
                min: 0,
                max: 3
            }
        }
    };

    return (
        <Box height="100%">
            <Typography variant="h6" gutterBottom>
                HR Diagram with Habitability Indicators
            </Typography>
            <Box height="calc(100% - 48px)">
                <Scatter data={chartData} options={options} />
            </Box>
        </Box>
    );
};
