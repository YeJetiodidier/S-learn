// Concrete, textbook-grade Cameroon GCE Study Notes & Question Explanation Engine.
// Zero meta-text, zero references to "the student" or "go and verify" — pure substantive content.

const CONCRETE_TOPIC_LIBRARY = {
  "accounting environment": {
    overview:
      "Accounting is the systematic process of identifying, recording, classifying, summarising, and communicating financial information about an economic entity to support informed decisions by owners, creditors, tax authorities, and management.",
    keyDefinitions: [
      {
        term: "Accounting",
        definition:
          "The systematic recording, classification, summarisation, analysis, and reporting of monetary transactions of an entity in accordance with established standards such as Revised OHADA.",
      },
      {
        term: "Sole Trader (Sole Proprietorship)",
        definition:
          "An unincorporated business owned and controlled by one individual who contributes the capital, retains all profits, and bears unlimited personal liability for business debts.",
      },
      {
        term: "Partnership",
        definition:
          "A business association of 2 to 20 persons (under general commercial practice) who pool capital and skills to carry on a lawful business in common with a view to profit.",
      },
      {
        term: "Limited Liability Company (SARL / SA)",
        definition:
          "An incorporated legal entity separate from its shareholders, whose financial liability is limited to the unpaid portion of their subscribed shares.",
      },
      {
        term: "OHADA (SYSCOHADA)",
        definition:
          "Organisation for the Harmonisation of Business Law in Africa — the uniform legal and accounting framework governing financial reporting across Cameroon and 16 other member states.",
      },
    ],
    sections: [
      {
        heading: "1. Purpose and Users of Accounting Information",
        content:
          "Financial accounting converts raw source documents (invoices, receipts, credit notes, bank statements) into structured financial statements: the Balance Sheet (Statement of Financial Position), Income Statement, and Cash Flow Statement. Internal users (management and employees) rely on these figures for budgeting, pricing, and cost control, while external users (investors, banks, suppliers, and the Directorate General of Taxation) use them to evaluate profitability, solvency, and tax obligations.",
        bulletPoints: [
          "Measures periodic profit or loss by matching revenues earned against expenses incurred.",
          "Tracks assets controlled, liabilities owed, and owner's equity at any reporting date.",
          "Provides an auditable trail that deters fraud, errors, and mismanagement of funds.",
        ],
        workedExample:
          "Example: Kumba Traders buys goods for 450,000 FCFA cash and sells them for 620,000 FCFA while paying 70,000 FCFA in shop rent. Gross Profit = 620,000 - 450,000 = 170,000 FCFA. Net Profit = 170,000 - 70,000 = 100,000 FCFA.",
      },
      {
        heading: "2. Forms of Business Organisation",
        content:
          "Enterprises are structured legally based on ownership, capital size, continuity, and liability. A sole trader is simple to form and keeps full control, but faces unlimited liability and ceases on the owner's death. A partnership combines greater capital and expertise governed by a Partnership Deed, though general partners remain jointly liable. A Limited Company (SARL or SA under OHADA) enjoys perpetual succession and separate legal personality, allowing capital mobilisation through share issues.",
        bulletPoints: [
          "Sole Proprietorship: Single owner, unlimited liability, quick decisions, limited capital.",
          "Partnership: Shared capital and skills, profit sharing ratio per Partnership Deed.",
          "Company (SARL / SA): Separate legal entity, limited liability, mandatory statutory reporting.",
        ],
        workedExample: "",
      },
      {
        heading: "3. Types of Business Activities & Role in the Economy",
        content:
          "Business activities fall into three core categories: Trading (merchandising) enterprises buy finished goods to resell at a markup; Manufacturing enterprises convert raw materials into finished products; Service enterprises deliver intangible value such as transport, banking, healthcare, or education. Together, enterprises create employment, generate tax revenue, produce essential goods, and drive GDP growth.",
        bulletPoints: [
          "Primary / Extractive: Agriculture, forestry, mining, and fishing.",
          "Secondary / Manufacturing: Processing raw materials into finished goods (e.g. cocoa processing, cement).",
          "Tertiary / Service & Commercial: Banking, insurance, retail, transport, and telecommunications.",
        ],
        workedExample: "",
      },
    ],
    examTips: [
      "Distinguish clearly between bookkeeping (daily recording of transactions) and accounting (recording, summarising, interpreting, and reporting).",
      "Under OHADA, always classify entities using the exact legal forms: Sole Proprietor, Partnership, SARL (Private Limited), and SA (Public Limited).",
    ],
    quickCheck: [
      {
        question: "What distinguishes a Limited Liability Company (SARL/SA) from a Sole Proprietorship?",
        answer:
          "A company is a separate legal entity with perpetual succession and limited shareholder liability, whereas a sole proprietorship has no separate legal identity from its owner and carries unlimited personal liability.",
      },
      {
        question: "Name two internal users and two external users of accounting information.",
        answer:
          "Internal users: management and employees. External users: banks/creditors, investors, suppliers, and tax authorities.",
      },
    ],
  },
  "recording process": {
    overview:
      "The double-entry recording system ensures that every financial transaction affects at least two accounts with equal debit and credit totals, preserving the fundamental accounting equation (Assets = Capital + Liabilities) throughout the OHADA accounting cycle.",
    keyDefinitions: [
      {
        term: "Accounting Equation",
        definition:
          "Assets = Owner's Equity (Capital) + Liabilities. Every recorded business transaction keeps both sides of this equation strictly balanced.",
      },
      {
        term: "Double Entry Principle",
        definition:
          "For every debit entry made in one account, an equal and corresponding credit entry must be recorded in another account (Debit the receiver/asset/expense; Credit the giver/liability/income).",
      },
      {
        term: "OHADA Chart of Accounts (Classes 1–8)",
        definition:
          "Class 1: Equity & Long-term Liabilities; Class 2: Fixed Assets; Class 3: Inventory; Class 4: Third-Party Accounts; Class 5: Cash & Bank; Class 6: Expenses; Class 7: Revenues; Class 8: Other Activities.",
      },
      {
        term: "Trial Balance",
        definition:
          "A two-column schedule listing all ledger account balances at a specific date to verify the arithmetical accuracy of double-entry postings (Total Debits = Total Credits).",
      },
      {
        term: "Capital vs Revenue Expenditure",
        definition:
          "Capital expenditure acquires or improves long-term non-current assets (Class 2, lasting >1 year), whereas revenue expenditure covers day-to-day running costs (Class 6, consumed within the current accounting period).",
      },
    ],
    sections: [
      {
        heading: "1. The Double Entry Rules & OHADA Account Classes",
        content:
          "Under Revised OHADA, balance sheet accounts belong to Classes 1 to 5 and income statement accounts to Classes 6 to 8. Assets (Classes 2, 3, 5) and Expenses (Class 6) increase on the Debit (Dr) side and decrease on the Credit (Cr) side. Capital/Liabilities (Classes 1, 4 payables) and Revenues (Class 7) increase on the Credit (Cr) side and decrease on the Debit (Dr) side.",
        bulletPoints: [
          "Debit increases Assets & Expenses; Credit decreases them.",
          "Credit increases Liabilities, Capital & Revenues; Debit decreases them.",
          "Source Document → Journal (Book of Original Entry) → General Ledger → Trial Balance → Financial Statements.",
        ],
        workedExample:
          "Journal Entry Example: On 5 May, Bamenda Supply buys office furniture worth 300,000 FCFA by cheque.\nDr 2444 Office Furniture (Asset increases) ........... 300,000 FCFA\n  Cr 521 Bank (Asset decreases) ...................... 300,000 FCFA\n(Being purchase of office furniture paid by bank cheque.)",
      },
      {
        heading: "2. Capital Expenditure vs Revenue Expenditure",
        content:
          "Classifying expenditure properly prevents profit distortion. Purchasing a delivery van (4,500,000 FCFA) and paying its import duty are Capital Expenditure recorded on the Balance Sheet and depreciated over its useful life. Fuel, routine repairs, insurance, and driver wages are Revenue Expenditure charged immediately to the Income Statement.",
        bulletPoints: [
          "Capital Expenditure: Non-recurring, enhances earning capacity, shown under Non-Current Assets (Class 2).",
          "Revenue Expenditure: Recurring, maintains existing capacity, charged to Expenses (Class 6).",
          "Treating capital expenditure as revenue understates both Net Profit and Total Assets.",
        ],
        workedExample: "",
      },
    ],
    examTips: [
      "Always include dates, OHADA account numbers (when known), narration, and equal debit/credit column totals in every journal entry.",
      "Errors that do NOT affect Trial Balance agreement include: Omission, Commission, Principle, Original Entry, Reversal, and Compensating errors.",
    ],
    quickCheck: [
      {
        question: "Which OHADA account classes appear in the Income Statement?",
        answer: "Class 6 (Ordinary Expenses), Class 7 (Ordinary Revenues), and Class 8 (Non-Ordinary / HAO Expenses and Revenues).",
      },
      {
        question: "What is the accounting effect if 250,000 FCFA spent on a new machine is wrongly debited to Repairs Expense?",
        answer: "Expenses are overstated by 250,000 FCFA, so Net Profit and Non-Current Assets are both understated by 250,000 FCFA (an Error of Principle).",
      },
    ],
  },
  "mole concept": {
    overview:
      "The mole is the SI unit of amount of substance containing exactly 6.022 × 10²³ elementary entities (Avogadro's constant). Stoichiometry uses balanced chemical equations and mole ratios to calculate exact reacting masses, gas volumes, and solution concentrations.",
    keyDefinitions: [
      {
        term: "One Mole (mol)",
        definition:
          "The amount of substance containing 6.022 × 10²³ particles (atoms, molecules, or ions), with mass in grams numerically equal to its relative atomic/molecular mass (Ar or Mr).",
      },
      {
        term: "Molar Mass (M)",
        definition:
          "The mass of one mole of a substance in g/mol (e.g. M(H₂O) = 2(1) + 16 = 18 g/mol; M(NaOH) = 23 + 16 + 1 = 40 g/mol).",
      },
      {
        term: "Molar Gas Volume (Vm)",
        definition:
          "The volume occupied by 1 mole of any ideal gas: 22.4 dm³ (22,400 cm³) at s.t.p. (0°C, 1 atm) and 24.0 dm³ (24,000 cm³) at r.t.p. (25°C, 1 atm).",
      },
      {
        term: "Empirical vs Molecular Formula",
        definition:
          "The empirical formula shows the simplest whole-number ratio of atoms in a compound (e.g. CH₂O), whereas the molecular formula shows the exact actual number of atoms per molecule (e.g. C₆H₁₂O₆).",
      },
    ],
    sections: [
      {
        heading: "1. Core Stoichiometry Equations",
        content:
          "Every quantitative chemistry calculation converts given measurements into moles first, applies the stoichiometric ratio from the balanced equation, and converts back to the required unit.",
        bulletPoints: [
          "Moles from mass: n = m / M  (m in grams, M in g/mol).",
          "Moles from solution: n = C × V  (C in mol/dm³, V in dm³ = cm³ / 1000).",
          "Moles from gas volume: n = V_gas / Vm  (24 dm³ at r.t.p., 22.4 dm³ at s.t.p.).",
          "Titration relation: (C_a × V_a) / a = (C_b × V_b) / b.",
        ],
        workedExample:
          "Titration Worked Example: 25.0 cm³ of NaOH is neutralised by 20.0 cm³ of 0.10 mol/dm³ H₂SO₄.\nEquation: 2NaOH + H₂SO₄ → Na₂SO₄ + 2H₂O (mole ratio NaOH : H₂SO₄ = 2 : 1).\n1. Moles of H₂SO₄ = 0.10 × (20.0 / 1000) = 0.0020 mol.\n2. Moles of NaOH = 2 × 0.0020 = 0.0040 mol.\n3. Concentration of NaOH = 0.0040 / (25.0 / 1000) = 0.16 mol/dm³.",
      },
    ],
    examTips: [
      "Always convert solution volumes from cm³ to dm³ by dividing by 1000 before multiplying by molar concentration.",
      "Check the limiting reagent whenever quantities of BOTH reactants are given.",
    ],
    quickCheck: [
      {
        question: "How many moles are present in 10.6 g of anhydrous Na₂CO₃ (Na=23, C=12, O=16)?",
        answer: "M(Na₂CO₃) = 2(23) + 12 + 3(16) = 106 g/mol. Moles = 10.6 / 106 = 0.10 mol.",
      },
    ],
  },
  "atomic structure": {
    overview:
      "Every atom consists of a dense positively charged nucleus (containing protons and neutrons) surrounded by negatively charged electrons arranged in discrete energy shells, which govern chemical bonding and periodic properties.",
    keyDefinitions: [
      {
        term: "Atomic Number (Z)",
        definition: "The number of protons in the nucleus of an atom, which uniquely defines the chemical element.",
      },
      {
        term: "Mass Number (A)",
        definition: "The total number of protons and neutrons (nucleons) in an atom's nucleus: Neutrons = A − Z.",
      },
      {
        term: "Isotopes",
        definition:
          "Atoms of the same element with the same number of protons (same Z) but different numbers of neutrons (different A), e.g. Chlorine-35 and Chlorine-37.",
      },
      {
        term: "Ionic vs Covalent Bonding",
        definition:
          "Ionic bonding is the electrostatic attraction between oppositely charged ions formed by electron transfer (metal + non-metal); covalent bonding is the sharing of electron pairs between non-metal atoms.",
      },
    ],
    sections: [
      {
        heading: "1. Sub-Atomic Particles & Electron Shells",
        content:
          "Protons have relative mass 1 and charge +1; neutrons have relative mass 1 and charge 0; electrons have negligible mass (1/1840) and charge −1. For the first 20 elements, electrons fill shells in the pattern 2, 8, 8, 2. The number of valence (outer-shell) electrons determines the group number and reactivity.",
        bulletPoints: [
          "Relative Atomic Mass (Ar) = Σ(isotopic mass × % abundance) / 100.",
          "Ionic compounds have high melting points and conduct electricity when molten or dissolved in water.",
          "Simple covalent molecules have low boiling points due to weak intermolecular forces and do not conduct electricity.",
        ],
        workedExample:
          "Isotope Ar Calculation: Chlorine consists of 75% ³⁵Cl and 25% ³⁷Cl.\nAr(Cl) = (35 × 75 + 37 × 25) / 100 = (2625 + 925) / 100 = 35.5.",
      },
    ],
    examTips: [
      "Isotopes have identical chemical properties because they have the exact same electronic configuration.",
    ],
    quickCheck: [
      {
        question: "Determine the protons, neutrons, and electronic configuration of ²³₁₁Na.",
        answer: "Protons = 11, Neutrons = 23 − 11 = 12, Electrons = 11 → Electronic configuration: 2, 8, 1.",
      },
    ],
  },
  "cell structure": {
    overview:
      "The cell is the fundamental structural and functional unit of all living organisms. Substances move across its selectively permeable plasma membrane via diffusion, osmosis, and active transport to maintain cellular homeostasis.",
    keyDefinitions: [
      {
        term: "Diffusion",
        definition:
          "The passive net movement of particles from a region of higher concentration to a region of lower concentration down a concentration gradient.",
      },
      {
        term: "Osmosis",
        definition:
          "The passive net movement of water molecules from a region of higher water potential (dilute solution) to a region of lower water potential (concentrated solution) across a selectively permeable membrane.",
      },
      {
        term: "Active Transport",
        definition:
          "The movement of molecules or ions against a concentration gradient (from low to high concentration) using energy released from ATP respiration via carrier proteins.",
      },
      {
        term: "Mitochondrion & Chloroplast",
        definition:
          "Mitochondria are the site of aerobic respiration producing ATP; chloroplasts contain chlorophyll and carry out photosynthesis in plant cells.",
      },
    ],
    sections: [
      {
        heading: "1. Plant vs Animal Cells and Membrane Transport",
        content:
          "Both plant and animal cells contain a nucleus, cytoplasm, cell membrane, ribosomes, and mitochondria. Plant cells additionally possess a rigid cellulose cell wall, a large permanent central vacuole, and chloroplasts. In hypertonic solutions, plant cells lose water by osmosis and undergo plasmolysis, whereas animal cells shrink (crenate). In hypotonic solutions, plant cells become turgid while animal cells burst (lysis).",
        bulletPoints: [
          "Turgor pressure supports herbaceous plants and keeps stomata open.",
          "Root hair cells absorb mineral ions from soil against a concentration gradient via active transport.",
          "Gas exchange (O₂ and CO₂) in lungs and leaves occurs purely by diffusion.",
        ],
        workedExample:
          "Osmosis Practical Case: A 50 mm potato cylinder placed in distilled water gains water by osmosis and expands to 54 mm (turgid). An identical cylinder placed in 1.0 M sucrose solution loses water and shrinks to 45 mm (flaccid/plasmolysed).",
      },
    ],
    examTips: [
      "Always state 'water molecules' and 'selectively permeable membrane' when defining osmosis — omitting either loses marks.",
    ],
    quickCheck: [
      {
        question: "Why does a red blood cell burst in distilled water while an onion epidermal cell does not?",
        answer: "The onion cell has a rigid cellulose cell wall that resists osmotic pressure and prevents bursting, whereas the red blood cell has only a flexible plasma membrane.",
      },
    ],
  },
  "motion, forces": {
    overview:
      "Classical mechanics describes how objects move (kinematics) and why their motion changes under forces (Newton's laws of motion and conservation of momentum).",
    keyDefinitions: [
      {
        term: "Newton's First Law (Inertia)",
        definition:
          "A body remains at rest or continues moving at constant velocity in a straight line unless acted upon by a non-zero resultant external force.",
      },
      {
        term: "Newton's Second Law",
        definition:
          "The rate of change of momentum of a body is directly proportional to the resultant force applied and acts in the direction of that force: F = ma (for constant mass).",
      },
      {
        term: "Newton's Third Law",
        definition:
          "For every action force exerted by body A on body B, body B exerts an equal and opposite reaction force on body A.",
      },
      {
        term: "Linear Momentum (p)",
        definition:
          "The product of mass and velocity (p = mv, unit kg·m/s). In an isolated system with no external forces, total momentum before collision equals total momentum after collision.",
      },
    ],
    sections: [
      {
        heading: "1. Equations of Uniformly Accelerated Motion (SUVAT)",
        content:
          "When acceleration (a) is constant, displacement (s), initial velocity (u), final velocity (v), and time (t) are linked by four equations. On a velocity-time graph, the gradient equals acceleration and the area under the line equals total displacement.",
        bulletPoints: [
          "v = u + at",
          "s = ut + ½at²",
          "v² = u² + 2as",
          "s = ½(u + v)t",
        ],
        workedExample:
          "Worked Example: A 1,200 kg car accelerates uniformly from 10 m/s to 25 m/s in 5 s.\n1. Acceleration a = (25 − 10) / 5 = 3.0 m/s².\n2. Resultant Force F = ma = 1200 × 3.0 = 3,600 N.\n3. Distance covered s = ½(10 + 25) × 5 = 87.5 m.",
      },
    ],
    examTips: [
      "Velocity, acceleration, force, and momentum are vector quantities — assign a positive direction and use negative signs for opposite motion.",
    ],
    quickCheck: [
      {
        question: "A 2 kg trolley moving at 4 m/s collides and sticks to a stationary 2 kg trolley. What is their common velocity?",
        answer: "Total initial momentum = 2(4) + 2(0) = 8 kg·m/s. Combined mass = 4 kg. Common velocity = 8 / 4 = 2.0 m/s.",
      },
    ],
  },
  "scarcity": {
    overview:
      "Economics studies how societies allocate scarce productive resources (land, labour, capital, enterprise) among unlimited human wants, requiring choices that always carry an opportunity cost.",
    keyDefinitions: [
      {
        term: "Scarcity",
        definition:
          "The fundamental economic condition in which limited productive resources cannot satisfy unlimited human wants.",
      },
      {
        term: "Opportunity Cost",
        definition:
          "The value of the next best alternative forgone whenever an economic choice is made.",
      },
      {
        term: "Production Possibility Curve (PPC)",
        definition:
          "A frontier showing all maximum attainable combinations of two goods an economy can produce with full and efficient employment of its existing resources and technology.",
      },
      {
        term: "Price Elasticity of Demand (PED)",
        definition:
          "The responsiveness of quantity demanded of a good to a change in its own price: PED = (%ΔQd) / (%ΔP).",
      },
    ],
    sections: [
      {
        heading: "1. Economic Systems & Resource Allocation",
        content:
          "Every economy answers three core questions: What to produce, How to produce, and For whom to produce. In a free-market economy, the price mechanism (demand and supply) allocates resources; in a planned economy, the state directs production; in a mixed economy like Cameroon, private enterprise operates alongside public sector provision and regulation.",
        bulletPoints: [
          "Points ON the PPC indicate productive efficiency; points INSIDE indicate unemployed resources.",
          "Outward shifts of the PPC represent economic growth (better technology, training, or new resources).",
          "Demand is elastic when |PED| > 1 (cutting price raises total revenue) and inelastic when |PED| < 1 (raising price raises total revenue).",
        ],
        workedExample:
          "PED Calculation: Price of rice rises from 500 FCFA to 550 FCFA (+10%), and quantity demanded falls from 200 kg to 190 kg (−5%).\nPED = −5% / +10% = −0.5. Since |PED| = 0.5 < 1, demand is price inelastic, so total revenue rises from 100,000 FCFA to 104,500 FCFA.",
      },
    ],
    examTips: [
      "A change in a good's own price causes a MOVEMENT along the demand curve, whereas changes in income, tastes, or prices of substitutes cause a SHIFT of the entire curve.",
    ],
    quickCheck: [
      {
        question: "What does a point strictly inside the Production Possibility Curve represent?",
        answer: "Inefficient resource utilisation or unemployment of factors of production.",
      },
    ],
  },
};

const matchCuratedTopic = (topicTitle, concepts = []) => {
  const haystack = `${topicTitle || ""} ${(concepts || []).join(" ")}`.toLowerCase();
  for (const [key, entry] of Object.entries(CONCRETE_TOPIC_LIBRARY)) {
    if (haystack.includes(key)) return entry;
  }
  return null;
};

/**
 * Builds concrete, factual, textbook-grade study notes directly from curated GCE content
 * and/or real ML-retrieved exam items (question + verified answer + scientific/factual support).
 * Never refers to "the student", never says "examiners test you", never says "go and verify".
 */
export const buildConcreteFallbackNotes = ({
  level = "O-Level",
  subject = "General",
  moduleTitle = "",
  topicTitle = "",
  concepts = [],
  objectives = [],
  mlRelatedQuestions = [],
  mlKeywords = [],
}) => {
  const curated = matchCuratedTopic(topicTitle, concepts);
  if (curated) {
    return {
      source: "concrete-syllabus-engine",
      generatedAt: new Date().toISOString(),
      level,
      subject,
      moduleTitle,
      topicTitle,
      readingTimeMinutes: Math.max(5, curated.sections.length * 2 + 1),
      overview: curated.overview,
      keyDefinitions: curated.keyDefinitions,
      sections: curated.sections,
      examTips: curated.examTips,
      quickCheck: curated.quickCheck,
      mlKeywords,
      mlRelatedQuestions,
    };
  }

  // Synthesize concrete factual notes directly from the real retrieved ML exam corpus items.
  const cleanConcepts = (Array.isArray(concepts) ? concepts : []).filter(Boolean);
  const cleanObjectives = (Array.isArray(objectives) ? objectives : []).filter(Boolean);
  const items = Array.isArray(mlRelatedQuestions) ? mlRelatedQuestions : [];

  const factualPoints = items
    .map((item) => {
      const support = String(item.explanation || "").trim();
      if (support.length > 35) return support;
      return `${item.question_text} — Key result: ${item.answer}.`;
    })
    .filter(Boolean);

  const overview =
    factualPoints[0] ||
    `${topicTitle} is a foundational unit in ${level} ${subject}${moduleTitle ? ` (${moduleTitle})` : ""}, covering ${
      cleanConcepts.length ? cleanConcepts.join(", ") : `core principles and applications of ${topicTitle}`
    }.`;

  const keyDefinitions = [];
  if (items.length > 0) {
    items.slice(0, 4).forEach((item, idx) => {
      const term =
        cleanConcepts[idx]
          ? cleanConcepts[idx].charAt(0).toUpperCase() + cleanConcepts[idx].slice(1)
          : String(item.answer || item.topic || `Concept ${idx + 1}`).slice(0, 48);
      const defText = item.explanation
        ? item.explanation
        : `Answer to "${item.question_text}": ${item.answer}.`;
      keyDefinitions.push({ term, definition: defText });
    });
  } else {
    (cleanConcepts.length ? cleanConcepts : [topicTitle]).forEach((concept) => {
      keyDefinitions.push({
        term: concept.charAt(0).toUpperCase() + concept.slice(1),
        definition: `Core ${level} ${subject} concept within ${topicTitle}, essential for understanding ${moduleTitle || subject} relationships and problem-solving.`,
      });
    });
  }

  const sections = [];
  if (items.length > 0) {
    items.slice(0, 3).forEach((item, idx) => {
      const heading = cleanObjectives[idx]
        ? `${idx + 1}. ${cleanObjectives[idx]}`
        : `${idx + 1}. Core Principle: ${item.topic || topicTitle}`;
      const body = item.explanation
        ? item.explanation
        : `In ${level} ${subject}, ${item.question_text} The established answer is ${item.answer}.`;
      const otherOptions = (item.options || []).filter((o) => o !== item.answer);
      sections.push({
        heading,
        content: body,
        bulletPoints: [
          `Established fact / result: ${item.answer}.`,
          ...(otherOptions.length
            ? [`Distinguished from incorrect alternatives such as: ${otherOptions.slice(0, 2).join("; ")}.`]
            : []),
        ],
        workedExample: `Applied Example:\nQuestion: ${item.question_text}\nSolution: ${item.answer}.${
          item.explanation ? `\nReasoning: ${item.explanation}` : ""
        }`,
      });
    });
  } else {
    (cleanObjectives.length ? cleanObjectives : [`Core Principles of ${topicTitle}`]).forEach(
      (obj, idx) => {
        sections.push({
          heading: `${idx + 1}. ${obj}`,
          content: `${obj} forms a key pillar of ${topicTitle} in ${level} ${subject}. Accurate analysis relies on defining the relevant quantities, applying the governing law or classification rule, and demonstrating each intermediate step clearly.`,
          bulletPoints: cleanConcepts.slice(idx, idx + 3).map((c) => `Key term: ${c}`),
          workedExample: "",
        });
      },
    );
  }

  return {
    source: "ml-grounded-notes",
    generatedAt: new Date().toISOString(),
    level,
    subject,
    moduleTitle,
    topicTitle,
    readingTimeMinutes: Math.max(4, sections.length * 2),
    overview,
    keyDefinitions,
    sections,
    examTips: [
      `State exact ${subject} definitions, units, and formulas before substituting values.`,
      `Show all intermediate steps clearly so partial credit is awarded even if an arithmetic slip occurs.`,
    ],
    quickCheck: items.slice(0, 3).map((q) => ({
      question: q.question_text,
      answer: q.explanation ? `${q.answer} — ${q.explanation}` : String(q.answer),
    })),
    mlKeywords,
    mlRelatedQuestions,
  };
};

/**
 * Generates a direct, concrete explanation for an MCQ without any meta-instructions
 * like "verify" or "review the syllabus".
 */
export const buildDirectQuestionExplanation = ({ question_text, answer, options = [], subject = "" }) => {
  const distractors = (Array.isArray(options) ? options : []).filter((o) => o && o !== answer);
  const distractorNote = distractors.length
    ? ` Unlike ${distractors.slice(0, 2).map((d) => `"${d}"`).join(" or ")}, "${answer}" directly satisfies the condition stated in the question.`
    : "";
  return `The correct answer is "${answer}". Within ${subject || "this subject"}, "${answer}" accurately addresses: ${question_text}${distractorNote}`;
};
