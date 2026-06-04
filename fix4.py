with open(r'app\properties\[id]\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_return = """`${heading}${readyText}
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

${property.Hashtags || '#realestate #realtor #property #home #houseforsale #homeforsale #dreamhome #newhome #homebuyers #househunting #investmentproperty #luxuryhomes #modernhomes #familyhome #readytomovein #Pampanga #Philippines'}${mediaInfo}
  }, [property, hasPhotos, hasVideo])"""

new_return = """[
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
    ].join('\\n')
  }, [property, hasPhotos, hasVideo])"""

count = content.count(old_return)
print(f'Return template occurrences: {count}')
content = content.replace(old_return, new_return)

with open(r'app\properties\[id]\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
