with open(r'app\properties\[id]\page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
issues = []
for i, line in enumerate(lines, 1):
    if '`' in line and '\\n' in line and '${' in line:
        issues.append('Line ' + str(i) + ': ' + line.rstrip())
if issues:
    for x in issues:
        print(x)
else:
    print('No remaining issues found')
