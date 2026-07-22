import { useState, useEffect } from 'react';
import { inventoryApi } from '../api/featureApi';
import toast from 'react-hot-toast';

const UNITS = ['pcs', 'kg', 'g', 'litre', 'ml', 'dozen', 'box', 'packet', 'bundle'];

const emptyForm = { name: '', sku: '', description: '', price: '', costPrice: '', quantityOnHand: '', unit: 'pcs' };

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null); // null = adding new
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const r = await inventoryApi.getAll();
      setItems(r.data);
    } catch { toast.error('Failed to load inventory'); }
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.sku && i.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      price: item.price !== undefined ? item.price : '',
      costPrice: item.costPrice !== undefined ? item.costPrice : '',
      quantityOnHand: item.quantityOnHand !== undefined ? item.quantityOnHand : '',
      unit: item.unit || 'pcs',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Item name is required'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        costPrice: parseFloat(form.costPrice) || 0,
        quantityOnHand: parseInt(form.quantityOnHand) || 0,
      };
      if (editItem) {
        await inventoryApi.update(editItem.id, payload);
        toast.success('Item updated');
      } else {
        await inventoryApi.add(payload);
        toast.success('Item added to inventory');
      }
      setShowForm(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Remove "${item.name}" from inventory?`)) return;
    try {
      await inventoryApi.delete(item.id);
      toast.success('Item removed');
      fetchItems();
    } catch { toast.error('Failed to remove item'); }
  };

  const formatPrice = (p) => p != null ? '₹' + Number(p).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—';

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h1>Inventory</h1>
          <p>{items.length} items · Manual entry only</p>
        </div>
        <button id="add-inventory-btn" className="btn btn-primary" onClick={openAdd}>+ Add Item</button>
      </div>

      <div className="inventory-toolbar">
        <input
          id="inventory-search"
          className="input-field search-field"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Disabled options notice */}
      <div className="feature-notice">
        <span>🚧 Variants, bundles &amp; kits — Coming soon</span>
      </div>

      {/* Item table */}
      {filtered.length === 0
        ? (
          <div className="empty-state-box">
            <p>{search ? 'No items match your search.' : 'No items yet. Click "+ Add Item" to get started.'}</p>
          </div>
        )
        : (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Sell Price</th>
                  <th>Cost Price</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td className="item-name">{item.name}</td>
                    <td className="item-sku">{item.sku || '—'}</td>
                    <td>{formatPrice(item.price)}</td>
                    <td>{formatPrice(item.costPrice)}</td>
                    <td>{item.quantityOnHand ?? '—'}</td>
                    <td>{item.unit || 'pcs'}</td>
                    <td className="item-actions">
                      <button className="btn-icon" onClick={() => openEdit(item)} title="Edit">✏️</button>
                      <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(item)} title="Remove">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit Item' : 'Add Item'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="item-form">
              <div className="form-row">
                <label>Item Name *</label>
                <input id="item-name" className="input-field" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Lays Classic Chips" />
              </div>
              <div className="form-row-2col">
                <div className="form-row">
                  <label>Sell Price (₹)</label>
                  <input id="item-price" className="input-field" type="number" min="0" step="0.01"
                    value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="form-row">
                  <label>Cost Price (₹)</label>
                  <input id="item-cost-price" className="input-field" type="number" min="0" step="0.01"
                    value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
              <div className="form-row-2col">
                <div className="form-row">
                  <label>Quantity in Stock</label>
                  <input id="item-qty" className="input-field" type="number" min="0"
                    value={form.quantityOnHand} onChange={e => setForm(f => ({ ...f, quantityOnHand: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-row">
                  <label>SKU / Code</label>
                  <input id="item-sku" className="input-field" value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. CHIPS-001" />
                </div>
              </div>
              <div className="form-row-2col">
                <div className="form-row">
                  <label>Unit</label>
                  <select id="item-unit" className="input-field" value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <label>Description</label>
                <textarea id="item-desc" className="input-field" rows={2}
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional notes about this item" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" id="save-item-btn" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving…' : editItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
