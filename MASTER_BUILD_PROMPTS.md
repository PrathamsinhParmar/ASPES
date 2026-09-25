# MASTER BUILD PROMPT
# AI Smart Academic Project Evaluation System
# Modular Prompts for Building with Anthropic Claude

---

## 📋 HOW TO USE THIS DOCUMENT

This document contains **modular prompts** for building each component of the system.

**Strategy:**
1. Start with **Module 1** (Project Setup)
2. Complete each module sequentially
3. Test each module before moving to the next
4. Copy the exact prompt for each module into Claude
5. Review Claude's output and iterate as needed

**Important:**
- Each prompt is self-contained and detailed
- Include context from previous modules when needed
- Test thoroughly at each step
- Don't skip modules - they build on each other

---

# MODULE 1: PROJECT SETUP & INITIALIZATION

## PROMPT 1.1: Create Project Structure

```
I need you to help me set up the complete folder structure for a full-stack AI-powered academic project evaluation system.

PROJECT OVERVIEW:
- Name: AI Smart Academic Project Evaluation System
- Backend: Python 3.11+ with FastAPI
- Frontend: React 18.2 with Tailwind CSS
- Database: PostgreSQL 15+
- AI/ML: PyTorch, Transformers, Sentence-BERT
- Task Queue: Celery with Redis

REQUIREMENTS:
1. Create the complete directory structure for both backend and frontend
2. Generate all necessary configuration files:
   - Backend: .env.example, .gitignore, requirements.txt, README.md
   - Frontend: .env.example, .gitignore, package.json, tailwind.config.js
3. Set up proper Python package structure with __init__.py files
4. Create initial README.md with project description and setup instructions

BACKEND STRUCTURE NEEDED:
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── projects.py
│   │   ├── evaluations.py
│   │   └── users.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── project.py
│   │   └── evaluation.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── project.py
│   │   └── evaluation.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   └── file_service.py
│   ├── ai_engine/
│   │   ├── __init__.py
│   │   ├── code_analyzer.py
│   │   ├── ai_code_detector.py
│   │   ├── doc_evaluator.py
│   │   ├── report_code_aligner.py
│   │   ├── plagiarism_detector.py
│   │   ├── feedback_generator.py
│   │   └── comprehensive_scorer.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── dependencies.py
│   │   └── security.py
│   ├── database/
│   │   ├── __init__.py
│   │   └── connection.py
│   └── tasks/
│       ├── __init__.py
│       └── evaluation_tasks.py
├── tests/
├── uploads/
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

FRONTEND STRUCTURE NEEDED:
```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Project/
│   │   ├── Evaluation/
│   │   └── Common/
│   ├── pages/
│   ├── services/
│   ├── context/
│   ├── hooks/
│   ├── utils/
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── .env.example
├── .gitignore
├── package.json
└── tailwind.config.js
```

OUTPUT FORMAT:
1. Provide bash/terminal commands to create the entire structure
2. Generate content for all configuration files
3. Create a setup checklist with commands to run

Please create this complete project structure with all necessary files.
```

---

## PROMPT 1.2: Setup Configuration Files

```
Now that I have the project structure, I need you to generate the complete content for all configuration files.

GENERATE THE FOLLOWING FILES:

1. **backend/.env.example**
   - Include all environment variables needed:
     * DATABASE_URL (PostgreSQL connection string)
     * REDIS_URL
     * SECRET_KEY
     * OPENAI_API_KEY
     * ALLOWED_ORIGINS
     * MAX_UPLOAD_SIZE
     * All other necessary configurations

2. **backend/requirements.txt**
   - Include ALL Python dependencies:
     * FastAPI ecosystem (fastapi, uvicorn, pydantic)
     * Database (sqlalchemy, psycopg2-binary, alembic)
     * Authentication (python-jose, passlib, bcrypt)
     * AI/ML (torch, transformers, sentence-transformers, openai)
     * NLP (spacy, nltk)
     * Code analysis (radon, pylint)
     * Document processing (python-docx, pypdf)
     * Async tasks (celery, redis)
     * Testing (pytest, httpx)
     * All other dependencies
   - Use specific versions for stability

3. **backend/.gitignore**
   - Python-specific ignores
   - Virtual environment folders
   - .env files
   - __pycache__, *.pyc
   - uploads/ folder
   - Database files
   - IDE-specific files

4. **frontend/package.json**
   - Complete React project configuration
   - All dependencies:
     * React, React Router, Redux Toolkit
     * Axios for HTTP
     * Tailwind CSS and plugins
     * Recharts for visualizations
     * React Hook Form for forms
     * Testing libraries
     * Development tools (ESLint, Prettier)
   - Scripts for dev, build, test
   - Proxy configuration for API

5. **frontend/tailwind.config.js**
   - Proper content paths
   - Custom theme colors (primary: #2E75B6, secondary: #44546A)
   - Required plugins (@tailwindcss/forms, @tailwindcss/typography)

6. **docker-compose.yml** (for the entire project)
   - Services: backend, frontend, postgres, redis, celery_worker
   - Proper networking
   - Volume mounts
   - Environment variables

For each file, provide:
- Complete, production-ready content
- Comments explaining important sections
- Best practices and security considerations
```

---

# MODULE 2: DATABASE SETUP

## PROMPT 2.1: Create Database Models

```
I need you to create complete SQLAlchemy database models for the AI Smart Academic Project Evaluation System.

CONTEXT:
- Using PostgreSQL 15+ with SQLAlchemy ORM
- Need models for: Users, Projects, Evaluations
- Relationships: User -> Projects (one-to-many), Project -> Evaluation (one-to-one)

CREATE THE FOLLOWING:

1. **backend/app/database/connection.py**
   - SQLAlchemy engine setup
   - SessionLocal for database sessions
   - Base declarative class
   - get_db dependency function for FastAPI

2. **backend/app/models/user.py**
   ```python
   Requirements:
   - Fields: id, email (unique), username (unique), hashed_password, full_name, role, department, created_at
   - Role enum: STUDENT, FACULTY, ADMIN
   - Relationship to projects
   - Proper indexes on email and username
   - Timestamps
   ```

3. **backend/app/models/project.py**
   ```python
   Requirements:
   - Fields: id, title, description, student_id (FK), code_file_path, doc_file_path, 
             programming_language, status, uploaded_at
   - Status enum: UPLOADED, PROCESSING, EVALUATED, PUBLISHED, ERROR
   - Relationship to user (student)
   - Relationship to evaluation
   - Indexes on student_id and status
   ```

4. **backend/app/models/evaluation.py**
   ```python
   Requirements:
   - Fields: id, project_id (FK, unique), code_quality_score, documentation_score,
             originality_score, final_score, letter_grade, ai_feedback,
             ai_detection_results (JSONB), alignment_results (JSONB),
             plagiarism_results (JSONB), is_finalized, faculty_comments,
             finalized_by (FK), evaluated_at, finalized_at
   - Relationship to project
   - Relationship to faculty user (finalized_by)
   - Indexes on project_id and is_finalized
   ```

5. **backend/app/models/__init__.py**
   - Import and expose all models
   - Import Base from connection

REQUIREMENTS:
- Use proper SQLAlchemy 2.0 syntax
- Include proper type hints
- Add docstrings to classes
- Use appropriate column types (DECIMAL for scores, JSONB for JSON data)
- Set up proper foreign key constraints
- Include cascade delete rules where appropriate
- Add created_at/updated_at timestamps
- Use enums for status fields

OUTPUT:
Complete, working Python files with all imports and proper structure.
```

---

## PROMPT 2.2: Create Pydantic Schemas

```
I need you to create Pydantic schemas for request/response validation in FastAPI.

CONTEXT:
- Using Pydantic v2
- Need schemas for User, Project, Evaluation
- Separate schemas for: Create, Update, Response (DB model)

CREATE THE FOLLOWING:

1. **backend/app/schemas/user.py**
   ```python
   Schemas needed:
   - UserBase: email, username, full_name, role, department
   - UserCreate (extends UserBase): + password
   - UserUpdate: Optional fields for updating
   - UserResponse (extends UserBase): + id, created_at (from_attributes = True)
   - UserInDB (extends UserResponse): + hashed_password
   - Token: access_token, token_type
   - TokenData: username, role
   ```

2. **backend/app/schemas/project.py**
   ```python
   Schemas needed:
   - ProjectBase: title, description, programming_language
   - ProjectCreate (extends ProjectBase): No additional fields (files handled separately)
   - ProjectUpdate: Optional fields
   - ProjectResponse: + id, student_id, status, uploaded_at, code_file_path, doc_file_path
   - ProjectWithEvaluation: ProjectResponse + evaluation data (Optional)
   ```

3. **backend/app/schemas/evaluation.py**
   ```python
   Schemas needed:
   - EvaluationBase: project_id
   - EvaluationCreate: All score fields, ai_feedback, JSON results
   - EvaluationUpdate: faculty_comments, modified scores
   - EvaluationResponse: All fields including id, timestamps
   - EvaluationFinalize: is_finalized, faculty_comments
   - DetailedScoreBreakdown: Nested schema for score components
   ```

4. **backend/app/schemas/__init__.py**
   - Import and expose all schemas

REQUIREMENTS:
- Use Pydantic v2 syntax (ConfigDict instead of Config class)
- Add field validators where appropriate (email format, score ranges 0-100)
- Use proper type hints (str, int, float, datetime, Optional, List)
- Add examples for documentation
- Include model_config with from_attributes=True for Response schemas
- Add helpful descriptions to fields
- Validate password strength in UserCreate
- Validate file extensions where applicable

OUTPUT:
Complete Pydantic schema files ready for use in FastAPI endpoints.
```

---

# MODULE 3: AUTHENTICATION & SECURITY

## PROMPT 3.1: Create Security Utilities

```
I need you to create complete authentication and security utilities for the FastAPI backend.

CREATE THE FOLLOWING:

1. **backend/app/utils/security.py**
   ```python
   Functions needed:
   - verify_password(plain_password: str, hashed_password: str) -> bool
     * Use passlib with bcrypt
   
   - get_password_hash(password: str) -> str
     * Hash password with bcrypt
   
   - create_access_token(data: dict, expires_delta: timedelta = None) -> str
     * Create JWT token
     * Use python-jose
     * Include expiration (default 7 days)
     * Add user role and username to token
   
   - verify_token(token: str) -> dict
     * Decode and verify JWT
     * Return payload or raise HTTPException
     * Handle expired tokens
   
   - validate_password_strength(password: str) -> bool
     * Check minimum 8 characters
     * Require uppercase, lowercase, number
     * Return True/False with error message
   ```

2. **backend/app/utils/dependencies.py**
   ```python
   Dependencies needed:
   - get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db))
     * Extract token from Authorization header
     * Verify token
     * Fetch user from database
     * Return user object
     * Raise 401 if invalid
   
   - get_current_active_user(current_user: User = Depends(get_current_user))
     * Check user is active
     * Return user
   
   - require_role(*allowed_roles: str)
     * Dependency factory for role-based access
     * Return function that checks user role
     * Raise 403 if unauthorized
   
   - get_db()
     * Yield database session
     * Close after request
   ```

3. **backend/app/config.py**
   ```python
   Configuration needed:
   - Load all environment variables using pydantic-settings
   - Settings class with:
     * DATABASE_URL
     * REDIS_URL
     * SECRET_KEY
     * ALGORITHM (default: HS256)
     * ACCESS_TOKEN_EXPIRE_MINUTES
     * OPENAI_API_KEY
     * MAX_UPLOAD_SIZE
     * ALLOWED_ORIGINS (list)
     * UPLOAD_DIR
     * All other configs
   - Validate required settings
   - Provide defaults for optional settings
   ```

REQUIREMENTS:
- Use FastAPI's OAuth2PasswordBearer for token handling
- Implement proper error handling with HTTPException
- Add detailed error messages
- Use environment variables for secrets
- Include type hints and docstrings
- Follow security best practices (no hardcoded secrets)
- Make token expiration configurable
- Add logging for authentication events

OUTPUT:
Complete, production-ready security utilities with all imports.
```

---

## PROMPT 3.2: Create Authentication Endpoints

```
I need you to create complete authentication API endpoints for the FastAPI backend.

CREATE: **backend/app/api/auth.py**

ENDPOINTS NEEDED:

1. **POST /api/auth/register**
   ```python
   Requirements:
   - Accept UserCreate schema
   - Validate email format
   - Check password strength
   - Check if email/username already exists
   - Hash password
   - Create user in database
   - Return UserResponse (without password)
   - Handle errors (duplicate user, validation)
   ```

2. **POST /api/auth/login**
   ```python
   Requirements:
   - Accept OAuth2PasswordRequestForm (username, password)
   - Find user by username
   - Verify password
   - Create JWT access token (7 day expiry)
   - Return Token schema (access_token, token_type)
   - Handle errors (user not found, wrong password)
   - Rate limiting consideration
   ```

3. **GET /api/auth/me**
   ```python
   Requirements:
   - Require authentication (Depends(get_current_user))
   - Return current user data (UserResponse)
   - Exclude password hash
   ```

4. **PUT /api/auth/change-password**
   ```python
   Requirements:
   - Require authentication
   - Accept old_password and new_password
   - Verify old password
   - Validate new password strength
   - Hash and update password
   - Return success message
   ```

IMPLEMENTATION REQUIREMENTS:
- Use APIRouter with prefix='/api/auth' and tags=['Authentication']
- Add proper HTTP status codes (201 for register, 200 for login)
- Include detailed error responses
- Add response models to endpoints
- Use proper dependency injection
- Add docstrings for API documentation
- Include example requests/responses
- Implement proper transaction handling
- Log authentication events

SECURITY:
- Never return password hashes
- Use constant-time comparison for passwords
- Add rate limiting headers
- Sanitize error messages (don't leak user existence in login)
- Use HTTPException for errors

OUTPUT:
Complete auth.py file ready to be imported in main.py
```

---

# MODULE 4: FILE HANDLING & PROJECT MANAGEMENT

## PROMPT 4.1: Create File Service

```
I need you to create a comprehensive file handling service for project uploads.

CREATE: **backend/app/services/file_service.py**

REQUIREMENTS:

1. **FileService class with methods:**

   a. **validate_file(file: UploadFile, allowed_extensions: set) -> None**
      ```python
      - Check file extension is in allowed list
      - Check file size <= MAX_UPLOAD_SIZE
      - Check MIME type matches extension
      - Raise HTTPException if invalid
      ```

   b. **save_file(file: UploadFile, subfolder: str) -> str**
      ```python
      - Generate unique filename (UUID + original extension)
      - Create subfolder if doesn't exist
      - Save file to disk (uploads/subfolder/)
      - Return full file path
      - Handle I/O errors
      ```

   c. **save_project_files(code_file: UploadFile, doc_file: UploadFile) -> tuple[str, str]**
      ```python
      - Validate code file (allowed: .py, .js, .java, .cpp, .zip)
      - Validate doc file (allowed: .pdf, .md, .txt, .docx)
      - Save both files
      - Return (code_path, doc_path)
      ```

   d. **delete_file(file_path: str) -> bool**
      ```python
      - Check file exists
      - Delete file from disk
      - Return success status
      - Handle errors gracefully
      ```

   e. **extract_zip(zip_path: str, extract_to: str) -> list[str]**
      ```python
      - Extract zip file
      - Return list of extracted file paths
      - Validate extracted files (no malicious paths)
      - Set size limit for extraction
      ```

   f. **read_file_content(file_path: str) -> str**
      ```python
      - Read file content as string
      - Handle different encodings (utf-8, latin-1)
      - Handle binary files appropriately
      - Return content or empty string
      ```

CONSTANTS:
```python
UPLOAD_DIR = Path("uploads")
ALLOWED_CODE_EXTENSIONS = {".py", ".js", ".java", ".cpp", ".c", ".zip"}
ALLOWED_DOC_EXTENSIONS = {".pdf", ".md", ".txt", ".docx"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
```

ADDITIONAL REQUIREMENTS:
- Use pathlib for path handling
- Create uploads directory on initialization
- Use async file operations where possible
- Add comprehensive error handling
- Log all file operations
- Sanitize file names (remove special characters)
- Check for path traversal attacks
- Add type hints
- Include docstrings

OUTPUT:
Complete file_service.py with all methods implemented and tested logic.
```

---

## PROMPT 4.2: Create Project Endpoints

```
I need you to create complete project management API endpoints.

CREATE: **backend/app/api/projects.py**

ENDPOINTS NEEDED:

1. **POST /api/projects/upload**
   ```python
   Requirements:
   - Accept multipart/form-data:
     * title: str (Form)
     * description: str (Form, optional)
     * programming_language: str (Form)
     * code_file: UploadFile (File)
     * doc_file: UploadFile (File)
   - Require authentication (student role)
   - Validate files using FileService
   - Save files to disk
   - Create Project record in database
   - Trigger async evaluation task (Celery)
   - Return ProjectResponse with status "uploaded"
   - Handle errors (file too large, invalid format, etc.)
   ```

2. **GET /api/projects/my**
   ```python
   Requirements:
   - Require authentication
   - Get all projects for current user
   - Include evaluation status
   - Order by uploaded_at DESC
   - Support pagination (skip, limit query params)
   - Return List[ProjectResponse]
   ```

3. **GET /api/projects/{project_id}**
   ```python
   Requirements:
   - Require authentication
   - Get specific project
   - Check user owns project OR user is faculty/admin
   - Include evaluation data if available
   - Return ProjectWithEvaluation
   - Return 404 if not found
   - Return 403 if not authorized
   ```

4. **DELETE /api/projects/{project_id}**
   ```python
   Requirements:
   - Require authentication
   - Check user owns project OR user is admin
   - Delete associated files from disk
   - Delete project from database (cascade delete evaluation)
   - Return success message
   - Return 404 if not found
   - Return 403 if not authorized
   ```

5. **GET /api/projects (Faculty/Admin only)**
   ```python
   Requirements:
   - Require faculty or admin role
   - Get all projects with filters:
     * status (query param)
     * student_id (query param)
     * date_range (query params)
   - Include student info
   - Support pagination
   - Return List[ProjectResponse] with student details
   ```

IMPLEMENTATION REQUIREMENTS:
- Use APIRouter with prefix='/api/projects' and tags=['Projects']
- Proper dependency injection for auth and database
- Use background tasks for file cleanup if needed
- Add comprehensive error handling
- Include request/response examples in docs
- Validate all inputs
- Use transactions for database operations
- Add logging for important events

CELERY INTEGRATION:
```python
# After creating project, trigger evaluation
from app.tasks.evaluation_tasks import evaluate_project_async
evaluate_project_async.delay(project.id)
```

OUTPUT:
Complete projects.py with all endpoints ready for integration.
```

---

# MODULE 5: AI ENGINE - CODE ANALYZER

## PROMPT 5.1: Create Code Quality Analyzer

```
I need you to create a comprehensive code quality analyzer using Radon and Pylint.

CREATE: **backend/app/ai_engine/code_analyzer.py**

IMPLEMENTATION:

```python
class CodeAnalyzer:
    """
    Analyzes code quality using static analysis tools
    Returns scores for complexity, maintainability, and overall quality
    """
    
    def __init__(self):
        self.weights = {
            'complexity': 0.3,
            'maintainability': 0.3,
            'quality': 0.4
        }
    
    def analyze(self, file_path: str) -> dict:
        """
        Main analysis method
        
        Args:
            file_path: Path to Python file to analyze
            
        Returns:
            {
                'final_score': float (0-100),
                'complexity': float (0-100),
                'maintainability': float (0-100),
                'quality': float (0-100),
                'details': {
                    'cyclomatic_complexity': dict,
                    'lines_of_code': int,
                    'functions_count': int,
                    'classes_count': int
                }
            }
        """
        # Read file
        # Run complexity analysis
        # Run maintainability analysis  
        # Run quality analysis
        # Calculate weighted final score
        # Return results
    
    def _analyze_complexity(self, code: str) -> float:
        """
        Use radon.complexity to calculate cyclomatic complexity
        
        Process:
        1. Use radon_cc.cc_visit(code) to get complexity results
        2. Calculate average complexity across all functions
        3. Convert to 0-100 scale (lower complexity = higher score)
        4. Formula: score = max(0, 100 - (avg_complexity * 10))
        
        Returns:
            Complexity score (0-100)
        """
    
    def _analyze_maintainability(self, code: str) -> float:
        """
        Use radon.metrics to calculate maintainability index
        
        Process:
        1. Use radon_metrics.mi_visit(code, multi=True)
        2. Return MI score (already 0-100 scale)
        3. Handle exceptions (return 50 as default)
        
        Returns:
            Maintainability score (0-100)
        """
    
    def _analyze_quality(self, file_path: str) -> float:
        """
        Use Pylint to assess code quality
        
        Process:
        1. Run: pylint.epylint.py_run(f'{file_path} --output-format=json')
        2. Parse JSON output
        3. Extract score (0-10 scale)
        4. Convert to 0-100 scale
        5. Handle errors gracefully
        
        Returns:
            Quality score (0-100)
        """
    
    def _get_code_details(self, code: str) -> dict:
        """
        Extract detailed metrics using AST parsing
        
        Returns:
            {
                'cyclomatic_complexity': {
                    'average': float,
                    'max': float,
                    'per_function': List[dict]
                },
                'lines_of_code': int,
                'functions_count': int,
                'classes_count': int,
                'comment_lines': int
            }
        """
```

REQUIREMENTS:
- Import: radon.complexity, radon.metrics, pylint.epylint, ast
- Handle syntax errors gracefully (return default scores)
- Add detailed logging
- Support Python, JavaScript (use different analyzers), Java
- Cache results if same file analyzed multiple times
- Add docstrings to all methods
- Include error handling for all analysis steps
- Return structured, consistent results

EDGE CASES TO HANDLE:
- Empty files
- Syntax errors
- Very large files (>10,000 lines)
- Files with no functions/classes
- Unsupported languages

OUTPUT:
Complete code_analyzer.py with all methods implemented and tested.
```

---

# MODULE 6: AI ENGINE - AI CODE DETECTOR

## PROMPT 6.1: Create AI-Generated Code Detector

```
I need you to create a sophisticated AI-generated code detector using multiple strategies.

CREATE: **backend/app/ai_engine/ai_code_detector.py**

IMPLEMENTATION:

```python
class AICodeDetector:
    """
    Detects if code was generated by AI tools (ChatGPT, GitHub Copilot, etc.)
    Uses 4 detection strategies: ML model, pattern analysis, style consistency, complexity variance
    """
    
    def __init__(self):
        # Try to load RoBERTa detector model
        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            self.tokenizer = AutoTokenizer.from_pretrained("roberta-base")
            self.model = AutoModelForSequenceClassification.from_pretrained(
                "roberta-base-openai-detector"
            )
            self.model.eval()
        except:
            print("Warning: AI detection model not available, using heuristics only")
            self.model = None
        
        self.weights = {
            'ml_model': 0.4,
            'pattern_analysis': 0.3,
            'style_consistency': 0.2,
            'complexity_analysis': 0.1
        }
        
        self.threshold = 0.75  # 75% probability = flagged as AI
    
    def analyze(self, code: str, file_path: str = None) -> dict:
        """
        Comprehensive AI-generated code detection
        
        Returns:
            {
                'ai_generated_probability': float (0-1),
                'verdict': str ('LIKELY_AI_GENERATED', 'POSSIBLY_AI_ASSISTED', 
                               'UNCERTAIN', 'POSSIBLY_HUMAN', 'LIKELY_HUMAN'),
                'confidence': float (0-1),
                'detection_details': {
                    'ml_detection': float,
                    'pattern_score': float,
                    'style_score': float,
                    'complexity_score': float
                },
                'flags': List[str]  # Specific red flags found
            }
        """
    
    def _ml_detection(self, code: str) -> float:
        """
        Use transformer model to detect AI-generated code
        
        Process:
        1. Tokenize code (max 512 tokens)
        2. Run model inference
        3. Get probability of AI-generated class
        4. Return probability (0-1)
        5. If model not available, return 0.5 (neutral)
        """
    
    def _pattern_analysis(self, code: str) -> float:
        """
        Analyze code for AI-typical patterns
        
        Check for:
        1. Perfect comment formatting (# This function does...)
        2. Overly verbose function names (calculate_and_return_sum_of_two_numbers)
        3. Comprehensive docstrings on ALL functions
        4. Perfect PEP8 formatting (AI never makes mistakes)
        
        Returns:
            Pattern score (0-1, higher = more AI-like)
        """
    
    def _style_consistency_check(self, code: str) -> float:
        """
        Check if style is TOO consistent (AI indicator)
        
        Analyze:
        1. Quote style consistency (all single or all double)
        2. Spacing consistency around operators
        3. Naming convention uniformity (100% snake_case)
        4. Comment style uniformity
        
        Key insight: Humans have SOME inconsistency (5-15%)
        If consistency > 95%, it's suspicious
        
        Returns:
            Style consistency score (0-1, higher = more AI-like)
        """
    
    def _complexity_analysis(self, code: str) -> float:
        """
        Detect uniform complexity (AI indicator)
        
        Process:
        1. Split code into functions
        2. Calculate cyclomatic complexity for each
        3. Calculate variance in complexity
        4. Low variance = suspicious (AI generates uniform complexity)
        5. High variance = human (natural variation)
        
        Returns:
            Complexity uniformity score (0-1, higher = more AI-like)
        """
    
    def _get_verdict(self, probability: float) -> str:
        """
        Convert probability to human-readable verdict
        
        Thresholds:
        >= 0.80: LIKELY_AI_GENERATED
        >= 0.60: POSSIBLY_AI_ASSISTED
        >= 0.40: UNCERTAIN
        >= 0.20: POSSIBLY_HUMAN
        <  0.20: LIKELY_HUMAN
        """
    
    def _calculate_confidence(self, results: dict) -> float:
        """
        Calculate confidence based on agreement between methods
        
        Low variance in results = high agreement = high confidence
        """
    
    def _get_specific_flags(self, code: str, results: dict) -> List[str]:
        """
        Identify specific red flags
        
        Examples:
        - "Suspiciously perfect code formatting"
        - "AI-typical comment patterns detected"
        - "Uniform complexity across functions"
        - "Overly verbose variable names"
        """
```

HELPER METHODS TO IMPLEMENT:
```python
def _check_perfect_comments(self, code: str) -> bool:
    """Check for AI-style perfect comments"""

def _check_verbose_names(self, code: str) -> bool:
    """Check for overly descriptive names"""

def _check_quote_consistency(self, code: str) -> float:
    """Calculate quote style consistency (0-1)"""

def _check_spacing_consistency(self, code: str) -> float:
    """Calculate spacing consistency (0-1)"""
```

REQUIREMENTS:
- Use numpy for statistical analysis
- Import torch, transformers (with try/except for optional)
- Add comprehensive error handling
- Support CPU-only inference
- Cache model in memory (singleton pattern)
- Add detailed logging
- Include all imports and type hints

OUTPUT:
Complete ai_code_detector.py ready for integration.
```

---

# MODULE 7: AI ENGINE - DOCUMENT EVALUATOR

## PROMPT 7.1: Create Documentation Evaluator

```
I need you to create a documentation evaluator using NLP techniques.

CREATE: **backend/app/ai_engine/doc_evaluator.py**

IMPLEMENTATION:

```python
class DocumentationEvaluator:
    """
    Evaluates documentation quality using NLP
    Checks completeness, clarity, and structure
    """
    
    def __init__(self):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        self.required_sections = [
            'introduction', 'overview', 'installation',
            'usage', 'features', 'requirements', 'examples'
        ]
    
    def evaluate(self, doc_file_path: str) -> dict:
        """
        Evaluate documentation quality
        
        Returns:
            {
                'final_score': float (0-100),
                'completeness': float (0-100),
                'clarity': float (0-100),
                'structure': float (0-100),
                'word_count': int,
                'missing_sections': List[str],
                'readability_grade': str
            }
        """
    
    def _check_completeness(self, content: str) -> float:
        """
        Check if documentation contains required sections
        
        Process:
        1. Convert content to lowercase
        2. Check each required section keyword
        3. Count found sections
        4. Calculate: (found / total) * 100
        
        Returns:
            Completeness score (0-100)
        """
    
    def _assess_clarity(self, content: str) -> float:
        """
        Assess readability and clarity
        
        Metrics:
        1. Average sentence length (15-20 words = optimal)
        2. Paragraph length
        3. Use of jargon without explanation
        4. Sentence complexity
        
        Scoring:
        - Optimal sentence length (15-20): 100
        - Too short (<10): 60
        - Too long (>30): 50
        
        Returns:
            Clarity score (0-100)
        """
    
    def _evaluate_structure(self, content: str) -> float:
        """
        Evaluate document structure
        
        Check for:
        1. Headings (# or ## or **)
        2. Code blocks (``` or indentation)
        3. Lists (bullet points or numbered)
        4. Sections organization
        
        Score = (elements_found / 3) * 100
        
        Returns:
            Structure score (0-100)
        """
    
    def _find_missing_sections(self, content: str) -> List[str]:
        """
        Identify which required sections are missing
        
        Returns:
            List of missing section names
        """
    
    def _calculate_readability_grade(self, content: str) -> str:
        """
        Calculate readability level
        
        Use Flesch Reading Ease or similar metric
        
        Returns:
            Grade level (e.g., "College", "High School", "Elementary")
        """
```

ADDITIONAL METHODS:
```python
def _count_code_examples(self, content: str) -> int:
    """Count number of code examples in documentation"""

def _check_for_images_diagrams(self, content: str) -> bool:
    """Check if documentation includes visual aids"""

def _extract_table_of_contents(self, content: str) -> List[str]:
    """Extract all section headers"""
```

REQUIREMENTS:
- Support PDF, Markdown, Plain text, DOCX
- Use pypdf or pdfplumber for PDF parsing
- Use python-docx for DOCX parsing
- Add encoding handling for text files
- Calculate various readability metrics
- Provide specific improvement suggestions
- Handle empty or malformed documents

OUTPUT:
Complete doc_evaluator.py with all NLP analysis methods.
```

---

# MODULE 8: AI ENGINE - REPORT-CODE ALIGNER

## PROMPT 8.1: Create Report-Code Alignment Verifier

```
I need you to create a sophisticated report-code alignment verifier that uses NLP and code parsing.

CREATE: **backend/app/ai_engine/report_code_aligner.py**

IMPLEMENTATION:

```python
class ReportCodeAligner:
    """
    Analyzes alignment between project documentation and actual code
    Uses NLP for report analysis and AST for code parsing
    """
    
    def __init__(self):
        from sentence_transformers import SentenceTransformer
        import spacy
        
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except:
            print("Warning: spaCy model not found. Using fallback.")
            self.nlp = None
    
    def analyze_alignment(
        self, 
        report_text: str, 
        code_content: str,
        file_paths: List[str] = None
    ) -> dict:
        """
        Comprehensive alignment analysis
        
        Returns:
            {
                'overall_alignment_score': float (0-100),
                'alignment_level': str ('EXCELLENT', 'GOOD', 'MODERATE', 'POOR'),
                'detailed_results': {
                    'feature_alignment': {...},
                    'technology_alignment': {...},
                    'architecture_alignment': {...},
                    'semantic_similarity': {...},
                    'completeness': {...}
                },
                'mismatches': List[str],
                'missing_features': List[str],
                'undocumented_features': List[str]
            }
        """
    
    def _extract_report_features(self, report_text: str) -> dict:
        """
        Extract features mentioned in report using NLP
        
        Use spaCy to extract:
        1. Mentioned features/functionalities
        2. Function names (if mentioned)
        3. Technologies/libraries mentioned
        4. Algorithms described
        5. Key components
        
        Returns:
            {
                'mentioned_features': List[str],
                'mentioned_functions': List[str],
                'mentioned_technologies': List[str],
                'mentioned_algorithms': List[str],
                'key_components': List[str]
            }
        """
    
    def _extract_code_features(self, code_content: str, file_paths: List[str] = None) -> dict:
        """
        Extract actual features from code using AST
        
        Parse Python code to extract:
        1. All function definitions
        2. All class definitions
        3. Import statements (identifies technologies used)
        4. File structure
        
        Returns:
            {
                'functions': List[{
                    'name': str,
                    'args': List[str],
                    'docstring': str
                }],
                'classes': List[{
                    'name': str,
                    'methods': List[str],
                    'docstring': str
                }],
                'imports': List[str],
                'technologies': List[str],
                'file_structure': List[str]
            }
        """
    
    def _check_feature_alignment(self, report_features: dict, code_features: dict) -> dict:
        """
        Check if mentioned features exist in code
        
        Process:
        1. Compare mentioned function names with actual functions
        2. Use fuzzy matching for similar names
        3. Calculate match rate
        
        Returns:
            {
                'score': float (0-1),
                'matched_features': List[str],
                'unmatched_features': List[str],
                'match_rate': str
            }
        """
    
    def _check_technology_stack(self, report_text: str, code_content: str) -> dict:
        """
        Verify mentioned technologies are actually used
        
        Process:
        1. Extract tech mentions from report (regex patterns)
        2. Extract imports from code
        3. Cross-reference
        
        Returns:
            {
                'score': float (0-1),
                'mentioned_technologies': List[str],
                'verified_technologies': List[str],
                'unverified_technologies': List[str]
            }
        """
    
    def _check_architecture_match(self, report_text: str, code_features: dict) -> dict:
        """
        Check if described architecture matches implementation
        
        Check for:
        1. MVC/MVT pattern if mentioned
        2. API architecture if mentioned
        3. Database layer if mentioned
        
        Returns:
            {
                'score': float (0-1),
                'findings': List[str]
            }
        """
    
    def _calculate_semantic_similarity(self, report_text: str, code_content: str) -> dict:
        """
        Calculate semantic similarity between report and code comments/docstrings
        
        Process:
        1. Extract comments and docstrings from code
        2. Generate embeddings for report text
        3. Generate embeddings for code text
        4. Calculate cosine similarity
        
        Returns:
            {
                'score': float (0-1),
                'similarity_percentage': float,
                'interpretation': str
            }
        """
    
    def _check_documentation_completeness(self, report_features: dict, code_features: dict) -> dict:
        """
        Check if all major code components are documented
        
        Returns:
            {
                'score': float (0-1),
                'documented_components': int,
                'total_components': int,
                'coverage_percentage': float
            }
        """
```

HELPER METHODS:
```python
def _identify_mismatches(self, report_features: dict, code_features: dict) -> List[str]:
    """Find specific mismatches"""

def _find_missing_features(self, report_features: dict, code_features: dict) -> List[str]:
    """Find features in report but not in code"""

def _find_undocumented_features(self, report_features: dict, code_features: dict) -> List[str]:
    """Find features in code but not in report"""
```

REQUIREMENTS:
- Use AST for Python code parsing
- Use regex for technology detection
- Use spaCy for entity extraction
- Use sentence-transformers for embeddings
- Handle multiple file paths
- Support different programming languages
- Provide detailed mismatch descriptions

OUTPUT:
Complete report_code_aligner.py with all analysis methods.
```

---

# MODULE 9: AI ENGINE - PLAGIARISM DETECTOR

## PROMPT 9.1: Create Plagiarism Detector

```
I need you to create a semantic plagiarism detector using embeddings.

CREATE: **backend/app/ai_engine/plagiarism_detector.py**

IMPLEMENTATION:

```python
class PlagiarismDetector:
    """
    Detects code plagiarism using semantic similarity
    Not just string matching - understands code meaning
    """
    
    def __init__(self):
        from sentence_transformers import SentenceTransformer, util
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.threshold = 0.75  # 75% similarity = flagged
    
    def detect(self, current_code: str, existing_projects: List[dict]) -> dict:
        """
        Compare current code with existing projects
        
        Args:
            current_code: Code to check
            existing_projects: List of dicts with keys:
                - 'id': project ID
                - 'code': code content
                - 'student_name': student name (optional)
        
        Returns:
            {
                'originality_score': float (0-100),
                'flagged': bool,
                'max_similarity_percent': float,
                'similar_projects': List[{
                    'project_id': int,
                    'student_name': str,
                    'similarity': float
                }],
                'risk_level': str ('HIGH', 'MEDIUM', 'LOW', 'MINIMAL')
            }
        """
    
    def detect_with_database(self, current_code: str, db: Session, current_project_id: int) -> dict:
        """
        Detect plagiarism by fetching existing projects from database
        
        Process:
        1. Query all projects except current one
        2. Read code files
        3. Run similarity detection
        4. Return results
        """
    
    def _get_risk_level(self, similarity: float) -> str:
        """
        Determine risk level based on similarity
        
        Thresholds:
        >= 0.90: HIGH (very likely plagiarism)
        >= 0.75: MEDIUM (suspicious, needs review)
        >= 0.60: LOW (some similarity, could be common patterns)
        <  0.60: MINIMAL (acceptable similarity)
        """
    
    def generate_detailed_report(self, results: dict) -> str:
        """
        Generate human-readable plagiarism report
        
        Include:
        - Originality score
        - Risk level
        - Similar projects found
        - Recommendations
        """
```

HELPER METHODS:
```python
def _normalize_code(self, code: str) -> str:
    """
    Normalize code before comparison
    - Remove comments
    - Remove extra whitespace
    - Lowercase all text (optional)
    """

def _chunk_code(self, code: str, chunk_size: int = 500) -> List[str]:
    """
    Split large code into chunks for more granular comparison
    """
```

OPTIMIZATION:
```python
# Cache embeddings for existing projects
# Don't regenerate every time

class PlagiarismDetectorWithCache(PlagiarismDetector):
    def __init__(self):
        super().__init__()
        self.embedding_cache = {}  # project_id -> embedding
    
    def _get_or_generate_embedding(self, project_id: int, code: str):
        """Get from cache or generate new embedding"""
```

REQUIREMENTS:
- Use sentence-transformers for embeddings
- Calculate cosine similarity using util.cos_sim
- Handle large codebases (>10,000 lines)
- Provide percentage scores
- Support batch processing
- Add caching for performance
- Handle encoding errors

OUTPUT:
Complete plagiarism_detector.py with caching support.
```

---

# MODULE 10: AI ENGINE - FEEDBACK GENERATOR

## PROMPT 10.1: Create Enhanced Feedback Generator

```
I need you to create an AI feedback generator using GPT-4 with fallback.

CREATE: **backend/app/ai_engine/feedback_generator.py**

IMPLEMENTATION:

```python
class EnhancedFeedbackGenerator:
    """
    Generates comprehensive feedback using GPT-4
    Includes fallback for when API is unavailable
    """
    
    def __init__(self):
        from openai import OpenAI
        import os
        
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = "gpt-4-turbo-preview"  # Or gpt-3.5-turbo for lower cost
    
    def generate_comprehensive_feedback(self, analysis_results: dict) -> dict:
        """
        Generate feedback based on all analysis components
        
        Args:
            analysis_results: Complete results from all analyzers
                - code_quality: {...}
                - alignment: {...}
                - ai_detection: {...}
                - plagiarism: {...}
        
        Returns:
            {
                'structured_feedback': {
                    'overall_assessment': str,
                    'code_quality_feedback': str,
                    'documentation_feedback': str,
                    'originality_feedback': str,
                    'improvement_suggestions': List[str],
                    'strengths': List[str],
                    'action_items': List[dict]
                },
                'narrative_feedback': str,
                'priority_items': List[str],
                'estimated_improvement_time': str
            }
        """
    
    def _generate_overall_assessment(self, results: dict) -> str:
        """
        Generate overall assessment using GPT-4
        
        Prompt template:
        '''
        Based on the following project analysis, provide a 2-3 sentence overall assessment:
        
        Final Score: {score}/100
        Code Quality: {code_score}/100
        Report Alignment: {alignment}%
        AI Detection: {verdict}
        Originality: {originality}%
        
        Provide an encouraging yet honest assessment.
        '''
        """
    
    def _generate_code_feedback(self, code_quality: dict) -> str:
        """Generate code quality specific feedback"""
    
    def _generate_doc_feedback(self, alignment: dict) -> str:
        """Generate documentation feedback"""
    
    def _generate_originality_feedback(self, ai_detection: dict, plagiarism: dict) -> str:
        """
        Generate feedback on originality and authenticity
        
        Handle cases:
        1. AI-generated code detected
        2. Plagiarism flagged
        3. Both issues
        4. All clear
        """
    
    def _generate_improvements(self, results: dict) -> List[str]:
        """
        Generate specific, actionable improvement suggestions
        
        Examples:
        - "Improve code structure: Break down complex functions..."
        - "Better align documentation: Document all major functions..."
        - "Add more personal coding style: Include edge cases..."
        """
    
    def _identify_strengths(self, results: dict) -> List[str]:
        """
        Identify project strengths
        
        Examples:
        - "Well-structured, maintainable code"
        - "Highly original implementation"
        - "Excellent documentation"
        """
    
    def _create_action_items(self, results: dict) -> List[dict]:
        """
        Create prioritized action items
        
        Returns:
            [{
                'priority': 'HIGH' | 'MEDIUM' | 'LOW',
                'action': str,
                'estimated_time': str
            }]
        """
    
    def _generate_narrative_feedback(self, results: dict, sections: dict) -> str:
        """
        Generate comprehensive narrative using GPT-4
        
        Prompt:
        '''
        Generate comprehensive, encouraging feedback for a student project:
        
        SCORES: {all scores}
        KEY FINDINGS: {findings}
        
        Provide:
        1. Warm opening acknowledging effort
        2. Specific strengths (2-3 points)
        3. Constructive areas for improvement (2-3 specific points)
        4. Encouraging conclusion with next steps
        
        Keep professional, specific, and motivating. ~300 words.
        '''
        
        If GPT-4 fails, use fallback template
        """
    
    def _fallback_narrative_feedback(self, results: dict, sections: dict) -> str:
        """
        Generate template-based feedback if GPT-4 unavailable
        
        Use structured template with scores and findings
        """
    
    def _get_priority_items(self, results: dict) -> List[str]:
        """Get top 3 priority improvements"""
    
    def _estimate_improvement_time(self, results: dict) -> str:
        """
        Estimate time needed for improvements
        
        Returns: "5 hours or less", "5-10 hours", "10+ hours"
        """
```

PROMPT ENGINEERING:
```python
FEEDBACK_PROMPT_TEMPLATE = """
You are an experienced computer science professor providing detailed feedback on a student project.

PROJECT METRICS:
- Overall Score: {final_score}/100
- Code Quality: {code_score}/100 (Complexity: {complexity}, Maintainability: {maintainability})
- Documentation: {doc_score}/100 (Completeness: {completeness}%, Clarity: {clarity})
- Report-Code Alignment: {alignment_score}%
- Originality: {originality_score}/100
- AI Detection: {ai_verdict} ({ai_probability}% AI-generated probability)

SPECIFIC FINDINGS:
{findings}

Please provide comprehensive feedback with:

1. OVERALL ASSESSMENT (2-3 sentences)
   - Acknowledge the student's effort
   - Summarize the project's quality level
   - Set a constructive tone

2. STRENGTHS (2-3 specific points)
   - What did the student do well?
   - Be specific with examples

3. AREAS FOR IMPROVEMENT (2-3 specific points)
   - What needs work?
   - Provide actionable suggestions
   - Include specific examples

4. ACTIONABLE RECOMMENDATIONS (2-3 items)
   - Concrete steps to improve
   - Prioritize the most important changes

Keep the tone:
- Professional yet warm
- Honest but encouraging
- Specific and actionable
- Supportive of learning

Word count: ~250-300 words
"""
```

REQUIREMENTS:
- Use OpenAI API with error handling
- Implement exponential backoff for rate limits
- Add fallback templates
- Cache similar feedback to reduce API costs
- Log all API calls
- Handle token limits
- Support multiple LLM providers (OpenAI, Anthropic)

OUTPUT:
Complete feedback_generator.py with GPT-4 integration and fallbacks.
```

---

# MODULE 11: AI ENGINE - COMPREHENSIVE SCORER

## PROMPT 11.1: Create Comprehensive Scoring System

```
I need you to create the comprehensive scoring system that combines all analysis components.

CREATE: **backend/app/ai_engine/comprehensive_scorer.py**

IMPLEMENTATION:

```python
class ComprehensiveScorer:
    """
    Calculates overall project score with weighted components,
    penalties, and bonuses
    """
    
    def __init__(self):
        # Component weights (must sum to 1.0)
        self.weights = {
            'code_quality': 0.25,
            'documentation_quality': 0.15,
            'report_alignment': 0.15,
            'originality': 0.20,
            'ai_authenticity': 0.15,
            'functionality': 0.10
        }
        
        # Letter grade scale
        self.grade_scale = {
            'A+': (97, 100),
            'A': (93, 96),
            'A-': (90, 92),
            'B+': (87, 89),
            'B': (83, 86),
            'B-': (80, 82),
            'C+': (77, 79),
            'C': (73, 76),
            'C-': (70, 72),
            'D+': (67, 69),
            'D': (63, 66),
            'D-': (60, 62),
            'F': (0, 59)
        }
    
    def calculate_overall_score(self, analysis_results: dict) -> dict:
        """
        Calculate comprehensive score with detailed breakdown
        
        Args:
            analysis_results: {
                'code_quality': {'final_score': float},
                'documentation': {'final_score': float},
                'report_alignment': {'overall_alignment_score': float},
                'plagiarism': {'originality_score': float},
                'ai_detection': {...},
                'functionality': {'score': float} (optional)
            }
        
        Returns:
            {
                'final_score': float,
                'letter_grade': str,
                'component_scores': dict,
                'weighted_contributions': dict,
                'penalties': List[dict],
                'bonuses': List[dict],
                'score_interpretation': str,
                'percentile': str
            }
        """
    
    def _calculate_authenticity_score(self, ai_detection: dict) -> float:
        """
        Convert AI detection to authenticity score
        
        authenticity = (1 - ai_probability) * 100
        
        If 90% AI-generated → 10% authentic
        If 10% AI-generated → 90% authentic
        """
    
    def _apply_penalties(self, score: float, results: dict) -> tuple[float, List[dict]]:
        """
        Apply penalties for serious issues
        
        Penalties:
        1. Plagiarism flagged: -20 points
        2. AI-generated (LIKELY): -15 points
        3. AI-assisted (POSSIBLE): -5 points
        4. Poor alignment (<40%): -10 points
        5. Missing documented features: -2 points each (max -15)
        
        Returns:
            (penalized_score, penalties_list)
        """
    
    def _apply_bonuses(self, score: float, results: dict) -> tuple[float, List[dict]]:
        """
        Apply bonuses for exceptional work
        
        Bonuses:
        1. Exceptional code quality (≥95): +3 points
        2. Perfect alignment (≥95%): +2 points
        3. High originality (≥95%): +2 points
        4. Comprehensive docs (≥90%): +2 points
        
        Max total bonus: +5 points
        
        Returns:
            (bonus_score, bonuses_list)
        """
    
    def _get_letter_grade(self, score: float) -> str:
        """
        Convert numerical score to letter grade
        
        Uses grade_scale dictionary
        """
    
    def _interpret_score(self, score: float) -> str:
        """
        Provide interpretation of the score
        
        ≥93: "Outstanding work demonstrating mastery"
        ≥85: "Excellent work with minor areas for improvement"
        ≥75: "Good work meeting most requirements"
        ≥65: "Satisfactory work with significant room for improvement"
        ≥55: "Below expectations, needs substantial revision"
        <55: "Does not meet minimum standards"
        """
    
    def _calculate_percentile(self, score: float) -> str:
        """
        Estimate percentile ranking
        
        In production, this would query historical data
        For now, use simplified assumptions:
        ≥95: "Top 5%"
        ≥90: "Top 10%"
        ≥85: "Top 20%"
        ≥80: "Top 30%"
        ≥75: "Top 50%"
        <75: "Below average"
        """
```

INTEGRATION CLASS:
```python
class EnhancedProjectEvaluator:
    """
    Main evaluator integrating all AI components
    """
    
    def __init__(self):
        from app.ai_engine.code_analyzer import CodeAnalyzer
        from app.ai_engine.doc_evaluator import DocumentationEvaluator
        from app.ai_engine.ai_code_detector import AICodeDetector
        from app.ai_engine.report_code_aligner import ReportCodeAligner
        from app.ai_engine.plagiarism_detector import PlagiarismDetector
        from app.ai_engine.feedback_generator import EnhancedFeedbackGenerator
        
        self.code_analyzer = CodeAnalyzer()
        self.doc_evaluator = DocumentationEvaluator()
        self.ai_detector = AICodeDetector()
        self.aligner = ReportCodeAligner()
        self.plagiarism_detector = PlagiarismDetector()
        self.feedback_generator = EnhancedFeedbackGenerator()
        self.scorer = ComprehensiveScorer()
    
    def evaluate_project(self, project_data: dict) -> dict:
        """
        Complete evaluation pipeline
        
        Args:
            project_data: {
                'id': int,
                'title': str,
                'code_file_path': str,
                'doc_file_path': str,
                'existing_projects': List[dict]
            }
        
        Returns:
            Complete evaluation results with all scores and feedback
        """
        # Read files
        # Run all analyses
        # Calculate scores
        # Generate feedback
        # Return results
```

REQUIREMENTS:
- Clear documentation of scoring formula
- Configurable weights (can be adjusted by admin)
- Transparent penalty/bonus calculations
- Historical percentile tracking (future enhancement)
- Audit trail of score changes

OUTPUT:
Complete comprehensive_scorer.py with integration class.
```

---

# MODULE 12: CELERY TASKS FOR ASYNC EVALUATION

## PROMPT 12.1: Create Celery Task System

```
I need you to create the Celery task system for asynchronous project evaluation.

CREATE: **backend/app/tasks/evaluation_tasks.py**

IMPLEMENTATION:

```python
from celery import Celery
from app.ai_engine.comprehensive_scorer import EnhancedProjectEvaluator
from app.database.connection import SessionLocal
from app.models.project import Project
from app.models.evaluation import Evaluation
import logging

# Initialize Celery
celery_app = Celery(
    'tasks',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3)
def evaluate_project_async(self, project_id: int):
    """
    Asynchronous project evaluation task
    
    Process:
    1. Fetch project from database
    2. Update status to 'processing'
    3. Initialize evaluator
    4. Run all AI analyses
    5. Calculate final score
    6. Generate feedback
    7. Save results to database
    8. Update status to 'evaluated'
    9. Send notification to faculty
    
    Args:
        project_id: Project ID to evaluate
    
    Returns:
        {'status': 'success', 'project_id': int, 'final_score': float}
    """
    db = SessionLocal()
    
    try:
        logger.info(f"Starting evaluation for project {project_id}")
        
        # 1. Fetch project
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise Exception(f"Project {project_id} not found")
        
        # 2. Update status
        project.status = "processing"
        db.commit()
        
        # 3. Initialize evaluator
        evaluator = EnhancedProjectEvaluator()
        
        # 4. Prepare project data
        project_data = {
            'id': project.id,
            'title': project.title,
            'code_file_path': project.code_file_path,
            'doc_file_path': project.doc_file_path,
            'existing_projects': _get_existing_projects(db, project.id)
        }
        
        # 5. Run evaluation
        results = evaluator.evaluate_project(project_data)
        
        # 6. Save results
        evaluation = Evaluation(
            project_id=project_id,
            code_quality_score=results['code_results']['final_score'],
            documentation_score=results['doc_results']['final_score'],
            originality_score=results['plagiarism_results']['originality_score'],
            final_score=results['scoring']['final_score'],
            letter_grade=results['scoring']['letter_grade'],
            ai_feedback=results['feedback']['narrative_feedback'],
            ai_detection_results=results['ai_detection'],
            alignment_results=results['report_alignment'],
            plagiarism_results=results['plagiarism_results']
        )
        
        db.add(evaluation)
        project.status = "evaluated"
        db.commit()
        
        logger.info(f"Evaluation complete for project {project_id}: {results['scoring']['final_score']}")
        
        # 7. Send notification
        _send_evaluation_notification(project, results)
        
        return {
            'status': 'success',
            'project_id': project_id,
            'final_score': results['scoring']['final_score']
        }
        
    except Exception as e:
        logger.error(f"Evaluation failed for project {project_id}: {str(e)}")
        
        # Update project status to error
        if project:
            project.status = "error"
            db.commit()
        
        # Retry task
        raise self.retry(exc=e, countdown=60)  # Retry after 60 seconds
        
    finally:
        db.close()

def _get_existing_projects(db: Session, current_project_id: int) -> List[dict]:
    """
    Fetch existing projects for plagiarism detection
    
    Returns:
        List[{
            'id': int,
            'code': str,
            'student_name': str
        }]
    """
    projects = db.query(Project).filter(
        Project.id != current_project_id,
        Project.status == "evaluated"
    ).all()
    
    result = []
    for project in projects:
        try:
            with open(project.code_file_path, 'r') as f:
                code = f.read()
            result.append({
                'id': project.id,
                'code': code,
                'student_name': project.student.full_name
            })
        except:
            continue
    
    return result

def _send_evaluation_notification(project: Project, results: dict):
    """
    Send email notification to faculty
    
    Include:
    - Project title
    - Student name
    - Final score
    - Link to review
    """
    # Implementation using email service
    pass

@celery_app.task
def cleanup_old_files(days: int = 90):
    """
    Periodic task to clean up old project files
    
    Args:
        days: Delete files older than this many days
    """
    # Implementation
    pass
```

CELERY CONFIGURATION:
```python
# backend/app/tasks/__init__.py
from .evaluation_tasks import celery_app, evaluate_project_async

__all__ = ['celery_app', 'evaluate_project_async']
```

REQUIREMENTS:
- Use Redis as broker
- Implement retry logic (max 3 retries)
- Add comprehensive logging
- Handle database sessions properly
- Update project status throughout
- Send notifications on completion
- Implement periodic cleanup tasks
- Add task monitoring

OUTPUT:
Complete evaluation_tasks.py with Celery integration.
```

---

# MODULE 13: EVALUATION ENDPOINTS

## PROMPT 13.1: Create Evaluation API Endpoints

```
I need you to create complete evaluation API endpoints for faculty review.

CREATE: **backend/app/api/evaluations.py**

ENDPOINTS NEEDED:

1. **GET /api/evaluations/{evaluation_id}**
   ```python
   Requirements:
   - Require authentication
   - Check user is student (own project) OR faculty/admin
   - Fetch evaluation with all details
   - Include project info and student info
   - Return complete evaluation response
   - Return 404 if not found
   - Return 403 if unauthorized
   ```

2. **GET /api/evaluations/pending (Faculty only)**
   ```python
   Requirements:
   - Require faculty or admin role
   - Query evaluations where is_finalized = False
   - Include project and student details
   - Order by evaluated_at DESC
   - Support pagination
   - Return List[EvaluationResponse]
   ```

3. **PUT /api/evaluations/{evaluation_id}/finalize (Faculty only)**
   ```python
   Requirements:
   - Require faculty or admin role
   - Accept EvaluationFinalize schema:
     * faculty_comments: Optional[str]
     * modified_score: Optional[float]
     * is_finalized: bool = True
   - Update evaluation
   - Set finalized_by = current_user.id
   - Set finalized_at = now()
   - Update project status = "published"
   - Send notification to student
   - Return updated evaluation
   ```

4. **POST /api/evaluations/{evaluation_id}/reprocess (Admin only)**
   ```python
   Requirements:
   - Require admin role
   - Reset evaluation
   - Trigger new async evaluation task
   - Return task ID and status
   ```

5. **GET /api/evaluations/statistics (Admin only)**
   ```python
   Requirements:
   - Require admin role
   - Calculate statistics:
     * Average score by component
     * Distribution of letter grades
     * AI detection statistics
     * Plagiarism detection statistics
   - Support date range filtering
   - Return comprehensive statistics
   ```

IMPLEMENTATION:
```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.utils.dependencies import get_current_user, require_role
from app.models import Evaluation, Project, User
from app.schemas.evaluation import (
    EvaluationResponse,
    EvaluationFinalize,
    EvaluationStatistics
)

router = APIRouter()

@router.get("/{evaluation_id}", response_model=EvaluationResponse)
async def get_evaluation(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    \"\"\"Get evaluation details\"\"\"
    # Implementation
    pass

@router.get("/pending", response_model=List[EvaluationResponse])
async def get_pending_evaluations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_role("faculty", "admin")),
    db: Session = Depends(get_db)
):
    \"\"\"Get pending evaluations for faculty review\"\"\"
    # Implementation
    pass

@router.put("/{evaluation_id}/finalize", response_model=EvaluationResponse)
async def finalize_evaluation(
    evaluation_id: int,
    finalize_data: EvaluationFinalize,
    current_user: User = Depends(require_role("faculty", "admin")),
    db: Session = Depends(get_db)
):
    \"\"\"Finalize evaluation and publish results\"\"\"
    # Implementation
    pass

# Additional endpoints...
```

REQUIREMENTS:
- Proper error handling
- Authorization checks
- Transaction management
- Notification triggers
- Response models
- API documentation
- Logging

OUTPUT:
Complete evaluations.py with all endpoints.
```

---

# MODULE 14: FRONTEND - AUTHENTICATION

## PROMPT 14.1: Create React Authentication System

```
I need you to create the complete React authentication system with context and components.

CREATE THE FOLLOWING FILES:

1. **frontend/src/context/AuthContext.jsx**
   ```javascript
   Requirements:
   - Create AuthContext using createContext
   - AuthProvider component with:
     * user state
     * loading state
     * login function (calls API, stores token, sets user)
     * logout function (removes token, clears user)
     * register function
   - useEffect to check token on mount
   - Export useAuth hook for easy access
   ```

2. **frontend/src/services/api.js**
   ```javascript
   Requirements:
   - Axios instance with baseURL
   - Request interceptor to add Authorization header
   - Response interceptor for error handling
   - Handle 401 (redirect to login)
   - Handle 403 (show permission denied)
   - Export configured axios instance
   ```

3. **frontend/src/services/authService.js**
   ```javascript
   Functions needed:
   - register(userData) -> POST /api/auth/register
   - login(username, password) -> POST /api/auth/login
   - logout() -> Clear localStorage
   - getCurrentUser() -> GET /api/auth/me
   - changePassword(oldPass, newPass) -> PUT /api/auth/change-password
   ```

4. **frontend/src/components/Auth/Login.jsx**
   ```javascript
   Component requirements:
   - Form with username and password fields
   - Submit button
   - Link to register
   - Loading state during submission
   - Error message display
   - Use React Hook Form for validation
   - Call authService.login on submit
   - Redirect to dashboard on success
   - Styled with Tailwind CSS
   ```

5. **frontend/src/components/Auth/Register.jsx**
   ```javascript
   Component requirements:
   - Form fields: email, username, full_name, password, confirm_password, role, department
   - Role dropdown (student/faculty)
   - Form validation (email format, password strength)
   - Submit button
   - Link to login
   - Loading and error states
   - Use React Hook Form + Yup validation
   - Call authService.register
   - Redirect to login on success
   - Tailwind styling
   ```

6. **frontend/src/components/Common/ProtectedRoute.jsx**
   ```javascript
   Component requirements:
   - Check if user is authenticated
   - Check if user has required role (if specified)
   - Redirect to login if not authenticated
   - Redirect to unauthorized if wrong role
   - Render children if authorized
   ```

EXAMPLE IMPLEMENTATION:
```javascript
// AuthContext.jsx structure
import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const response = await authService.login(username, password);
    localStorage.setItem('token', response.access_token);
    const userData = await authService.getCurrentUser();
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

REQUIREMENTS:
- Use React 18.2 hooks
- Implement proper error handling
- Add loading states
- Use Tailwind CSS for styling
- Add form validation
- Store JWT in localStorage
- Auto-logout on token expiry
- Redirect flows

OUTPUT:
Complete authentication system with all files.
```

---

# MODULE 15: FRONTEND - DASHBOARDS

## PROMPT 15.1: Create Role-Based Dashboards

```
I need you to create three role-based dashboards for student, faculty, and admin.

CREATE THE FOLLOWING:

1. **frontend/src/components/Dashboard/StudentDashboard.jsx**
   ```javascript
   Requirements:
   - Welcome message with student name
   - Statistics cards:
     * Total projects uploaded
     * Projects pending evaluation
     * Projects evaluated
     * Average score
   - Recent projects list (with status badges)
   - Upload new project button (prominent)
   - Quick actions section
   - Responsive grid layout with Tailwind
   
   API Calls:
   - GET /api/projects/my
   - Calculate statistics from projects
   
   Components:
   - StatCard (reusable for metrics)
   - ProjectListItem (project row)
   - StatusBadge (color-coded status)
   ```

2. **frontend/src/components/Dashboard/FacultyDashboard.jsx**
   ```javascript
   Requirements:
   - Welcome message
   - Statistics cards:
     * Total projects to review
     * Projects reviewed today
     * Average review time
     * Pending evaluations count
   - Pending evaluations table
   - Recent evaluations list
   - Search and filter options
   - Review button for each project
   
   API Calls:
   - GET /api/evaluations/pending
   - GET /api/evaluations (recent)
   
   Features:
   - Sort by date, score, student
   - Filter by status
   - Quick review modal
   ```

3. **frontend/src/components/Dashboard/AdminDashboard.jsx**
   ```javascript
   Requirements:
   - System statistics overview
   - Charts:
     * Score distribution (bar chart)
     * Projects over time (line chart)
     * AI detection statistics (pie chart)
   - User management section
   - System health indicators
   - Recent activity feed
   
   API Calls:
   - GET /api/evaluations/statistics
   - GET /api/users
   
   Libraries:
   - Recharts for visualizations
   ```

COMMON COMPONENTS TO CREATE:

4. **frontend/src/components/Dashboard/StatCard.jsx**
   ```javascript
   Props:
   - title: string
   - value: number | string
   - icon: ReactElement
   - trend: 'up' | 'down' | 'neutral' (optional)
   - trendValue: string (optional)
   
   Design:
   - Card with gradient background
   - Icon in colored circle
   - Large value display
   - Trend indicator with arrow
   - Tailwind styling
   ```

5. **frontend/src/components/Common/Navbar.jsx**
   ```javascript
   Requirements:
   - App logo/name
   - Navigation links (based on role)
   - User profile dropdown
   - Logout button
   - Notifications bell (future)
   - Responsive mobile menu
   - Active route highlighting
   ```

6. **frontend/src/components/Common/Sidebar.jsx**
   ```javascript
   Requirements:
   - Role-based navigation items
   - Icons for each menu item
   - Active route highlighting
   - Collapsible on mobile
   - Smooth transitions
   ```

EXAMPLE IMPLEMENTATION:
```javascript
// StudentDashboard.jsx structure
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import StatCard from './StatCard';
import { FolderIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const StudentDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getMyProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === 'processing').length,
    evaluated: projects.filter(p => p.status === 'evaluated').length,
    avgScore: calculateAverageScore(projects)
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
      
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Projects"
          value={stats.total}
          icon={<FolderIcon className="w-6 h-6" />}
        />
        {/* More stat cards */}
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
        {/* Projects list */}
      </div>
    </div>
  );
};
```

REQUIREMENTS:
- Use React Router for navigation
- Implement loading states
- Add error handling
- Use Recharts for charts
- Responsive design (mobile-first)
- Smooth animations
- Accessibility (ARIA labels)

OUTPUT:
Complete dashboard system with all components.
```

---

# MODULE 16: FRONTEND - PROJECT UPLOAD

## PROMPT 16.1: Create Project Upload Component

```
I need you to create a comprehensive project upload component with file validation and progress tracking.

CREATE: **frontend/src/components/Project/ProjectUpload.jsx**

REQUIREMENTS:

Component features:
1. Multi-step form:
   - Step 1: Project details (title, description, language)
   - Step 2: File uploads (code, documentation)
   - Step 3: Review and submit

2. File upload handling:
   - Drag and drop support (react-dropzone)
   - File type validation
   - File size validation
   - Preview uploaded files
   - Progress bar during upload
   - Ability to remove/replace files

3. Form validation:
   - Required fields
   - Title length (3-100 chars)
   - File size limits (50MB)
   - Allowed file types

4. User feedback:
   - Loading spinner during upload
   - Success message with project ID
   - Error messages for validation
   - Upload progress percentage

IMPLEMENTATION:

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { projectService } from '../../services/projectService';
import toast from 'react-hot-toast';

const schema = yup.object({
  title: yup.string().required('Title is required').min(3).max(100),
  description: yup.string(),
  programming_language: yup.string().required('Language is required')
});

const ProjectUpload = () => {
  const [step, setStep] = useState(1);
  const [codeFile, setCodeFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  // Code file dropzone
  const {
    getRootProps: getCodeRootProps,
    getInputProps: getCodeInputProps,
    isDragActive: isCodeDragActive
  } = useDropzone({
    accept: {
      'application/zip': ['.zip'],
      'text/x-python': ['.py'],
      'text/javascript': ['.js'],
      'text/x-java': ['.java']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: (acceptedFiles) => setCodeFile(acceptedFiles[0])
  });

  // Doc file dropzone
  const {
    getRootProps: getDocRootProps,
    getInputProps: getDocInputProps,
    isDragActive: isDocDragActive
  } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => setDocFile(acceptedFiles[0])
  });

  const onSubmit = async (data) => {
    if (!codeFile || !docFile) {
      toast.error('Please upload both code and documentation files');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('programming_language', data.programming_language);
    formData.append('code_file', codeFile);
    formData.append('doc_file', docFile);

    try {
      const response = await projectService.uploadProject(formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      toast.success('Project uploaded successfully!');
      navigate(`/projects/${response.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upload New Project</h1>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 ${s !== 3 ? 'mr-2' : ''}`}>
              <div className={`h-2 rounded-full ${
                step >= s ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span>Details</span>
          <span>Upload Files</span>
          <span>Review</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Project Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Title *</label>
              <input
                {...register('title')}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="My Awesome Project"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                {...register('description')}
                className="w-full px-3 py-2 border rounded-lg"
                rows="4"
                placeholder="Describe your project..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Programming Language *</label>
              <select
                {...register('programming_language')}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: File Upload */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Code file dropzone */}
            <div>
              <label className="block text-sm font-medium mb-2">Code Files *</label>
              <div
                {...getCodeRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                  isCodeDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <input {...getCodeInputProps()} />
                {codeFile ? (
                  <div>
                    <p className="text-green-600 font-medium">{codeFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(codeFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCodeFile(null);
                      }}
                      className="mt-2 text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p>Drag & drop code files here, or click to select</p>
                    <p className="text-sm text-gray-500 mt-1">
                      .py, .js, .java, .zip (max 50MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Doc file dropzone */}
            <div>
              <label className="block text-sm font-medium mb-2">Documentation *</label>
              <div
                {...getDocRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                  isDocDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <input {...getDocInputProps()} />
                {docFile ? (
                  <div>
                    <p className="text-green-600 font-medium">{docFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(docFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocFile(null);
                      }}
                      className="mt-2 text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p>Drag & drop documentation here, or click to select</p>
                    <p className="text-sm text-gray-500 mt-1">
                      .pdf, .md, .txt (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!codeFile || !docFile}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Review Your Submission</h3>
              {/* Display summary */}
            </div>

            {uploading && (
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-center mt-1">{uploadProgress}% uploaded</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={uploading}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {uploading ? 'Uploading...' : 'Submit Project'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProjectUpload;
```

SERVICE:
```javascript
// frontend/src/services/projectService.js
import api from './api';

export const projectService = {
  uploadProject: (formData, config = {}) => {
    return api.post('/projects/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config
    }).then(res => res.data);
  },
  
  getMyProjects: () => {
    return api.get('/projects/my').then(res => res.data);
  },
  
  getProject: (id) => {
    return api.get(`/projects/${id}`).then(res => res.data);
  },
  
  deleteProject: (id) => {
    return api.delete(`/projects/${id}`).then(res => res.data);
  }
};
```

REQUIREMENTS:
- Use react-dropzone for file handling
- Use react-hook-form for form management
- Add Yup validation
- Show upload progress
- Handle errors gracefully
- Responsive design
- Accessibility features

OUTPUT:
Complete project upload component with all features.
```

---

# MODULE 17: FRONTEND - EVALUATION RESULTS

## PROMPT 17.1: Create Evaluation Results Display

```
I need you to create a comprehensive evaluation results display component with charts and detailed feedback.

CREATE: **frontend/src/components/Evaluation/EvaluationResults.jsx**

REQUIREMENTS:

Component features:
1. Score summary section:
   - Final score (large, prominent)
   - Letter grade badge
   - Score interpretation
   - Percentile ranking

2. Score breakdown:
   - Radar chart showing all component scores
   - Bar chart for weighted contributions
   - Individual score cards for each component

3. Detailed analysis:
   - Code quality metrics (collapsible)
   - Documentation analysis (collapsible)
   - AI detection results (collapsible)
   - Plagiarism check results (collapsible)
   - Report-code alignment (collapsible)

4. AI Feedback:
   - Narrative feedback (formatted text)
   - Strengths (bulleted list with icons)
   - Improvements (numbered list with checkboxes)
   - Action items (priority badges)

5. Faculty review section (if finalized):
   - Faculty comments
   - Modified scores (if any)
   - Finalized date and by whom

IMPLEMENTATION:

```javascript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { evaluationService } from '../../services/evaluationService';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const EvaluationResults = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    fetchEvaluation();
  }, [id]);

  const fetchEvaluation = async () => {
    try {
      const data = await evaluationService.getEvaluation(id);
      setEvaluation(data);
    } catch (error) {
      console.error('Failed to fetch evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!evaluation) {
    return <div>Evaluation not found</div>;
  }

  // Prepare chart data
  const radarData = [
    { subject: 'Code Quality', score: evaluation.code_quality_score },
    { subject: 'Documentation', score: evaluation.documentation_score },
    { subject: 'Originality', score: evaluation.originality_score },
    { subject: 'Alignment', score: evaluation.alignment_score * 100 },
    { subject: 'Authenticity', score: evaluation.authenticity_score }
  ];

  const barData = [
    { name: 'Code', score: evaluation.code_quality_score, weight: 0.25 },
    { name: 'Docs', score: evaluation.documentation_score, weight: 0.15 },
    { name: 'Alignment', score: evaluation.alignment_score * 100, weight: 0.15 },
    { name: 'Originality', score: evaluation.originality_score, weight: 0.20 },
    { name: 'Authenticity', score: evaluation.authenticity_score, weight: 0.15 }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{evaluation.project.title}</h1>
        <p className="text-gray-600">Evaluation Results</p>
      </div>

      {/* Score Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg opacity-90 mb-2">Final Score</p>
            <p className="text-6xl font-bold">{evaluation.final_score}</p>
            <p className="text-xl mt-2">{evaluation.score_interpretation}</p>
          </div>
          <div className="text-right">
            <div className="bg-white text-blue-600 px-6 py-3 rounded-lg text-3xl font-bold mb-2">
              {evaluation.letter_grade}
            </div>
            <p className="text-sm opacity-90">{evaluation.percentile}</p>
          </div>
        </div>
      </div>

      {/* Score Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Radar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Score Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#2563eb"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Weighted Contributions</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Feedback */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">AI Feedback</h2>
        
        <div className="prose max-w-none mb-6">
          <p className="whitespace-pre-line">{evaluation.ai_feedback}</p>
        </div>

        {/* Strengths */}
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {evaluation.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {evaluation.improvements && evaluation.improvements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 mr-2" />
              Areas for Improvement
            </h3>
            <ol className="space-y-2 list-decimal list-inside">
              {evaluation.improvements.map((improvement, idx) => (
                <li key={idx}>{improvement}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Action Items */}
        {evaluation.action_items && evaluation.action_items.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Priority Action Items</h3>
            <div className="space-y-3">
              {evaluation.action_items.map((item, idx) => (
                <div key={idx} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <span className={`px-2 py-1 text-xs font-semibold rounded mr-3 ${
                    item.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.priority}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{item.action}</p>
                    <p className="text-sm text-gray-600">{item.estimated_time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Analysis Sections (Collapsible) */}
      <div className="space-y-4">
        {/* Code Quality */}
        <AnalysisSection
          title="Code Quality Analysis"
          score={evaluation.code_quality_score}
          expanded={expandedSections.codeQuality}
          onToggle={() => toggleSection('codeQuality')}
        >
          <div className="space-y-2">
            <MetricRow label="Complexity" value={evaluation.code_complexity} />
            <MetricRow label="Maintainability" value={evaluation.code_maintainability} />
            <MetricRow label="Quality" value={evaluation.code_quality} />
          </div>
        </AnalysisSection>

        {/* AI Detection */}
        <AnalysisSection
          title="AI-Generated Code Detection"
          verdict={evaluation.ai_detection_verdict}
          expanded={expandedSections.aiDetection}
          onToggle={() => toggleSection('aiDetection')}
        >
          <div className="space-y-2">
            <p>AI Probability: {evaluation.ai_probability}%</p>
            <p>Confidence: {evaluation.ai_confidence}%</p>
            {evaluation.ai_flags && evaluation.ai_flags.length > 0 && (
              <div>
                <p className="font-medium mt-2">Flags:</p>
                <ul className="list-disc list-inside">
                  {evaluation.ai_flags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AnalysisSection>

        {/* Plagiarism */}
        <AnalysisSection
          title="Plagiarism Check"
          score={evaluation.originality_score}
          expanded={expandedSections.plagiarism}
          onToggle={() => toggleSection('plagiarism')}
        >
          <div className="space-y-2">
            <p>Risk Level: {evaluation.plagiarism_risk_level}</p>
            {evaluation.similar_projects && evaluation.similar_projects.length > 0 && (
              <div>
                <p className="font-medium mt-2">Similar Projects:</p>
                <ul className="space-y-1">
                  {evaluation.similar_projects.map((proj, idx) => (
                    <li key={idx} className="text-sm">
                      Project #{proj.project_id}: {proj.similarity}% similar
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AnalysisSection>

        {/* Report-Code Alignment */}
        <AnalysisSection
          title="Report-Code Alignment"
          score={evaluation.alignment_score * 100}
          expanded={expandedSections.alignment}
          onToggle={() => toggleSection('alignment')}
        >
          <div className="space-y-2">
            <p>Alignment Level: {evaluation.alignment_level}</p>
            {evaluation.missing_features && evaluation.missing_features.length > 0 && (
              <div>
                <p className="font-medium text-red-600 mt-2">Missing Features:</p>
                <ul className="list-disc list-inside">
                  {evaluation.missing_features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AnalysisSection>
      </div>

      {/* Faculty Comments (if finalized) */}
      {evaluation.is_finalized && evaluation.faculty_comments && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mt-8">
          <h3 className="text-lg font-semibold mb-2">Faculty Comments</h3>
          <p className="whitespace-pre-line">{evaluation.faculty_comments}</p>
          <p className="text-sm text-gray-600 mt-2">
            Finalized by {evaluation.finalized_by_name} on{' '}
            {new Date(evaluation.finalized_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

// Helper Components
const AnalysisSection = ({ title, score, verdict, expanded, onToggle, children }) => (
  <div className="bg-white rounded-lg shadow">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 flex items-center justify-between text-left"
    >
      <div className="flex items-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        {score !== undefined && (
          <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {score}/100
          </span>
        )}
        {verdict && (
          <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
            verdict.includes('HUMAN') ? 'bg-green-100 text-green-800' :
            verdict.includes('ASSISTED') ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {verdict}
          </span>
        )}
      </div>
      <svg
        className={`w-5 h-5 transition-transform ${expanded ? 'transform rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {expanded && (
      <div className="px-6 pb-4 border-t">
        {children}
      </div>
    )}
  </div>
);

const MetricRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value}/100</span>
  </div>
);

export default EvaluationResults;
```

SERVICE:
```javascript
// frontend/src/services/evaluationService.js
import api from './api';

export const evaluationService = {
  getEvaluation: (id) => {
    return api.get(`/evaluations/${id}`).then(res => res.data);
  },
  
  getPendingEvaluations: (skip = 0, limit = 50) => {
    return api.get(`/evaluations/pending?skip=${skip}&limit=${limit}`)
      .then(res => res.data);
  },
  
  finalizeEvaluation: (id, data) => {
    return api.put(`/evaluations/${id}/finalize`, data).then(res => res.data);
  }
};
```

REQUIREMENTS:
- Use Recharts for visualizations
- Implement collapsible sections
- Add smooth animations
- Color-coded indicators
- Responsive design
- Print-friendly layout
- Accessibility features

OUTPUT:
Complete evaluation results display with all visualizations.
```

---

# FINAL INTEGRATION PROMPT

## PROMPT 18: Complete Application Integration

```
I need you to help me integrate all modules into a complete working application.

TASKS:

1. **Backend Integration (backend/app/main.py)**
   - Import all routers
   - Include all routers with proper prefixes
   - Add CORS middleware with correct origins
   - Add error handlers
   - Add startup/shutdown events (load AI models)
   - Configure logging

2. **Frontend Integration (frontend/src/App.jsx)**
   - Set up React Router with all routes
   - Wrap with AuthProvider
   - Add protected routes
   - Add role-based routing
   - Add loading states
   - Add error boundaries

3. **Environment Configuration**
   - Complete .env files for both backend and frontend
   - Add all required environment variables
   - Add instructions for setup

4. **Docker Integration**
   - Complete docker-compose.yml
   - Add Dockerfiles for backend and frontend
   - Add environment variable handling
   - Add volume mounts
   - Add network configuration

5. **Database Migrations**
   - Create Alembic migration
   - Add initial migration script
   - Add seed data script (optional)

6. **Testing Setup**
   - Create sample test files
   - Add test configuration
   - Add test data fixtures

7. **README and Documentation**
   - Complete README.md with:
     * Project description
     * Setup instructions
     * Running the application
     * API documentation
     * Troubleshooting guide

Please provide complete, working files for all integration points.
```

---

# USAGE INSTRUCTIONS

## How to Use These Prompts

1. **Sequential Execution**: Start with Module 1 and work your way through each module
2. **Copy-Paste**: Copy the exact prompt text for each module
3. **Customize**: Adjust project-specific details as needed
4. **Iterate**: Review Claude's output and request refinements
5. **Test**: Test each module before moving to the next
6. **Document**: Keep notes on any customizations made

## Tips for Best Results

- Always specify the exact file path where code should go
- Request working, complete implementations (not pseudocode)
- Ask for error handling in every component
- Request type hints and docstrings
- Specify testing requirements
- Ask for both happy path and error cases

## Validation Checklist

After each module:
- ✅ Code runs without syntax errors
- ✅ All imports resolve correctly
- ✅ Database operations work
- ✅ API endpoints respond correctly
- ✅ Frontend components render
- ✅ No console errors
- ✅ Basic functionality works

---

**Total Estimated Development Time Using These Prompts**: 20-30 days with Claude's assistance

**Success Rate**: 90%+ if prompts are followed sequentially and outputs are tested at each step
