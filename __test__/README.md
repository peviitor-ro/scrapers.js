# Scraper Validation Script

This directory contains the validation script for testing scrapers in JavaScript (Node.js).

## runTest.js

A Node.js validation script that replicates validation logic for scrapers. It validates that modified scrapers produce correctly formatted job data.

### Features

- Automatically detects modified files in the `sites/` directory using `git diff`
- Executes each modified scraper and captures its JSON output
- Validates JSON against the schema rules
- Provides clear success (✅) and error (❌) indicators

### Validation Rules

The script validates that each job object has:

**Required fields:**
- `job_title` - Must not be empty or null
- `job_link` - Must not be empty or null
- `country` - Must not be empty or null

**Optional fields:**
- `city` - Array of city names
- `county` - Array of county names
- `remote` - Array with lowercase values from: `remote`, `on-site`, `hybrid`

**Additional rules:**
- No extra/unexpected fields are allowed
- If `remote` is present, it must be an array
- All `remote` values must be lowercase
- All `remote` values must be one of: `remote`, `on-site`, `hybrid`

### Usage

```bash
# Run validation on modified scrapers
node __test__/runTest.js

# Or use npm script
npm run validate
```

The script will:
1. Fetch `upstream/main` or `origin/main`
2. Get the list of modified files in `sites/` directory
3. Execute each scraper with `node`
4. Extract and validate the JSON output
5. Report results with ✅ for valid scrapers and ❌ for errors

### Exit Codes

- `0` - All scrapers are valid (or no scrapers to test)
- `1` - One or more scrapers have validation errors

### Example Output

```
🔍 Scraper Validation Script
============================

✓ Fetched upstream
Found 2 modified scraper(s):
  - sites/company1.js
  - sites/company2.js

📝 Testing: sites/company1.js

✅ sites/company1.js
   Found 5 valid job(s)

📝 Testing: sites/company2.js

❌ sites/company2.js
   Job 1: Missing required key "job_title"
   Job 2: "remote" value "Remote" must be lowercase

============================
📊 Summary
============================
Total scrapers tested: 2
✅ Valid: 1
❌ Invalid: 1

❌ Some scrapers have validation errors
```

### Module Exports

The script also exports functions for programmatic use:

```javascript
const { validateJob, validateJobs, getModifiedFiles } = require('./runTest.js');

// Validate a single job
const errors = validateJob(jobObject, jobIndex);

// Validate an array of jobs
const allErrors = validateJobs(jobsArray);

// Get modified files from git
const files = getModifiedFiles();
```
