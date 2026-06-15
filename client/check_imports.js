import fs from 'fs';
import { build } from 'esbuild';

build({
  entryPoints: ['src/pages/Dashboard/AdminDashboard.jsx'],
  bundle: true,
  external: ['react', 'react-dom', 'framer-motion', 'lucide-react', 'axios', 'react-hot-toast', 'react-router-dom'],
  outfile: 'out.js',
  format: 'esm',
  loader: { '.jsx': 'jsx' }
}).then(() => console.log('Build OK')).catch(e => console.error('Build Failed:', e));
