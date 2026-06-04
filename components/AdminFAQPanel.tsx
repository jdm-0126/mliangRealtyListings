'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface FAQItem {
  id: string;
  keyword: string;
  answer: string;
  category: string;
}

const formatPreview = (text: string) => {
  if (!text) return '';
  
  let formatted = text;
  
  // Format bold **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Format italic *text*
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Format numbered lists 1) -> 1.
  formatted = formatted.replace(/(\d+)\)\s*/g, '<br/>$1. ');
  
  // Format bullet points - -> •
  formatted = formatted.replace(/^\s*-\s*/gm, '&bull; ');
  formatted = formatted.replace(/([^>])\s+-\s*/g, '$1<br/>&bull; ');
  
  // Format section headers (text followed by colon)
  formatted = formatted.replace(/^([A-Za-z][^:]*?):\s*/gm, '<br/><strong>$1:</strong><br/>');
  
  // Convert line breaks
  formatted = formatted.replace(/\n/g, '<br/>');
  
  // Clean up multiple breaks
  formatted = formatted.replace(/(<br\/>){3,}/g, '<br/><br/>');
  
  return formatted.trim();
};

export default function AdminFAQPanel() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['buying', 'selling', 'renting', 'investing', 'general'];

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = () => {
    const stored = localStorage.getItem('mliang_faqs');
    if (stored) {
      setFaqs(JSON.parse(stored));
    } else {
      // Initialize with all existing FAQs from the original database
      const defaultFAQs: FAQItem[] = [
        // Property Buying Process
        { id: '1', keyword: 'buying process', answer: 'The property buying process in the Philippines involves: 1) Due Diligence (verify title at Registry of Deeds), 2) Contract to Sell (if installment), 3) Execute Deed of Absolute Sale (notarized), 4) Pay taxes (CGT 6%, DST 1.5%), 5) Transfer title at Registry of Deeds, 6) Transfer Tax Declaration. Total transaction cost is approximately 8-10% of property value.', category: 'buying' },
        { id: '2', keyword: 'how to buy', answer: 'To buy property: First, verify the title at the Registry of Deeds. Check for liens, encumbrances, and ensure the seller\'s name matches. Then execute a notarized Deed of Absolute Sale, pay required taxes (CGT and DST), and transfer the title. Always conduct due diligence before paying in full.', category: 'buying' },
        { id: '3', keyword: 'title verification', answer: 'To verify a title, go to the Registry of Deeds where the property is located and request a Certified True Copy (CTC). Check: 1) Title number matches seller\'s copy, 2) Owner\'s name matches valid ID, 3) No liens or encumbrances, 4) No adverse claims, 5) If mortgaged, ensure bank releases it before transfer.', category: 'buying' },
        { id: '4', keyword: 'taxes', answer: 'Property transaction taxes include: Capital Gains Tax (CGT) - 6% paid by seller, Documentary Stamp Tax (DST) - 1.5% paid by buyer, Transfer Tax - 0.5-0.75% depending on LGU, Registration Fee - varies, and Notary fees ₱5,000-₱20,000. Total is about 8-10% of property value.', category: 'buying' },
        { id: '5', keyword: 'cgt', answer: 'Capital Gains Tax (CGT) is 6% of the selling price or fair market value (whichever is higher). It is typically paid by the SELLER within 30 days of sale. This must be paid at the BIR before you can transfer the title.', category: 'selling' },
        { id: '6', keyword: 'dst', answer: 'Documentary Stamp Tax (DST) is 1.5% of the selling price or fair market value (whichever is higher). It is typically paid by the BUYER. This is required before title transfer at the Registry of Deeds.', category: 'buying' },
        { id: '7', keyword: 'transfer tax', answer: 'Transfer Tax is 0.5% to 0.75% of the selling price or fair market value, depending on your Local Government Unit (LGU). This is paid at the City/Municipal Treasurer\'s Office before title transfer.', category: 'buying' },
        { id: '8', keyword: 'documents needed', answer: 'Required documents: 1) Original Owner\'s Duplicate Title, 2) Notarized Deed of Absolute Sale, 3) Certificate Authorizing Registration (CAR) from BIR, 4) Tax Clearance, 5) Transfer tax receipt, 6) Valid IDs of buyer and seller, 7) Marriage certificate (if married), 8) TIN numbers.', category: 'buying' },
        { id: '9', keyword: 'deed of sale', answer: 'A Deed of Absolute Sale (DOAS) is the legal document that transfers ownership from seller to buyer. It must be NOTARIZED to be valid. It should include: property description, selling price, buyer and seller details, and signatures. This is required for title transfer.', category: 'buying' },
        { id: '10', keyword: 'car', answer: 'CAR (Certificate Authorizing Registration) is issued by the BIR after you pay the Capital Gains Tax and Documentary Stamp Tax. This is MANDATORY before you can transfer the title at the Registry of Deeds. You must get this within 30 days of the sale.', category: 'buying' },
        { id: '11', keyword: 'financing', answer: 'Property financing typically requires 20% equity (down payment) and 80% mortgage from a bank. Monthly payments depend on the loan term (5, 10, 15, or 20 years) and interest rate (usually 6-10%). Banks require: proof of income, valid IDs, and property appraisal.', category: 'investing' },
        { id: '12', keyword: 'mortgage', answer: 'A mortgage is a loan from a bank to purchase property. You typically need 20% down payment and can finance 80%. Interest rates range from 6-10% annually. Loan terms are usually 5, 10, 15, or 20 years. Monthly payments include principal and interest.', category: 'investing' },
        { id: '13', keyword: 'down payment', answer: 'The standard down payment is 20% of the property price. This is called equity. The remaining 80% can be financed through a bank mortgage. Some developers offer lower down payment schemes with in-house financing.', category: 'investing' },
        { id: '14', keyword: 'lot only', answer: 'A lot-only property is vacant land without any structure. When buying a lot: verify boundaries match the title, check for road access, ensure no informal settlers, and confirm zoning allows your intended use. Lot-only properties don\'t have floor area, only lot area.', category: 'buying' },
        { id: '15', keyword: 'house and lot', answer: 'A house and lot includes both the land and the structure built on it. Check: lot area, floor area, number of bedrooms/bathrooms, condition of the house, and included fixtures. Verify the house matches the approved building plans.', category: 'buying' },
        { id: '16', keyword: 'condominium', answer: 'Condominiums have different ownership rules. You own the unit but share common areas. Foreigners can own condo units (up to 40% of building). Check: association dues, building rules, parking allocation, and Certificate of Title (CCT) or Condominium Certificate of Title (CCT).', category: 'buying' },
        { id: '17', keyword: 'clean title', answer: 'A "clean title" means the property has no liens, encumbrances, mortgages, or adverse claims. Verify this at the Registry of Deeds by getting a Certified True Copy. A clean title is essential for safe property purchase.', category: 'buying' },
        { id: '18', keyword: 'encumbrance', answer: 'An encumbrance is a claim or liability on a property (mortgage, lien, easement, etc.). Check the title for annotations. If there\'s a mortgage, the bank must issue a Release of Mortgage before you can transfer the title to your name.', category: 'buying' },
        { id: '19', keyword: 'adverse claim', answer: 'An adverse claim is a notice filed by someone claiming interest in the property. This is a RED FLAG. Do not proceed with the purchase until the adverse claim is resolved. Consult a lawyer immediately.', category: 'buying' },
        { id: '20', keyword: 'rights only', answer: 'Buying "rights only" means you\'re buying the seller\'s claim to the property, NOT the actual title. This is RISKY. You may face legal disputes and cannot get a clean title. Avoid "rights only" properties if you want secure ownership.', category: 'buying' },
        { id: '21', keyword: 'how long', answer: 'The property buying process typically takes 2-4 months: Due diligence (1-2 weeks), Contract execution (1 week), Tax payment (1-2 weeks), Title transfer at Registry of Deeds (2-4 weeks), Tax Declaration transfer (1 week). Delays can occur if documents are incomplete.', category: 'buying' },
        { id: '22', keyword: 'title transfer', answer: 'Title transfer at the Registry of Deeds takes 2-4 weeks after submitting all required documents (original title, notarized DOAS, CAR, tax clearance, transfer tax receipt). You\'ll receive a new title under your name.', category: 'buying' },
        { id: '23', keyword: 'closing costs', answer: 'Closing costs (transaction costs) are approximately 8-10% of the property value. This includes: CGT (6%), DST (1.5%), Transfer Tax (0.5-0.75%), Registration Fee, and Notary fees. Budget accordingly when buying property.', category: 'buying' },
        { id: '24', keyword: 'notary fee', answer: 'Notary fees for a Deed of Absolute Sale typically range from ₱5,000 to ₱20,000, depending on the property value and notary. This is required to make the deed legally binding.', category: 'buying' },
        { id: '25', keyword: 'lawyer', answer: 'While not required, hiring a lawyer is HIGHLY RECOMMENDED for property transactions. A lawyer can: verify documents, check title authenticity, review contracts, ensure proper execution, and protect your interests. Fees vary but are worth the security.', category: 'buying' },
        { id: '26', keyword: 'married', answer: 'If the seller is married, BOTH SPOUSES must sign the Deed of Absolute Sale, even if only one name is on the title. This is required by law. Bring the marriage certificate when executing the deed.', category: 'selling' },
        { id: '27', keyword: 'inherited property', answer: 'For inherited property, ensure the estate tax is SETTLED before buying. The seller must show proof of estate tax payment and extrajudicial settlement. Otherwise, you may inherit tax liabilities.', category: 'buying' },
        { id: '28', keyword: 'tenant rights', answer: 'Tenant rights in the Philippines include: 1) Right to peaceful enjoyment of the property, 2) Right to privacy and advance notice for inspections, 3) Protection from illegal eviction, 4) Right to habitable living conditions, 5) Right to security deposit return upon lease end. Tenants must pay rent on time, maintain the property, and follow lease terms.', category: 'renting' },
        { id: '29', keyword: 'tenant obligations', answer: 'Tenant obligations include: 1) Pay rent on time as agreed, 2) Maintain cleanliness and proper care of the property, 3) Follow house rules and lease conditions, 4) Report damages immediately, 5) Allow reasonable property inspections with notice, 6) Return property in good condition. Failure to meet obligations may result in lease termination.', category: 'renting' },
        { id: '30', keyword: 'contact', answer: 'You can contact RealtyProv1 at: Phone: 09393440944, Office: S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga. PRC License No. 0019653. We are a licensed real estate broker.', category: 'general' },
        { id: '31', keyword: 'services', answer: 'RealtyProv1 offers: Property listings (house and lot, lots, commercial), Property buying assistance, Title verification support, Financing guidance, Documentation assistance, and Property viewing arrangements. We serve Pampanga and nearby areas.', category: 'general' },
        { id: '32', keyword: 'viewing', answer: 'To schedule a property viewing, contact us at 09393440944 or visit our office. We can arrange viewings for any listed property. Bring valid ID and be ready to discuss your budget and requirements.', category: 'general' }
      ];
      setFaqs(defaultFAQs);
      localStorage.setItem('mliang_faqs', JSON.stringify(defaultFAQs));
    }
  };

  const saveFAQs = (updatedFAQs: FAQItem[]) => {
    setFaqs(updatedFAQs);
    localStorage.setItem('mliang_faqs', JSON.stringify(updatedFAQs));
  };

  const addFAQ = () => {
    if (!newKeyword.trim() || !newAnswer.trim()) return;
    
    const newFAQ: FAQItem = {
      id: Date.now().toString(),
      keyword: newKeyword.toLowerCase(),
      answer: newAnswer,
      category: newCategory
    };
    
    const updatedFAQs = [...faqs, newFAQ];
    saveFAQs(updatedFAQs);
    setNewKeyword('');
    setNewAnswer('');
  };

  const updateFAQ = (id: string, keyword: string, answer: string, category: string) => {
    const updatedFAQs = faqs.map(faq => 
      faq.id === id ? { ...faq, keyword: keyword.toLowerCase(), answer, category } : faq
    );
    saveFAQs(updatedFAQs);
    setEditingId(null);
  };

  const exportFAQs = () => {
    const dataStr = JSON.stringify(faqs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mliang-faqs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importFAQs = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          // Validate structure
          const validFAQs = importedData.filter(item => 
            item.id && item.keyword && item.answer && item.category
          );
          
          if (validFAQs.length > 0) {
            saveFAQs(validFAQs);
            alert(`Successfully imported ${validFAQs.length} FAQs`);
          } else {
            alert('No valid FAQs found in the file');
          }
        } else {
          alert('Invalid file format. Expected JSON array.');
        }
      } catch (error) {
        alert('Error reading file. Please ensure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const resetToDefaults = () => {
    if (confirm('This will replace all current FAQs with defaults. Continue?')) {
      const defaultFAQs: FAQItem[] = [
        {
          id: '1',
          keyword: 'tenant rights',
          answer: 'Tenant rights in the Philippines include: 1) Right to peaceful enjoyment of the property, 2) Right to privacy and advance notice for inspections, 3) Protection from illegal eviction, 4) Right to habitable living conditions, 5) Right to security deposit return upon lease end. Tenants must pay rent on time, maintain the property, and follow lease terms.',
          category: 'renting'
        },
        {
          id: '2', 
          keyword: 'tenant obligations',
          answer: 'Tenant obligations include: 1) Pay rent on time as agreed, 2) Maintain cleanliness and proper care of the property, 3) Follow house rules and lease conditions, 4) Report damages immediately, 5) Allow reasonable property inspections with notice, 6) Return property in good condition. Failure to meet obligations may result in lease termination.',
          category: 'renting'
        },
        {
          id: '3',
          keyword: 'buying process',
          answer: 'The property buying process in the Philippines involves: 1) Due Diligence (verify title at Registry of Deeds), 2) Contract to Sell (if installment), 3) Execute Deed of Absolute Sale (notarized), 4) Pay taxes (CGT 6%, DST 1.5%), 5) Transfer title at Registry of Deeds, 6) Transfer Tax Declaration. Total transaction cost is approximately 8-10% of property value.',
          category: 'buying'
        },
        {
          id: '4',
          keyword: 'cgt',
          answer: 'Capital Gains Tax (CGT) is 6% of the selling price or fair market value (whichever is higher). It is typically paid by the SELLER within 30 days of sale. This must be paid at the BIR before you can transfer the title.',
          category: 'selling'
        },
        {
          id: '5',
          keyword: 'contact',
          answer: 'You can contact RealtyProv1 at: Phone: 09393440944, Office: S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga. PRC License No. 0019653. We are a licensed real estate broker.',
          category: 'general'
        }
      ];
      saveFAQs(defaultFAQs);
    }
  };

  const deleteFAQ = (id: string) => {
    const updatedFAQs = faqs.filter(faq => faq.id !== id);
    saveFAQs(updatedFAQs);
  };

  const filteredFAQs = faqs.filter(faq => 
    faq.keyword.includes(searchTerm.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-300">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Admin FAQ Management</h2>
      
      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-900 mb-2">Search FAQs</label>
        <Input
          placeholder="Search by keyword or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md border-2 border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 bg-white font-medium"
        />
      </div>

      {/* Import/Export Controls */}
      <div className="mb-6 p-6 bg-blue-100 rounded-lg border-2 border-blue-300">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Import/Export FAQs</h3>
        <div className="flex gap-4 flex-wrap">
          <Button onClick={exportFAQs} variant="outline" className="bg-white border-2 border-gray-600 text-gray-900 hover:bg-gray-100 hover:border-gray-700 font-semibold">
            📥 Export FAQs
          </Button>
          
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={importFAQs}
              className="hidden"
            />
            <Button variant="outline" className="pointer-events-none bg-white border-2 border-gray-600 text-gray-900 font-semibold">
              📤 Import FAQs
            </Button>
          </label>
          
          <Button onClick={resetToDefaults} variant="outline" className="bg-white border-2 border-orange-500 text-orange-700 hover:bg-orange-50 hover:border-orange-600 font-semibold">
            🔄 Reset to Defaults
          </Button>
          
          <div className="text-sm text-gray-800 flex items-center font-bold">
            💡 Export to backup, import to restore, or share FAQ sets
          </div>
        </div>
      </div>
      <div className="mb-8 p-6 bg-green-100 rounded-lg border-2 border-green-300">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Add New FAQ</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Keyword</label>
              <Input
                placeholder="e.g., tenant rights"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="border-2 border-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-200 text-gray-900 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Category</label>
              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:border-green-600 focus:ring-2 focus:ring-green-200 text-gray-900 bg-white font-medium"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="text-gray-900 font-medium">{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Answer</label>
            <div className="mb-2 text-xs text-gray-700 bg-yellow-50 p-2 rounded border">
              <strong>Formatting Guide:</strong><br/>
              • **text** = <strong>Bold text</strong><br/>
              • *text* = <em>Italic text</em><br/>
              • - item = • Bullet point<br/>
              • 1) item = 1. Numbered list<br/>
              • Section: = <strong>Section:</strong> (bold header)
            </div>
            <textarea
              placeholder="Enter the detailed answer... Use **bold**, *italic*, - bullets, 1) numbers"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="w-full p-3 border-2 border-gray-400 rounded-md h-32 resize-none focus:border-green-600 focus:ring-2 focus:ring-green-200 text-gray-900 bg-white font-medium"
            />
            <div className="mt-2 p-3 bg-gray-50 border rounded text-sm">
              <strong>Preview:</strong>
              <div className="mt-1 text-gray-800" dangerouslySetInnerHTML={{ 
                __html: formatPreview(newAnswer)
              }} />
            </div>
          </div>
          <Button onClick={addFAQ} className="w-fit bg-green-700 hover:bg-green-800 text-white font-bold border-2 border-green-800">Add FAQ</Button>
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Existing FAQs ({filteredFAQs.length})</h3>
        {filteredFAQs.map(faq => (
          <FAQItem
            key={faq.id}
            faq={faq}
            isEditing={editingId === faq.id}
            onEdit={() => setEditingId(faq.id)}
            onSave={updateFAQ}
            onCancel={() => setEditingId(null)}
            onDelete={deleteFAQ}
            categories={categories}
          />
        ))}
      </div>
    </div>
  );
}

interface FAQItemProps {
  faq: FAQItem;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (id: string, keyword: string, answer: string, category: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  categories: string[];
}

function FAQItem({ faq, isEditing, onEdit, onSave, onCancel, onDelete, categories }: FAQItemProps) {
  const [keyword, setKeyword] = useState(faq.keyword);
  const [answer, setAnswer] = useState(faq.answer);
  const [category, setCategory] = useState(faq.category);

  const handleSave = () => {
    onSave(faq.id, keyword, answer, category);
  };

  if (isEditing) {
    return (
      <div className="p-6 border-2 border-blue-400 rounded-lg bg-blue-50">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Keyword</label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Keyword"
                className="border-2 border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 bg-white font-medium"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="text-gray-900 font-medium">{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Answer</label>
            <div className="mb-2 text-xs text-gray-700 bg-yellow-50 p-2 rounded border">
              <strong>Formatting Guide:</strong><br/>
              • **text** = <strong>Bold text</strong><br/>
              • *text* = <em>Italic text</em><br/>
              • - item = • Bullet point<br/>
              • 1) item = 1. Numbered list<br/>
              • Section: = <strong>Section:</strong> (bold header)
            </div>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full p-3 border-2 border-gray-400 rounded-md h-40 resize-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 bg-white font-medium"
              placeholder="Use **bold**, *italic*, - bullets, 1) numbers, Section: headers"
            />
            <div className="mt-2 p-3 bg-gray-50 border rounded text-sm max-h-32 overflow-y-auto">
              <strong>Preview:</strong>
              <div className="mt-1 text-gray-800" dangerouslySetInnerHTML={{ 
                __html: formatPreview(answer)
              }} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} size="sm" className="bg-blue-700 hover:bg-blue-800 text-white font-bold border-2 border-blue-800">Save Changes</Button>
            <Button onClick={onCancel} variant="outline" size="sm" className="bg-white border-2 border-gray-600 text-gray-900 hover:bg-gray-100 font-bold">Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border-2 border-gray-300 rounded-lg bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 items-center">
          <span className="font-bold text-blue-700 text-base">"{faq.keyword}"</span>
          <span className="text-sm bg-gray-800 text-white px-3 py-1 rounded font-bold">{faq.category}</span>
        </div>
        <div className="flex gap-3">
          <Button onClick={onEdit} variant="outline" size="sm" className="bg-white border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-bold">Edit</Button>
          <Button onClick={() => onDelete(faq.id)} variant="outline" size="sm" className="bg-white border-2 border-red-600 text-red-700 hover:bg-red-50 font-bold">Delete</Button>
        </div>
      </div>
      <p className="text-gray-900 text-sm font-medium leading-relaxed">{faq.answer}</p>
    </div>
  );
}