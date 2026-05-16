import re

with open(r'app\properties\[id]\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix template literals that use \n inside ${} expressions
# Pattern: `\nSomeText: ${expr}` -> '\nSomeText: ' + expr
# These cause Turbopack "Expected unicode escape" errors

replacements = [
    ("`\\nLot Area: ${property['Lot Area']}`", "'\\nLot Area: ' + property['Lot Area']"),
    ("`\\nFloor Area: ${property['Floor Area']}`", "'\\nFloor Area: ' + property['Floor Area']"),
    ('`\\n${property.Bedrooms} Bedrooms`', "'\\n' + property.Bedrooms + ' Bedrooms'"),
    ('`\\n${property.Bathrooms} Bathrooms`', "'\\n' + property.Bathrooms + ' Bathrooms'"),
    ('`\\n${property.Carports} Carports`', "'\\n' + property.Carports + ' Carports'"),
    ('`\\n${property.Features}`', "'\\n' + property.Features"),
    ('`\\n${property.Condition}`', "'\\n' + property.Condition"),
]

for old, new in replacements:
    count = content.count(old)
    print(f'Replacing ({count}x): {old[:50]}')
    content = content.replace(old, new)

# Also fix the \n inside the amenities default string inside ${}
# `\nClubhouse & Events Place\nChurch...` inside ${}
old_amenities = r"${property.Amenities || 'Entrance Gate with Guard\nClubhouse & Events Place\nChurch\nSwimming Pool\nBasketball Court\nPlayground\nCommunity Plaza'}"
new_amenities = "${property.Amenities || 'Entrance Gate with Guard\\nClubhouse & Events Place\\nChurch\\nSwimming Pool\\nBasketball Court\\nPlayground\\nCommunity Plaza'}"

# Check if it exists as-is
count = content.count(old_amenities)
print(f'Amenities occurrences: {count}')

with open(r'app\properties\[id]\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
