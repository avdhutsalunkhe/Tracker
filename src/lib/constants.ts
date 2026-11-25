import { HabitTimeSlot } from '../types';

// Default spaced repetition schedule (in days from completion / last revision)
export const SPACED_REPETITION_INTERVALS = [1, 3, 7, 15, 30, 60];

// Default GATE exam target date
export const DEFAULT_GATE_EXAM_DATE = '2027-02-06';
export const DEFAULT_DAILY_STUDY_GOAL_HOURS = 6.0;

// Color palette choices for subjects
export const SUBJECT_COLORS = [
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#84CC16', // Lime
  '#F59E0B', // Amber
  '#F97316', // Orange
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
];

// Default habits template for new users
export const DEFAULT_HABIT_TEMPLATES: Array<{ title: string; time_slot: HabitTimeSlot; sort_order: number }> = [
  { title: 'Morning 30-min brisk walk / workout', time_slot: 'Morning', sort_order: 1 },
  { title: 'Eat 3 eggs / high-protein breakfast', time_slot: 'Morning', sort_order: 2 },
  { title: 'Drink 3.5L of water throughout the day', time_slot: 'Anytime', sort_order: 3 },
  { title: 'Solve 15 GATE Previous Year Questions (PYQs)', time_slot: 'Afternoon', sort_order: 4 },
  { title: 'Review 1 Spaced Repetition topic', time_slot: 'Evening', sort_order: 5 },
  { title: 'Formula Vault & Mistake Notebook review', time_slot: 'Evening', sort_order: 6 },
];

// Sample GATE Branches and their standard syllabus subjects
export interface BranchPreset {
  branchName: string;
  subjects: Array<{ name: string; color: string; sampleTopics: string[] }>;
}

export const GATE_BRANCH_PRESETS: BranchPreset[] = [
  {
    branchName: 'Computer Science & Information Technology (CS/IT)',
    subjects: [
      {
        name: 'Engineering Mathematics',
        color: '#6366F1',
        sampleTopics: ['Discrete Mathematics & Logic', 'Linear Algebra & Matrices', 'Calculus & Limits', 'Probability & Distributions']
      },
      {
        name: 'Digital Logic',
        color: '#3B82F6',
        sampleTopics: ['Boolean Algebra & Minimization', 'Combinational Circuits (MUX, Decoders)', 'Sequential Circuits (Flip-Flops, Counters)', 'Number Representations']
      },
      {
        name: 'Computer Organization & Architecture',
        color: '#06B6D4',
        sampleTopics: ['Machine Instructions & Addressing', 'ALU & Data-Path Design', 'Instruction Pipelining & Hazards', 'Memory Hierarchy & Cache Mapping', 'I/O Interface']
      },
      {
        name: 'Programming & Data Structures',
        color: '#10B981',
        sampleTopics: ['Recursion & Pointers in C', 'Arrays, Stacks & Queues', 'Binary Search Trees & AVL Trees', 'Binary Heaps & Priority Queues', 'Hashing & Graphs']
      },
      {
        name: 'Algorithms',
        color: '#84CC16',
        sampleTopics: ['Asymptotic Analysis & Recurrences', 'Divide & Conquer', 'Greedy Algorithms', 'Dynamic Programming', 'Graph Traversals (BFS, DFS, Dijkstra, Bellman-Ford)']
      },
      {
        name: 'Theory of Computation',
        color: '#F59E0B',
        sampleTopics: ['DFA, NFA & Regular Expressions', 'Pumping Lemma & Minimization', 'Context-Free Grammars & Pushdown Automata', 'Turing Machines & Decidability']
      },
      {
        name: 'Compiler Design',
        color: '#F97316',
        sampleTopics: ['Lexical Analysis', 'Parsing (LL, LR, LALR)', 'Syntax Directed Translation', 'Intermediate Code Generation', 'Code Optimization & Data Flow']
      },
      {
        name: 'Operating Systems',
        color: '#EC4899',
        sampleTopics: ['Process Management & CPU Scheduling', 'Inter-process Communication & Synchronization', 'Deadlocks & Prevention', 'Virtual Memory & Page Replacement', 'File Systems']
      },
      {
        name: 'Databases (DBMS)',
        color: '#8B5CF6',
        sampleTopics: ['ER Model & Relational Algebra', 'SQL Queries & Joins', 'Normalization (1NF to BCNF)', 'Transactions & ACID Properties', 'Concurrency Control & Indexing (B+ Trees)']
      },
      {
        name: 'Computer Networks',
        color: '#14B8A6',
        sampleTopics: ['OSI & TCP/IP Model', 'Flow & Error Control (Sliding Window)', 'IPv4/IPv6 & Subnetting', 'Routing Algorithms (OSPF, BGP)', 'TCP/UDP & Congestion Control', 'Application Layer (DNS, HTTP)']
      },
      {
        name: 'General Aptitude',
        color: '#64748B',
        sampleTopics: ['Verbal Ability & Grammar', 'Numerical Ability & Series', 'Spatial Reasoning', 'Logical Deduction & Data Interpretation']
      }
    ]
  },
  {
    branchName: 'Data Science & Artificial Intelligence (DA)',
    subjects: [
      {
        name: 'Probability and Statistics',
        color: '#6366F1',
        sampleTopics: ['Random Variables & PDFs', 'Expectation & Variance', 'Conditional Probability & Bayes Theorem', 'Sampling Distributions & Hypothesis Testing']
      },
      {
        name: 'Linear Algebra & Calculus',
        color: '#3B82F6',
        sampleTopics: ['Vector Spaces & Subspaces', 'Eigenvalues & Eigenvectors', 'SVD & PCA', 'Gradient Descent & Multivariable Calculus']
      },
      {
        name: 'Programming, Data Structures & Algorithms',
        color: '#10B981',
        sampleTopics: ['Python Fundamentals', 'Searching & Sorting Algorithms', 'Graph Traversals & Trees', 'Time & Space Complexity']
      },
      {
        name: 'Database Management & Data Warehousing',
        color: '#8B5CF6',
        sampleTopics: ['Relational Model & SQL', 'Indexing & Query Optimization', 'NoSQL & Data Warehousing Schemes']
      },
      {
        name: 'Machine Learning',
        color: '#F59E0B',
        sampleTopics: ['Supervised Learning (Regression, Classification)', 'SVM, Decision Trees & Random Forests', 'Unsupervised Learning (K-Means, GMM)', 'Model Evaluation & Cross-Validation']
      },
      {
        name: 'Artificial Intelligence',
        color: '#EC4899',
        sampleTopics: ['Search Strategies (A*, Heuristics)', 'Adversarial Search (Minimax, Alpha-Beta)', 'Propositional & First-Order Logic', 'Uncertainty Reasoning']
      }
    ]
  },
  {
    branchName: 'Electronics & Communication (EC)',
    subjects: [
      { name: 'Engineering Mathematics', color: '#6366F1', sampleTopics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Complex Analysis', 'Probability'] },
      { name: 'Networks, Signals and Systems', color: '#3B82F6', sampleTopics: ['Network Theorems & Transient Analysis', 'Continuous & Discrete-Time Fourier Transforms', 'Laplace & Z-Transforms', 'LTI Systems'] },
      { name: 'Electronic Devices', color: '#06B6D4', sampleTopics: ['Semiconductor Physics', 'P-N Junction & Zener Diodes', 'BJT & MOSFET Characteristics', 'Optoelectronic Devices'] },
      { name: 'Analog Circuits', color: '#10B981', sampleTopics: ['Diode Circuits & Rectifiers', 'BJT/MOSFET Biasing & Small Signal Amplifiers', 'Op-Amp Applications & Active Filters', 'Oscillators'] },
      { name: 'Digital Circuits', color: '#F59E0B', sampleTopics: ['Combinational Logic', 'Sequential Logic & State Machines', 'Semiconductor Memories', 'ADC/DAC Converters'] },
      { name: 'Control Systems', color: '#F97316', sampleTopics: ['Transfer Functions & Block Diagrams', 'Time Domain Analysis & Routh Hurwitz', 'Root Locus & Bode Plots', 'State Space Analysis'] },
      { name: 'Communications', color: '#EC4899', sampleTopics: ['AM, FM & PM Systems', 'Digital Modulation (ASK, FSK, PSK, QAM)', 'Information Theory & Channel Capacity', 'Noise in Receivers'] },
      { name: 'Electromagnetics', color: '#8B5CF6', sampleTopics: ['Maxwell Equations & Boundary Conditions', 'Plane Waves in Media', 'Transmission Lines & Smith Chart', 'Waveguides & Antennas'] }
    ]
  },
  {
    branchName: 'Mechanical Engineering (ME)',
    subjects: [
      { name: 'Engineering Mathematics', color: '#6366F1', sampleTopics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Numerical Methods'] },
      { name: 'Engineering Mechanics & Strength of Materials', color: '#3B82F6', sampleTopics: ['Trusses & Friction', 'Stress-Strain & Mohr Circle', 'Bending & Shear Stress', 'Torsion & Columns'] },
      { name: 'Theory of Machines & Vibrations', color: '#06B6D4', sampleTopics: ['Mechanisms & Inversions', 'Gears & Flywheels', 'Governors & Balancing', 'Free & Forced Vibrations'] },
      { name: 'Machine Design', color: '#10B981', sampleTopics: ['Fatigue Failure & S-N Curve', 'Design of Shafts, Keys & Couplings', 'Bolted & Welded Joints', 'Bearings & Brakes'] },
      { name: 'Fluid Mechanics & Thermal Sciences', color: '#F59E0B', sampleTopics: ['Fluid Statics & Bernoulli Equation', 'Boundary Layer & Pipe Flow', 'Laws of Thermodynamics & Cycles', 'Heat Transfer (Conduction, Convection, Radiation)'] },
      { name: 'Manufacturing & Industrial Engineering', color: '#8B5CF6', sampleTopics: ['Casting, Forming & Joining', 'Machining & Tool Life', 'Forecasting & Inventory Models', 'Linear Programming & CPM/PERT'] }
    ]
  },
  {
    branchName: 'Electrical Engineering (EE)',
    subjects: [
      { name: 'Engineering Mathematics', color: '#6366F1', sampleTopics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability'] },
      { name: 'Electric Circuits', color: '#3B82F6', sampleTopics: ['Network Theorems', 'Transient Response of RL, RC, RLC', 'Sinusoidal Steady State & Resonance', 'Three Phase Circuits'] },
      { name: 'Electromagnetic Fields', color: '#06B6D4', sampleTopics: ['Electrostatics & Magnetostatics', 'Faraday Law & Inductance', 'Maxwell Equations'] },
      { name: 'Signals and Systems', color: '#10B981', sampleTopics: ['LTI Systems', 'Fourier & Laplace Transforms', 'Z-Transform & Sampling'] },
      { name: 'Electrical Machines', color: '#F59E0B', sampleTopics: ['Single & Three Phase Transformers', 'DC Machines & Starters', 'Three Phase Induction Motors', 'Synchronous Machines'] },
      { name: 'Power Systems', color: '#F97316', sampleTopics: ['Transmission Line Models', 'Load Flow Analysis', 'Fault Analysis (Symmetrical & Unsymmetrical)', 'Power System Stability & Protection'] },
      { name: 'Control Systems', color: '#EC4899', sampleTopics: ['Transfer Function & Stability', 'Root Locus & Frequency Response', 'Compensators & State Variables'] },
      { name: 'Power Electronics', color: '#8B5CF6', sampleTopics: ['Power Semiconductor Switches', 'Phase-Controlled Rectifiers', 'DC-DC Converters (Buck, Boost)', 'Inverters & Harmonics'] }
    ]
  }
];

