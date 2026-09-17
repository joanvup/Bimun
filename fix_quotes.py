import re

with open('server/api.ts', 'r') as f:
    code = f.read()

# Replace WHERE column = "value" with WHERE column = 'value'
code = re.sub(r'WHERE ([a-zA-Z_]+) = "([^"]+)"', r"WHERE \1 = '\2'", code)

with open('server/api.ts', 'w') as f:
    f.write(code)

print("Fixed quotes")
