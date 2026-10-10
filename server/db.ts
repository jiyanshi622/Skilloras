import fs from 'fs';
import path from 'path';
import {
  User, StudentProfile, Subject, Topic, Question,
  AssessmentAttempt, StudentPerformance, LearningMaterial,
  TimetableSlot, Recommendation, LearningHistoryItem, AISettings,
  StudyNote
} from '../src/types/index.ts';

const DB_FILE = path.join(process.cwd(), 'data', 'skillora_store.json');

export interface DatabaseState {
  users: User[];
  profiles: StudentProfile[];
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  assessmentAttempts: AssessmentAttempt[];
  performances: StudentPerformance[];
  materials: LearningMaterial[];
  timetables: TimetableSlot[];
  recommendations: Recommendation[];
  history: LearningHistoryItem[];
  settings: AISettings;
  savedNotes: StudyNote[];
}

const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj_cs_dsa',
    code: 'CS_DSA',
    title: 'Data Structures & Algorithms',
    category: 'Computer Science',
    description: 'Master binary search, asymptotic complexity, graphs, and dynamic programming.',
    iconName: 'Code',
    orderIndex: 1
  },
  {
    id: 'subj_ml_ai',
    code: 'ML_AI',
    title: 'Machine Learning & Neural Networks',
    category: 'Artificial Intelligence',
    description: 'Understand gradient descent, backpropagation, transformers, and model evaluation.',
    iconName: 'Brain',
    orderIndex: 2
  },
  {
    id: 'subj_math',
    code: 'MATH_CALC',
    title: 'Calculus & Linear Algebra',
    category: 'Mathematics',
    description: 'Foundations of multivariable calculus, matrix decompositions, and eigenvalues.',
    iconName: 'Calculator',
    orderIndex: 3
  },
  {
    id: 'subj_web',
    code: 'WEB_ARCH',
    title: 'Full-Stack Web Architecture',
    category: 'Software Engineering',
    description: 'Modern frontend reactivity, RESTful caching, relational schema design, and security.',
    iconName: 'Globe',
    orderIndex: 4
  },
  {
    id: 'subj_physics',
    code: 'PHYS_MECH',
    title: 'Classical & Computational Physics',
    category: 'Natural Sciences',
    description: 'Newtonian mechanics, work-energy theorem, and rotational dynamics.',
    iconName: 'Atom',
    orderIndex: 5
  }
];

const INITIAL_TOPICS: Topic[] = [
  // CS DSA
  {
    id: 'top_dsa_1',
    subjectId: 'subj_cs_dsa',
    title: 'Asymptotic Analysis & Big-O Notation',
    slug: 'asymptotic-analysis-big-o',
    difficultyLevel: 'easy',
    orderIndex: 1,
    estimatedMinutes: 35
  },
  {
    id: 'top_dsa_2',
    subjectId: 'subj_cs_dsa',
    title: 'Binary Search Trees & Balancing (AVL/Red-Black)',
    slug: 'binary-search-trees',
    difficultyLevel: 'medium',
    orderIndex: 2,
    estimatedMinutes: 45
  },
  {
    id: 'top_dsa_3',
    subjectId: 'subj_cs_dsa',
    title: 'Dynamic Programming & Memoization',
    slug: 'dynamic-programming',
    difficultyLevel: 'hard',
    orderIndex: 3,
    estimatedMinutes: 60
  },
  // ML AI
  {
    id: 'top_ml_1',
    subjectId: 'subj_ml_ai',
    title: 'Linear Regression & Cost Functions',
    slug: 'linear-regression-cost-functions',
    difficultyLevel: 'easy',
    orderIndex: 1,
    estimatedMinutes: 40
  },
  {
    id: 'top_ml_2',
    subjectId: 'subj_ml_ai',
    title: 'Gradient Descent & Learning Rate Scheduling',
    slug: 'gradient-descent-optimization',
    difficultyLevel: 'medium',
    orderIndex: 2,
    estimatedMinutes: 50
  },
  {
    id: 'top_ml_3',
    subjectId: 'subj_ml_ai',
    title: 'Deep Neural Networks & Backpropagation',
    slug: 'backpropagation-neural-networks',
    difficultyLevel: 'hard',
    orderIndex: 3,
    estimatedMinutes: 65
  },
  // Math
  {
    id: 'top_math_1',
    subjectId: 'subj_math',
    title: 'Vectors, Dot Products & Matrix Multiplication',
    slug: 'linear-algebra-vectors-matrices',
    difficultyLevel: 'easy',
    orderIndex: 1,
    estimatedMinutes: 35
  },
  {
    id: 'top_math_2',
    subjectId: 'subj_math',
    title: 'Eigenvalues & Principal Component Decomposition',
    slug: 'eigenvalues-pca',
    difficultyLevel: 'hard',
    orderIndex: 2,
    estimatedMinutes: 55
  },
  // Web
  {
    id: 'top_web_1',
    subjectId: 'subj_web',
    title: 'HTTP Semantics, Idempotency & REST Design',
    slug: 'http-semantics-rest',
    difficultyLevel: 'easy',
    orderIndex: 1,
    estimatedMinutes: 30
  },
  {
    id: 'top_web_2',
    subjectId: 'subj_web',
    title: 'Database Indexing (B-Trees vs Hash Indexes)',
    slug: 'database-indexing-optimization',
    difficultyLevel: 'medium',
    orderIndex: 2,
    estimatedMinutes: 50
  }
];

const INITIAL_QUESTIONS: Question[] = [
  // DSA Questions
  {
    id: 'q_dsa_01',
    subjectId: 'subj_cs_dsa',
    topicId: 'top_dsa_1',
    difficulty: 'easy',
    questionType: 'multiple_choice',
    questionText: 'What is the tightest worst-case time complexity of accessing an element by index in a standard continuous array?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctOptionIndex: 0,
    explanation: 'Continuous arrays use pointer arithmetic base_address + (index * element_size), which computes memory offset in constant O(1) time.',
    hint: 'Think about how memory offset is calculated with contiguous memory cells.',
    isInitialAssessment: true
  },
  {
    id: 'q_dsa_02',
    subjectId: 'subj_cs_dsa',
    topicId: 'top_dsa_1',
    difficulty: 'medium',
    questionType: 'code_output',
    questionText: 'What is the time complexity of the following nested loop?',
    codeSnippet: 'for (let i = 1; i <= n; i *= 2) {\n  for (let j = 0; j < n; j++) {\n    doWork();\n  }\n}',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'],
    correctOptionIndex: 1,
    explanation: 'The outer loop doubles each step, running log₂(n) times. The inner loop executes n times per iteration, yielding O(n log n) overall.',
    hint: 'Count how many times the outer variable doubles up to n.',
    isInitialAssessment: true
  },
  {
    id: 'q_dsa_03',
    subjectId: 'subj_cs_dsa',
    topicId: 'top_dsa_2',
    difficulty: 'medium',
    questionType: 'multiple_choice',
    questionText: 'In a standard unbalanced Binary Search Tree, what is the worst-case lookup time complexity when elements are inserted in strictly sorted order?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctOptionIndex: 2,
    explanation: 'Inserting sorted elements produces a degenerate skewed tree resembling a linked list with height equal to n, degenerating search to O(n).',
    hint: 'What shape does the BST take when each new node is strictly greater than the previous?',
    isInitialAssessment: true
  },
  {
    id: 'q_dsa_04',
    subjectId: 'subj_cs_dsa',
    topicId: 'top_dsa_3',
    difficulty: 'hard',
    questionType: 'multiple_choice',
    questionText: 'Which two fundamental properties must an optimization problem exhibit to be solvable efficiently using Dynamic Programming?',
    options: [
      'NP-Completeness and Greedy Choice',
      'Optimal Substructure and Overlapping Subproblems',
      'Divide-and-Conquer and Disjoint Sets',
      'Polynomial Reducibility and Memoization'
    ],
    correctOptionIndex: 1,
    explanation: 'Dynamic Programming requires Optimal Substructure (optimal solution contains optimal solutions to subproblems) and Overlapping Subproblems (subproblems are computed repeatedly).',
    hint: 'Think of caching solutions to subproblems that occur multiple times.',
    isInitialAssessment: true
  },
  // ML Questions
  {
    id: 'q_ml_01',
    subjectId: 'subj_ml_ai',
    topicId: 'top_ml_1',
    difficulty: 'easy',
    questionType: 'multiple_choice',
    questionText: 'In simple linear regression, what metric is minimized by the Ordinary Least Squares (OLS) criterion?',
    options: [
      'Sum of Squared Residuals (SSR)',
      'Cross-Entropy Loss',
      'Maximum Margin Distance',
      'Kullback-Leibler Divergence'
    ],
    correctOptionIndex: 0,
    explanation: 'Ordinary Least Squares minimizes the sum of squared differences between observed values y and model predictions ŷ.',
    hint: 'Notice the phrase "Least Squares" in the method name.',
    isInitialAssessment: true
  },
  {
    id: 'q_ml_02',
    subjectId: 'subj_ml_ai',
    topicId: 'top_ml_2',
    difficulty: 'medium',
    questionType: 'multiple_choice',
    questionText: 'What typically occurs during Gradient Descent training if the learning rate α is set excessively high?',
    options: [
      'The parameters get trapped in a shallow saddle point',
      'The loss oscillates violently and may diverge to infinity',
      'Training requires infinite epochs without parameter updates',
      'The gradient norm automatically decays to zero'
    ],
    correctOptionIndex: 1,
    explanation: 'When learning rate is too large, the update steps overshoot the local minimum of the loss surface, causing numerical divergence.',
    hint: 'Consider what happens when the update step jumps past the bottom of the valley.',
    isInitialAssessment: true
  },
  {
    id: 'q_ml_03',
    subjectId: 'subj_ml_ai',
    topicId: 'top_ml_3',
    difficulty: 'hard',
    questionType: 'multiple_choice',
    questionText: 'In deep neural networks trained with Sigmoid or Tanh activation functions, what mathematical phenomenon causes gradients in early layers to vanish during backpropagation?',
    options: [
      'Multiplying derivatives that are strictly bounded less than 0.25 across multiple layers via the Chain Rule',
      'Matrix multiplication overflow in the forward pass',
      'L1 regularization forcing weights to exact zero',
      'High dropout probability dropping entire activation matrices'
    ],
    correctOptionIndex: 0,
    explanation: 'The maximum derivative of the sigmoid function is 0.25. Repeated multiplication of values ≤ 0.25 across deep layers causes the backpropagated gradient to exponentially decay towards zero.',
    hint: 'Evaluate the maximum value of σ\'(z) = σ(z)(1 - σ(z)).',
    isInitialAssessment: true
  },
  // Math Questions
  {
    id: 'q_math_01',
    subjectId: 'subj_math',
    topicId: 'top_math_1',
    difficulty: 'easy',
    questionType: 'multiple_choice',
    questionText: 'If two non-zero vectors u and v have a dot product u · v = 0, what is the geometric relationship between them?',
    options: ['They are parallel', 'They are orthogonal (perpendicular)', 'They are identical', 'They have opposite signs'],
    correctOptionIndex: 1,
    explanation: 'Since u · v = ||u|| ||v|| cos(θ), a dot product of 0 implies cos(θ) = 0, meaning the angle θ between them is 90° (orthogonal).',
    hint: 'cos(90°) = ?',
    isInitialAssessment: true
  },
  {
    id: 'q_math_02',
    subjectId: 'subj_math',
    topicId: 'top_math_2',
    difficulty: 'hard',
    questionType: 'multiple_choice',
    questionText: 'For a square matrix A, non-zero vector v, and scalar λ, which equation defines the eigenvalue problem?',
    options: ['A + v = λ', 'A v = λ v', 'A v = vᵀ λ', 'det(A) = λ ||v||'],
    correctOptionIndex: 1,
    explanation: 'An eigenvector v undergoes only a scalar scaling by λ under the linear transformation A, defined by A v = λ v.',
    hint: 'The matrix acts on the vector simply by scaling it.',
    isInitialAssessment: true
  },
  // Web Questions
  {
    id: 'q_web_01',
    subjectId: 'subj_web',
    topicId: 'top_web_1',
    difficulty: 'easy',
    questionType: 'multiple_choice',
    questionText: 'In RESTful HTTP design, which of the following HTTP methods is specified by RFC 9110 to be idempotent?',
    options: ['POST', 'PUT', 'CONNECT', 'PATCH (in non-standard forms)'],
    correctOptionIndex: 1,
    explanation: 'PUT replaces the target resource state; repeated identical PUT requests produce the exact same final server state as a single request.',
    hint: 'Repeated executions must have the same side effects as one execution.',
    isInitialAssessment: true
  },
  {
    id: 'q_web_02',
    subjectId: 'subj_web',
    topicId: 'top_web_2',
    difficulty: 'medium',
    questionType: 'multiple_choice',
    questionText: 'Why are B-Tree / B+Tree indexes predominantly chosen over Hash indexes for general-purpose relational database columns?',
    options: [
      'Hash indexes cannot store string data types',
      'B-Trees support efficient range queries (e.g., WHERE age BETWEEN 20 AND 30) and ordered scans',
      'B-Trees require O(1) disk writes whereas Hash indexes require O(n)',
      'Hash indexes cannot handle NULL values in standard SQL'
    ],
    correctOptionIndex: 1,
    explanation: 'Hash indexes only support direct equality lookups (=). B-Trees preserve sorting order, enabling range queries, prefix matching, and ORDER BY without sorting.',
    hint: 'Consider how sorting and inequality comparisons (<, >, BETWEEN) work on hashed buckets versus ordered trees.',
    isInitialAssessment: true
  }
];

const INITIAL_MATERIALS: LearningMaterial[] = [
  {
    id: 'mat_dsa_1',
    topicId: 'top_dsa_1',
    subjectId: 'subj_cs_dsa',
    title: 'Deconstructing Asymptotic Big-O Complexity',
    summary: 'A deep dive into upper bounds, tight bounds (Big-Θ), and evaluating nested algorithmic loops.',
    readingTimeMinutes: 8,
    contentMarkdown: `### 1. The Core Meaning of Big-O Notation
Big-O notation describes the limiting behavior of a function when the argument tends towards a particular value or infinity. In computer science, it characterizes the upper bound of run-time or space requirements as input size $N$ scales.

\`\`\`
O(1)        <  O(log N)    <  O(N)       <  O(N log N)  <  O(N²)      <  O(2ᴺ)
Constant       Logarithmic    Linear        Linearithmic   Quadratic     Exponential
\`\`\`

### 2. Formal Mathematical Definition
A function $f(n) \\in O(g(n))$ if and only if there exist positive constants $c$ and $n_0$ such that:
$$0 \\le f(n) \\le c \\cdot g(n) \\quad \\text{for all } n \\ge n_0$$

### 3. Practical Analysis Rules
1. **Drop Constant Factors**: $5N^2 + 100N \\implies O(N^2)$.
2. **Drop Lower-Order Terms**: $N^3 + N^2 \\log N \\implies O(N^3)$.
3. **Sequential Blocks Add**: Loop of size $N$ followed by loop of size $M \\implies O(N + M)$.
4. **Nested Loops Multiply**: Loop of size $N$ enclosing loop of size $K \\implies O(N \\cdot K)$.`,
    keyTakeaways: [
      'Big-O represents the asymptotic upper bound, ignoring hardware speed and constant multipliers.',
      'Logarithmic growth O(log n) occurs whenever the problem space halves each step (e.g., binary search).',
      'Space complexity must account for auxiliary allocations and call-stack recursion depth.'
    ],
    interactiveExample: {
      type: 'algorithm',
      title: 'Halving Search Space (Binary Search)',
      input: 'Array size N = 1,000,000',
      expectedOutput: 'Maximum ~20 comparisons',
      explanation: 'log₂(1,000,000) ≈ 19.93. Even with a million items, binary search needs at most 20 iterations.'
    }
  },
  {
    id: 'mat_ml_1',
    topicId: 'top_ml_2',
    subjectId: 'subj_ml_ai',
    title: 'Gradient Descent Optimization & Learning Rate Dynamics',
    summary: 'How weights update iteratively along the negative gradient vector and strategies for convergence.',
    readingTimeMinutes: 10,
    contentMarkdown: `### 1. Intuition of Gradient Descent
Imagine being blindfolded on a foggy mountain and wanting to reach the lowest valley floor. At each step, you feel the slope of the ground beneath your boots and take a step in the steepest downward direction.

### 2. The Weight Update Rule
For a loss function $J(\\theta)$, the parameter vector is updated iteratively:
$$\\theta_{t+1} = \\theta_t - \\alpha \\nabla J(\\theta_t)$$
Where:
- $\\theta$: The weights vector
- $\\alpha$: The learning rate (step size hyperparameter)
- $\\nabla J(\\theta_t)$: Vector of partial derivatives $\\frac{\\partial J}{\\partial \\theta_i}$

### 3. Impact of Learning Rate (α)
- **Too Small (α = 0.00001)**: Slow crawl, high risk of getting trapped in plateau or taking millions of epochs.
- **Optimal (α = 0.01 - 0.001)**: Steady decrease in loss, smooth asymptotic convergence.
- **Too Large (α = 1.5)**: Overshooting the valley, divergence, loss exploding to NaN.`,
    keyTakeaways: [
      'The gradient points in the direction of greatest rate of increase; we step in the negative gradient direction.',
      'Modern optimizers (Adam, RMSProp) use momentum and adaptive per-parameter learning rates.',
      'Feature normalization (StandardScaler) makes the loss contours spherical, speeding up convergence.'
    ]
  },
  {
    id: 'mat_web_1',
    topicId: 'top_web_2',
    subjectId: 'subj_web',
    title: 'Relational Database Indexing with B+Trees',
    summary: 'How database engines avoid full table scans using balanced tree indexing structures.',
    readingTimeMinutes: 9,
    contentMarkdown: `### 1. Why Full Table Scans Fail at Scale
Without an index, querying \`SELECT * FROM users WHERE email = 'ada@example.com'\` requires examining every data page on disk—an $O(N)$ sequential I/O operation.

### 2. The B+Tree Architecture
A B+Tree is a self-balancing, multi-way search tree where:
- All data records or row pointers reside strictly in the leaf nodes.
- Leaf nodes are linked together via a doubly-linked list for ultra-fast range queries.
- Internal nodes only contain routing keys and page pointers, yielding high fan-out (100–500 keys per page).

### 3. Composite Index Column Ordering
If an index is defined as \`(status, created_at)\`:
- ✅ Fast: \`WHERE status = 'active' AND created_at > '2026-01-01'\`
- ✅ Fast: \`WHERE status = 'active'\`
- ❌ Index Skipped: \`WHERE created_at > '2026-01-01'\` (Leftmost Prefix Rule).`,
    keyTakeaways: [
      'B+Tree lookup complexity is O(log_B N), typically taking only 3–4 page reads for millions of records.',
      'Indexes speed up reads but incur a write overhead on every INSERT, UPDATE, and DELETE.',
      'Always order composite index columns by equality filters first, then range filters.'
    ]
  }
];

export class DatabaseStore {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadOrInit();
  }

  private loadOrInit(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.savedNotes) parsed.savedNotes = [];
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read existing db file, creating clean initial store');
    }

    const defaultState: DatabaseState = {
      users: [],
      profiles: [],
      subjects: INITIAL_SUBJECTS,
      topics: INITIAL_TOPICS,
      questions: INITIAL_QUESTIONS,
      assessmentAttempts: [],
      performances: [],
      materials: INITIAL_MATERIALS,
      timetables: [],
      recommendations: [],
      history: [],
      savedNotes: [],
      settings: {
        engineProvider: 'gemini',
        ollamaEndpoint: 'http://localhost:11434',
        ollamaModel: 'llama3',
        geminiModel: 'gemini-3.8-flash',
        speechEnabled: true
      }
    };

    this.save(defaultState);
    return defaultState;
  }

  public save(newState?: DatabaseState): void {
    if (newState) this.state = newState;
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database store:', err);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  // --- Users & Profiles ---
  public findUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  public createUser(user: User, profile: StudentProfile): { user: User; profile: StudentProfile } {
    this.state.users.push(user);
    this.state.profiles.push(profile);
    this.save();
    return { user, profile };
  }

  public getProfileByUserId(userId: string): StudentProfile | undefined {
    return this.state.profiles.find(p => p.userId === userId);
  }

  public updateProfile(userId: string, updates: Partial<StudentProfile>): StudentProfile | undefined {
    const profile = this.state.profiles.find(p => p.userId === userId);
    if (profile) {
      Object.assign(profile, updates, { updatedAt: new Date().toISOString() });
      this.save();
    }
    return profile;
  }

  // --- Subjects & Topics ---
  public getSubjects(): Subject[] {
    return this.state.subjects;
  }

  public getTopics(subjectId?: string): Topic[] {
    if (subjectId) {
      return this.state.topics.filter(t => t.subjectId === subjectId);
    }
    return this.state.topics;
  }

  // --- Questions ---
  public getQuestions(filters?: { topicId?: string; subjectId?: string; difficulty?: string; initialOnly?: boolean }): Question[] {
    return this.state.questions.filter(q => {
      if (filters?.initialOnly && !q.isInitialAssessment) return false;
      if (filters?.topicId && q.topicId !== filters.topicId) return false;
      if (filters?.subjectId && q.subjectId !== filters.subjectId) return false;
      if (filters?.difficulty && q.difficulty !== filters.difficulty) return false;
      return true;
    });
  }

  // --- Attempts & Performance ---
  public recordAssessmentAttempt(attempt: AssessmentAttempt): void {
    this.state.assessmentAttempts.push(attempt);
    this.save();
  }

  public getPerformances(userId: string): StudentPerformance[] {
    return this.state.performances.filter(p => p.userId === userId);
  }

  public upsertPerformance(perf: StudentPerformance): void {
    const existingIndex = this.state.performances.findIndex(
      p => p.userId === perf.userId && p.topicId === perf.topicId
    );
    if (existingIndex >= 0) {
      this.state.performances[existingIndex] = perf;
    } else {
      this.state.performances.push(perf);
    }
    this.save();
  }

  // --- Timetables ---
  public getTimetable(userId: string): TimetableSlot[] {
    return this.state.timetables.filter(t => t.userId === userId);
  }

  public setTimetable(userId: string, slots: TimetableSlot[]): void {
    this.state.timetables = this.state.timetables.filter(t => t.userId !== userId).concat(slots);
    this.save();
  }

  public toggleTimetableSlot(userId: string, slotId: string, isCompleted: boolean): boolean {
    const slot = this.state.timetables.find(t => t.userId === userId && t.id === slotId);
    if (slot) {
      slot.isCompleted = isCompleted;
      this.save();
      return true;
    }
    return false;
  }

  public addTimetableSlot(slot: TimetableSlot): TimetableSlot {
    this.state.timetables.unshift(slot);
    this.save();
    return slot;
  }

  public deleteTimetableSlot(userId: string, slotId: string): boolean {
    const prevLen = this.state.timetables.length;
    this.state.timetables = this.state.timetables.filter(t => !(t.userId === userId && t.id === slotId));
    if (this.state.timetables.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public updateTimetableSlot(userId: string, slotId: string, updates: Partial<TimetableSlot>): TimetableSlot | null {
    const slot = this.state.timetables.find(t => t.userId === userId && t.id === slotId);
    if (slot) {
      Object.assign(slot, updates);
      this.save();
      return slot;
    }
    return null;
  }

  public addCustomSubject(subject: Subject): Subject {
    const exists = this.state.subjects.find(s => s.id === subject.id || s.title.toLowerCase() === subject.title.toLowerCase());
    if (exists) return exists;
    this.state.subjects.push(subject);
    this.save();
    return subject;
  }

  public updateUserSubjects(userId: string, subjectIds: string[]): string[] {
    const profile = this.getProfileByUserId(userId);
    if (profile) {
      profile.selectedSubjects = subjectIds;
      profile.updatedAt = new Date().toISOString();
      this.save();
    }
    return subjectIds;
  }

  // --- Recommendations ---
  public getRecommendations(userId: string): Recommendation[] {
    return this.state.recommendations.filter(r => r.userId === userId);
  }

  public setRecommendations(userId: string, list: Recommendation[]): void {
    this.state.recommendations = this.state.recommendations.filter(r => r.userId !== userId).concat(list);
    this.save();
  }

  // --- Learning Materials ---
  public getMaterials(topicId?: string): LearningMaterial[] {
    if (topicId) {
      return this.state.materials.filter(m => m.topicId === topicId);
    }
    return this.state.materials;
  }

  // --- History ---
  public addHistory(item: LearningHistoryItem): void {
    this.state.history.unshift(item);
    if (this.state.history.length > 100) this.state.history.pop();
    this.save();
  }

  public getHistory(userId: string): LearningHistoryItem[] {
    return this.state.history.filter(h => h.userId === userId);
  }

  // --- Settings ---
  public getSettings(): AISettings {
    return this.state.settings;
  }

  public updateSettings(settings: Partial<AISettings>): AISettings {
    this.state.settings = { ...this.state.settings, ...settings };
    this.save();
    return this.state.settings;
  }

  // --- Saved Notes ---
  public getSavedNotes(userId?: string): StudyNote[] {
    if (!this.state.savedNotes) this.state.savedNotes = [];
    if (userId) {
      return this.state.savedNotes.filter(n => !n.userId || n.userId === userId);
    }
    return this.state.savedNotes;
  }

  public saveNote(note: StudyNote): StudyNote {
    if (!this.state.savedNotes) this.state.savedNotes = [];
    const idx = this.state.savedNotes.findIndex(n => n.id === note.id);
    if (idx >= 0) {
      this.state.savedNotes[idx] = note;
    } else {
      this.state.savedNotes.unshift(note);
    }
    this.save();
    return note;
  }

  public deleteSavedNote(noteId: string): boolean {
    if (!this.state.savedNotes) this.state.savedNotes = [];
    const prevLen = this.state.savedNotes.length;
    this.state.savedNotes = this.state.savedNotes.filter(n => n.id !== noteId);
    if (this.state.savedNotes.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }
}

export const dbStore = new DatabaseStore();
