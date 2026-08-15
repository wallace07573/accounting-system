'use client'

import { useState, useEffect } from 'react'
import { Plus, Save, Trash2, Search, GripVertical, CheckCircle, Loader2 } from 'lucide-react'
import { getLatestSequence, getLastDocumentDetails, searchCustomers, searchProducts, saveDocument, updateDocument, updateDocumentStatus, deleteDocumentById } from '@/app/actions/document'
import { getInvoiceGroups, createInvoiceGroup } from '@/app/actions/group'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

function incrementSequence(sequence: string | null, docType: string): string {
  const date = new Date()
  const yy = date.getFullYear().toString().slice(2)
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')

  if (!sequence) {
    if (docType === 'Invoice' || docType === 'Pre-Order') return 'INV-1001'
    if (docType === 'Quotation') return `Q-${yy}-${mm}-1001`
    if (docType === 'Delivery Order') return 'DO-1001'
    return 'DOC-1001'
  }
  // Find the last sequence of digits in the string
  const match = sequence.match(/(\d+)(?!.*\d)/)
  if (!match) return sequence + '1' // If no numbers, just append 1
  
  const numStr = match[1]
  const nextNum = (parseInt(numStr, 10) + 1).toString()
  const paddedNextNum = nextNum.padStart(Math.max(4, numStr.length), '0') // Ensure at least 4 digits
  
  if (docType === 'Quotation') {
    return `Q-${yy}-${mm}-${paddedNextNum}`
  }

  const prefix = sequence.slice(0, match.index)
  const suffix = sequence.slice(match.index! + numStr.length)
  
  return `${prefix}${paddedNextNum}${suffix}`
}

const HEAT_UP_PRODUCTS = [
    { id: 1, name: "PKM TCG 30th Celebration Binder Collection", prices: [990, 1260, 1290, 1500] },
    { id: 2, name: "PKM TCG 30th Celebration Tech Sticker Collection", prices: [1068, 1380, 1440, 1560] },
    { id: 3, name: "PKM TCG 30th Celebration Tech Poster Collection", prices: [630, 690, 720, 780] },
    { id: 4, name: "PKM TCG 30th Celebration 2-Pack Blister", prices: [708, 900, 960, 1080] },
    { id: 5, name: "PKM TCG 30th Celebration Knock Out Collection", prices: [1416, 1800, 1920, 2160] },
    { id: 6, name: "PKM TCG 30th Celebration EX BOX", prices: [630, 900, 930, 990] },
    { id: 7, name: "PKM TCG 30th Celebration EX Tin [Assortment]", prices: [810, 990, 1020, 1140] },
    { id: 8, name: "PKM TCG 30th Celebration ETB", prices: [2400, 3200, 3300, 3500, 3600, 3800] },
    { id: 9, name: "PKM TCG 30th Celebration Ex Tin", prices: [630, 870, 900, 960], release: "Oct 26" }
];

export default function DocumentForm({ initialData, tenant }: { initialData?: any, tenant?: any }) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [docType, setDocType] = useState(initialData?.type || 'Pre-Order')
  const [docNo, setDocNo] = useState(initialData?.doc_no || '')
  const defaultDueDate = new Date()
  defaultDueDate.setDate(defaultDueDate.getDate() + 7)
  
  const [issueDate, setIssueDate] = useState(initialData?.issue_date || new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(initialData?.due_date || defaultDueDate.toISOString().split('T')[0])
  const [title, setTitle] = useState(initialData?.title || '')
  const [status, setStatus] = useState(initialData?.status || 'Draft')
  const [isCorporate, setIsCorporate] = useState(initialData?.is_corporate || false)
  const [showBankDetails, setShowBankDetails] = useState(initialData?.show_bank_details || false)
  const [terms, setTerms] = useState(initialData?.terms || '')
  
  const [groupId, setGroupId] = useState<string>(initialData?.group_id || '')
  const [invoiceGroups, setInvoiceGroups] = useState<any[]>([])
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupColor, setNewGroupColor] = useState('#f8fafc')

  const predefinedColors = [
    { label: 'Light Blue', value: '#e0f2fe' },
    { label: 'Light Pink', value: '#fce7f3' },
    { label: 'Light Green', value: '#dcfce7' },
    { label: 'Light Orange', value: '#ffedd5' },
    { label: 'Light Purple', value: '#f3e8ff' },
    { label: 'Light Yellow', value: '#fef3c7' },
    { label: 'Light Gray', value: '#f8fafc' }
  ]
  
  const [customer, setCustomer] = useState(initialData?.customer || { id: '', name: '', company_name: '', address: '', attention: '', email: '' })
  const [customerQuery, setCustomerQuery] = useState(initialData?.customer?.name || '')
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([])
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)

  const initialRegularItems = initialData?.items 
    ? initialData.items.filter((i: any) => i.description !== 'Discount Allowed')
    : [];
  
  const initialDiscountItem = initialData?.items?.find((i: any) => i.description === 'Discount Allowed');

  const [items, setItems] = useState(initialRegularItems.length > 0 ? initialRegularItems.map((i: any, idx: number) => ({
      ...i,
      id: i.id || Date.now() + idx,
      isNew: false
  })) : [
    { id: Date.now(), description: '', qty: 1, uom: 'Unit', unit_price: 0, amount: 0, isNew: false }
  ])

  const [hasDiscount, setHasDiscount] = useState(!!initialDiscountItem)
  const [discountAmount, setDiscountAmount] = useState(initialDiscountItem ? Math.abs(initialDiscountItem.unit_price) : 0)
  const [amountPaid, setAmountPaid] = useState(initialData?.amount_paid || 0)
  const [productSuggestions, setProductSuggestions] = useState<any[]>([])
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
  

  const [isEditingMode] = useState(!!initialData)

  const [hcSelectedProductId, setHcSelectedProductId] = useState<number | ''>('')
  const [hcSelectedPrice, setHcSelectedPrice] = useState<number | ''>('')
  const [hcSelectedPercentage, setHcSelectedPercentage] = useState<number>(0)

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedItemIndex === null || draggedItemIndex === index) return

    const newItems = [...items]
    const draggedItem = newItems[draggedItemIndex]
    newItems.splice(draggedItemIndex, 1)
    newItems.splice(index, 0, draggedItem)
    
    setDraggedItemIndex(index)
    setItems(newItems)
  }

  const handleDragEnd = () => {
    setDraggedItemIndex(null)
  }

  const addHeatUpItem = () => {
    if (hcSelectedProductId === '' || hcSelectedPrice === '') return;
    const p = HEAT_UP_PRODUCTS.find(x => x.id === hcSelectedProductId);
    if (!p) return;
    
    const finalPrice = hcSelectedPrice * hcSelectedPercentage;
    const desc = `${p.name} (RM${hcSelectedPrice} @ ${hcSelectedPercentage * 100}%)`;

    const lastItem = items[items.length - 1]
    const isEmpty = lastItem && !lastItem.description && lastItem.unit_price === 0

    const newItem = {
      id: Date.now(),
      description: desc,
      qty: 1,
      uom: 'Unit',
      unit_price: finalPrice,
      amount: finalPrice,
      isNew: true
    }

    if (isEmpty && items.length === 1) {
      setItems([newItem])
    } else if (isEmpty) {
      const newItems = [...items]
      newItems[newItems.length - 1] = newItem
      setItems(newItems)
    } else {
      setItems([...items, newItem])
    }
  }

  // Fetch initial sequence & products
  useEffect(() => {
    async function init() {
      // Only fetch sequence if creating new, or if docType changed while editing
      if (!isEditingMode || (initialData && docType !== initialData.type)) {
        const latest = await getLatestSequence(docType)
        setDocNo(incrementSequence(latest, docType))
      }
      
      const groups = await getInvoiceGroups()
      setInvoiceGroups(groups)

      if (!isEditingMode && !initialData?.group_id && (docType === 'Invoice' || docType === 'Pre-Order')) {
        const prev = await getLastDocumentDetails(docType)
        if (prev?.group_id) {
          setGroupId(prev.group_id)
        }
      }
    }
    init()
  }, [docType, isEditingMode, initialData])

  // Customer search debounce
  useEffect(() => {
    if (!customerQuery || customerQuery.length < 2) {
      setCustomerSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingCustomer(true)
      const results = await searchCustomers(customerQuery)
      setCustomerSuggestions(results)
      setIsSearchingCustomer(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [customerQuery])

  const handleCustomerSelect = (c: any) => {
    setCustomer({
      id: c.id,
      name: c.name,
      company_name: c.company_name || '',
      address: c.address || '',
      attention: c.attention || ''
    })
    setCustomerQuery(c.name)
    setShowCustomerSuggestions(false)
  }

  const handleItemSearch = async (query: string, index: number) => {
    const newItems = [...items]
    newItems[index].description = query
    newItems[index].isNew = true // Assume new until selected from list
    setItems(newItems)

    if (query.length > 1) {
      const results = await searchProducts(query)
      setProductSuggestions(results)
      setActiveItemIndex(index)
    } else {
      setProductSuggestions([])
      setActiveItemIndex(null)
    }
  }

  const handleProductSelect = (p: any, index: number) => {
    const newItems = [...items]
    newItems[index].description = p.name
    newItems[index].uom = p.uom || 'Unit'
    newItems[index].unit_price = p.default_price || 0
    newItems[index].amount = newItems[index].qty * (p.default_price || 0)
    newItems[index].isNew = false // Exists in DB
    setItems(newItems)
    setProductSuggestions([])
    setActiveItemIndex(null)
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    ;(newItems[index] as any)[field] = value
    if (field === 'qty' || field === 'unit_price') {
      newItems[index].amount = newItems[index].qty * newItems[index].unit_price
    }
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', qty: 1, uom: 'Unit', unit_price: 0, amount: 0, isNew: true }])
  }



  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((item: any, i: number) => i !== index))
  }

  const regularTotal = items.reduce((sum: number, item: any) => sum + item.amount, 0)
  const totalAmount = hasDiscount ? regularTotal - discountAmount : regularTotal

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return
    setLoading(true)
    const res = await createInvoiceGroup(newGroupName, newGroupColor)
    setLoading(false)
    if (res.error) {
      toast(res.error, 'error')
    } else if (res.group) {
      setInvoiceGroups([...invoiceGroups, res.group])
      setGroupId(res.group.id)
      setIsAddingGroup(false)
      setNewGroupName('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const finalCustomer = { ...customer }
    if (!finalCustomer.id && customerQuery) {
      finalCustomer.name = customerQuery
    }
    // ensure email is explicitly passed or null
    finalCustomer.email = finalCustomer.email || null

    const payload = {
      type: docType,
      doc_no: docNo,
      issue_date: issueDate,
      due_date: dueDate,
      title: (docType === 'Quotation' || docType === 'Invoice' || docType === 'Pre-Order') ? title : null,
      is_corporate: (docType === 'Quotation' || docType === 'Invoice' || docType === 'Pre-Order') ? isCorporate : false,
      show_bank_details: (docType === 'Quotation' || docType === 'Invoice' || docType === 'Pre-Order') ? showBankDetails : false,
      terms: terms || null,
      customer: finalCustomer,
      amount_paid: amountPaid,
      status: status === 'Verified' ? 'Verified' : ((docType === 'Invoice' || docType === 'Pre-Order') && amountPaid > 0 ? 'Payment Received' : status),
      group_id: (docType === 'Invoice' || docType === 'Pre-Order') ? (groupId || null) : null,
      items: items.map((i: any) => ({
        description: i.description,
        qty: i.qty,
        uom: i.uom,
        unit_price: i.unit_price,
        amount: i.amount,
        isNew: i.isNew
      })).concat(hasDiscount && discountAmount > 0 ? [{
        description: 'Discount Allowed',
        qty: 1,
        uom: '',
        unit_price: -discountAmount,
        amount: -discountAmount,
        isNew: false
      }] : [])
    }

    let res;
    if (initialData?.id) {
      res = await updateDocument(initialData.id, payload)
    } else {
      res = await saveDocument(payload)
    }

    if (res.error) {
      toast(res.error, 'error')
      setLoading(false)
    } else {
      router.push(`/preview/${res.documentId}`)
    }
  }

  const handleDelete = async () => {
    if (!initialData?.id) return
    if (!confirm('Are you sure you want to delete this document?')) return
    setLoading(true)
    const res = await deleteDocumentById(initialData.id)
    if (res?.error) {
      toast(res.error, 'error')
      setLoading(false)
    } else {
      toast('Document deleted successfully')
      router.push('/dashboard/documents')
    }
  }

  const handleCopyPrevious = async () => {
    setLoading(true)
    try {
      const prev = await getLastDocumentDetails(docType)
      if (prev) {
        if (prev.customer) {
          setCustomer(prev.customer)
          setCustomerQuery(prev.customer.name)
        }
        if (prev.group_id && (docType === 'Invoice' || docType === 'Pre-Order')) {
          setGroupId(prev.group_id)
        }
        if (prev.items && prev.items.length > 0) {
          const regularItems = prev.items.filter((i: any) => i.description !== 'Discount Allowed')
          const discountItem = prev.items.find((i: any) => i.description === 'Discount Allowed')
          
          if (regularItems.length > 0) {
            setItems(regularItems.map((i: any, idx: number) => ({
              ...i,
              id: Date.now() + idx,
              isNew: false
            })))
          }
          if (discountItem) {
            setHasDiscount(true)
            setDiscountAmount(Math.abs(discountItem.unit_price))
          } else {
            setHasDiscount(false)
            setDiscountAmount(0)
          }
        }
        setTitle(prev.title || '')
        setIsCorporate(prev.is_corporate || false)
        setShowBankDetails(prev.show_bank_details || false)
        setTerms(prev.terms || '')
      } else {
        toast(`No previous ${docType} found to copy from.`, 'info')
      }
    } catch (e: any) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!initialData?.id) return;
    setLoading(true);
    try {
      const res = await updateDocumentStatus(initialData.id, 'Verified');
      if (res.error) throw new Error(res.error);
      setStatus('Verified');
      toast('Document verified successfully');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleConvertToInvoice = async () => {
    if (!initialData?.id) return;
    if (!confirm('Convert this Quotation to an Invoice? A new Invoice will be created with the current details.')) return;
    setLoading(true);
    try {
      const latestInv = await getLatestSequence('Invoice');
      const nextInvNo = incrementSequence(latestInv, 'Invoice');
      
      const payload = {
        type: 'Invoice',
        doc_no: nextInvNo,
        issue_date: issueDate,
        due_date: dueDate,
        title: title,
        is_corporate: isCorporate,
        show_bank_details: showBankDetails,
        terms: terms || null,
        customer: customer,
        amount_paid: 0,
        status: 'Draft',
        group_id: null,
        items: items.map((i: any) => ({
          description: i.description,
          qty: i.qty,
          uom: i.uom,
          unit_price: i.unit_price,
          amount: i.amount,
          isNew: i.isNew
        })).concat(hasDiscount && discountAmount > 0 ? [{
          description: 'Discount Allowed',
          qty: 1,
          uom: '',
          unit_price: -discountAmount,
          amount: -discountAmount,
          isNew: false
        }] : [])
      };

      const res = await saveDocument(payload);
      if (res.error) throw new Error(res.error);
      
      // Update the quotation status to 'Converted'
      await updateDocumentStatus(initialData.id, 'Converted');
      
      toast('Converted to Invoice successfully!', 'success');
      router.push(`/dashboard/documents/${res.documentId}/edit`);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header with Save */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>Document Details</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {initialData?.id && (
            <>
              {(docType === 'Invoice' || docType === 'Pre-Order') && status === 'Verified' && (
                <span
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px',
                    backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #166534', borderRadius: '8px',
                    fontWeight: 500, opacity: 0.8
                  }}
                >
                  Verified
                </span>
              )}
              {docType === 'Quotation' && status !== 'Converted' && (
                <button
                  type="button"
                  onClick={handleConvertToInvoice}
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px',
                    backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px',
                    fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
                  }}
                >
                  Convert to Invoice
                </button>
              )}
              {docType === 'Quotation' && status === 'Converted' && (
                <span
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px',
                    backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '8px',
                    fontWeight: 500, opacity: 0.8
                  }}
                >
                  Converted
                </span>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px',
                  backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
                }}
                title="Delete Document"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
          {!initialData?.id && (
            <button 
              type="button" 
              onClick={handleCopyPrevious}
              disabled={loading}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', 
                backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px',
                fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
              }}
            >
              Copy Previous
            </button>
          )}
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
              backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px',
              fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}
          >
            <Save size={18} /> {loading ? (initialData ? 'Updating...' : 'Saving...') : (initialData ? 'Update & Generate' : 'Save & Generate')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Type & Doc No */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Document Type</label>
          <select 
            value={docType} onChange={e => setDocType(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
          >
            <option>Pre-Order</option>
            <option>Invoice</option>
            <option>Quotation</option>
            <option>Delivery Order</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Document Number (Auto-incremented)</label>
          <input 
            type="text" required
            value={docNo} onChange={e => setDocNo(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
          />
        </div>

        {/* Dates */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Issue Date</label>
          <input 
            type="date" required
            value={issueDate} onChange={e => setIssueDate(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Due Date</label>
          <input 
            type="date"
            value={dueDate} onChange={e => setDueDate(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
          />
        </div>

        {(docType === 'Invoice' || docType === 'Pre-Order') && (
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Amount Received (RM)</label>
            <input 
              type="number" min="0" step="0.01"
              value={amountPaid === 0 ? '' : amountPaid}
              onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
            />
          </div>
        )}

        {(docType === 'Invoice' || docType === 'Pre-Order') && (
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Invoice Group</label>
            {!isAddingGroup ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  value={groupId} 
                  onChange={e => {
                    if (e.target.value === 'ADD_NEW') setIsAddingGroup(true)
                    else setGroupId(e.target.value)
                  }}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
                >
                  <option value="">No Group</option>
                  {invoiceGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                  <option value="ADD_NEW">➕ Add New Group</option>
                </select>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input 
                  type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Group Name"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#0f172a' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {predefinedColors.map(c => (
                    <div 
                      key={c.value} 
                      onClick={() => setNewGroupColor(c.value)}
                      style={{ 
                        width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c.value, cursor: 'pointer',
                        border: newGroupColor === c.value ? '2px solid #2563eb' : '1px solid #cbd5e1'
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={handleAddGroup} style={{ padding: '6px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Save Group</button>
                  <button type="button" onClick={() => setIsAddingGroup(false)} style={{ padding: '6px 12px', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {docType === 'Quotation' && (
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Project Title (Optional)</label>
            <input 
              type="text" 
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Project: POC for Sunway Medical Center"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
            />
          </div>
        )}

        {(docType === 'Quotation' || docType === 'Invoice' || docType === 'Pre-Order') && (
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Customer Layout</label>
            <select
              value={isCorporate ? 'Corporate' : 'Personal'}
              onChange={e => setIsCorporate(e.target.value === 'Corporate')}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
            >
              <option value="Personal">Personal</option>
              <option value="Corporate">Corporate</option>
            </select>
          </div>
        )}

        {docType === 'Quotation' && (
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Options</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#0f172a', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={showBankDetails}
                onChange={e => setShowBankDetails(e.target.checked)}
              />
              ☑️ Include Bank Details
            </label>
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />

      {/* Customer Section */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px' }}>Customer Information</h3>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Customer Name (Type to search or add new)</label>
          <div style={{ position: 'relative' }}>
            {isSearchingCustomer ? (
              <Loader2 size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            )}
            <input 
              type="text" required
              value={customerQuery}
              onChange={e => {
                setCustomerQuery(e.target.value)
                setCustomer({ ...customer, name: e.target.value, id: '' })
                setShowCustomerSuggestions(true)
              }}
              onFocus={() => setShowCustomerSuggestions(true)}
              onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
              placeholder="Search or type a new customer name"
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
            />
          </div>
          
          {showCustomerSuggestions && customerSuggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              {customerSuggestions.map(c => (
                <div 
                  key={c.id}
                  onClick={() => handleCustomerSelect(c)}
                  style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ fontWeight: 500, color: '#1e293b' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{c.address || 'No address'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Contact (Optional)</label>
              <input 
                type="text"
                value={customer.attention}
                onChange={e => setCustomer({ ...customer, attention: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Email (Optional)</label>
              <input 
                type="email"
                value={customer.email || ''}
                onChange={e => setCustomer({ ...customer, email: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
                placeholder="e.g. john@example.com"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {isCorporate && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Company Name (Optional)</label>
                <input 
                  type="text"
                  value={customer.company_name}
                  onChange={e => setCustomer({ ...customer, company_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
                  placeholder="e.g. Acme Corp (TR0239097-A)"
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Billing Address</label>
            <textarea 
              value={customer.address}
              onChange={e => setCustomer({ ...customer, address: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white', minHeight: '80px' }}
            />
          </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />

      {/* Line Items */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Line Items</h3>
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px', width: '40px' }}></th>
                <th style={{ padding: '12px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>DESCRIPTION</th>
                <th style={{ padding: '12px', fontSize: '12px', fontWeight: 600, color: '#64748b', width: '100px' }}>QTY</th>
                <th style={{ padding: '12px', fontSize: '12px', fontWeight: 600, color: '#64748b', width: '100px' }}>UOM</th>
                <th style={{ padding: '12px', fontSize: '12px', fontWeight: 600, color: '#64748b', width: '120px' }}>PRICE</th>
                <th style={{ padding: '12px', fontSize: '12px', fontWeight: 600, color: '#64748b', width: '120px' }}>AMOUNT</th>
                <th style={{ padding: '12px', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => (
                <tr 
                  key={item.id} 
                  style={{ 
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: draggedItemIndex === index ? '#f8fafc' : 'white',
                    opacity: draggedItemIndex === index ? 0.5 : 1
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <td style={{ padding: '12px', textAlign: 'center', cursor: 'grab', color: '#cbd5e1' }}>
                    <GripVertical size={18} />
                  </td>
                  <td style={{ padding: '12px', position: 'relative' }}>
                    <input 
                      type="text" required placeholder="Item description"
                      value={item.description}
                      onChange={e => handleItemSearch(e.target.value, index)}
                      onBlur={() => setTimeout(() => setActiveItemIndex(null), 200)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
                    />
                    {activeItemIndex === index && productSuggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: '12px', right: '12px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        {productSuggestions.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => handleProductSelect(p, index)}
                            style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f1f5f9' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {p.name} <span style={{ color: '#94a3b8', fontSize: '12px' }}>({p.default_price})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="number" min="0" step="0.01"
                      value={item.qty || ''}
                      onChange={e => updateItem(index, 'qty', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="text"
                      value={item.uom || ''}
                      onChange={e => updateItem(index, 'uom', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="number" min="0" step="0.01"
                      value={item.unit_price || ''}
                      onChange={e => updateItem(index, 'unit_price', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
                    />
                  </td>
                  <td style={{ padding: '12px', fontWeight: 500, color: '#334155' }}>
                    {item.amount ? item.amount.toFixed(2) : ''}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button 
                      type="button" 
                      onClick={() => removeItem(index)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: items.length > 1 ? 1 : 0.3 }}
                      disabled={items.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {hasDiscount && (
                <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#fff7ed' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#c2410c' }}>Discount Allowed</div>
                  </td>
                  <td colSpan={2} style={{ padding: '12px' }}></td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#c2410c', fontWeight: 600 }}>-</span>
                      <input 
                        type="number" required min="0" step="0.01"
                        value={discountAmount || ''}
                        onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', color: '#0f172a', backgroundColor: 'white' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#c2410c' }}>
                    -{discountAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px' }}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button 
              type="button" 
              onClick={addItem}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              <Plus size={16} /> Add Line Item
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={hasDiscount} 
                onChange={e => {
                  setHasDiscount(e.target.checked)
                  if (!e.target.checked) setDiscountAmount(0)
                }}
                style={{ cursor: 'pointer' }}
              />
              ☑️ Discount Allowed
            </label>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Total: {totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Terms */}
        <div style={{ marginTop: '24px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
            <span>Notes (Optional)</span>
          </label>
          {docType === 'Quotation' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setTerms(terms ? terms + '\n100% Advanced Payment Required upon Confirmation.' : '100% Advanced Payment Required upon Confirmation.')}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', color: '#475569', fontWeight: 500 }}
              >
                ☑️ 100% Advanced Payment
              </button>
              <button
                type="button"
                onClick={() => setTerms(terms ? terms + '\nThis quotation is valid for 14 days from the date of issue.' : 'This quotation is valid for 14 days from the date of issue.')}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', color: '#475569', fontWeight: 500 }}
              >
                ☑️ Valid for 14 Days
              </button>
              <button
                type="button"
                onClick={() => setTerms(terms ? terms + '\n50% Advanced Payment Required, remaining 50% due upon completion.' : '50% Advanced Payment Required, remaining 50% due upon completion.')}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', color: '#475569', fontWeight: 500 }}
              >
                ☑️ 50% Advanced, 50% Completion
              </button>
            </div>
          )}
          <textarea
            value={terms}
            onChange={e => setTerms(e.target.value)}
            placeholder="Enter terms and conditions here..."
            rows={4}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', backgroundColor: 'white', resize: 'vertical' }}
          />
        </div>

        {/* Heat Up Collection PO */}
        {tenant?.enable_heat_up_po && (
          <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔥 Heat Up Collection PO
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Select Product</label>
              <select 
                value={hcSelectedProductId}
                onChange={(e) => {
                  setHcSelectedProductId(Number(e.target.value));
                  setHcSelectedPrice('');
                }}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: 'white' }}
              >
                <option value="" disabled>Choose...</option>
                {HEAT_UP_PRODUCTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.release ? `(${p.release})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Target Price</label>
              <select 
                value={hcSelectedPrice}
                onChange={(e) => setHcSelectedPrice(Number(e.target.value))}
                disabled={hcSelectedProductId === ''}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: hcSelectedProductId === '' ? '#f1f5f9' : 'white' }}
              >
                <option value="" disabled>Choose price...</option>
                {hcSelectedProductId !== '' && HEAT_UP_PRODUCTS.find(p => p.id === hcSelectedProductId)?.prices.map(price => (
                  <option key={price} value={price}>RM {price}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Percentage</label>
              <select 
                value={hcSelectedPercentage}
                onChange={(e) => setHcSelectedPercentage(Number(e.target.value))}
                style={{ width: '100px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: 'white' }}
              >
                <option value={0}>0%</option>
                <option value={0.05}>5%</option>
                <option value={0.10}>10%</option>
                <option value={0.15}>15%</option>
              </select>
            </div>
            <button 
              type="button" 
              onClick={addHeatUpItem}
              disabled={hcSelectedProductId === '' || hcSelectedPrice === ''}
              style={{
                padding: '8px 16px',
                backgroundColor: (hcSelectedProductId === '' || hcSelectedPrice === '') ? '#94a3b8' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: (hcSelectedProductId === '' || hcSelectedPrice === '') ? 'not-allowed' : 'pointer',
                height: '37px'
              }}
            >
              Add
            </button>
          </div>
        </div>
        )}
      </div>

    </form>
  )
}
