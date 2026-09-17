import re

with open('server/api.ts', 'r') as f:
    code = f.read()

# I will just carefully replace the broken strings.
code = code.replace("'SELECT * FROM countries WHERE status = 'active' ORDER BY name ASC;'",
                    "`SELECT * FROM countries WHERE status = 'active' ORDER BY name ASC;`")
code = code.replace("'SELECT COUNT(*) as count FROM delegations WHERE status = 'assigned';'",
                    "`SELECT COUNT(*) as count FROM delegations WHERE status = 'assigned';`")
code = code.replace("'SELECT COUNT(*) as count FROM registrations WHERE status = 'pending';'",
                    "`SELECT COUNT(*) as count FROM registrations WHERE status = 'pending';`")
code = code.replace("'SELECT value FROM settings WHERE key = 'gallery_categories';'",
                    "`SELECT value FROM settings WHERE key = 'gallery_categories';`")

with open('server/api.ts', 'w') as f:
    f.write(code)
print("Fixed inner quotes")
