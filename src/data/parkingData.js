// Données simulées pour le parking intelligent
export const parkingStats = {
  total: 120,
  available: 47,
  occupied: 68,
  reserved: 5,
}

export const floors = [
  { id: 'B2', name: 'Sous-sol 2', available: 18, total: 40 },
  { id: 'B1', name: 'Sous-sol 1', available: 15, total: 40 },
  { id: 'RDC', name: 'Rez-de-chaussée', available: 14, total: 40 },
]

export const spots = [
  // Étage B2
  { id: 'B2-A1', floor: 'B2', status: 'available', zone: 'A' },
  { id: 'B2-A2', floor: 'B2', status: 'occupied', zone: 'A' },
  { id: 'B2-A3', floor: 'B2', status: 'available', zone: 'A' },
  { id: 'B2-A4', floor: 'B2', status: 'reserved', zone: 'A' },
  { id: 'B2-A5', floor: 'B2', status: 'available', zone: 'A' },
  { id: 'B2-B1', floor: 'B2', status: 'occupied', zone: 'B' },
  { id: 'B2-B2', floor: 'B2', status: 'occupied', zone: 'B' },
  { id: 'B2-B3', floor: 'B2', status: 'available', zone: 'B' },
  { id: 'B2-B4', floor: 'B2', status: 'available', zone: 'B' },
  { id: 'B2-B5', floor: 'B2', status: 'occupied', zone: 'B' },
  { id: 'B2-C1', floor: 'B2', status: 'available', zone: 'C' },
  { id: 'B2-C2', floor: 'B2', status: 'occupied', zone: 'C' },
  { id: 'B2-C3', floor: 'B2', status: 'available', zone: 'C' },
  { id: 'B2-C4', floor: 'B2', status: 'available', zone: 'C' },
  { id: 'B2-C5', floor: 'B2', status: 'occupied', zone: 'C' },
  // Étage B1
  { id: 'B1-A1', floor: 'B1', status: 'available', zone: 'A' },
  { id: 'B1-A2', floor: 'B1', status: 'occupied', zone: 'A' },
  { id: 'B1-A3', floor: 'B1', status: 'reserved', zone: 'A' },
  { id: 'B1-A4', floor: 'B1', status: 'available', zone: 'A' },
  { id: 'B1-A5', floor: 'B1', status: 'occupied', zone: 'A' },
  { id: 'B1-B1', floor: 'B1', status: 'available', zone: 'B' },
  { id: 'B1-B2', floor: 'B1', status: 'available', zone: 'B' },
  { id: 'B1-B3', floor: 'B1', status: 'occupied', zone: 'B' },
  { id: 'B1-B4', floor: 'B1', status: 'available', zone: 'B' },
  { id: 'B1-B5', floor: 'B1', status: 'occupied', zone: 'B' },
  { id: 'B1-C1', floor: 'B1', status: 'occupied', zone: 'C' },
  { id: 'B1-C2', floor: 'B1', status: 'available', zone: 'C' },
  { id: 'B1-C3', floor: 'B1', status: 'available', zone: 'C' },
  { id: 'B1-C4', floor: 'B1', status: 'occupied', zone: 'C' },
  { id: 'B1-C5', floor: 'B1', status: 'available', zone: 'C' },
  // RDC
  { id: 'RDC-A1', floor: 'RDC', status: 'available', zone: 'A' },
  { id: 'RDC-A2', floor: 'RDC', status: 'available', zone: 'A' },
  { id: 'RDC-A3', floor: 'RDC', status: 'occupied', zone: 'A' },
  { id: 'RDC-A4', floor: 'RDC', status: 'reserved', zone: 'A' },
  { id: 'RDC-A5', floor: 'RDC', status: 'available', zone: 'A' },
  { id: 'RDC-B1', floor: 'RDC', status: 'occupied', zone: 'B' },
  { id: 'RDC-B2', floor: 'RDC', status: 'available', zone: 'B' },
  { id: 'RDC-B3', floor: 'RDC', status: 'available', zone: 'B' },
  { id: 'RDC-B4', floor: 'RDC', status: 'occupied', zone: 'B' },
  { id: 'RDC-B5', floor: 'RDC', status: 'available', zone: 'B' },
  { id: 'RDC-C1', floor: 'RDC', status: 'available', zone: 'C' },
  { id: 'RDC-C2', floor: 'RDC', status: 'occupied', zone: 'C' },
  { id: 'RDC-C3', floor: 'RDC', status: 'reserved', zone: 'C' },
  { id: 'RDC-C4', floor: 'RDC', status: 'available', zone: 'C' },
  { id: 'RDC-C5', floor: 'RDC', status: 'occupied', zone: 'C' },
]
