with open(r'app\properties\[id]\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: amenities default string with \n inside ${} - appears twice
old_amenities = "${property.Amenities || 'Entrance Gate with Guard\\nClubhouse & Events Place\\nChurch\\nSwimming Pool\\nBasketball Court\\nPlayground\\nCommunity Plaza'}"
new_amenities = "${property.Amenities || ['Entrance Gate with Guard','Clubhouse & Events Place','Church','Swimming Pool','Basketball Court','Playground','Community Plaza'].join('\\n')}"

count = content.count(old_amenities)
print(f'Amenities occurrences: {count}')
content = content.replace(old_amenities, new_amenities)

# Fix 2: mortgage computation - big template literal with \n inside ${}
# The issue is \n inside ${} expressions like \n${property.Village}
# We need to rewrite this as string concatenation
old_mortgage = r"""    const text = `MORTGAGE COMPUTATION\n\nProperty #${displayPropertyId}\n${property.Village || ''}, ${property.Location || ''}\n\nFINANCING BREAKDOWN:\n${priceLabel}: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.totalPrice)}\n20% Equity: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.equity)}\n80% Mortgage: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.mortgage)}\n\nMONTHLY PAYMENT OPTIONS (${interestRate}% Interest):\n${monthlyOptions}\n\n* Calculations are estimates\n* Actual rates may vary by lender\n\n${tenantSettings.businessName}\n${tenantSettings.contactNumber}\n${tenantSettings.emailAddress}`"""

new_mortgage = """    const fmtPHP = (v: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(v)
    const text = [
      'MORTGAGE COMPUTATION',
      '',
      'Property #' + displayPropertyId,
      (property.Village || '') + ', ' + (property.Location || ''),
      '',
      'FINANCING BREAKDOWN:',
      priceLabel + ': ' + fmtPHP(calculateFinancing.totalPrice),
      '20% Equity: ' + fmtPHP(calculateFinancing.equity),
      '80% Mortgage: ' + fmtPHP(calculateFinancing.mortgage),
      '',
      'MONTHLY PAYMENT OPTIONS (' + interestRate + '% Interest):',
      monthlyOptions,
      '',
      '* Calculations are estimates',
      '* Actual rates may vary by lender',
      '',
      tenantSettings.businessName,
      tenantSettings.contactNumber,
      tenantSettings.emailAddress,
    ].join('\\n')"""

count = content.count(old_mortgage)
print(f'Mortgage template occurrences: {count}')
content = content.replace(old_mortgage, new_mortgage)

with open(r'app\properties\[id]\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
