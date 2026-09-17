with open('server/api.ts', 'r') as f:
    code = f.read()

code = code.replace(
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM committees;')?.count",
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM committees;'))?.count"
)
code = code.replace(
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM delegations;')?.count",
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM delegations;'))?.count"
)
code = code.replace(
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM delegations WHERE status = \"assigned\";')?.count",
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM delegations WHERE status = \"assigned\";'))?.count"
)
code = code.replace(
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM registrations WHERE status = \"pending\";')?.count",
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM registrations WHERE status = \"pending\";'))?.count"
)
code = code.replace(
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM registrations;')?.count",
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM registrations;'))?.count"
)
code = code.replace(
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM countries;')?.count",
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM countries;'))?.count"
)
code = code.replace(
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM documents;')?.count",
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM documents;'))?.count"
)
code = code.replace(
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM news;')?.count",
    "(await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM news;'))?.count"
)

with open('server/api.ts', 'w') as f:
    f.write(code)
