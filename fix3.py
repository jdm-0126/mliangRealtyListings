with open(r'app\properties\[id]\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The multi-line template literal used in both useMemo (return) and copyToClipboard (const text =)
# Turbopack chokes on multi-line template literals starting with ${expr}
# We replace both with array.join('\n') approach

old_template = """`${heading}${readyText}
${property.Village || ''} ${property.Location || ''}
| ${property.Road || property.Street || 'Main Road'}
${property.Distance || 'Minutes from city center'}
Near ${property.Landmarks || 'Major landmarks'}
| ${property.Boundary || 'City boundary'}

Property Highlights:
${property.Model || 'Property'} ${property.Description || ''}${propertyDetails}

Community Amenities:
${property.Amenities || ['Entrance Gate with Guard','Clubhouse & Events Place','Church','Swimming Pool','Basketball Court','Playground','Community Plaza'].join('\\n')}

Price ${property['Listing Price'] || property.ListingPrice || property.Price || 'On request'}
MOP: ${property.MOP || 'Cash or BF'}

${tenantSettings.businessName}
${formatTenantFooter()}

${property.Hashtags || '#realestate #realtor #property #home #houseforsale #homeforsale #dreamhome #newhome #homebuyers #househunting #investmentproperty #luxuryhomes #modernhomes #familyhome #readytomovein #Pampanga #Philippines'}${mediaInfo}`"""

new_template = """[
      heading + readyText,
      (property.Village || '') + ' ' + (property.Location || ''),
      '| ' + (property.Road || property.Street || 'Main Road'),
      property.Distance || 'Minutes from city center',
      'Near ' + (property.Landmarks || 'Major landmarks'),
      '| ' + (property.Boundary || 'City boundary'),
      '',
      'Property Highlights:',
      (property.Model || 'Property') + ' ' + (property.Description || '') + propertyDetails,
      '',
      'Community Amenities:',
      property.Amenities || ['Entrance Gate with Guard','Clubhouse & Events Place','Church','Swimming Pool','Basketball Court','Playground','Community Plaza'].join('\\n'),
      '',
      "Price " + (property['Listing Price'] || property.ListingPrice || property.Price || 'On request'),
      'MOP: ' + (property.MOP || 'Cash or BF'),
      '',
      tenantSettings.businessName,
      formatTenantFooter(),
      '',
      (property.Hashtags || '#realestate #realtor #property #home #houseforsale #homeforsale #dreamhome #newhome #homebuyers #househunting #investmentproperty #luxuryhomes #modernhomes #familyhome #readytomovein #Pampanga #Philippines') + mediaInfo,
    ].join('\\n')"""

count = content.count(old_template)
print(f'Template occurrences: {count}')
content = content.replace(old_template, new_template)

with open(r'app\properties\[id]\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
