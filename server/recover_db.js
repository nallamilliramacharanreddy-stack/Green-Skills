require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Quiz = require('./models/Quiz');

// These are the 20 YouTube video IDs found in server/uploads/videos/
// Each maps to a real video that was downloaded and stored locally
const VIDEO_DATA = [
  // ─── Renewable Energy Course ───────────────────────────────
  { id: 'jx05-nuFetw', title: 'Lec 1: Energy Scenarios',            module: 'Introduction',        course: 'Renewable Energy Fundamentals' },
  { id: 'xKk2PhU1GYQ', title: 'Lec 2: Solar Energy Basics',         module: 'Solar Power',         course: 'Renewable Energy Fundamentals' },
  { id: 'xucSgcB0i-g', title: 'Lec 3: Wind Energy Systems',         module: 'Wind Power',          course: 'Renewable Energy Fundamentals' },
  { id: 'zHYjuF48Tlc', title: 'Lec 4: Hydro & Biomass Energy',      module: 'Biomass & Hydro',     course: 'Renewable Energy Fundamentals' },
  // ─── Solar Installation Course ─────────────────────────────
  { id: 'BWqjPHGM5D0', title: 'Solar Panel Selection Guide',         module: 'Equipment',           course: 'Solar Panel Installation & Maintenance' },
  { id: 'JFnXlY8MVL8', title: 'Rooftop Solar Installation Steps',   module: 'Installation',        course: 'Solar Panel Installation & Maintenance' },
  { id: 'N4y10dMpLeQ', title: 'Solar Wiring & Inverter Setup',      module: 'Electrical',          course: 'Solar Panel Installation & Maintenance' },
  { id: 'bRSeMnpT_ik', title: 'Solar System Maintenance Tips',       module: 'Maintenance',         course: 'Solar Panel Installation & Maintenance' },
  // ─── Organic Farming Course ────────────────────────────────
  { id: 'VdYtTWOQrNs', title: 'Soil Health & Composting',           module: 'Soil Science',        course: 'Sustainable Organic Farming' },
  { id: 'WtZgsyhA294', title: 'Natural Pest Management',            module: 'Pest Control',        course: 'Sustainable Organic Farming' },
  { id: 'YGdeZKO_mxc', title: 'Organic Crop Planning & Rotation',   module: 'Crop Management',     course: 'Sustainable Organic Farming' },
  { id: 'YhtgnlguKyk', title: 'Vermicomposting Techniques',         module: 'Composting',          course: 'Sustainable Organic Farming' },
  // ─── Water Resource Management Course ──────────────────────
  { id: 'dlsSYTg8-UA', title: 'Rainwater Harvesting Methods',       module: 'Water Collection',    course: 'Water Resource Management' },
  { id: 'eSc3SFr6LXE', title: 'Drip Irrigation Systems',           module: 'Irrigation',          course: 'Water Resource Management' },
  { id: 'f6lHaH07S6E', title: 'Water Conservation Strategies',      module: 'Conservation',        course: 'Water Resource Management' },
  { id: 'hUvvqZ7UWPM', title: 'Water Quality Testing & Treatment',  module: 'Quality',             course: 'Water Resource Management' },
  // ─── Waste Management Course ───────────────────────────────
  { id: 'jZs37m3IXJU', title: 'Solid Waste Segregation',            module: 'Segregation',         course: 'Waste Management & Recycling' },
  { id: 'jwjG-MZibSA', title: 'Recycling & Upcycling Techniques',  module: 'Recycling',           course: 'Waste Management & Recycling' },
  { id: 'q7VIITSysMs', title: 'Biogas from Organic Waste',          module: 'Biogas',              course: 'Waste Management & Recycling' },
  { id: 'uarkiL5InKE', title: 'E-Waste Handling & Disposal',        module: 'E-Waste',             course: 'Waste Management & Recycling' },
];

const COURSE_META = {
  'Renewable Energy Fundamentals': {
    description: 'Comprehensive introduction to renewable energy sources — solar, wind, hydro and biomass — for rural communities.',
    category: 'Renewable Energy',
    difficulty: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=1000',
    skillTags: ['Solar', 'Wind', 'Biomass', 'Hydro', 'Green Energy'],
  },
  'Solar Panel Installation & Maintenance': {
    description: 'Learn how to select, install, wire and maintain rooftop solar PV systems for rural homes and farms.',
    category: 'Renewable Energy',
    difficulty: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1000',
    skillTags: ['Solar PV', 'Wiring', 'Inverter', 'Maintenance'],
  },
  'Sustainable Organic Farming': {
    description: 'Master chemical-free farming, natural pest control, composting and crop rotation for sustainable rural agriculture.',
    category: 'Sustainable Agriculture',
    difficulty: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=1000',
    skillTags: ['Organic', 'Composting', 'Pest Control', 'Soil Health'],
  },
  'Water Resource Management': {
    description: 'Digital tools and traditional methods for monitoring, conserving and treating water in rural areas.',
    category: 'Eco-Management',
    difficulty: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1468476396571-4d6f2a427ee7?auto=format&fit=crop&q=80&w=1000',
    skillTags: ['Irrigation', 'Rainwater', 'Water Quality', 'Conservation'],
  },
  'Waste Management & Recycling': {
    description: 'Practical guide to solid waste segregation, recycling, biogas generation and safe e-waste disposal.',
    category: 'Eco-Management',
    difficulty: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=1000',
    skillTags: ['Recycling', 'Biogas', 'E-Waste', 'Segregation'],
  },
};

async function recoverDatabase() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/green_skills';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB:', uri);

    // ── Step 1: Clear only courses & quizzes (keep users/results) ──
    await Course.deleteMany({});
    console.log('🗑  Cleared existing courses');

    // ── Step 2: Group videos by course ──────────────────────────────
    const courseMap = {};
    for (const v of VIDEO_DATA) {
      if (!courseMap[v.course]) courseMap[v.course] = [];
      courseMap[v.course].push(v);
    }

    // ── Step 3: Build & insert courses ──────────────────────────────
    const insertedCourses = [];
    for (const [courseName, videos] of Object.entries(courseMap)) {
      const meta = COURSE_META[courseName];

      const lessons = videos.map(v => ({
        moduleTitle: v.module,
        title: v.title,
        videoSource: 'direct',
        youtubeLink: `https://www.youtube.com/watch?v=${v.id}`,
        directVideoUrl: `http://localhost:5001/api/videos/stream/${v.id}`,
        internalVideoUrl: `http://localhost:5001/api/videos/stream/${v.id}`,
        youtube_video_id: v.id,
        status: 'completed',
        duration: '10:00',
        isMandatory: true,
      }));

      const course = new Course({
        title: courseName,
        description: meta.description,
        category: meta.category,
        difficulty: meta.difficulty,
        thumbnail: meta.thumbnail,
        skillTags: meta.skillTags,
        lessons,
      });

      await course.save();
      insertedCourses.push(course);
      console.log(`✅ Course saved: "${courseName}" (${lessons.length} lessons)`);
    }

    // ── Step 4: Recover Quiz ─────────────────────────────────────────
    // Remove seed quiz and restore a proper quiz with 50 questions
    await Quiz.deleteMany({});

    const recoveredQuiz = new Quiz({
      title: 'Green Skills Comprehensive Assessment',
      description: 'A 50-question comprehensive assessment covering Renewable Energy, Organic Farming, Water Resource Management, and Waste Management.',
      category: 'General',
      courseId: insertedCourses[0]._id, // Associate with first course
      isPublished: true,
      duration: 60, // 60 minutes
      questions: [
        // === Course 1: Renewable Energy Fundamentals (Questions 1-10) ===
        {
          questionText: 'Which of the following is considered a primary energy scenario constraint for rural grids?',
          options: ['Grid stability & peak power matches', 'High initial solar module efficiency only', 'Consumer preference for AC over DC', 'Wind speed uniformity'],
          correctAnswer: 0,
          explanation: 'Grid stability and matching peak demand with variable supply are major challenges for off-grid rural power scenarios.'
        },
        {
          questionText: "In global energy transitions, what does the term 'Decentralized Energy Systems' primarily refer to?",
          options: ['Power generated from large nuclear plants', 'Power generation at or near the point of use', 'Transmission of power across international lines', 'Fossil fuel refinement facilities'],
          correctAnswer: 1,
          explanation: 'Decentralized energy systems generate power close to the end-users, reducing transmission loss and improving local reliability.'
        },
        {
          questionText: 'Photovoltaic cells exploit which material property to produce electricity from photons?',
          options: ['Piezoelectricity', 'Electromagnetism', 'Semiconductivity & band gap excitation', 'Superconductivity'],
          correctAnswer: 2,
          explanation: 'Solar cells utilize semiconducting materials (like silicon) with a band gap that allows absorbed photons to excite electrons and create current.'
        },
        {
          questionText: 'What is the standard test condition (STC) cell temperature used for rating solar panel performance?',
          options: ['0°C', '25°C', '50°C', '75°C'],
          correctAnswer: 1,
          explanation: 'STC ratings specify a cell temperature of 25°C, an irradiance of 1000 W/m², and an air mass of 1.5.'
        },
        {
          questionText: 'In wind energy systems, what determines the theoretical limit of energy extraction from wind?',
          options: ['Betz Limit (approx. 59.3%)', 'Carnot Limit', 'Einstein\'s Equation', 'Newton\'s Second Law'],
          correctAnswer: 0,
          explanation: 'The Betz Limit states that a wind turbine can capture a maximum of 59.3% of the kinetic energy in the wind.'
        },
        {
          questionText: 'What is the function of the yaw mechanism in a wind turbine?',
          options: ['To control blade pitch angle', 'To orient the rotor toward the wind direction', 'To apply mechanical brakes during high winds', 'To start the generator'],
          correctAnswer: 1,
          explanation: 'The yaw mechanism rotates the nacelle on the tower so the rotor faces directly into the wind as wind direction changes.'
        },
        {
          questionText: 'Which type of wind turbine is most commonly used for large-scale utility power generation?',
          options: ['Vertical Axis Wind Turbine (VAWT)', 'Horizontal Axis Wind Turbine (HAWT)', 'Savonius Wind Turbine', 'Darrieus Wind Turbine'],
          correctAnswer: 1,
          explanation: 'HAWTs with three-blade rotors are the standard for utility-scale power generation due to their higher aerodynamic efficiency.'
        },
        {
          questionText: 'Biomass gasification converts organic materials into which combustible gas mixture?',
          options: ['Pure methane', 'Syngas (carbon monoxide & hydrogen)', 'Carbon dioxide & nitrogen', 'LPG'],
          correctAnswer: 1,
          explanation: 'Gasification processes organic material under high temperatures with limited oxygen to produce syngas (synthesis gas).'
        },
        {
          questionText: 'In micro-hydro power plants, what is the \'head\' of a system?',
          options: ['The length of the generator shaft', 'The vertical distance the water falls', 'The volume flow rate of the stream', 'The turbine rotor diameter'],
          correctAnswer: 1,
          explanation: '\'Head\' refers to the vertical height difference between the water intake and the turbine, which determines pressure.'
        },
        {
          questionText: 'What is the primary environmental benefit of using biomass energy over coal?',
          options: ['It is completely non-combustible', 'It is carbon-neutral when managed sustainably', 'It produces zero particulate emissions', 'It requires no land use'],
          correctAnswer: 1,
          explanation: 'Biomass absorbs CO2 during growth, making it carbon-neutral if the harvest rate does not exceed the replanting rate.'
        },

        // === Course 2: Solar Panel Installation & Maintenance (Questions 11-20) ===
        {
          questionText: 'Which factor is most critical when selecting a site for rooftop solar panels?',
          options: ['Distance to nearest highway', 'Shading from nearby trees or structures', 'Rooftop color', 'Local humidity levels'],
          correctAnswer: 1,
          explanation: 'Micro-shading can severely reduce output across an entire solar array string.'
        },
        {
          questionText: 'What does \'Voc\' stand for on a solar panel technical label?',
          options: ['Voltage at open circuit', 'Variable output current', 'Voltage under standard operation', 'Voltage of cell assembly'],
          correctAnswer: 0,
          explanation: 'Open-circuit voltage (Voc) is the maximum voltage a solar panel can produce when disconnected from any load.'
        },
        {
          questionText: 'Why are solar panels mounted with an air gap beneath them on a rooftop?',
          options: ['To allow birds to nest', 'To prevent water accumulation', 'To allow air circulation and cool the panels', 'To simplify wiring access'],
          correctAnswer: 2,
          explanation: 'Solar panel efficiency decreases as their temperature rises; an air gap allows passive cooling.'
        },
        {
          questionText: 'Which mounting angle is generally recommended for solar panels in India to optimize year-round solar capture?',
          options: ['Equivalent to the local latitude', 'Strictly horizontal (0 degrees)', 'Strictly vertical (90 degrees)', 'Latitude plus 45 degrees'],
          correctAnswer: 0,
          explanation: 'Mounting panels at an angle roughly equal to the site\'s latitude maximizes year-round average solar radiation absorption.'
        },
        {
          questionText: 'What is the function of a bypass diode in a solar panel module?',
          options: ['To convert DC to AC directly', 'To allow current to flow around shaded cells', 'To regulate battery charging voltage', 'To shut down the array at night'],
          correctAnswer: 1,
          explanation: 'Bypass diodes prevent shaded cells from becoming hot spots by allowing current to bypass them.'
        },
        {
          questionText: 'In solar wiring, why is multi-strand copper wire preferred over solid copper wire?',
          options: ['It has higher resistance', 'It is more flexible and resistant to vibration/fatigue', 'It is cheaper to manufacture', 'It carries only high-voltage AC'],
          correctAnswer: 1,
          explanation: 'Multi-strand cables are flexible and durable, making them ideal for outdoor conduits and roof mounting.'
        },
        {
          questionText: 'What is the purpose of an anti-islanding protection in grid-tied solar inverters?',
          options: ['To protect the inverter from salty island air', 'To disconnect the inverter from the grid during utility outages', 'To increase electricity export tariff', 'To store power in local microgrids'],
          correctAnswer: 1,
          explanation: 'Islanding is hazardous to line workers; anti-islanding shuts down the inverter if grid power is lost.'
        },
        {
          questionText: 'How often should solar panels be cleaned in dusty rural environments for optimal output?',
          options: ['Once every year', 'Every 1-2 weeks', 'Only during monsoons', 'Daily with high-pressure steam'],
          correctAnswer: 1,
          explanation: 'Regular cleaning (every 1-2 weeks) prevents dust buildup (soiling) from reducing efficiency by 10% to 30%.'
        },
        {
          questionText: 'Which tool is essential to safely check if a solar string has a high-resistance grounding fault?',
          options: ['Infrared thermometer', 'Insulation resistance tester (Megger)', 'Standard wire strippers', 'Soldering iron'],
          correctAnswer: 1,
          explanation: 'An insulation resistance tester (Megger) checks the wire insulation to detect grounding leaks.'
        },
        {
          questionText: 'What is the first safety action before inspecting a suspected malfunctioning string inverter?',
          options: ['Wash the solar panels', 'Disconnect the AC breaker followed by the DC isolator', 'Disconnect the DC isolator first', 'Tap the inverter casing to check for vibrations'],
          correctAnswer: 1,
          explanation: 'Turning off the AC side first extinguishes load currents, reducing arcing when the DC switches are flipped.'
        },

        // === Course 3: Sustainable Organic Farming (Questions 21-30) ===
        {
          questionText: 'What is the primary role of mycorrhizal fungi in organic soils?',
          options: ['To decompose heavy stones', 'To form symbiotic networks that transfer nutrients and water to roots', 'To kill insect larvae', 'To increase soil acidity'],
          correctAnswer: 1,
          explanation: 'Mycorrhizae form a symbiotic relationship with plant roots, effectively increasing the root surface area for nutrients like phosphorus.'
        },
        {
          questionText: 'Which green manure crop is commonly grown in India to fix nitrogen before planting main crops?',
          options: ['Mustard', 'Sunn hemp (Crotalaria juncea) or Dhaincha', 'Wheat grass', 'Sugarcane'],
          correctAnswer: 1,
          explanation: 'Sunn hemp and Dhaincha are leguminous green manures that fix atmospheric nitrogen in soil nodules.'
        },
        {
          questionText: 'In natural pest management, what is a \'trap crop\'?',
          options: ['A crop that catches chemical sprays', 'A crop planted to lure pests away from the main cash crop', 'A crop that poisons all insects', 'A net placed over fields'],
          correctAnswer: 1,
          explanation: 'Trap crops (like marigolds or castor) attract pests, keeping them off key crops like cotton or tomatoes.'
        },
        {
          questionText: 'What is the primary active ingredient in Neem oil that acts as an insect growth regulator?',
          options: ['Nicotine', 'Azadirachtin', 'Capsaicin', 'Rotenone'],
          correctAnswer: 1,
          explanation: 'Azadirachtin disrupts the hormonal systems of insects, preventing them from feeding, growing, and reproducing.'
        },
        {
          questionText: 'Crop rotation involving shallow-rooted and deep-rooted crops helps prevent which soil issue?',
          options: ['Wind erosion only', 'Nutrient depletion in specific soil zones & compaction', 'Over-hydration', 'High salinity'],
          correctAnswer: 1,
          explanation: 'Rotating roots of different depths ensures nutrients are drawn evenly from different soil profiles.'
        },
        {
          questionText: 'Which crop combination is a classic example of intercropping/companion planting?',
          options: ['Wheat and barley', 'Maize, beans, and squash (Three Sisters)', 'Rice and sugarcane', 'Potato and sweet potato'],
          correctAnswer: 1,
          explanation: 'Maize provides support for climbing beans, which fix nitrogen, while squash covers the ground to prevent weeds.'
        },
        {
          questionText: 'Why is synthetic chemical fertilizer (like urea) banned in organic farming?',
          options: ['It is too expensive', 'It kills soil microbiology, degrades structure, and leaches groundwater', 'It has no nutritional value for plants', 'It attracts rain clouds'],
          correctAnswer: 1,
          explanation: 'Synthetic nitrogen fertilizer bypasses soil biology, leads to structural collapse, and can leach nitrates into water.'
        },
        {
          questionText: 'What is the ideal carbon-to-nitrogen (C:N) ratio for compost pile raw materials?',
          options: ['5:1', '30:1', '100:1', '500:1'],
          correctAnswer: 1,
          explanation: 'A 30:1 ratio provides microbes with enough carbon for energy and nitrogen for protein synthesis without odor.'
        },
        {
          questionText: 'Which earthworm species is most preferred for vermicomposting organic farm waste?',
          options: ['Common nightcrawler', 'Eisenia fetida (Red wiggler)', 'Indian blue worm only', 'African giant worm'],
          correctAnswer: 1,
          explanation: 'Eisenia fetida is highly efficient at processing organic waste near the surface, rather than burrowing deep.'
        },
        {
          questionText: 'What indicates that vermicompost is fully mature and ready for application?',
          options: ['It is hot and smells of ammonia', 'It is dark brown, crumbly, and has an earthy smell', 'It is wet and sticky', 'Earthworms are no longer alive in it'],
          correctAnswer: 1,
          explanation: 'Mature compost should be stable, dark, rich, crumbly, and smell like clean forest soil.'
        },

        // === Course 4: Water Resource Management (Questions 31-40) ===
        {
          questionText: 'What is the purpose of a first flush diverter in rainwater harvesting?',
          options: ['To collect the cleanest rainwater first', 'To divert the initial, contaminated wash-off away from the storage tank', 'To increase water pressure in taps', 'To filter out sand only'],
          correctAnswer: 1,
          explanation: 'The first flush of rain washes dust, bird droppings, and debris off the roof; diverting it keeps the main storage clean.'
        },
        {
          questionText: 'In rooftop rainwater harvesting, which roofing material is safest for drinking water collection?',
          options: ['Asbestos sheets', 'Galvanized iron (GI) sheets or food-grade plastic', 'Leaded paint metal sheets', 'Tar paper shingles'],
          correctAnswer: 1,
          explanation: 'Asbestos and lead leach toxic materials; GI and food-grade plastic sheets are safe for potable collection.'
        },
        {
          questionText: 'Which component of a drip irrigation system maintains uniform pressure across sloping fields?',
          options: ['Sand filter', 'Pressure compensating (PC) emitters', 'Venturi injector', 'Sub-main valves'],
          correctAnswer: 1,
          explanation: 'PC emitters release water at a constant rate regardless of elevation changes and pressure fluctuations.'
        },
        {
          questionText: 'What is a key disadvantage of micro-sprinklers compared to drip irrigation?',
          options: ['They are more expensive to buy', 'Higher water loss to evaporation & wind drift', 'They clog more easily', 'They cannot deliver nutrients'],
          correctAnswer: 1,
          explanation: 'Micro-sprinklers throw water into the air, increasing evaporation losses compared to direct soil drippers.'
        },
        {
          questionText: 'How does mulching assist in water conservation in agriculture?',
          options: ['By attracting rain', 'By reducing soil water evaporation and holding moisture', 'By filtering chemical runoff', 'By cooling root zones only'],
          correctAnswer: 1,
          explanation: 'Mulching shields the soil from direct sunlight, reducing evaporation and preserving moisture.'
        },
        {
          questionText: 'What is the function of a check dam in watershed management?',
          options: ['To store water for cities', 'To slow down water runoff, prevent erosion, and recharge groundwater', 'To generate hydroelectric power', 'To fish farm'],
          correctAnswer: 1,
          explanation: 'Check dams slow surface runoff in gullies, allowing water to infiltrate and recharge underground aquifers.'
        },
        {
          questionText: 'What does the term \'aquifer\' refer to?',
          options: ['A water purification device', 'A water-bearing underground rock formation', 'A canal for irrigation', 'A rain cloud formation'],
          correctAnswer: 1,
          explanation: 'An aquifer is an underground layer of water-bearing permeable rock, gravel, sand, or silt.'
        },
        {
          questionText: 'Which parameter is measured to estimate the concentration of dissolved salts in irrigation water?',
          options: ['pH', 'Electrical Conductivity (EC)', 'Turbidity', 'Dissolved Oxygen'],
          correctAnswer: 1,
          explanation: 'EC increases proportionally with dissolved salt levels, making it the standard metric for salinity.'
        },
        {
          questionText: 'What does a high level of coliform bacteria in a well indicate?',
          options: ['Excessive chemical pesticide runoff', 'Contamination from sewage or animal waste', 'High mineral deposits', 'Acid rain infiltration'],
          correctAnswer: 1,
          explanation: 'Coliforms indicate biological contamination from fecal matter, posing immediate disease risks.'
        },
        {
          questionText: 'How does solar water disinfection (SODIS) treat water?',
          options: ['Using solar panels to boil water', 'Exposing water in transparent PET bottles to sunlight UV radiation', 'Adding solar chlorine', 'Filtering through solar cells'],
          correctAnswer: 1,
          explanation: 'SODIS uses solar UV-A radiation and heat to destroy pathogens in clear plastic bottles.'
        },

        // === Course 5: Waste Management & Recycling (Questions 41-50) ===
        {
          questionText: 'Which category of waste should go into the green-colored bin in Indian municipality systems?',
          options: ['Dry plastic wrappers', 'Wet, biodegradable organic waste', 'Hazardous sanitary items', 'Broken glass'],
          correctAnswer: 1,
          explanation: 'Green bins are designated for organic/wet waste like food scraps, which can be composted.'
        },
        {
          questionText: 'Why is waste segregation at the source critical for recycling?',
          options: ['It reduces the weight of waste', 'It prevents clean recyclables from being contaminated by wet waste', 'It is required by law everywhere', 'It speeds up collection trucks'],
          correctAnswer: 1,
          explanation: 'Mixing wet waste with paper or plastic makes them dirty and unrecyclable, sending them to landfills.'
        },
        {
          questionText: 'What is the process of upcycling?',
          options: ['Breaking waste down into raw chemical form', 'Transforming waste materials into products of higher value or quality', 'Burning waste to generate heat', 'Burying waste in deep pits'],
          correctAnswer: 1,
          explanation: 'Upcycling increases the value or utility of waste products by creative reuse (e.g. making furniture from pallets).'
        },
        {
          questionText: 'Which plastic type is represented by the resin code #1 and is highly recyclable?',
          options: ['PVC (Polyvinyl Chloride)', 'PET (Polyethylene Terephthalate)', 'PS (Polystyrene)', 'LDPE'],
          correctAnswer: 1,
          explanation: 'PET (#1) is widely used for water bottles and is the most commonly recycled plastic.'
        },
        {
          questionText: 'What is the primary gas produced in an anaerobic biogas digester?',
          options: ['Carbon monoxide', 'Methane (approx. 50-70%)', 'Nitrous oxide', 'Propane'],
          correctAnswer: 1,
          explanation: 'Anaerobic bacteria break down organic waste to produce biogas, which is mostly methane (CH4) and carbon dioxide.'
        },
        {
          questionText: 'What is the nutrient-rich byproduct of biogas production used for?',
          options: ['Industrial fuel', 'Bio-fertilizer (slurry) for crops', 'Plastic additive', 'Paving roads'],
          correctAnswer: 1,
          explanation: 'Digested slurry is rich in nitrogen, phosphorus, and potassium, serving as an excellent organic fertilizer.'
        },
        {
          questionText: 'Which bacteria group is responsible for the final methane-producing stage in a biogas plant?',
          options: ['Lactobacillus', 'Methanogens', 'Streptococcus', 'Azotobacter'],
          correctAnswer: 1,
          explanation: 'Methanogenic archaea (methanogens) convert acetate and hydrogen into methane under strict anaerobic conditions.'
        },
        {
          questionText: 'Why is burning e-waste in open fires highly dangerous?',
          options: ['It doesn\'t burn easily', 'It releases toxic heavy metals and dioxins into the air and soil', 'It consumes too much oxygen', 'It causes high wind currents'],
          correctAnswer: 1,
          explanation: 'E-waste contains lead, mercury, and flame retardants which release carcinogens and toxic fumes when burned openly.'
        },
        {
          questionText: 'Which valuable metals can be recovered from processed computer circuit boards?',
          options: ['Iron and steel only', 'Gold, silver, copper, and palladium', 'Aluminum and zinc only', 'No metals can be recovered'],
          correctAnswer: 1,
          explanation: 'PCBs contain significant amounts of precious metals like gold and copper, which can be recycled.'
        },
        {
          questionText: 'What is the primary goal of the Extended Producer Responsibility (EPR) policy?',
          options: ['To force consumers to pay for recycling', 'To make manufacturers responsible for the entire life cycle of their products', 'To increase tax on electronics', 'To ban plastic production'],
          correctAnswer: 1,
          explanation: 'EPR holds producers responsible for collecting and safely processing their products at end-of-life.'
        }
      ]
    });

    await recoveredQuiz.save();
    console.log(`✅ Quiz saved: "${recoveredQuiz.title}" (${recoveredQuiz.questions.length} questions)`);

    // ── Step 5: Distribute quiz questions to corresponding Course documents ──
    // This makes the quizzes available in the Student Dashboard via Course page or direct Quiz tab
    for (let i = 0; i < insertedCourses.length; i++) {
      const course = insertedCourses[i];
      // Get the 10 questions for this course (each course corresponds to a block of 10 in the list of 50)
      const startIdx = i * 10;
      const endIdx = startIdx + 10;
      const courseQuestions = recoveredQuiz.questions.slice(startIdx, endIdx).map(q => ({
        question: q.questionText,
        options: q.options,
        correctAnswer: q.options[q.correctAnswer],
        explanation: q.explanation,
        difficulty: 'Medium'
      }));

      course.quiz = courseQuestions;
      await course.save();
      console.log(`✅ Distrubuted 10 questions to Course: "${course.title}" quiz field`);
    }

    // ── Step 6: Summary ─────────────────────────────────────────────
    const totalCourses = await Course.countDocuments();
    const totalLessons = insertedCourses.reduce((sum, c) => sum + c.lessons.length, 0);
    const totalQuizzes = await Quiz.countDocuments();

    console.log('\n══════════════════════════════════════');
    console.log('🎉 DATABASE RECOVERY COMPLETE (50 QUESTIONS)!');
    console.log('══════════════════════════════════════');
    console.log(`📚 Courses   : ${totalCourses}`);
    console.log(`🎬 Videos    : ${totalLessons} (all pointing to local mp4 files)`);
    console.log(`📝 Quizzes   : ${totalQuizzes} (with 50 questions)`);
    console.log('══════════════════════════════════════');

  } catch (err) {
    console.error('❌ Recovery failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

recoverDatabase();
