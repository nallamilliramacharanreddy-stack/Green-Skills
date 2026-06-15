import React from 'react';
import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full mt-auto z-10 relative">
      {/* Torn Paper Mountain Divider */}
      <div className="w-full leading-none -mb-[1px] relative z-10 bg-transparent">
        <svg className="w-full h-[40px] md:h-[80px] text-[#2A1A14] fill-current block" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,120 H1200 V50 L1200.0,29.0 L1194.0,29.5 L1188.0,26.1 L1182.0,27.2 L1176.0,35.7 L1170.0,33.7 L1164.0,35.3 L1158.0,32.2 L1152.0,32.9 L1146.0,34.0 L1140.0,40.3 L1134.0,39.0 L1128.0,48.7 L1122.0,42.1 L1116.0,43.3 L1110.0,38.0 L1104.0,35.3 L1098.0,42.9 L1092.0,40.0 L1086.0,40.9 L1080.0,36.6 L1074.0,33.1 L1068.0,26.9 L1062.0,30.8 L1056.0,26.3 L1050.0,34.6 L1044.0,31.3 L1038.0,33.0 L1032.0,28.8 L1026.0,25.4 L1020.0,30.7 L1014.0,31.4 L1008.0,38.1 L1002.0,40.7 L996.0,42.5 L990.0,41.9 L984.0,44.3 L978.0,41.7 L972.0,52.6 L966.0,52.6 L960.0,57.4 L954.0,56.2 L948.0,53.5 L942.0,54.5 L936.0,50.9 L930.0,54.5 L924.0,56.4 L918.0,57.3 L912.0,50.8 L906.0,52.0 L900.0,43.0 L894.0,49.6 L888.0,45.6 L882.0,51.4 L876.0,52.9 L870.0,53.7 L864.0,53.9 L858.0,50.3 L852.0,53.8 L846.0,58.4 L840.0,63.8 L834.0,65.1 L828.0,71.4 L822.0,62.8 L816.0,66.2 L810.0,66.3 L804.0,71.4 L798.0,73.2 L792.0,76.6 L786.0,72.9 L780.0,66.4 L774.0,64.5 L768.0,62.9 L762.0,66.1 L756.0,61.8 L750.0,67.6 L744.0,57.6 L738.0,55.7 L732.0,48.7 L726.0,48.9 L720.0,51.8 L714.0,55.8 L708.0,56.6 L702.0,55.6 L696.0,50.9 L690.0,51.1 L684.0,53.3 L678.0,52.7 L672.0,62.6 L666.0,59.1 L660.0,64.0 L654.0,56.3 L648.0,55.3 L642.0,54.9 L636.0,57.2 L630.0,59.4 L624.0,56.8 L618.0,52.2 L612.0,45.9 L606.0,42.9 L600.0,36.3 L594.0,42.3 L588.0,38.4 L582.0,40.6 L576.0,35.9 L570.0,29.8 L564.0,27.3 L558.0,28.8 L552.0,30.4 L546.0,36.0 L540.0,35.5 L534.0,33.3 L528.0,36.3 L522.0,30.0 L516.0,36.4 L510.0,37.2 L504.0,44.9 L498.0,43.5 L492.0,41.9 L486.0,38.2 L480.0,39.9 L474.0,35.6 L468.0,39.9 L462.0,42.5 L456.0,38.0 L450.0,39.8 L444.0,28.2 L438.0,29.6 L432.0,26.0 L426.0,30.4 L420.0,31.7 L414.0,32.9 L408.0,29.6 L402.0,30.5 L396.0,24.1 L390.0,29.3 L384.0,36.2 L378.0,38.4 L372.0,46.9 L366.0,39.4 L360.0,44.3 L354.0,42.4 L348.0,48.2 L342.0,50.8 L336.0,57.7 L330.0,56.6 L324.0,58.6 L318.0,50.1 L312.0,51.7 L306.0,52.2 L300.0,52.4 L294.0,60.4 L288.0,51.6 L282.0,55.1 L276.0,45.4 L270.0,46.4 L264.0,45.9 L258.0,49.2 L252.0,52.2 L246.0,55.2 L240.0,49.3 L234.0,50.5 L228.0,51.2 L222.0,51.3 L216.0,63.2 L210.0,62.6 L204.0,69.1 L198.0,66.0 L192.0,66.8 L186.0,65.0 L180.0,68.7 L174.0,69.1 L168.0,77.0 L162.0,70.4 L156.0,71.0 L150.0,66.7 L144.0,61.2 L138.0,65.5 L132.0,61.5 L126.0,65.5 L120.0,62.5 L114.0,56.7 L108.0,51.5 L102.0,50.6 L96.0,48.9 L90.0,56.5 L84.0,53.5 L78.0,55.5 L72.0,55.3 L66.0,48.6 L60.0,55.0 L54.0,52.6 L48.0,60.3 L42.0,60.3 L36.0,62.5 L30.0,58.4 L24.0,58.9 L18.0,54.0 L12.0,59.8 L6.0,56.2 L0.0,59.1 Z" />
        </svg>
      </div>
      <div className="bg-[#2A1A14] text-white py-12 w-full relative">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Leaf className="text-primary w-8 h-8" />
            <span className="text-2xl font-bold">GreenSkill <span className="text-primary">Rural</span></span>
          </div>
          <p className="text-gray-400 max-w-md">
            A dedicated platform for rural students to bridge the digital divide and enter the green economy.
          </p>
        </div>
        <div>
          <h4 className="text-lg font-bold mb-6 text-primary">Quick Links</h4>
          <ul className="space-y-4 text-gray-400">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-bold mb-6 text-primary">Contact Us</h4>
          <ul className="space-y-4 text-gray-400">
            <li>Email: nallamilliramacharanreddy@gmail.com</li>
            <li>Phone: +91 98765 43210</li>
            <li>Address: Rural Tech Hub, India</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pt-12 mt-12 border-t border-gray-800 text-center text-gray-500">
        <p>© 2026 GreenSkill Rural Platform. All rights reserved.</p>
      </div>
      </div>
    </footer>
  );
};

export default Footer;
