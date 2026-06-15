export const getStreakRank = (days) => {
  if (days >= 730) return { title: 'ULTRA LEGEND X', id: 'ultralegend', color: '#ff00ff', glow: 'drop-shadow-[0_0_30px_rgba(255,0,255,0.8)]' };
  if (days >= 365) return { title: 'LEGEND PRIME', id: 'legend', color: '#8a2be2', glow: 'drop-shadow-[0_0_30px_rgba(138,43,226,0.8)]' };
  if (days >= 240) return { title: 'PLATINUM EMPEROR', id: 'platinum', color: '#e5e4e2', glow: 'drop-shadow-[0_0_30px_rgba(229,228,226,0.8)]' };
  if (days >= 180) return { title: 'DIAMOND TITAN', id: 'diamond', color: '#00ffff', glow: 'drop-shadow-[0_0_30px_rgba(0,255,255,0.8)]' };
  if (days >= 90) return { title: 'GOLD SUPREME', id: 'gold', color: '#ffd700', glow: 'drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]' };
  if (days >= 60) return { title: 'SILVER PHANTOM', id: 'silver', color: '#c0c0c0', glow: 'drop-shadow-[0_0_30px_rgba(192,192,192,0.8)]' };
  if (days >= 30) return { title: 'BRONZE ASCENDANT', id: 'bronze', color: '#cd7f32', glow: 'drop-shadow-[0_0_30px_rgba(205,127,50,0.8)]' };
  return { title: 'ENERGY NOVICE', id: 'base', color: '#4ade80', glow: 'drop-shadow-[0_0_30px_rgba(74,222,128,0.8)]' };
};
