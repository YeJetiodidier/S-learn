// Complete Official Cameroon GCE Board Syllabus Catalog
// Covers Ordinary Level (O-Level) & Advanced Level (A-Level) across Science, Arts, and Commercial streams.

export const ACADEMIC_LEVELS = [
  { id: "O-Level", label: "Ordinary Level (O-Level)", short: "O-Level" },
  { id: "A-Level", label: "Advanced Level (A-Level)", short: "A-Level" },
];

export const GCE_STREAMS = [
  { id: "All", label: "All Streams" },
  { id: "Science", label: "Science" },
  { id: "Arts", label: "Arts" },
  { id: "Commercial", label: "Commercial" },
];

const makeModule = (id, title, sectionTitle, topics) => ({
  id,
  title,
  sections: [{ title: sectionTitle, topics }],
});

export const SYLLABUS_CATALOG = {
  "O-Level": [
    /* ═══════════════════ COMMERCIAL (O-LEVEL) ═══════════════════ */
    {
      id: "ol-accounting",
      name: "Accounting",
      code: "0505",
      stream: "Commercial",
      category: "Commercial",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured & OHADA Accounts)"],
      accent: "#2563eb",
      icon: "📊",
      modules: [
        {
          id: "ol-acc-m1",
          title: "MODULE 1: Accounting Environment and the OHADA System",
          sections: [
            {
              title: "ACCOUNTING ENVIRONMENT",
              topics: [
                {
                  id: "ol-acc-t1",
                  number: "1",
                  title: "Accounting Environment",
                  periods: "4p",
                  concepts: [
                    "accounting defined",
                    "forms of business organisation",
                    "types of business activities",
                    "role of enterprise in the economy",
                    "role of accounting in business",
                  ],
                  objectives: [
                    "Define accounting and explain its purpose",
                    "Identify forms of business organisation (sole trader, partnership, company)",
                    "Classify types of business activities",
                    "Explain the role of accounting in business decision-making",
                  ],
                },
              ],
            },
            {
              title: "RECORDING PROCESS AND INTRODUCTION TO OHADA",
              topics: [
                {
                  id: "ol-acc-t2",
                  number: "2-3",
                  title: "Recording Process and Introduction to OHADA Accounting System",
                  periods: "8p",
                  concepts: [
                    "the accounts",
                    "classification of accounts",
                    "double entry principle",
                    "journals (books of original entry)",
                    "the ledger",
                    "trial balance",
                    "accounting period",
                    "accounting equation",
                    "capital and revenue expenditure",
                  ],
                  objectives: [
                    "Apply the double entry principle to business transactions",
                    "Classify accounts under the OHADA chart of accounts",
                    "Record transactions in journals, post to ledgers, and extract a trial balance",
                    "Distinguish between capital and revenue expenditure",
                  ],
                },
              ],
            },
          ],
        },
        makeModule("ol-acc-m2", "MODULE 2: Books of Original Entry & Cash Controls", "CASH BOOK & RECONCILIATION", [
          {
            id: "ol-acc-t3",
            number: "4",
            title: "Cash Book, Petty Cash and Bank Reconciliation",
            periods: "6p",
            concepts: ["three-column cash book", "contra entries", "imprest system", "unpresented cheques", "bank reconciliation"],
            objectives: [
              "Prepare two-column, three-column, and analytical petty cash books",
              "Reconcile cash book balances with bank statements",
            ],
          },
          {
            id: "ol-acc-t4",
            number: "5",
            title: "Final Accounts and Year-End Adjustments",
            periods: "8p",
            concepts: ["income statement", "balance sheet", "accruals & prepayments", "depreciation", "bad debts"],
            objectives: [
              "Prepare sole-trader final accounts with OHADA adjustments",
              "Calculate straight-line and reducing-balance depreciation",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-commerce",
      name: "Commerce",
      code: "0520",
      stream: "Commercial",
      category: "Commercial",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Essay & Case Study)"],
      accent: "#0d9488",
      icon: "🏪",
      modules: [
        makeModule("ol-com-m1", "MODULE 1: Production, Trade & Business Units", "HOME & FOREIGN TRADE", [
          {
            id: "ol-com-t1",
            number: "1",
            title: "Nature of Commerce, Production & Specialisation",
            periods: "5p",
            concepts: ["direct vs indirect production", "division of labour", "chain of distribution", "retail & wholesale trade"],
            objectives: [
              "Explain the branches of commerce and aids to trade",
              "Describe roles of wholesalers, retailers, and modern e-commerce channels",
            ],
          },
          {
            id: "ol-com-t2",
            number: "2",
            title: "Banking, Insurance, Transport & Communication",
            periods: "6p",
            concepts: ["commercial banks", "cheques & mobile money", "principles of insurance", "warehousing", "foreign trade documents"],
            objectives: [
              "Distinguish functions of commercial banks and BEAC central banking",
              "Explain utmost good faith, indemnity, and insurable interest",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-economics",
      name: "Economics",
      code: "0525",
      stream: "Commercial",
      category: "Commercial",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Data Response & Essay)"],
      accent: "#ec4899",
      icon: "📈",
      modules: [
        makeModule("ol-eco-m1", "MODULE 1: Scarcity, Price Theory & Market Systems", "MICROECONOMICS", [
          {
            id: "ol-eco-t1",
            number: "1",
            title: "Scarcity, Choice and Opportunity Cost",
            periods: "4p",
            concepts: ["economic problem", "opportunity cost", "production possibility curve", "economic systems"],
            objectives: [
              "Explain scarcity, choice, and opportunity cost using PPC diagrams",
              "Compare market, planned, and mixed economic systems",
            ],
          },
          {
            id: "ol-eco-t2",
            number: "2",
            title: "Demand, Supply and Price Elasticity",
            periods: "6p",
            concepts: ["law of demand", "shifts vs movements", "market equilibrium", "PED calculations", "price controls"],
            objectives: [
              "Analyse equilibrium price shifts using demand and supply curves",
              "Calculate and interpret price elasticity of demand and supply",
            ],
          },
        ]),
        makeModule("ol-eco-m2", "MODULE 2: Money, Banking & National Economy", "MACROECONOMICS", [
          {
            id: "ol-eco-t3",
            number: "3",
            title: "Money, Inflation, Unemployment & International Trade",
            periods: "6p",
            concepts: ["functions of money", "causes of inflation", "balance of payments", "taxation", "economic growth"],
            objectives: [
              "Distinguish demand-pull and cost-push inflation",
              "Explain fiscal and monetary measures to reduce unemployment",
            ],
          },
        ]),
      ],
    },

    /* ═══════════════════ SCIENCE (O-LEVEL) ═══════════════════ */
    {
      id: "ol-biology",
      name: "Biology",
      code: "0510",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured & Essay)"],
      accent: "#10b981",
      icon: "🧬",
      modules: [
        makeModule("ol-bio-m1", "MODULE 1: Cell Biology, Nutrition & Transport", "CELLS & PHYSIOLOGY", [
          {
            id: "ol-bio-t1",
            number: "1",
            title: "Cell Structure, Diffusion and Osmosis",
            periods: "5p",
            concepts: ["plant vs animal cells", "cell organelles", "diffusion", "osmosis", "active transport"],
            objectives: [
              "Compare structures and functions of plant and animal cells",
              "Explain movement of substances across selectively permeable membranes",
            ],
          },
          {
            id: "ol-bio-t2",
            number: "2",
            title: "Photosynthesis, Respiration & Human Nutrition",
            periods: "6p",
            concepts: ["chloroplasts", "limiting factors", "digestive enzymes", "aerobic vs anaerobic respiration"],
            objectives: [
              "Write balanced equations for photosynthesis and cellular respiration",
              "Trace mechanical and chemical digestion along the alimentary canal",
            ],
          },
        ]),
        makeModule("ol-bio-m2", "MODULE 2: Genetics, Ecology & Reproduction", "INHERITANCE & ECOSYSTEMS", [
          {
            id: "ol-bio-t3",
            number: "3",
            title: "Cell Division, Mendelian Genetics & Ecology",
            periods: "6p",
            concepts: ["mitosis vs meiosis", "alleles", "Punnett squares", "food webs", "carbon & nitrogen cycles"],
            objectives: [
              "Predict phenotypic and genotypic ratios from monohybrid crosses",
              "Explain energy flow and nutrient cycling in ecosystems",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-chemistry",
      name: "Chemistry",
      code: "0515",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured)"],
      accent: "#0ea5e9",
      icon: "🧪",
      modules: [
        makeModule("ol-chem-m1", "MODULE 1: Atomic Structure, Bonding & Periodicity", "FOUNDATIONS OF CHEMISTRY", [
          {
            id: "ol-chem-t1",
            number: "1",
            title: "Atomic Structure, Isotopes and Chemical Bonding",
            periods: "6p",
            concepts: ["sub-atomic particles", "isotopes", "electronic configuration", "ionic & covalent bonding", "periodic trends"],
            objectives: [
              "Determine protons, neutrons, electrons, and electronic structures",
              "Relate ionic, covalent, and metallic structures to physical properties",
            ],
          },
          {
            id: "ol-chem-t2",
            number: "2",
            title: "The Mole Concept, Stoichiometry, Acids, Bases & Salts",
            periods: "8p",
            concepts: ["molar mass", "molar gas volume", "titration", "pH scale", "salt preparation", "ion tests"],
            objectives: [
              "Solve stoichiometry and volumetric titration problems",
              "Select appropriate laboratory methods for soluble and insoluble salts",
            ],
          },
        ]),
        makeModule("ol-chem-m2", "MODULE 2: Electrochemistry & Organic Chemistry", "REACTIONS & HYDROCARBONS", [
          {
            id: "ol-chem-t3",
            number: "3",
            title: "Electrolysis, Rates of Reaction & Organic Compounds",
            periods: "8p",
            concepts: ["electrolysis", "redox", "alkanes & alkenes", "alcohols", "esterification", "polymers"],
            objectives: [
              "Predict electrode products during electrolysis of molten and aqueous salts",
              "Name isomers and describe reactions of alkanes, alkenes, and alcohols",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-food-nutrition",
      name: "Food and Nutrition",
      code: "0540",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured)", "Paper 3 (Practical)"],
      accent: "#f97316",
      icon: "🥗",
      modules: [
        makeModule("ol-fn-m1", "MODULE 1: Nutrients, Meal Planning & Food Science", "HUMAN NUTRITION", [
          {
            id: "ol-fn-t1",
            number: "1",
            title: "Macronutrients, Micronutrients & Balanced Diets",
            periods: "6p",
            concepts: ["carbohydrates & proteins", "vitamins & minerals", "deficiency diseases", "dietary needs"],
            objectives: [
              "Classify nutrients by biological function and food sources",
              "Plan balanced meals for infants, adolescents, pregnant mothers, and athletes",
            ],
          },
          {
            id: "ol-fn-t2",
            number: "2",
            title: "Food Preservation, Hygiene & Cooking Methods",
            periods: "5p",
            concepts: ["food spoilage", "pasteurisation", "kitchen hygiene", "moist & dry heat methods"],
            objectives: [
              "Explain microbial causes of food poisoning and preservation principles",
              "Compare nutrient retention across different cooking techniques",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-geography",
      name: "Geography",
      code: "0550",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ & Map Reading)", "Paper 2 (Structured & Essay)"],
      accent: "#16a34a",
      icon: "🌍",
      modules: [
        makeModule("ol-geo-m1", "MODULE 1: Physical Geography & Map Work", "GEOMORPHOLOGY & CLIMATOLOGY", [
          {
            id: "ol-geo-t1",
            number: "1",
            title: "Map Reading, Plate Tectonics, Weathering & Rivers",
            periods: "6p",
            concepts: ["contour lines & scale", "plate boundaries", "volcanism", "fluvial landforms", "weather & climate"],
            objectives: [
              "Interpret topographic maps, bearings, gradients, and cross-sections",
              "Explain landforms created by tectonic activity, rivers, and coastal processes",
            ],
          },
          {
            id: "ol-geo-t2",
            number: "2",
            title: "Population, Settlement & Economic Geography of Cameroon",
            periods: "6p",
            concepts: ["population pyramid", "urbanisation", "agriculture", "industrialisation", "environmental conservation"],
            objectives: [
              "Analyse demographic transition and rural-urban migration in Cameroon",
              "Evaluate sustainable resource management and economic development",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-geology",
      name: "Geology",
      code: "0555",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured & Map Work)"],
      accent: "#b45309",
      icon: "🪨",
      modules: [
        makeModule("ol-geol-m1", "MODULE 1: Earth Structure, Minerals & Rocks", "PETROLOGY & STRATIGRAPHY", [
          {
            id: "ol-geol-t1",
            number: "1",
            title: "Earth's Interior, Mineralogy and the Rock Cycle",
            periods: "6p",
            concepts: ["crust mantle core", "Mohs hardness scale", "igneous rocks", "sedimentary rocks", "metamorphism"],
            objectives: [
              "Identify common rock-forming minerals using physical properties",
              "Classify igneous, sedimentary, and metamorphic rocks by texture and origin",
            ],
          },
          {
            id: "ol-geol-t2",
            number: "2",
            title: "Structural Geology, Fossils & Cameroon Geology",
            periods: "6p",
            concepts: ["folds and faults", "unconformities", "index fossils", "Cameroon Volcanic Line"],
            objectives: [
              "Interpret geological cross-sections, dip, strike, and stratigraphic order",
              "Describe the origin and hazards of the Cameroon Volcanic Line",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-human-biology",
      name: "Human Biology",
      code: "0565",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured)"],
      accent: "#e11d48",
      icon: "🫀",
      modules: [
        makeModule("ol-hb-m1", "MODULE 1: Human Organ Systems & Health", "ANATOMY & PHYSIOLOGY", [
          {
            id: "ol-hb-t1",
            number: "1",
            title: "Circulatory, Respiratory, Skeletal & Nervous Systems",
            periods: "7p",
            concepts: ["heart & blood vessels", "gas exchange", "synapses & reflexes", "homeostasis", "kidney nephron"],
            objectives: [
              "Explain double circulation, blood clotting, and gaseous exchange in alveoli",
              "Describe reflex arcs, endocrine coordination, and osmoregulation",
            ],
          },
          {
            id: "ol-hb-t2",
            number: "2",
            title: "Immunity, Infectious Diseases & Community Health",
            periods: "5p",
            concepts: ["pathogens", "malaria & cholera", "vaccination", "antibodies", "sanitation"],
            objectives: [
              "Distinguish active and passive immunity and explain how vaccines work",
              "Outline prevention and control measures for endemic tropical diseases",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-mathematics",
      name: "Mathematics",
      code: "0570",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured)"],
      accent: "#6366f1",
      icon: "📐",
      modules: [
        makeModule("ol-math-m1", "MODULE 1: Number Systems, Sets & Algebra", "NUMBERS & ALGEBRA", [
          {
            id: "ol-math-t1",
            number: "1",
            title: "Sets, Venn Diagrams, Logic & Quadratic Equations",
            periods: "6p",
            concepts: ["Venn diagrams", "truth tables", "indices & surds", "factorisation", "quadratic formula"],
            objectives: [
              "Solve three-set cardinality and logical truth-table problems",
              "Solve linear, simultaneous, and quadratic equations accurately",
            ],
          },
          {
            id: "ol-math-t2",
            number: "2",
            title: "Trigonometry, Circle Theorems, Vectors & Matrices",
            periods: "7p",
            concepts: ["SOHCAHTOA", "sine & cosine rules", "bearings", "2x2 matrices", "transformations"],
            objectives: [
              "Apply sine and cosine rules to triangles and three-figure bearings",
              "Use matrices and vectors to represent geometric transformations",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-add-math",
      name: "Additional Mathematics",
      code: "0575",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured)"],
      accent: "#4f46e5",
      icon: "∑",
      modules: [
        makeModule("ol-am-m1", "MODULE 1: Polynomials, Calculus & Mechanics Intro", "ADVANCED O-LEVEL MATH", [
          {
            id: "ol-am-t1",
            number: "1",
            title: "Remainder & Factor Theorems, Series & Logarithms",
            periods: "6p",
            concepts: ["polynomial division", "AP & GP series", "binomial expansion", "logarithmic equations"],
            objectives: [
              "Factorise cubic polynomials using the factor and remainder theorems",
              "Compute sums of arithmetic and geometric progressions",
            ],
          },
          {
            id: "ol-am-t2",
            number: "2",
            title: "Introductory Differentiation, Integration & Coordinate Geometry",
            periods: "7p",
            concepts: ["gradient of a curve", "stationary points", "area under a curve", "equation of a circle"],
            objectives: [
              "Differentiate and integrate polynomial and simple trig expressions",
              "Solve tangent, normal, and optimisation problems",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-physics",
      name: "Physics",
      code: "0580",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured)"],
      accent: "#f59e0b",
      icon: "⚡",
      modules: [
        makeModule("ol-phy-m1", "MODULE 1: Mechanics, Energy & Thermal Physics", "FORCES & MOTION", [
          {
            id: "ol-phy-t1",
            number: "1",
            title: "Motion, Forces, Newton's Laws & Energy",
            periods: "6p",
            concepts: ["velocity-time graphs", "Newton's laws", "momentum", "work & power", "efficiency"],
            objectives: [
              "Apply kinematics equations and conservation of momentum",
              "Calculate work, energy transfers, and machine efficiency",
            ],
          },
          {
            id: "ol-phy-t2",
            number: "2",
            title: "Waves, Optics, Electricity & Radioactivity",
            periods: "7p",
            concepts: ["reflection & refraction", "Ohm's law", "series & parallel circuits", "electromagnetism", "half-life"],
            objectives: [
              "Solve circuit problems using Ohm's law and electrical power",
              "Compare alpha, beta, and gamma emissions and compute half-life",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-cs",
      name: "Computer Science",
      code: "0595",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured)"],
      accent: "#8b5cf6",
      icon: "💻",
      modules: [
        makeModule("ol-cs-m1", "MODULE 1: Architecture, Logic & Algorithms", "COMPUTING FOUNDATIONS", [
          {
            id: "ol-cs-t1",
            number: "1",
            title: "Binary, Hexadecimal, Logic Gates & Hardware",
            periods: "6p",
            concepts: ["binary & hex", "two's complement", "logic gates", "truth tables", "CPU fetch-execute cycle"],
            objectives: [
              "Convert numbers between denary, binary, and hexadecimal",
              "Construct truth tables and explain the von Neumann architecture",
            ],
          },
          {
            id: "ol-cs-t2",
            number: "2",
            title: "Algorithms, Pseudocode, Flowcharts & Databases",
            periods: "7p",
            concepts: ["flowcharts", "pseudocode", "loops & arrays", "trace tables", "relational tables"],
            objectives: [
              "Write structured pseudocode and dry-run algorithms with trace tables",
              "Design normalized database tables with primary and foreign keys",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-ict",
      name: "Information and Communication Technology (ICT)",
      code: "0596",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured)", "Paper 3 (Practical)"],
      accent: "#06b6d4",
      icon: "🌐",
      modules: [
        makeModule("ol-ict-m1", "MODULE 1: Networks, Productivity & Digital Security", "ICT SYSTEMS", [
          {
            id: "ol-ict-t1",
            number: "1",
            title: "Computer Networks, Internet & Cybersecurity",
            periods: "6p",
            concepts: ["LAN & WAN", "topologies", "protocols (TCP/IP, HTTP)", "malware & firewalls", "data protection"],
            objectives: [
              "Compare network topologies, transmission media, and internet protocols",
              "Explain encryption, authentication, and safe online practices",
            ],
          },
          {
            id: "ol-ict-t2",
            number: "2",
            title: "Spreadsheets, Databases & System Development Life Cycle",
            periods: "6p",
            concepts: ["spreadsheet formulas", "SQL queries", "SDLC phases", "digital ethics"],
            objectives: [
              "Apply spreadsheet functions (IF, SUMIF, VLOOKUP) to business problems",
              "Outline analysis, design, implementation, and testing phases of SDLC",
            ],
          },
        ]),
      ],
    },

    /* ═══════════════════ ARTS (O-LEVEL) ═══════════════════ */
    {
      id: "ol-english",
      name: "English Language",
      code: "0530",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ & Grammar)", "Paper 2 (Directed Writing, Essay & Summary)"],
      accent: "#14b8a6",
      icon: "✍️",
      modules: [
        makeModule("ol-eng-m1", "MODULE 1: Composition, Directed Writing & Comprehension", "COMMUNICATION SKILLS", [
          {
            id: "ol-eng-t1",
            number: "1",
            title: "Directed Writing, Formal Letters, Speeches & Essays",
            periods: "6p",
            concepts: ["formal letter format", "speech & report writing", "argumentative essays", "register & tone"],
            objectives: [
              "Write well-structured formal letters, reports, speeches, and essays",
              "Adapt tone, vocabulary, and cohesion to audience and purpose",
            ],
          },
          {
            id: "ol-eng-t2",
            number: "2",
            title: "Comprehension, Summary & Grammar Mastery",
            periods: "5p",
            concepts: ["inference", "paraphrasing", "concise summary", "clauses & concord", "reported speech"],
            objectives: [
              "Answer inferential comprehension questions and produce concise summaries",
              "Apply grammatical accuracy in tense, concord, and sentence structure",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-literature",
      name: "Literature in English",
      code: "0535",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ & Unseen)", "Paper 2 (Drama, Prose & Poetry)"],
      accent: "#a855f7",
      icon: "📖",
      modules: [
        makeModule("ol-lit-m1", "MODULE 1: Literary Appreciation, Drama, Prose & Poetry", "GENRES & CRITICISM", [
          {
            id: "ol-lit-t1",
            number: "1",
            title: "Literary Devices, Poetic Forms & Unseen Appreciation",
            periods: "6p",
            concepts: ["imagery & metaphor", "irony & satire", "tone & mood", "rhyme & metre", "characterisation"],
            objectives: [
              "Identify and analyse figures of speech and structural techniques",
              "Evaluate theme, tone, and speaker attitude in unseen poems and passages",
            ],
          },
          {
            id: "ol-lit-t2",
            number: "2",
            title: "African & Shakespearean Drama and Prose Analysis",
            periods: "6p",
            concepts: ["plot structure", "tragic hero", "conflict & setting", "point of view", "textual evidence"],
            objectives: [
              "Construct thesis-driven literary essays supported by close textual references",
              "Analyse socio-cultural themes in Cameroon and African literature",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-french",
      name: "French",
      code: "0545",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ & Grammar)", "Paper 2 (Composition & Translation)"],
      accent: "#3b82f6",
      icon: "🇫🇷",
      modules: [
        makeModule("ol-fr-m1", "MODULE 1: Grammaire, Compréhension & Expression Écrite", "LANGUE FRANÇAISE", [
          {
            id: "ol-fr-t1",
            number: "1",
            title: "Temps Verbaux, Pronoms & Accord Grammaticaux",
            periods: "6p",
            concepts: ["passé composé vs imparfait", "subjonctif", "pronoms COD/COI", "discours indirect"],
            objectives: [
              "Conjugate regular and irregular verbs accurately across GCE tenses",
              "Apply pronoun replacement and past participle agreement rules",
            ],
          },
          {
            id: "ol-fr-t2",
            number: "2",
            title: "Traduction (Version & Thème) et Rédaction",
            periods: "5p",
            concepts: ["translation idioms", "letter & essay writing", "reading comprehension", "bilingual expression"],
            objectives: [
              "Translate passages idiomatically between English and French",
              "Write coherent descriptive, narrative, and argumentative essays in French",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-sbe-french",
      name: "Special Bilingual Education French",
      code: "0546",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Bilingual Essay & Literature)"],
      accent: "#2563eb",
      icon: "🗣️",
      modules: [
        makeModule("ol-sbe-m1", "MODULE 1: Bilingual Expression & Francophone Culture", "EDUCATION BILINGUE", [
          {
            id: "ol-sbe-t1",
            number: "1",
            title: "Advanced Bilingual Comprehension, Summary & Translation",
            periods: "6p",
            concepts: ["résumé de texte", "commentaire dirigé", "traduction avancée", "registres de langue"],
            objectives: [
              "Produce accurate French summaries and bilingual analyses",
              "Demonstrate fluent stylistic command across formal and literary registers",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-history",
      name: "History",
      code: "0560",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured & Essay)"],
      accent: "#d97706",
      icon: "🏛️",
      modules: [
        makeModule("ol-hist-m1", "MODULE 1: Cameroon, African & World History", "MODERN HISTORY", [
          {
            id: "ol-hist-t1",
            number: "1",
            title: "Cameroon History: Pre-Colonial, German, Mandate & Reunification",
            periods: "7p",
            concepts: ["Germano-Douala Treaty", "Mandate & Trusteeship", "nationalism", "1961 Plebiscite", "Reunification"],
            objectives: [
              "Trace Cameroon's political evolution from 1884 to the 1972 Unitary State",
              "Evaluate causes and outcomes of the 1961 Southern Cameroons plebiscite",
            ],
          },
          {
            id: "ol-hist-t2",
            number: "2",
            title: "African Decolonisation & 20th Century World Events",
            periods: "6p",
            concepts: ["Scramble for Africa", "World Wars I & II", "League of Nations & UNO", "Cold War", "OAU / AU"],
            objectives: [
              "Analyse causes and global consequences of World Wars I and II",
              "Assess the role of the United Nations and African Union in peacebuilding",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-citizenship",
      name: "Citizenship Education",
      code: "0562",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured & Essay)"],
      accent: "#059669",
      icon: "⚖️",
      modules: [
        makeModule("ol-cit-m1", "MODULE 1: Civic Rights, Governance & Global Citizenship", "CIVICS & LAW", [
          {
            id: "ol-cit-t1",
            number: "1",
            title: "The State, Constitution, Human Rights & Democracy",
            periods: "5p",
            concepts: ["separation of powers", "rule of law", "human rights", "electoral process", "national symbols"],
            objectives: [
              "Explain the executive, legislative, and judicial arms of government in Cameroon",
              "Identify fundamental human rights and civic responsibilities",
            ],
          },
          {
            id: "ol-cit-t2",
            number: "2",
            title: "Social Cohesion, Environment & International Organisations",
            periods: "5p",
            concepts: ["national integration", "anti-corruption", "peace resolution", "Commonwealth & Francophonie"],
            objectives: [
              "Discuss mechanisms for promoting national unity and ethical governance",
              "Explain Cameroon's participation in CEMAC, AU, UN, and Commonwealth",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-religious",
      name: "Religious Studies",
      code: "0585",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured & Essay)"],
      accent: "#7c3aed",
      icon: "🕊️",
      modules: [
        makeModule("ol-rel-m1", "MODULE 1: Sacred Texts, Ethics & Comparative Religion", "RELIGIOUS THOUGHT", [
          {
            id: "ol-rel-t1",
            number: "1",
            title: "Old & New Testament Themes and Islamic / Traditional Values",
            periods: "6p",
            concepts: ["covenant & prophecy", "Gospel parables", "Five Pillars of Islam", "African Traditional Religion", "moral ethics"],
            objectives: [
              "Explain core teachings, parables, and historical contexts of sacred texts",
              "Apply religious ethical principles to family, justice, and social harmony",
            ],
          },
        ]),
      ],
    },
    {
      id: "ol-logic",
      name: "Logic",
      code: "0590",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured & Proofs)"],
      accent: "#475569",
      icon: "🧠",
      modules: [
        makeModule("ol-log-m1", "MODULE 1: Deductive Reasoning, Syllogisms & Fallacies", "FORMAL & INFORMAL LOGIC", [
          {
            id: "ol-log-t1",
            number: "1",
            title: "Arguments, Categorical Syllogisms & Square of Opposition",
            periods: "6p",
            concepts: ["premises & conclusions", "validity vs soundness", "A E I O propositions", "mood & figure", "Venn validity tests"],
            objectives: [
              "Distinguish deductive from inductive arguments and validity from truth",
              "Test categorical syllogisms using rules and Venn diagrams",
            ],
          },
          {
            id: "ol-log-t2",
            number: "2",
            title: "Symbolic Logic, Truth Tables & Informal Fallacies",
            periods: "6p",
            concepts: ["propositional connectives", "truth tables", "tautology & contradiction", "ad hominem & straw man"],
            objectives: [
              "Evaluate compound propositions using truth tables and natural deduction",
              "Identify and correct common informal fallacies in everyday arguments",
            ],
          },
        ]),
      ],
    },
  ],

  "A-Level": [
    /* ═══════════════════ COMMERCIAL (A-LEVEL) ═══════════════════ */
    {
      id: "al-accounting",
      name: "Accounting",
      code: "0705",
      stream: "Commercial",
      category: "Commercial",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Financial & OHADA Accounting)", "Paper 3 (Cost & Management Accounting)"],
      accent: "#2563eb",
      icon: "📊",
      modules: [
        makeModule("al-acc-m1", "MODULE 1: Revised OHADA Framework & Company Accounts", "FINANCIAL REPORTING", [
          {
            id: "al-acc-t1",
            number: "1",
            title: "OHADA Accounting Principles, Conventions & Classes 1–8",
            periods: "6p",
            concepts: ["going concern", "accrual basis", "prudence", "OHADA chart of accounts", "financial statements"],
            objectives: [
              "Apply Revised OHADA conventions to complex corporate transactions",
              "Prepare income statements, balance sheets, and cash flow statements",
            ],
          },
          {
            id: "al-acc-t2",
            number: "2",
            title: "Company Accounts, Share Issues & Ratio Analysis",
            periods: "8p",
            concepts: ["share capital", "legal reserves", "profit appropriation", "debentures", "liquidity & profitability ratios"],
            objectives: [
              "Account for share issues, calls in arrears, and profit appropriation",
              "Interpret financial performance using accounting ratios",
            ],
          },
        ]),
        makeModule("al-acc-m2", "MODULE 2: Cost & Management Accounting", "COSTING & BUDGETS", [
          {
            id: "al-acc-t3",
            number: "3",
            title: "Marginal Costing, Break-Even, Budgeting & Variance Analysis",
            periods: "8p",
            concepts: ["contribution margin", "break-even point", "flexible budgets", "material & labour variances", "investment appraisal"],
            objectives: [
              "Use marginal costing and CVP analysis for short-term decisions",
              "Calculate and interpret standard costing variances and NPV/IRR",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-economics",
      name: "Economics",
      code: "0725",
      stream: "Commercial",
      category: "Commercial",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Data Response & Essay)", "Paper 3 (Applied Economics)"],
      accent: "#ec4899",
      icon: "🏛️",
      modules: [
        makeModule("al-eco-m1", "MODULE 1: Price Theory, Market Structures & Welfare", "MICROECONOMICS", [
          {
            id: "al-eco-t1",
            number: "1",
            title: "Consumer Behaviour, Theory of the Firm & Market Structures",
            periods: "8p",
            concepts: ["indifference curves", "MC = MR equilibrium", "perfect competition", "monopoly & oligopoly", "market failure"],
            objectives: [
              "Compare short-run and long-run equilibrium across all market structures",
              "Evaluate externalities, public goods, and government intervention",
            ],
          },
        ]),
        makeModule("al-eco-m2", "MODULE 2: Macroeconomics, Money & International Trade", "MACROECONOMICS", [
          {
            id: "al-eco-t2",
            number: "2",
            title: "National Income, AD-AS Model, Policy & Balance of Payments",
            periods: "8p",
            concepts: ["GDP & multiplier", "AD-AS curves", "Phillips curve", "fiscal & monetary policy", "exchange rates"],
            objectives: [
              "Analyse macroeconomic shocks and multiplier effects using AD-AS diagrams",
              "Evaluate monetary, fiscal, and supply-side policies in developing economies",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-commerce",
      name: "Commerce",
      code: "0720",
      stream: "Commercial",
      category: "Commercial",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Business & Trade Strategy)"],
      accent: "#0d9488",
      icon: "💼",
      modules: [
        makeModule("al-com-m1", "MODULE 1: Corporate Management, Marketing & Trade Finance", "BUSINESS & COMMERCE", [
          {
            id: "al-com-t1",
            number: "1",
            title: "Business Organisation, Marketing Mix & Strategic Management",
            periods: "6p",
            concepts: ["corporate governance", "4Ps marketing mix", "market segmentation", "capital markets", "international trade finance"],
            objectives: [
              "Evaluate corporate financing options, stock exchanges, and trade credit",
              "Design effective marketing and distribution strategies for enterprises",
            ],
          },
        ]),
      ],
    },

    /* ═══════════════════ SCIENCE (A-LEVEL) ═══════════════════ */
    {
      id: "al-biology",
      name: "Biology",
      code: "0710",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured & Essay)", "Paper 3 (Practical)"],
      accent: "#10b981",
      icon: "🔬",
      modules: [
        makeModule("al-bio-m1", "MODULE 1: Biochemistry, Bioenergetics & Molecular Genetics", "CELLULAR & MOLECULAR BIOLOGY", [
          {
            id: "al-bio-t1",
            number: "1",
            title: "Enzyme Kinetics, Cellular Respiration & Photosynthesis",
            periods: "8p",
            concepts: ["Michaelis-Menten", "glycolysis & Krebs cycle", "oxidative phosphorylation", "Calvin cycle", "chemiosmosis"],
            objectives: [
              "Explain competitive and non-competitive inhibition of enzymes",
              "Trace ATP yields across aerobic respiration and light-dependent/independent reactions",
            ],
          },
          {
            id: "al-bio-t2",
            number: "2",
            title: "DNA Replication, Gene Expression, Immunity & Homeostasis",
            periods: "8p",
            concepts: ["transcription & translation", "lac operon", "biotechnology & PCR", "humoral immunity", "nerve impulse"],
            objectives: [
              "Describe molecular mechanisms of DNA replication and protein synthesis",
              "Explain action potentials, nephron counter-current exchange, and genetic engineering",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-chemistry",
      name: "Chemistry",
      code: "0715",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Physical, Inorganic & Organic)", "Paper 3 (Practical)"],
      accent: "#0ea5e9",
      icon: "🧪",
      modules: [
        makeModule("al-chem-m1", "MODULE 1: Physical Chemistry — Energetics, Kinetics & Equilibria", "PHYSICAL CHEMISTRY", [
          {
            id: "al-chem-t1",
            number: "1",
            title: "Hess's Law, Born-Haber Cycles, Kinetics & Equilibria",
            periods: "8p",
            concepts: ["lattice energy", "rate equations", "Arrhenius equation", "Kc & Kp", "buffer solutions", "electrode potentials"],
            objectives: [
              "Construct Born-Haber energy cycles and deduce reaction mechanisms from rate laws",
              "Solve Kc, Kp, Ka, pH buffer, and standard cell EMF calculations",
            ],
          },
        ]),
        makeModule("al-chem-m2", "MODULE 2: Inorganic Periodicity & Organic Synthesis", "INORGANIC & ORGANIC CHEMISTRY", [
          {
            id: "al-chem-t2",
            number: "2",
            title: "Transition Metals, Mechanisms (SN1/SN2) & Spectroscopy",
            periods: "8p",
            concepts: ["complex ions & ligands", "SN1 vs SN2", "electrophilic substitution", "carbonyls & amines", "IR & NMR spectroscopy"],
            objectives: [
              "Explain variable oxidation states, colour, and catalysis in d-block elements",
              "Draw curly-arrow mechanisms and plan multi-step organic syntheses",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-food-science",
      name: "Food Science and Nutrition",
      code: "0740",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured)", "Paper 3 (Practical)"],
      accent: "#f97316",
      icon: "🥗",
      modules: [
        makeModule("al-fsn-m1", "MODULE 1: Food Chemistry, Microbiology & Clinical Nutrition", "ADVANCED FOOD SCIENCE", [
          {
            id: "al-fsn-t1",
            number: "1",
            title: "Food Macromolecules, Enzymatic Browning & Food Safety (HACCP)",
            periods: "6p",
            concepts: ["Maillard reaction", "emulsions & gels", "food microbiology", "HACCP", "therapeutic diets"],
            objectives: [
              "Explain chemical changes in proteins, lipids, and carbohydrates during processing",
              "Apply HACCP quality assurance and design diets for metabolic conditions",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-geography",
      name: "Geography",
      code: "0750",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Physical Geography)", "Paper 3 (Human & Cameroon Geography)"],
      accent: "#16a34a",
      icon: "🌍",
      modules: [
        makeModule("al-geo-m1", "MODULE 1: Atmospheric, Fluvial, Tectonic & Human Systems", "ADVANCED GEOGRAPHY", [
          {
            id: "al-geo-t1",
            number: "1",
            title: "Climatology, Hydrology, Geomorphology & Biogeography",
            periods: "7p",
            concepts: ["tri-cellular circulation", "drainage basin hydrology", "slope evolution", "soil catenas", "biomes"],
            objectives: [
              "Analyse global atmospheric circulation, monsoon systems, and urban microclimates",
              "Evaluate drainage basin storm hydrographs and slope processes",
            ],
          },
          {
            id: "al-geo-t2",
            number: "2",
            title: "Urban Systems, Industrial Location & Regional Development",
            periods: "6p",
            concepts: ["Weber & von Thunen models", "Christaller central place", "globalisation", "sustainable cities"],
            objectives: [
              "Apply classical spatial models to agriculture, industry, and urban hierarchies",
              "Assess regional development strategies in Cameroon and Sub-Saharan Africa",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-geology",
      name: "Geology",
      code: "0755",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Theory)", "Paper 3 (Practical & Maps)"],
      accent: "#b45309",
      icon: "🪨",
      modules: [
        makeModule("al-geol-m1", "MODULE 1: Mineralogy, Petrology, Plate Tectonics & Economic Geology", "ADVANCED GEOLOGY", [
          {
            id: "al-geol-t1",
            number: "1",
            title: "Crystallography, Magmatic Differentiation & Structural Maps",
            periods: "7p",
            concepts: ["Bowen's reaction series", "metamorphic facies", "stereonets & faults", "ore deposits", "hydrogeology"],
            objectives: [
              "Explain magma evolution using Bowen's reaction series and phase diagrams",
              "Construct accurate structural cross-sections and interpret mineral exploration data",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-pmm",
      name: "Pure Mathematics with Mechanics",
      code: "0765",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Pure Mathematics)", "Paper 3 (Mechanics)"],
      accent: "#6366f1",
      icon: "∫",
      modules: [
        makeModule("al-pmm-m1", "MODULE 1: Calculus, Complex Numbers & Differential Equations", "PURE MATHEMATICS", [
          {
            id: "al-pmm-t1",
            number: "1",
            title: "Differentiation, Integration, Partial Fractions & ODEs",
            periods: "8p",
            concepts: ["implicit & parametric differentiation", "integration by parts", "partial fractions", "separable ODEs", "Maclaurin series"],
            objectives: [
              "Differentiate and integrate advanced algebraic, trig, and exponential functions",
              "Solve first-order differential equations with boundary conditions",
            ],
          },
          {
            id: "al-pmm-t2",
            number: "2",
            title: "Complex Numbers, Vectors & Mechanics (Dynamics & Statics)",
            periods: "8p",
            concepts: ["Argand diagrams", "De Moivre's theorem", "3D vectors", "projectiles", "friction & rigid bodies", "impulse & momentum"],
            objectives: [
              "Apply vector equations of lines and planes in 3D space",
              "Solve projectile, circular motion, equilibrium, and collision mechanics problems",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-pms",
      name: "Pure Mathematics with Statistics",
      code: "0770",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Pure Mathematics)", "Paper 3 (Probability & Statistics)"],
      accent: "#4f46e5",
      icon: "📉",
      modules: [
        makeModule("al-pms-m1", "MODULE 1: Pure Calculus & Statistical Inference", "PROBABILITY & STATISTICS", [
          {
            id: "al-pms-t1",
            number: "1",
            title: "Probability Distributions: Binomial, Poisson & Normal",
            periods: "7p",
            concepts: ["conditional probability", "discrete & continuous PDFs", "Binomial & Poisson", "Normal approximation", "expectation & variance"],
            objectives: [
              "Model real-world phenomena with Binomial, Poisson, and Normal distributions",
              "Compute expectation, variance, and cumulative probabilities accurately",
            ],
          },
          {
            id: "al-pms-t2",
            number: "2",
            title: "Hypothesis Testing, Chi-Squared & Regression",
            periods: "7p",
            concepts: ["z-test & t-test", "confidence intervals", "chi-squared goodness of fit", "correlation & least-squares regression"],
            objectives: [
              "Conduct one-tailed and two-tailed hypothesis tests and interpret p-values",
              "Compute Pearson correlation and regression lines for bivariate data",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-further-math",
      name: "Further Mathematics",
      code: "0775",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Further Pure)", "Paper 3 (Further Mechanics & Stats)"],
      accent: "#7c3aed",
      icon: "∞",
      modules: [
        makeModule("al-fm-m1", "MODULE 1: Linear Algebra, Hyperbolic Functions & Second-Order ODEs", "FURTHER PURE & APPLIED", [
          {
            id: "al-fm-t1",
            number: "1",
            title: "Group Theory, Eigenvalues, Polar Curves & Second-Order ODEs",
            periods: "8p",
            concepts: ["group axioms & Lagrange", "3x3 matrices & eigenvalues", "hyperbolic functions", "polar coordinates", "second-order ODEs"],
            objectives: [
              "Prove algebraic structures form groups and diagonalise matrices via eigenvalues",
              "Solve homogeneous and non-homogeneous second-order linear differential equations",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-physics",
      name: "Physics",
      code: "0780",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Structured)", "Paper 3 (Practical)"],
      accent: "#f59e0b",
      icon: "🔭",
      modules: [
        makeModule("al-phy-m1", "MODULE 1: Oscillations, Fields, Quantum & Nuclear Physics", "ADVANCED PHYSICS", [
          {
            id: "al-phy-t1",
            number: "1",
            title: "Simple Harmonic Motion, Waves & Gravitational/Electric Fields",
            periods: "8p",
            concepts: ["SHM equations", "interference & diffraction", "Newton gravitation", "Coulomb's law", "capacitors", "electromagnetic induction"],
            objectives: [
              "Derive SHM energy equations and analyse wave diffraction patterns",
              "Apply field potential, capacitance, and Faraday-Lenz induction laws",
            ],
          },
          {
            id: "al-phy-t2",
            number: "2",
            title: "Thermodynamics, Quantum Photoelectric Effect & Nuclear Physics",
            periods: "7p",
            concepts: ["ideal gas laws", "photoelectric equation", "de Broglie wavelength", "binding energy", "nuclear fission & fusion"],
            objectives: [
              "Solve Einstein photoelectric and energy-level transition problems",
              "Calculate mass defect, binding energy per nucleon, and decay constants",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-cs",
      name: "Computer Science",
      code: "0795",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Theory)", "Paper 3 (Practical Programming)"],
      accent: "#8b5cf6",
      icon: "🖥️",
      modules: [
        makeModule("al-cs-m1", "MODULE 1: Data Structures, Algorithms, OS & Databases", "ADVANCED COMPUTING", [
          {
            id: "al-cs-t1",
            number: "1",
            title: "Stacks, Queues, Trees, Recursion & Complexity Analysis",
            periods: "8p",
            concepts: ["linked lists", "binary search trees", "sorting & searching", "recursion", "Big-O notation"],
            objectives: [
              "Implement abstract data types and traverse binary trees (pre/in/post-order)",
              "Compare algorithm efficiency using asymptotic Big-O analysis",
            ],
          },
          {
            id: "al-cs-t2",
            number: "2",
            title: "Operating Systems, Networking & Relational SQL Databases",
            periods: "7p",
            concepts: ["process scheduling", "deadlocks", "OSI & TCP/IP layers", "3NF normalisation", "SQL JOINs"],
            objectives: [
              "Explain CPU scheduling, paging, and virtual memory management",
              "Normalise schemas to 3NF and write multi-table SQL queries",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-ict",
      name: "Information and Communication Technology (ICT)",
      code: "0796",
      stream: "Science",
      category: "Science",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Theory)", "Paper 3 (Practical)"],
      accent: "#06b6d4",
      icon: "📡",
      modules: [
        makeModule("al-ict-m1", "MODULE 1: Information Systems, Networks & Project Management", "ENTERPRISE ICT", [
          {
            id: "al-ict-t1",
            number: "1",
            title: "Information Systems, Networking, Web Technologies & Security",
            periods: "7p",
            concepts: ["MIS & DSS", "IPv4/IPv6 subnetting", "cloud computing", "cryptography", "project management (PERT/Gantt)"],
            objectives: [
              "Evaluate enterprise information systems and network security architectures",
              "Manage ICT projects using critical path analysis and system lifecycles",
            ],
          },
        ]),
      ],
    },

    /* ═══════════════════ ARTS (A-LEVEL) ═══════════════════ */
    {
      id: "al-english",
      name: "English Language",
      code: "0730",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ & Language Usage)", "Paper 2 (Summary, Critical Analysis & Essay)"],
      accent: "#14b8a6",
      icon: "✍️",
      modules: [
        makeModule("al-eng-m1", "MODULE 1: Stylistics, Critical Discourse & Advanced Composition", "ADVANCED ENGLISH", [
          {
            id: "al-eng-t1",
            number: "1",
            title: "Linguistic Varieties, Stylistic Analysis & Discursive Writing",
            periods: "7p",
            concepts: ["syntax & semantics", "pragmatics", "stylistic devices", "critical summary", "persuasive essays"],
            objectives: [
              "Analyse register, cohesion, and rhetorical strategies in unseen texts",
              "Compose nuanced discursive, expository, and argumentative essays",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-literature",
      name: "Literature in English",
      code: "0735",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ & Context)", "Paper 2 (Drama & Poetry)", "Paper 3 (Prose & Unseen)"],
      accent: "#a855f7",
      icon: "📖",
      modules: [
        makeModule("al-lit-m1", "MODULE 1: Literary Criticism, Shakespeare, African & World Texts", "ADVANCED LITERATURE", [
          {
            id: "al-lit-t1",
            number: "1",
            title: "Critical Appreciation of Drama, Modern Prose & Poetry",
            periods: "8p",
            concepts: ["post-colonial criticism", "dramatic irony", "narrative voice", "modernist poetry", "comparative essays"],
            objectives: [
              "Evaluate form, ideology, and aesthetic craft across prescribed GCE texts",
              "Perform close critical appreciation of unseen prose and poetry extracts",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-french",
      name: "French",
      code: "0745",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ & Linguistics)", "Paper 2 (Essay & Translation)", "Paper 3 (Literature & Civilisation)"],
      accent: "#3b82f6",
      icon: "🇫🇷",
      modules: [
        makeModule("al-fr-m1", "MODULE 1: Dissertation, Traduction & Littérature Francophone", "FRANÇAIS AVANCÉ", [
          {
            id: "al-fr-t1",
            number: "1",
            title: "Dissertation Littéraire, Traduction et Civilisation",
            periods: "7p",
            concepts: ["dissertation structurée", "version & thème", "négritude & francophonie", "analyse stylistique"],
            objectives: [
              "Write analytical French essays on contemporary and literary themes",
              "Translate complex literary and journalistic passages with stylistic precision",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-sbe-french",
      name: "Special Bilingual Education French",
      code: "0746",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Bilingual Commentary & Synthesis)", "Paper 3 (Oral & Literature)"],
      accent: "#2563eb",
      icon: "🗣️",
      modules: [
        makeModule("al-sbe-m1", "MODULE 1: Synthèse Bilingue & Études Littéraires", "BILINGUISME AVANCÉ", [
          {
            id: "al-sbe-t1",
            number: "1",
            title: "Commentaire Composé, Synthèse et Traduction Comparée",
            periods: "7p",
            concepts: ["commentaire composé", "synthèse de documents", "interculturalité", "traduction spécialisée"],
            objectives: [
              "Synthesise multiple bilingual documents into coherent critical arguments",
              "Demonstrate near-native command of French literary analysis",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-history",
      name: "History",
      code: "0760",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Cameroon & Africa)", "Paper 3 (World History)"],
      accent: "#d97706",
      icon: "🏛️",
      modules: [
        makeModule("al-hist-m1", "MODULE 1: Cameroon, African & Global Diplomacy Since 1800", "ADVANCED HISTORY", [
          {
            id: "al-hist-t1",
            number: "1",
            title: "Cameroon & African Political Transformations (1800–Present)",
            periods: "8p",
            concepts: ["pre-colonial states", "colonial administration", "decolonisation", "post-independence nation-building"],
            objectives: [
              "Critically assess competing historiographical perspectives on Cameroon and Africa",
              "Compare nationalist movements and post-colonial economic reforms",
            ],
          },
          {
            id: "al-hist-t2",
            number: "2",
            title: "European Revolutions, World Wars & Cold War Geopolitics",
            periods: "7p",
            concepts: ["Congress of Vienna", "Treaty of Versailles", "fascism & WWII", "Cold War crises", "globalisation"],
            objectives: [
              "Evaluate diplomatic causes of European conflicts and Cold War realignments",
              "Analyse international peacekeeping and multipolar diplomacy",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-religious",
      name: "Religious Studies",
      code: "0785",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ)", "Paper 2 (Scriptural Studies)", "Paper 3 (Philosophy of Religion & Ethics)"],
      accent: "#7c3aed",
      icon: "🕊️",
      modules: [
        makeModule("al-rel-m1", "MODULE 1: Scriptural Exegesis, Ethics & Philosophy of Religion", "ADVANCED RELIGIOUS STUDIES", [
          {
            id: "al-rel-t1",
            number: "1",
            title: "Prophetic Literature, Synoptic Gospels, Islam & Religious Ethics",
            periods: "7p",
            concepts: ["hermeneutics", "problem of evil", "arguments for God's existence", "bioethics", "interfaith dialogue"],
            objectives: [
              "Critically evaluate theological arguments and scriptural scholarship",
              "Apply religious ethics to contemporary moral and social debates",
            ],
          },
        ]),
      ],
    },
    {
      id: "al-philosophy",
      name: "Philosophy",
      code: "0790",
      stream: "Arts",
      category: "Arts",
      papers: ["Paper 1 (MCQ)", "Paper 2 (History of Philosophy & Epistemology)", "Paper 3 (Logic, Ethics & African Philosophy)"],
      accent: "#475569",
      icon: "🦉",
      modules: [
        makeModule("al-phil-m1", "MODULE 1: Epistemology, Metaphysics, Ethics & African Philosophy", "WESTERN & AFRICAN PHILOSOPHY", [
          {
            id: "al-phil-t1",
            number: "1",
            title: "Rationalism vs Empiricism, Ethics & Political Philosophy",
            periods: "8p",
            concepts: ["Plato & Aristotle", "Descartes & Locke", "Kant's categorical imperative", "utilitarianism", "social contract"],
            objectives: [
              "Compare rationalist and empiricist theories of knowledge",
              "Evaluate deontological, utilitarian, and virtue-ethics frameworks",
            ],
          },
          {
            id: "al-phil-t2",
            number: "2",
            title: "Symbolic Logic & Contemporary African Philosophy",
            periods: "7p",
            concepts: ["predicate logic", "ethnophilosophy", "sage philosophy", "Ubuntu & communalism", "Kwasi Wiredu & Hountondji"],
            objectives: [
              "Construct formal proofs in propositional and predicate logic",
              "Debate major trends and thinkers in contemporary African philosophy",
            ],
          },
        ]),
      ],
    },
  ],
};

export const getSubjectsForLevel = (level, stream = "All") => {
  const list = SYLLABUS_CATALOG[level] || SYLLABUS_CATALOG["O-Level"];
  if (!stream || stream === "All") return list;
  return list.filter((s) => s.stream.toLowerCase() === stream.toLowerCase());
};

export const getAllGceSubjects = () => [
  ...SYLLABUS_CATALOG["O-Level"].map((s) => ({ ...s, level: "O-Level" })),
  ...SYLLABUS_CATALOG["A-Level"].map((s) => ({ ...s, level: "A-Level" })),
];

export const inferStreamForSubject = (subjectName) => {
  const target = String(subjectName || "").trim().toLowerCase();
  if (!target) return "Science";
  const all = getAllGceSubjects();
  const exact = all.find((s) => s.name.toLowerCase() === target);
  if (exact) return exact.stream;
  const partial = all.find(
    (s) => s.name.toLowerCase().includes(target) || target.includes(s.name.toLowerCase()),
  );
  if (partial) return partial.stream;
  if (/account|econ|commerc|market|business/.test(target)) return "Commercial";
  if (/english|lit|french|hist|philos|logic|relig|citizen/.test(target)) return "Arts";
  return "Science";
};

export const getTopicsForSubject = (level, subjectName) => {
  const list = SYLLABUS_CATALOG[level] || SYLLABUS_CATALOG["O-Level"];
  const found = list.find(
    (s) => s.name.toLowerCase() === String(subjectName || "").toLowerCase(),
  );
  if (!found) return [];
  return found.modules.flatMap((mod) =>
    mod.sections.flatMap((sec) =>
      sec.topics.map((topic) => ({
        ...topic,
        moduleTitle: mod.title,
        sectionTitle: sec.title,
      })),
    ),
  );
};
