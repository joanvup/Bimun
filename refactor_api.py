import re

with open('server/api.ts', 'r') as f:
    code = f.read()

# Replace imports
code = code.replace("import { queryAll, queryOne, runSql, getDb,", "import { getDb,")
code = code.replace("import { queryAll, queryOne, runSql, getDb }", "import { getDb }")
code = code.replace("import { queryAll, queryOne, runSql }", "")
code = code.replace("import { executeQueryAll, executeQueryOne, executeRunSql, getDatabaseStatus } from './dbManager.ts';", "import { executeQueryAll, executeQueryOne, executeRunSql, getDatabaseStatus, switchDatabaseEngine, migrateCurrentDataToTarget, testConnection, getCurrentConfigSafe } from './dbManager.ts';")

if "import { executeQueryAll, executeQueryOne, executeRunSql }" not in code:
    code = code.replace("import { getDb", "import { executeQueryAll, executeQueryOne, executeRunSql } from './dbManager.ts';\nimport { getDb")

# Replace sync db calls to async
code = code.replace("queryAll(", "await executeQueryAll(")
code = code.replace("queryOne(", "await executeQueryOne(")
code = code.replace("runSql(", "await executeRunSql(")

# Replace synchronous handlers
# We want to match: apiRouter.ANY('/path', [middlewares...], (req, res) => {
# and add async before (req, res)
def replacer(match):
    prefix = match.group(1)
    args = match.group(2)
    # Check if 'async' is already there
    if 'async' in args:
        return match.group(0)
    
    # We find (req, res) or (req, res, next) and prepend async
    new_args = re.sub(r'\(req,\s*res\)\s*=>', r'async (req, res) =>', args)
    new_args = re.sub(r'\(req,\s*res,\s*next\)\s*=>', r'async (req, res, next) =>', new_args)
    return prefix + new_args

code = re.sub(r'(apiRouter\.[a-z]+\()([^)]+\)\s*=>\s*\{)', replacer, code)

# Note: The above regex might fail if there are nested parentheses before the arrow function. 
# A safer regex: match " (req, res) => {" or ", (req, res) => {"
code = re.sub(r'(,\s*)\(req,\s*res\)\s*=>\s*\{', r'\1async (req, res) => {', code)

with open('server/api.ts', 'w') as f:
    f.write(code)

print("Refactored api.ts")
