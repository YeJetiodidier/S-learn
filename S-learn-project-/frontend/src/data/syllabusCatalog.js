// Structured O-Level & A-Level GCE Syllabus Catalog for S-Learn Learning & Exam Engines.

export const ACADEMIC_LEVELS = [
  { id: "O-Level", label: "Ordinary Level (O-Level)", short: "O-Level" },
  { id: "A-Level", label: "Advanced Level (A-Level)", short: "A-Level" },
];

export const SYLLABUS_CATALOG = {
  "O-Level": [
    {
      id: "ol-accounting",
      name: "Accounting",
      code: "0505",
      category: "Commercial",
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
        {
          id: "ol-acc-m2",
          title: "MODULE 2: Books of Original Entry & Cash Controls",
          sections: [
            {
              title: "CASH BOOK & BANK RECONCILIATION",
              topics: [
                {
                  id: "ol-acc-t3",
                  number: "4",
                  title: "Cash Book and Petty Cash Book",
                  periods: "6p",
                  concepts: [
                    "two-column cash book",
                    "three-column cash book",
                    "contra entries",
                    "imprest system",
                    "cash discounts",
                  ],
                  objectives: [
                    "Prepare two-column and three-column cash books accurately",
                    "Record contra entries and cash discounts allowed and received",
                    "Maintain an analytical petty cash book under the imprest system",
                  ],
                },
                {
                  id: "ol-acc-t4",
                  number: "5",
                  title: "Bank Reconciliation Statements",
                  periods: "5p",
                  concepts: [
                    "unpresented cheques",
                    "uncredited lodgements",
                    "standing orders",
                    "bank charges",
                    "updated cash book",
                  ],
                  objectives: [
                    "Explain causes of differences between cash book and bank statement balances",
                    "Update the cash book and prepare a bank reconciliation statement",
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "ol-acc-m3",
          title: "MODULE 3: Financial Statements & Adjustments",
          sections: [
            {
              title: "FINAL ACCOUNTS OF A SOLE TRADER",
              topics: [
                {
                  id: "ol-acc-t5",
                  number: "6",
                  title: "Income Statement and Balance Sheet",
                  periods: "8p",
                  concepts: [
                    "gross profit",
                    "net profit",
                    "accruals and prepayments",
                    "depreciation",
                    "provisions for bad debts",
                  ],
                  objectives: [
                    "Prepare trading, profit and loss accounts with end-of-period adjustments",
                    "Calculate straight-line and reducing-balance depreciation",
                    "Present an OHADA-compliant balance sheet",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ol-chemistry",
      name: "Chemistry",
      code: "0515",
      category: "Sciences",
      accent: "#0ea5e9",
      icon: "🧪",
      modules: [
        {
          id: "ol-chem-m1",
          title: "MODULE 1: Matter, Atomic Structure & Bonding",
          sections: [
            {
              title: "ATOMIC STRUCTURE & PERIODICITY",
              topics: [
                {
                  id: "ol-chem-t1",
                  number: "1",
                  title: "Particulate Nature of Matter & Atomic Structure",
                  periods: "6p",
                  concepts: [
                    "states of matter",
                    "sub-atomic particles",
                    "atomic and mass numbers",
                    "isotopes",
                    "electronic configuration",
                  ],
                  objectives: [
                    "Describe the arrangement and motion of particles in solids, liquids, and gases",
                    "Determine protons, neutrons, and electrons from atomic notation",
                    "Write electronic configurations for the first 20 elements",
                  ],
                },
                {
                  id: "ol-chem-t2",
                  number: "2",
                  title: "Chemical Bonding and Structure",
                  periods: "6p",
                  concepts: [
                    "ionic bonding",
                    "covalent bonding",
                    "metallic bonding",
                    "giant structures",
                    "properties of compounds",
                  ],
                  objectives: [
                    "Draw dot-and-cross diagrams for ionic and covalent compounds",
                    "Relate physical properties to bonding and crystal structure",
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "ol-chem-m2",
          title: "MODULE 2: Stoichiometry, Acids, Bases & Salts",
          sections: [
            {
              title: "QUANTITATIVE CHEMISTRY",
              topics: [
                {
                  id: "ol-chem-t3",
                  number: "3",
                  title: "The Mole Concept and Stoichiometry",
                  periods: "8p",
                  concepts: [
                    "relative molecular mass",
                    "Avogadro constant",
                    "molar volume of gases",
                    "empirical formula",
                    "titration calculations",
                  ],
                  objectives: [
                    "Calculate moles, masses, concentrations, and gas volumes",
                    "Determine empirical and molecular formulae from percentage composition",
                    "Solve volumetric analysis titration problems",
                  ],
                },
                {
                  id: "ol-chem-t4",
                  number: "4",
                  title: "Acids, Bases, Salts and pH Scale",
                  periods: "6p",
                  concepts: [
                    "strong vs weak acids",
                    "indicators and pH",
                    "neutralisation",
                    "salt preparation methods",
                    "qualitative ion tests",
                  ],
                  objectives: [
                    "Differentiate strong and weak acids and alkalis using ionisation",
                    "Select appropriate laboratory methods to prepare soluble and insoluble salts",
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "ol-chem-m3",
          title: "MODULE 3: Organic Chemistry & Electrochemistry",
          sections: [
            {
              title: "HYDROCARBONS & POLYMERS",
              topics: [
                {
                  id: "ol-chem-t5",
                  number: "5",
                  title: "Alkanes, Alkenes, Alcohols and Carboxylic Acids",
                  periods: "8p",
                  concepts: [
                    "homologous series",
                    "isomerism",
                    "addition reactions",
                    "esterification",
                    "cracking and polymerisation",
                  ],
                  objectives: [
                    "Name and draw structural isomers of simple organic molecules",
                    "Describe characteristic reactions of alkanes, alkenes, and alcohols",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ol-mathematics",
      name: "Mathematics",
      code: "0570",
      category: "Core",
      accent: "#6366f1",
      icon: "📐",
      modules: [
        {
          id: "ol-math-m1",
          title: "MODULE 1: Number Systems, Sets & Algebra",
          sections: [
            {
              title: "NUMBERS & SET THEORY",
              topics: [
                {
                  id: "ol-math-t1",
                  number: "1",
                  title: "Sets, Venn Diagrams and Logic",
                  periods: "5p",
                  concepts: [
                    "set notation",
                    "union and intersection",
                    "complement of a set",
                    "three-set Venn diagrams",
                    "truth tables",
                  ],
                  objectives: [
                    "Represent relationships accurately using two- and three-set Venn diagrams",
                    "Solve real-life cardinality problems using set identities",
                    "Evaluate compound logical statements using truth tables",
                  ],
                },
                {
                  id: "ol-math-t2",
                  number: "2",
                  title: "Quadratic Equations, Surds & Indices",
                  periods: "7p",
                  concepts: [
                    "laws of indices",
                    "rationalising surds",
                    "factorisation",
                    "completing the square",
                    "quadratic formula",
                  ],
                  objectives: [
                    "Simplify algebraic expressions involving indices and surds",
                    "Solve quadratic equations and interpret their roots graphically",
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "ol-math-m2",
          title: "MODULE 2: Geometry, Trigonometry & Vectors",
          sections: [
            {
              title: "TRIGONOMETRY & CIRCLE THEOREMS",
              topics: [
                {
                  id: "ol-math-t3",
                  number: "3",
                  title: "Trigonometric Ratios, Sine & Cosine Rules",
                  periods: "6p",
                  concepts: [
                    "SOHCAHTOA",
                    "angles of elevation",
                    "bearings",
                    "sine rule",
                    "cosine rule",
                  ],
                  objectives: [
                    "Calculate missing sides and angles in right-angled and non-right-angled triangles",
                    "Apply trigonometry to three-figure bearings and height problems",
                  ],
                },
                {
                  id: "ol-math-t4",
                  number: "4",
                  title: "Vectors, Matrices & Transformations",
                  periods: "6p",
                  concepts: [
                    "column vectors",
                    "matrix multiplication",
                    "determinant and inverse",
                    "enlargement and rotation",
                    "translation and reflection",
                  ],
                  objectives: [
                    "Perform operations on 2x2 matrices and solve simultaneous equations",
                    "Describe geometric transformations using matrix representations",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ol-physics",
      name: "Physics",
      code: "0580",
      category: "Sciences",
      accent: "#f59e0b",
      icon: "⚡",
      modules: [
        {
          id: "ol-phy-m1",
          title: "MODULE 1: Mechanics, Forces & Energy",
          sections: [
            {
              title: "KINEMATICS & DYNAMICS",
              topics: [
                {
                  id: "ol-phy-t1",
                  number: "1",
                  title: "Motion, Forces and Newton's Laws",
                  periods: "6p",
                  concepts: [
                    "velocity-time graphs",
                    "equations of motion",
                    "Newton's three laws",
                    "momentum",
                    "moments and equilibrium",
                  ],
                  objectives: [
                    "Interpret distance-time and velocity-time graphs",
                    "Apply Newton's laws and conservation of momentum to collisions",
                  ],
                },
                {
                  id: "ol-phy-t2",
                  number: "2",
                  title: "Work, Energy, Power and Machines",
                  periods: "5p",
                  concepts: [
                    "kinetic and potential energy",
                    "conservation of energy",
                    "efficiency",
                    "mechanical advantage",
                    "velocity ratio",
                  ],
                  objectives: [
                    "Calculate work done, energy transfers, and power output",
                    "Determine efficiency of simple machines",
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "ol-phy-m2",
          title: "MODULE 2: Waves, Optics & Electricity",
          sections: [
            {
              title: "CURRENT ELECTRICITY",
              topics: [
                {
                  id: "ol-phy-t3",
                  number: "3",
                  title: "Ohm's Law, Circuits and Electrical Power",
                  periods: "7p",
                  concepts: [
                    "current and voltage",
                    "series and parallel resistors",
                    "Ohm's law",
                    "electrical energy (kWh)",
                    "domestic wiring safety",
                  ],
                  objectives: [
                    "Calculate total resistance, current, and voltage in circuit networks",
                    "Explain fuses, earthing, and domestic electrical safety",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ol-biology",
      name: "Biology",
      code: "0510",
      category: "Sciences",
      accent: "#10b981",
      icon: "🧬",
      modules: [
        {
          id: "ol-bio-m1",
          title: "MODULE 1: Cell Biology & Nutrition",
          sections: [
            {
              title: "CELLS & TRANSPORT",
              topics: [
                {
                  id: "ol-bio-t1",
                  number: "1",
                  title: "Cell Structure, Diffusion and Osmosis",
                  periods: "5p",
                  concepts: [
                    "plant vs animal cells",
                    "cell organelles",
                    "diffusion",
                    "osmosis",
                    "active transport",
                  ],
                  objectives: [
                    "Compare structures and functions of plant and animal cells",
                    "Explain how substances move across cell membranes",
                  ],
                },
                {
                  id: "ol-bio-t2",
                  number: "2",
                  title: "Photosynthesis and Human Nutrition",
                  periods: "6p",
                  concepts: [
                    "chloroplasts and light reactions",
                    "limiting factors",
                    "digestive enzymes",
                    "villi and absorption",
                    "balanced diet",
                  ],
                  objectives: [
                    "Write word and balanced chemical equations for photosynthesis",
                    "Trace mechanical and chemical digestion along the alimentary canal",
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "ol-bio-m2",
          title: "MODULE 2: Genetics, Ecology & Reproduction",
          sections: [
            {
              title: "INHERITANCE & VARIATION",
              topics: [
                {
                  id: "ol-bio-t3",
                  number: "3",
                  title: "Cell Division and Mendelian Genetics",
                  periods: "6p",
                  concepts: [
                    "mitosis vs meiosis",
                    "alleles and genotypes",
                    "monohybrid crosses",
                    "sex determination",
                    "mutations",
                  ],
                  objectives: [
                    "Predict phenotypic and genotypic ratios using Punnett squares",
                    "Contrast mitosis and meiosis in growth and reproduction",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ol-cs",
      name: "Computer Science",
      code: "0595",
      category: "Technology",
      accent: "#8b5cf6",
      icon: "💻",
      modules: [
        {
          id: "ol-cs-m1",
          title: "MODULE 1: Computer Architecture & Data Representation",
          sections: [
            {
              title: "NUMBER SYSTEMS & LOGIC",
              topics: [
                {
                  id: "ol-cs-t1",
                  number: "1",
                  title: "Binary, Hexadecimal and Logic Gates",
                  periods: "6p",
                  concepts: [
                    "binary conversion",
                    "hexadecimal",
                    "two's complement",
                    "AND OR NOT XOR gates",
                    "truth tables",
                  ],
                  objectives: [
                    "Convert numbers seamlessly between denary, binary, and hexadecimal",
                    "Construct truth tables and logic circuits for Boolean expressions",
                  ],
                },
              ],
            },
            {
              title: "ALGORITHMS & PROGRAMMING",
              topics: [
                {
                  id: "ol-cs-t2",
                  number: "2",
                  title: "Flowcharts, Pseudocode and Control Structures",
                  periods: "7p",
                  concepts: [
                    "sequence and selection",
                    "loops (FOR, WHILE)",
                    "arrays",
                    "trace tables",
                    "debugging",
                  ],
                  objectives: [
                    "Design algorithms using standard flowcharts and pseudocode",
                    "Dry-run algorithms accurately using trace tables",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ol-economics",
      name: "Economics",
      code: "0525",
      category: "Social Sciences",
      accent: "#ec4899",
      icon: "📈",
      modules: [
        {
          id: "ol-eco-m1",
          title: "MODULE 1: Basic Economic Problem & Price Theory",
          sections: [
            {
              title: "SCARCITY & DEMAND-SUPPLY",
              topics: [
                {
                  id: "ol-eco-t1",
                  number: "1",
                  title: "Scarcity, Choice and Opportunity Cost",
                  periods: "4p",
                  concepts: [
                    "economic problem",
                    "opportunity cost",
                    "production possibility curve",
                    "economic systems",
                  ],
                  objectives: [
                    "Explain scarcity, choice, and opportunity cost using a PPC diagram",
                    "Compare market, planned, and mixed economic systems",
                  ],
                },
                {
                  id: "ol-eco-t2",
                  number: "2",
                  title: "Demand, Supply and Price Elasticity",
                  periods: "6p",
                  concepts: [
                    "law of demand",
                    "shifts vs movements",
                    "market equilibrium",
                    "PED calculations",
                    "price controls",
                  ],
                  objectives: [
                    "Analyse changes in equilibrium price using demand and supply diagrams",
                    "Calculate and interpret price elasticity of demand",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ol-english",
      name: "English Language",
      code: "0530",
      category: "Languages",
      accent: "#14b8a6",
      icon: "✍️",
      modules: [
        {
          id: "ol-eng-m1",
          title: "MODULE 1: Directed Writing, Composition & Comprehension",
          sections: [
            {
              title: "ESSAY & SUMMARY SKILLS",
              topics: [
                {
                  id: "ol-eng-t1",
                  number: "1",
                  title: "Directed Writing and Formal Letters",
                  periods: "5p",
                  concepts: [
                    "audience and tone",
                    "formal letter format",
                    "speech writing",
                    "report structure",
                    "cohesive devices",
                  ],
                  objectives: [
                    "Adapt register and format for letters, speeches, and reports",
                    "Select and reorganise key points cleanly within word limits",
                  ],
                },
                {
                  id: "ol-eng-t2",
                  number: "2",
                  title: "Comprehension and Summary Techniques",
                  periods: "5p",
                  concepts: [
                    "inference questions",
                    "vocabulary in context",
                    "paraphrasing",
                    "concise summary",
                  ],
                  objectives: [
                    "Extract implicit and explicit meanings from unseen passages",
                    "Write clear, concise summaries in your own words",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  "A-Level": [
    {
      id: "al-accounting",
      name: "Accounting (OHADA)",
      code: "0705",
      category: "Commercial",
      accent: "#2563eb",
      icon: "📊",
      modules: [
        {
          id: "al-acc-m1",
          title: "MODULE 1: OHADA Conceptual Framework & Financial Reporting",
          sections: [
            {
              title: "ACCOUNTING ENVIRONMENT & OHADA FRAMEWORK",
              topics: [
                {
                  id: "al-acc-t1",
                  number: "1",
                  title: "OHADA Accounting Principles and Conventions",
                  periods: "6p",
                  concepts: [
                    "going concern",
                    "accrual basis",
                    "prudence concept",
                    "consistency principle",
                    "OHADA classes 1 to 8",
                  ],
                  objectives: [
                    "Evaluate the fundamental accounting conventions of Revised OHADA",
                    "Apply OHADA account classification to complex business events",
                  ],
                },
                {
                  id: "al-acc-t2",
                  number: "2",
                  title: "Company Accounts and Appropriation of Profit",
                  periods: "8p",
                  concepts: [
                    "share capital issue",
                    "legal reserve",
                    "dividends payable",
                    "debentures",
                    "statement of cash flows",
                  ],
                  objectives: [
                    "Record share issues, calls in arrears, and profit appropriation",
                    "Prepare OHADA statement of cash flows and ratio analysis",
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "al-acc-m2",
          title: "MODULE 2: Cost & Management Accounting",
          sections: [
            {
              title: "COSTING & BUDGETARY CONTROL",
              topics: [
                {
                  id: "al-acc-t3",
                  number: "3",
                  title: "Marginal Costing, Break-Even & Variance Analysis",
                  periods: "8p",
                  concepts: [
                    "contribution margin",
                    "break-even point",
                    "margin of safety",
                    "material and labour variances",
                    "flexible budgets",
                  ],
                  objectives: [
                    "Compute break-even point and support make-or-buy decisions",
                    "Calculate and interpret standard costing variances",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "al-chemistry",
      name: "Chemistry",
      code: "0715",
      category: "Sciences",
      accent: "#0ea5e9",
      icon: "🧪",
      modules: [
        {
          id: "al-chem-m1",
          title: "MODULE 1: Physical Chemistry — Energetics, Kinetics & Equilibria",
          sections: [
            {
              title: "THERMOCHEMISTRY & EQUILIBRIUM",
              topics: [
                {
                  id: "al-chem-t1",
                  number: "1",
                  title: "Enthalpy Changes, Hess's Law and Born-Haber Cycles",
                  periods: "8p",
                  concepts: [
                    "enthalpy of formation",
                    "Hess's law",
                    "bond enthalpies",
                    "lattice energy",
                    "Born-Haber cycle",
                  ],
                  objectives: [
                    "Construct energy cycles to calculate enthalpy and lattice energies",
                    "Compare experimental and theoretical lattice energies via polarisation",
                  ],
                },
                {
                  id: "al-chem-t2",
                  number: "2",
                  title: "Chemical Kinetics and Rate Equations",
                  periods: "6p",
                  concepts: [
                    "order of reaction",
                    "rate constant",
                    "half-life",
                    "Arrhenius equation",
                    "rate-determining step",
                  ],
                  objectives: [
                    "Deduce rate equations from initial-rate experimental data",
                    "Link reaction mechanisms to the rate-determining step",
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "al-chem-m2",
          title: "MODULE 2: Organic Synthesis & Spectroscopy",
          sections: [
            {
              title: "REACTION MECHANISMS",
              topics: [
                {
                  id: "al-chem-t3",
                  number: "3",
                  title: "Nucleophilic Substitution, Elimination & Aromatic Chemistry",
                  periods: "8p",
                  concepts: [
                    "SN1 vs SN2 mechanisms",
                    "electrophilic substitution",
                    "benzene delocalisation",
                    "carbonyl chemistry",
                    "IR and mass spectrometry",
                  ],
                  objectives: [
                    "Draw curly-arrow mechanisms for SN1, SN2, and electrophilic substitution",
                    "Design multi-step organic synthesis pathways",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "al-pure-math",
      name: "Pure Mathematics",
      code: "0765",
      category: "Mathematics",
      accent: "#6366f1",
      icon: "∫",
      modules: [
        {
          id: "al-pm-m1",
          title: "MODULE 1: Calculus — Differentiation & Integration",
          sections: [
            {
              title: "DIFFERENTIAL & INTEGRAL CALCULUS",
              topics: [
                {
                  id: "al-pm-t1",
                  number: "1",
                  title: "Differentiation Techniques and Applications",
                  periods: "8p",
                  concepts: [
                    "product and quotient rules",
                    "chain rule",
                    "implicit differentiation",
                    "parametric curves",
                    "Maclaurin series",
                  ],
                  objectives: [
                    "Differentiate implicit, parametric, exponential, and logarithmic functions",
                    "Find stationary points, tangents, normals, and rates of change",
                  ],
                },
                {
                  id: "al-pm-t2",
                  number: "2",
                  title: "Integration Methods and Differential Equations",
                  periods: "8p",
                  concepts: [
                    "integration by parts",
                    "partial fractions",
                    "trigonometric substitution",
                    "separable ODEs",
                    "volumes of revolution",
                  ],
                  objectives: [
                    "Evaluate definite and indefinite integrals using advanced techniques",
                    "Solve first-order separable differential equations with boundary conditions",
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "al-pm-m2",
          title: "MODULE 2: Complex Numbers, Vectors & Proof",
          sections: [
            {
              title: "COMPLEX ANALYSIS & VECTORS",
              topics: [
                {
                  id: "al-pm-t3",
                  number: "3",
                  title: "Complex Numbers, Argand Diagrams and De Moivre's Theorem",
                  periods: "7p",
                  concepts: [
                    "modulus-argument form",
                    "Argand plane loci",
                    "De Moivre's theorem",
                    "nth roots of unity",
                    "mathematical induction",
                  ],
                  objectives: [
                    "Express complex numbers in polar and exponential forms",
                    "Apply De Moivre's theorem to find roots and prove trig identities",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "al-physics",
      name: "Physics",
      code: "0780",
      category: "Sciences",
      accent: "#f59e0b",
      icon: "🔭",
      modules: [
        {
          id: "al-phy-m1",
          title: "MODULE 1: Fields, Oscillations & Waves",
          sections: [
            {
              title: "SHM & FIELDS",
              topics: [
                {
                  id: "al-phy-t1",
                  number: "1",
                  title: "Simple Harmonic Motion and Resonance",
                  periods: "6p",
                  concepts: [
                    "defining SHM equation",
                    "phase difference",
                    "energy in SHM",
                    "damping",
                    "forced oscillations",
                  ],
                  objectives: [
                    "Derive and apply velocity, displacement, and acceleration equations in SHM",
                    "Analyse damping effects and resonance in engineering structures",
                  ],
                },
                {
                  id: "al-phy-t2",
                  number: "2",
                  title: "Gravitational, Electric and Magnetic Fields",
                  periods: "8p",
                  concepts: [
                    "Newton's law of gravitation",
                    "Coulomb's law",
                    "electric potential",
                    "Faraday's & Lenz's laws",
                    "charged particle motion",
                  ],
                  objectives: [
                    "Compare gravitational and electrostatic field strength and potential",
                    "Apply electromagnetic induction laws to generators and transformers",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "al-biology",
      name: "Biology",
      code: "0710",
      category: "Sciences",
      accent: "#10b981",
      icon: "🔬",
      modules: [
        {
          id: "al-bio-m1",
          title: "MODULE 1: Biochemistry, Bioenergetics & Molecular Genetics",
          sections: [
            {
              title: "CELLULAR RESPIRATION & DNA",
              topics: [
                {
                  id: "al-bio-t1",
                  number: "1",
                  title: "Glycolysis, Krebs Cycle and Oxidative Phosphorylation",
                  periods: "8p",
                  concepts: [
                    "ATP synthesis",
                    "glycolysis",
                    "link reaction",
                    "Krebs cycle",
                    "chemiosmosis",
                  ],
                  objectives: [
                    "Trace ATP, NADH, and FADH2 yields across aerobic respiration stages",
                    "Explain proton gradients and ATP synthase in oxidative phosphorylation",
                  ],
                },
                {
                  id: "al-bio-t2",
                  number: "2",
                  title: "DNA Replication, Transcription and Translation",
                  periods: "7p",
                  concepts: [
                    "semi-conservative replication",
                    "mRNA processing",
                    "genetic code",
                    "ribosomes and tRNA",
                    "gene mutations",
                  ],
                  objectives: [
                    "Describe enzyme roles in DNA replication and protein synthesis",
                    "Explain how point and frameshift mutations alter polypeptides",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "al-cs",
      name: "Computer Science",
      code: "0795",
      category: "Technology",
      accent: "#8b5cf6",
      icon: "🖥️",
      modules: [
        {
          id: "al-cs-m1",
          title: "MODULE 1: Data Structures, Algorithms & Databases",
          sections: [
            {
              title: "ALGORITHMS & COMPLEXITY",
              topics: [
                {
                  id: "al-cs-t1",
                  number: "1",
                  title: "Stacks, Queues, Trees and Recursion",
                  periods: "8p",
                  concepts: [
                    "LIFO and FIFO",
                    "linked lists",
                    "binary search trees",
                    "tree traversals",
                    "Big-O notation",
                  ],
                  objectives: [
                    "Implement operations on stacks, queues, linked lists, and binary trees",
                    "Compare sorting and searching algorithms using Big-O complexity",
                  ],
                },
                {
                  id: "al-cs-t2",
                  number: "2",
                  title: "Relational Databases, Normalisation and SQL",
                  periods: "6p",
                  concepts: [
                    "ER diagrams",
                    "1NF, 2NF, 3NF",
                    "primary & foreign keys",
                    "SQL JOIN queries",
                    "ACID transactions",
                  ],
                  objectives: [
                    "Normalise unnormalised tables cleanly up to Third Normal Form (3NF)",
                    "Write multi-table SQL SELECT, GROUP BY, and JOIN statements",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "al-economics",
      name: "Economics",
      code: "0725",
      category: "Social Sciences",
      accent: "#ec4899",
      icon: "🏛️",
      modules: [
        {
          id: "al-eco-m1",
          title: "MODULE 1: Market Structures & Macroeconomics",
          sections: [
            {
              title: "THEORY OF THE FIRM & NATIONAL INCOME",
              topics: [
                {
                  id: "al-eco-t1",
                  number: "1",
                  title: "Perfect Competition, Monopoly and Oligopoly",
                  periods: "7p",
                  concepts: [
                    "MC = MR equilibrium",
                    "supernormal profit",
                    "price discrimination",
                    "kinked demand curve",
                    "allocative efficiency",
                  ],
                  objectives: [
                    "Contrast short-run and long-run equilibrium across market structures",
                    "Evaluate economic efficiency and welfare loss under monopoly",
                  ],
                },
                {
                  id: "al-eco-t2",
                  number: "2",
                  title: "National Income, Inflation and Monetary Policy",
                  periods: "7p",
                  concepts: [
                    "GDP and GNP",
                    "multiplier effect",
                    "AD-AS model",
                    "fiscal vs monetary policy",
                    "balance of payments",
                  ],
                  objectives: [
                    "Analyse macroeconomic shocks using Aggregate Demand and Supply diagrams",
                    "Evaluate central bank and government policy responses to inflation",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const getSubjectsForLevel = (level) => SYLLABUS_CATALOG[level] || SYLLABUS_CATALOG["O-Level"];

export const getTopicsForSubject = (level, subjectName) => {
  const list = getSubjectsForLevel(level);
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
