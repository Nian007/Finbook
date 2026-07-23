import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Camera, CheckCircle, XCircle, Search, PlusCircle, ShoppingCart, Package } from 'lucide-react';
import toast from 'react-hot-toast';

function MobileScanner() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('CONNECTING'); // CONNECTING, PAIRED, ERROR
  const [businessName, setBusinessName] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  
  const [aiResult, setAiResult] = useState(null); // { guess, category, matches: [] }
  const [manualSearch, setManualSearch] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setStatus('ERROR');
      return;
    }
    pairDevice();
  }, [token]);

  const pairDevice = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/scan-sessions/${token}/pair`);
      if (res.data.status === 'PAIRED') {
        setStatus('PAIRED');
        setBusinessName(res.data.businessName);
      }
    } catch (err) {
      setStatus('ERROR');
      toast.error('Failed to connect to desktop session.');
    }
  };

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoUrl(URL.createObjectURL(file));
    setIsProcessing(true);
    setAiResult(null);
    setManualSearch(false);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('token', token);

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/vision/identify`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setAiResult(res.data);
    } catch (err) {
      toast.error('AI Recognition failed. Please search manually.');
      setManualSearch(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current.click();
  };

  const addToSale = async (item) => {
    const qty = prompt(`Enter quantity for ${item.productName || item.guess}`, '1');
    if (!qty) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/scan-sessions/${token}/add-sale`, {
        productName: item.productName || item.guess,
        quantity: parseInt(qty),
        price: item.sellPrice || 0
      });
      toast.success('Sent to Desktop (Sale)');
      setAiResult(null);
      setPhotoUrl(null);
    } catch (err) {
      toast.error('Failed to send to desktop');
    }
  };

  const addToInventory = async (item) => {
    const qty = prompt(`Enter received stock for ${item.productName || item.guess}`, '10');
    if (!qty) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/scan-sessions/${token}/add-inventory`, {
        productName: item.productName || item.guess,
        quantity: parseInt(qty)
      });
      toast.success('Sent to Desktop (Inventory)');
      setAiResult(null);
      setPhotoUrl(null);
    } catch (err) {
      toast.error('Failed to send to desktop');
    }
  };

  if (status === 'CONNECTING') return <div style={{ padding: '20px', textAlign: 'center' }}>Connecting to Desktop...</div>;
  if (status === 'ERROR') return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Invalid or Expired QR Code. Please generate a new one on your desktop.</div>;

  return (
    <div style={{ padding: '15px', maxWidth: '100%', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <CheckCircle color="#10b981" /> 
        <div>
          <div style={{ fontWeight: 600 }}>Connected</div>
          <div style={{ fontSize: '0.8rem', color: 'gray' }}>{businessName}</div>
        </div>
      </div>

      {!photoUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div 
            onClick={triggerCamera}
            style={{ 
              width: '150px', height: '150px', borderRadius: '50%', background: '#3b82f6', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)', cursor: 'pointer'
            }}
          >
            <Camera size={64} color="white" />
          </div>
          <h3 style={{ marginTop: '30px' }}>Tap to Scan Item</h3>
          <p className="text-secondary" style={{ textAlign: 'center', marginTop: '10px' }}>
            Take a photo of the product to automatically identify it via AI.
          </p>
          {/* Hidden file input that forces camera on mobile */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef}
            onChange={handleCapture}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div>
          <img src={photoUrl} alt="Captured" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />
          
          {isProcessing ? (
            <div style={{ textAlign: 'center', margin: '30px 0' }}>
              <div className="spinner" style={{ margin: '0 auto', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '15px' }}>AI Analyzing Product...</p>
            </div>
          ) : (
            <div style={{ marginTop: '20px' }}>
              {aiResult && !manualSearch && (
                <div className="card" style={{ padding: '15px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>AI IDENTIFIED</div>
                  <h3 style={{ margin: '5px 0' }}>{aiResult.guess}</h3>
                  <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Category: {aiResult.category}</p>

                  {aiResult.matches && aiResult.matches.length > 0 ? (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '10px' }}>Matched Inventory:</div>
                      {aiResult.matches.map(m => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px' }}>
                          <div>{m.productName} (₹{m.sellPrice})</div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button className="btn btn-sm" style={{ background: '#3b82f6', padding: '8px' }} onClick={() => addToSale(m)}><ShoppingCart size={16}/></button>
                            <button className="btn btn-sm" style={{ background: '#f59e0b', padding: '8px' }} onClick={() => addToInventory(m)}><Package size={16}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <p className="text-secondary" style={{ fontSize: '0.9rem' }}>No exact match in inventory.</p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button className="btn btn-sm" style={{ flex: 1, background: '#3b82f6' }} onClick={() => addToSale(aiResult)}><ShoppingCart size={16}/> Add to Sale</button>
                        <button className="btn btn-sm" style={{ flex: 1, background: '#f59e0b' }} onClick={() => addToInventory(aiResult)}><Package size={16}/> Add to Stock</button>
                      </div>
                    </div>
                  )}

                  <button className="btn btn-sm" style={{ width: '100%', marginTop: '15px', background: 'transparent', border: '1px solid gray' }} onClick={() => setManualSearch(true)}>
                    <Search size={16} style={{ marginRight: '5px' }}/> Search Manually Instead
                  </button>
                </div>
              )}

              {manualSearch && (
                <div className="card" style={{ padding: '15px' }}>
                  <h4>Search Inventory</h4>
                  <input type="text" placeholder="Search product name..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'white', marginTop: '10px' }} />
                  <p className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '10px', textAlign: 'center' }}>Search results would appear here...</p>
                  <button className="btn btn-sm" style={{ width: '100%', marginTop: '15px', background: 'transparent', border: '1px solid gray' }} onClick={() => setManualSearch(false)}>
                    Back to AI Result
                  </button>
                </div>
              )}

              <button className="btn" style={{ width: '100%', marginTop: '20px', background: 'rgba(255,255,255,0.1)' }} onClick={() => setPhotoUrl(null)}>
                Scan Another Item
              </button>
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default MobileScanner;
