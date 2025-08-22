import Papa from 'papaparse';

export interface Planet {
  pl_name: string;
  hostname: string;
  pl_orbper: number;
  pl_orbsmax: number;
  pl_radj: number;
  pl_bmassj: number;
  st_teff: number;
  st_dist: number;
  ra: number;
  dec: number;
}

export const getPlanetData = async (): Promise<Planet[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse('/confirmed_planets.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const planets = results.data.map((row: any) => ({
          pl_name: row.pl_name,
          hostname: row.pl_hostname,
          pl_orbper: row.pl_orbper,
          pl_orbsmax: row.pl_orbsmax,
          pl_radj: row.pl_radj,
          pl_bmassj: row.pl_bmassj,
          st_teff: row.st_teff,
          st_dist: row.st_dist,
          ra: row.ra,
          dec: row.dec,
        })).filter(p => p.pl_name && p.hostname);
        resolve(planets as Planet[]);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
