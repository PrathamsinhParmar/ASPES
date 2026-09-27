/**
 * Formats programming language or course names with standard industry capitalization.
 * e.g., 'python' -> 'Python', 'javascript' -> 'JavaScript', 'cpp' -> 'C++'
 */
export const formatLanguageName = (name) => {
  if (!name || typeof name !== 'string') return '';

  const langMap = {
    python: 'Python',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    js: 'JavaScript',
    ts: 'TypeScript',
    cpp: 'C++',
    'c++': 'C++',
    csharp: 'C#',
    'c#': 'C#',
    java: 'Java',
    html: 'HTML',
    css: 'CSS',
    sql: 'SQL',
    php: 'PHP',
    go: 'Go',
    golang: 'Golang',
    rust: 'Rust',
    ruby: 'Ruby',
    swift: 'Swift',
    kotlin: 'Kotlin',
    r: 'R',
    dart: 'Dart',
    scala: 'Scala',
    shell: 'Shell',
    bash: 'Bash',
    c: 'C',
    react: 'React',
    vue: 'Vue',
    angular: 'Angular',
    django: 'Django',
    flask: 'Flask',
    fastapi: 'FastAPI',
    nodejs: 'Node.js',
    node: 'Node.js'
  };

  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  if (langMap[lower]) {
    return langMap[lower];
  }

  // Handle compound words or title casing
  return trimmed
    .split(/[\s_-]+/)
    .map(word => {
      const wLower = word.toLowerCase();
      if (langMap[wLower]) return langMap[wLower];
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Formats a project status string into Capitalized/Title Case.
 * e.g., 'submitted' -> 'Submitted', 'under_evaluation' -> 'Under Evaluation', 'evaluated' -> 'Evaluated'
 */
export const formatStatus = (status) => {
  if (!status || typeof status !== 'string') return '';
  return status
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default formatLanguageName;

