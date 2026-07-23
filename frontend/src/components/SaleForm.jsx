import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ShoppingBag, Mic, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { salesApi } from '../api/salesApi';
import { formatCurrency } from '../utils/formatters';
import DesktopScannerPairing from './DesktopScannerPairing';

const emptyItem = { productId: null, productName: '', quantity: 1, unitPrice: 0 };

function SaleForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    paymentMethod: 'CASH',
    notes: '',
  });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [showScanner, setShowScanner] = useState(false);

  // Voice AI States
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef('');
  const [aiParsing, setAiParsing] = useState(false);

  const recognitionRef = useRef(null);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser. Try Chrome or Android.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'hi-IN'; // Works for Hindi and Hinglish
    recognition.continuous = true; // Keeps listening until manually stopped
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      transcriptRef.current = '';
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
      transcriptRef.current = currentTranscript;
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        console.error(event.error);
        toast.error('Voice recording error: ' + event.error);
      }
      setIsListening(false);
    };

    recognition.onend = async () => {
      setIsListening(false);
      
      const finalTranscript = transcriptRef.current.trim();
      if (!finalTranscript) return;

         setAiParsing(true);
         try {
            const response = await salesApi.parseVoice(finalTranscript);
            const data = response.data;
            
            // Auto-fill form
            if (data.customer) {
               setForm(prev => ({
                 ...prev,
                 customerName: data.customer.matched_name || data.customer.raw_spoken_name || prev.customerName
               }));
            }
            
            if (data.items && data.items.length > 0) {
               const parsedItems = data.items.map(item => ({
                  productId: item.matched_product_id || null,
                  productName: item.matched_product_name || item.raw_spoken_item || '',
                  quantity: item.quantity || 1,
                  unitPrice: item.unit_price_used || 0
               }));
               setItems(prev => {
                   const validPrevItems = prev.filter(item => item.productName.trim() !== '');
                   return [...validPrevItems, ...parsedItems];
               });
            }
            
            if (data.payment) {
               let method = 'CASH';
               if (data.payment.payment_status === 'unpaid') {
                   setForm(prev => ({ ...prev, notes: (prev.notes ? prev.notes + ' | ' : '') + 'UNPAID' }));
               }
               // Note: amount_paid is useful but we don't track partial payments in the basic DB yet, we just track totalAmount via items.
            }
            
            if (data.notes) {
               setForm(prev => ({ ...prev, notes: (prev.notes ? prev.notes + '\nAI Note: ' : 'AI Note: ') + data.notes }));
            }
            
            if (data.needs_review) {
               toast.success('AI loaded details, but needs your review before saving!', { duration: 5000, icon: '⚠️' });
            } else {
               toast.success('AI matched everything perfectly!');
            }

         } catch (e) {
            console.error(e);
            toast.error('AI failed to parse the voice sale.');
         } finally {
            setAiParsing(false);
            setTranscript('');
         }
    };

    recognition.start();
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }]);
  };

  const handleMobileScan = (scannedData, type) => {
    if (type !== 'Sale') return;
    setItems(prev => {
      const validItems = prev.filter(item => item.productName.trim() !== '');
      return [...validItems, {
        productId: scannedData.productId || null,
        productName: scannedData.productName || scannedData.guess || '',
        quantity: scannedData.quantity || 1,
        unitPrice: scannedData.price || 0
      }];
    });
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const getSubtotal = (item) => (item.quantity || 0) * (item.unitPrice || 0);
  const grandTotal = items.reduce((sum, item) => sum + getSubtotal(item), 0);

  const validate = () => {
    if (!form.customerName.trim()) {
      toast.error('Customer name is required');
      return false;
    }
    const validItems = items.filter(
      (item) => item.productName.trim() && item.unitPrice > 0
    );
    if (validItems.length === 0) {
      toast.error('Add at least one item with a name and price');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items
          .filter((item) => item.productName.trim() && item.unitPrice > 0)
          .map((item) => ({
            productId: item.productId || null,
            productName: item.productName.trim(),
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice),
          })),
      };
      const response = await salesApi.create(payload);
      toast.success('Sale recorded successfully');
      navigate(`/sales/${response.data.id}?autoPrint=true`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Record New Sale</h1>
        
        <button 
          type="button"
          onClick={toggleListening} 
          disabled={aiParsing}
          className={`btn ${isListening ? 'btn-danger' : 'btn-primary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: isListening ? 'pulse 1.5s infinite' : 'none' }}
        >
          {aiParsing ? <Loader className="spin" size={18} /> : <Mic size={18} />}
          {aiParsing ? 'AI is thinking...' : isListening ? 'Stop Recording' : 'Record Voice Sale'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button className="btn" onClick={() => setShowScanner(!showScanner)}>
          {showScanner ? 'Hide Mobile Scanner' : '📱 Scan with Phone'}
        </button>
      </div>

      {showScanner && (
        <div style={{ marginBottom: '20px' }}>
          <DesktopScannerPairing onScan={handleMobileScan} />
        </div>
      )}
      
      {(isListening || transcript || aiParsing) && (
         <div className="card" style={{ marginBottom: '20px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6' }}>
            <div style={{ padding: '15px' }}>
               <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mic size={16} /> 
                  {isListening ? 'Speak now (Hindi/Hinglish)...' : 'Processing voice...'}
               </h4>
               <p style={{ margin: 0, fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                  {transcript || '...'}
               </p>
            </div>
         </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-section">
            <h3 className="form-section-title">Customer Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => updateForm('customerName', e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => updateForm('customerPhone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="form-section">
            <h3 className="form-section-title">Items</h3>
            {items.map((item, index) => (
              <div className="item-row" key={index}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    value={item.productName}
                    onChange={(e) => updateItem(index, 'productName', e.target.value)}
                    placeholder="Item name"
                  />
                </div>
                <div className="form-group" style={{ flex: 0.7 }}>
                  <label className="form-label">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                  />
                </div>
                <div className="item-subtotal">{formatCurrency(getSubtotal(item))}</div>
                <button
                  type="button"
                  className="btn-icon btn-danger"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button type="button" className="btn btn-ghost" onClick={addItem}>
              <Plus size={16} /> Add Item
            </button>

            <div className="items-total-bar">
              <span className="items-total-label">Grand Total</span>
              <span className="items-total-value">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="form-section">
            <h3 className="form-section-title">Payment Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => updateForm('paymentMethod', e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg btn-full"
          disabled={submitting}
        >
          <Save size={18} />
          {submitting ? 'Recording...' : 'Record Sale'}
        </button>
      </form>
    </div>
  );
}

export default SaleForm;
