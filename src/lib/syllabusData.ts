export interface SyllabusSubGroup {
  label?: string;
  items: string[];
}

export interface SyllabusSection {
  sectionNumber: number;
  title: string;
  color: string;
  groups: SyllabusSubGroup[];
}

export interface GatePaperSyllabus {
  code: 'CS' | 'DA';
  name: string;
  organizingInstitute: string;
  sections: SyllabusSection[];
}

export const GATE_SYLLABUS_PAPERS: GatePaperSyllabus[] = [
  {
    code: 'CS',
    name: 'Computer Science and Information Technology',
    organizingInstitute: 'GATE 2027 · IIT Madras',
    sections: [
      {
        sectionNumber: 1,
        title: 'Engineering Mathematics',
        color: '#6366F1',
        groups: [
          {
            label: 'Discrete Mathematics',
            items: [
              'Propositional and first order logic',
              'Sets, relations, functions, partial orders and lattices',
              'Monoids, Groups',
              'Graphs: connectivity, matching, colouring',
              'Combinatorics: counting, recurrence relations, generating functions',
            ],
          },
          {
            label: 'Linear Algebra',
            items: [
              'Matrices, determinants, system of linear equations',
              'Eigenvalues and eigenvectors',
              'LU decomposition',
            ],
          },
          {
            label: 'Calculus',
            items: [
              'Limits, continuity and differentiability',
              'Maxima and minima',
              'Mean value theorem',
              'Integration',
            ],
          },
          {
            label: 'Probability and Statistics',
            items: [
              'Random variables',
              'Uniform, normal, exponential, Poisson and binomial distributions',
              'Mean, median, mode and standard deviation',
              'Conditional probability and Bayes theorem',
            ],
          },
        ],
      },
      {
        sectionNumber: 2,
        title: 'Digital Logic',
        color: '#3B82F6',
        groups: [
          {
            items: [
              'Boolean algebra and minimization – algebraic technique, Karnaugh map, tabular method',
              'Design of combinational and sequential circuits',
              'Number representation and arithmetic (fixed and floating point)',
            ],
          },
        ],
      },
      {
        sectionNumber: 3,
        title: 'Computer Organization and Architecture',
        color: '#06B6D4',
        groups: [
          {
            items: [
              'Instruction set and addressing modes',
              'Design of arithmetic and logic unit (ALU)',
              'Design of control unit – hardwired and microprogrammed',
              'Memory interfacing and hierarchy: performance, cache memory mapping',
              'I/O interface (interrupt and DMA)',
              'Instruction pipelining, pipeline hazards',
            ],
          },
        ],
      },
      {
        sectionNumber: 4,
        title: 'Programming and Data Structures',
        color: '#10B981',
        groups: [
          {
            items: [
              'Programming in C',
              'Recursion',
              'Arrays, stacks, queues, linked lists',
              'Trees, binary search trees, binary heaps',
              'Graphs',
            ],
          },
        ],
      },
      {
        sectionNumber: 5,
        title: 'Algorithms',
        color: '#84CC16',
        groups: [
          {
            items: [
              'Searching, sorting, hashing',
              'Asymptotic worst case time and space complexity',
              'Algorithm design techniques: greedy, dynamic programming and divide-and-conquer',
              'Graph traversals, minimum spanning trees, shortest paths',
            ],
          },
        ],
      },
      {
        sectionNumber: 6,
        title: 'Theory of Computation',
        color: '#F59E0B',
        groups: [
          {
            items: [
              'Regular expressions and finite automata',
              'Context-free grammars and push-down automata',
              'Regular and context-free languages, pumping lemma',
              'Turing machines and undecidability',
            ],
          },
        ],
      },
      {
        sectionNumber: 7,
        title: 'Compiler Design',
        color: '#F97316',
        groups: [
          {
            items: [
              'Lexical analysis, parsing, syntax-directed translation',
              'Runtime environments',
              'Intermediate code generation',
              'Local optimisation, Data flow analyses: constant propagation, liveness analysis, common sub expression elimination',
            ],
          },
        ],
      },
      {
        sectionNumber: 8,
        title: 'Operating System',
        color: '#EC4899',
        groups: [
          {
            items: [
              'System calls, processes, threads, inter-process communication',
              'Concurrency and synchronization',
              'Deadlock',
              'CPU and I/O scheduling',
              'Memory management and virtual memory',
              'File systems',
            ],
          },
        ],
      },
      {
        sectionNumber: 9,
        title: 'Databases',
        color: '#8B5CF6',
        groups: [
          {
            items: [
              'ER-model',
              'Relational model: relational algebra, tuple calculus, SQL',
              'Integrity constraints, normal forms',
              'File organization, indexing (e.g., B and B+ trees)',
              'Transactions and concurrency control',
            ],
          },
        ],
      },
      {
        sectionNumber: 10,
        title: 'Computer Networks',
        color: '#14B8A6',
        groups: [
          {
            items: [
              'Principles of Layering; Basics of switching (circuit, packet and virtual circuit) and performance metrics',
              'Data link layer: error detection, Medium Access Control, Ethernet',
              'Distance vector and link state routing',
              'IPv4 - Fragmentation, CIDR Notation, Network Address Translation',
              'TCP - flow control and congestion control, socket API',
              'DNS and HTTP',
            ],
          },
        ],
      },
    ],
  },
  {
    code: 'DA',
    name: 'Data Science and Artificial Intelligence',
    organizingInstitute: 'GATE 2027 · IIT Madras',
    sections: [
      {
        sectionNumber: 1,
        title: 'Probability and Statistics',
        color: '#6366F1',
        groups: [
          {
            items: [
              'Counting (permutation and combinations), probability axioms',
              'Sample space, events, independent events, mutually exclusive events',
              'Marginal, conditional and joint probability, Bayes Theorem',
              'Conditional expectation and variance, mean, median, mode and standard deviation, correlation, and covariance',
              'Random variables, discrete random variables and probability mass functions, uniform, Bernoulli, binomial distribution',
              'Continuous random variables and probability distribution function, uniform, exponential, Poisson, normal, standard normal, t-distribution, chi-squared distributions',
              'Cumulative distribution function, Conditional PDF, Central limit theorem',
              'Confidence interval, z-test, t-test, chi-squared test',
            ],
          },
        ],
      },
      {
        sectionNumber: 2,
        title: 'Linear Algebra',
        color: '#3B82F6',
        groups: [
          {
            items: [
              'Vector space, subspaces, linear dependence and independence of vectors',
              'Matrices, projection matrix, orthogonal matrix, idempotent matrix, partition matrix and their properties',
              'Quadratic forms, systems of linear equations and solutions; Gaussian elimination',
              'Eigenvalues and eigenvectors, determinant, rank, nullity, projections',
              'LU decomposition, singular value decomposition',
            ],
          },
        ],
      },
      {
        sectionNumber: 3,
        title: 'Calculus and Optimization',
        color: '#06B6D4',
        groups: [
          {
            items: [
              'Functions of a single variable, limit, continuity and differentiability',
              'Taylor series',
              'Maxima and minima, optimization involving a single variable',
            ],
          },
        ],
      },
      {
        sectionNumber: 4,
        title: 'Programming, Data Structures and Algorithms',
        color: '#10B981',
        groups: [
          {
            items: [
              'Programming in Python',
              'Basic data structures: stacks, queues, linked lists, trees, hash tables',
              'Search algorithms: linear search and binary search',
              'Basic sorting algorithms: selection sort, bubble sort and insertion sort',
              'Divide and conquer: mergesort, quicksort',
              'Introduction to graph theory; basic graph algorithms: traversals and shortest path',
            ],
          },
        ],
      },
      {
        sectionNumber: 5,
        title: 'Database Management and Warehousing',
        color: '#8B5CF6',
        groups: [
          {
            items: [
              'ER-model, relational model: relational algebra, tuple calculus, SQL',
              'Integrity constraints, normal form, file organization, indexing',
              'Data types, data transformation such as normalization, discretization, sampling, compression',
              'Data warehouse modelling: schema for multidimensional data models, concept hierarchies, measures: categorization and computations',
            ],
          },
        ],
      },
      {
        sectionNumber: 6,
        title: 'Machine Learning',
        color: '#F59E0B',
        groups: [
          {
            label: 'Supervised Learning',
            items: [
              'Regression and classification problems, simple linear regression, multiple linear regression, ridge regression, logistic regression',
              'k-nearest neighbour, naive Bayes classifier, linear discriminant analysis, support vector machine, decision trees',
              'Bias-variance trade-off, cross-validation methods such as leave-one-out (LOO) cross-validation, k-folds cross-validation',
              'Multi-layer perceptron, feed-forward neural network',
            ],
          },
          {
            label: 'Unsupervised Learning',
            items: [
              'Clustering algorithms, k-means/k-medoid, hierarchical clustering (top-down, bottom-up: single-linkage, multiple-linkage)',
              'Dimensionality reduction, principal component analysis',
            ],
          },
        ],
      },
      {
        sectionNumber: 7,
        title: 'AI',
        color: '#EC4899',
        groups: [
          {
            items: [
              'Search: informed, uninformed, adversarial',
              'Logic: propositional, predicate',
              'Reasoning under uncertainty: conditional independence representation, exact inference through variable elimination, approximate inference through sampling',
            ],
          },
        ],
      },
    ],
  },
];
