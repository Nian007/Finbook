import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { salesApi } from '../api/salesApi';
import { formatCurrency } from '../utils/formatters';

const emptyItem = { productName: '', quantity: 1, unitPrice: 0 };

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
      <div className="page-header">
        <h1 className="page-title">Record New Sale</h1>
      </div>

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
