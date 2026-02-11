const express = require('express');
const { pool } = require('../utils/db');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const router = express.Router();

// Mock database for dams
const dams = [
  {
    id: '1',
    name: 'Narmada Dam',
    location: { lat: 21.8274, lng: 73.4535 },
    status: 'operational',
    affectedPopulation: 245000,
    displacementPercentage: 78,
    satelliteImagery: 'sentinel-2-latest',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Tehri Dam',
    location: { lat: 30.3849, lng: 78.4867 },
    status: 'operational',
    affectedPopulation: 186000,
    displacementPercentage: 65,
    satelliteImagery: 'sentinel-2-latest',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Sardar Sarovar Dam',
    location: { lat: 21.8165, lng: 73.2563 },
    status: 'operational',
    affectedPopulation: 320000,
    displacementPercentage: 85,
    satelliteImagery: 'sentinel-2-latest',
    lastUpdated: new Date().toISOString()
  }
];

// Read dams from CSV (fallback when DB unavailable)
async function readDamsCsv(filePath = path.join(__dirname, '../../public/dams and reservoirs (1).csv')) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return resolve([]);
    }
    const raw = [];
    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => (header || '').trim() }))
      .on('data', (row) => {
        const name = (row['dam name'] || row['Reservior name'] || '').toString().trim();
        const lat = parseFloat(row['latitude']);
        const lng = parseFloat(row['longitude']);
        const status = (row['status'] || row['TIMELINE(status)'] || 'operational').toString().trim();
        if (name && Number.isFinite(lat) && Number.isFinite(lng)) {
          raw.push({ name, lat, lng, status });
        }
      })
      .on('end', () => {
        const data = raw.map((r, idx) => ({
          id: String(idx + 1),
          name: r.name,
          location: { lat: r.lat, lng: r.lng },
          status: r.status || 'operational',
          affectedPopulation: 0,
          displacementPercentage: 0,
          satelliteImagery: 'sentinel-2-latest',
          lastUpdated: new Date().toISOString()
        }));
        resolve(data);
      })
      .on('error', reject);
  });
}

// Get all dams from Postgres
router.get('/', async (req, res) => {
  try {
    console.log('[Dams] Attempting to fetch from database...');
    const result = await pool.query('SELECT * FROM dams ORDER BY id');
    console.log('[Dams] Database query result:', result.rows.length, 'rows found');
    
    // Map DB rows to API shape
    const data = result.rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      location: { lat: row.lat, lng: row.lng },
      status: row.status,
      affectedPopulation: row.affected_population,
      displacementPercentage: row.displacement_percentage,
      satelliteImagery: row.satellite_imagery,
      lastUpdated: row.last_updated,
    }));
    
    console.log('[Dams] Successfully mapped', data.length, 'dams to API format');
    res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('[Dams] Database error:', error.message);
    console.error('[Dams] Full error details:', error);
    
    try {
      const csvData = await readDamsCsv();
      if (csvData.length > 0) {
        console.log('[Dams] Falling back to CSV data:', csvData.length, 'records');
        return res.json({ success: true, data: csvData, count: csvData.length });
      }
    } catch (e) {
      console.error('[Dams] CSV read error:', e.message);
    }
    
    res.status(500).json({ success: false, error: 'Failed to fetch dams data' });
  }
});

// Get dam by ID from Postgres
router.get('/:id', async (req, res) => {
  try {
    const idNum = parseInt(req.params.id, 10);
    const result = await pool.query('SELECT * FROM dams WHERE id = $1', [idNum]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dam not found' });
    }
    const row = result.rows[0];
    const dam = {
      id: String(row.id),
      name: row.name,
      location: { lat: row.lat, lng: row.lng },
      status: row.status,
      affectedPopulation: row.affected_population,
      displacementPercentage: row.displacement_percentage,
      satelliteImagery: row.satellite_imagery,
      lastUpdated: row.last_updated,
    };
    res.json({ success: true, data: dam });
  } catch (error) {
    console.error('[Dams] DB error on id, falling back to CSV:', error.message);
    try {
      const csvData = await readDamsCsv();
      const dam = csvData.find(d => d.id === req.params.id);
      if (dam) {
        return res.json({ success: true, data: dam });
      }
    } catch (e) {
      console.error('[Dams] CSV read error on id:', e.message);
    }
    // Final fallback to small mock
    const dam = dams.find(d => d.id === req.params.id);
    if (!dam) {
      return res.status(404).json({ success: false, error: 'Dam not found' });
    }
    res.json({ success: true, data: dam });
  }
});

// Create new dam (persist to Postgres)
router.post('/', async (req, res) => {
  try {
    const { name, location, status, affectedPopulation, displacementPercentage, satelliteImagery } = req.body;
    if (!name || !location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const result = await pool.query(
      `INSERT INTO dams (name, lat, lng, status, affected_population, displacement_percentage, satellite_imagery)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        location.lat,
        location.lng,
        status || 'planned',
        affectedPopulation || 0,
        displacementPercentage || 0,
        satelliteImagery || 'pending',
      ]
    );
    const row = result.rows[0];
    const newDam = {
      id: String(row.id),
      name: row.name,
      location: { lat: row.lat, lng: row.lng },
      status: row.status,
      affectedPopulation: row.affected_population,
      displacementPercentage: row.displacement_percentage,
      satelliteImagery: row.satellite_imagery,
      lastUpdated: row.last_updated,
    };
    res.status(201).json({ success: true, data: newDam });
  } catch (error) {
    console.error('[Dams] DB error on create:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update dam in Postgres
router.put('/:id', async (req, res) => {
  try {
    const idNum = parseInt(req.params.id, 10);
    const { name, location, status, affectedPopulation, displacementPercentage, satelliteImagery } = req.body;
    const result = await pool.query(
      `UPDATE dams SET 
        name = COALESCE($1, name),
        lat = COALESCE($2, lat),
        lng = COALESCE($3, lng),
        status = COALESCE($4, status),
        affected_population = COALESCE($5, affected_population),
        displacement_percentage = COALESCE($6, displacement_percentage),
        satellite_imagery = COALESCE($7, satellite_imagery),
        last_updated = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        name ?? null,
        location?.lat ?? null,
        location?.lng ?? null,
        status ?? null,
        affectedPopulation ?? null,
        displacementPercentage ?? null,
        satelliteImagery ?? null,
        idNum,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dam not found' });
    }
    const row = result.rows[0];
    const updatedDam = {
      id: String(row.id),
      name: row.name,
      location: { lat: row.lat, lng: row.lng },
      status: row.status,
      affectedPopulation: row.affected_population,
      displacementPercentage: row.displacement_percentage,
      satelliteImagery: row.satellite_imagery,
      lastUpdated: row.last_updated,
    };
    res.json({ success: true, data: updatedDam });
  } catch (error) {
    console.error('[Dams] DB error on update:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import dams from CSV into Postgres
router.post('/import', async (req, res) => {
  const filePath = req.body?.filePath || path.join(__dirname, '../../public/dams and reservoirs (1).csv');
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ success: false, error: `CSV file not found at: ${filePath}` });
    }
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ mapHeaders: ({ header }) => (header || '').trim() }))
        .on('data', (row) => {
          const name = (row['dam name'] || row['Reservior name'] || '').toString().trim();
          const lat = parseFloat(row['latitude']);
          const lng = parseFloat(row['longitude']);
          const status = (row['status'] || row['TIMELINE(status)'] || 'operational').toString().trim();
          if (name && Number.isFinite(lat) && Number.isFinite(lng)) {
            rows.push({ name, lat, lng, status });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid rows found in CSV.' });
    }

    let inserted = 0;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const r of rows) {
        await client.query(
          `INSERT INTO dams (name, lat, lng, status)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [r.name, r.lat, r.lng, r.status || 'operational']
        );
        inserted++;
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return res.json({ success: true, inserted, totalParsed: rows.length });
  } catch (err) {
    console.error('[Dams Import] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
