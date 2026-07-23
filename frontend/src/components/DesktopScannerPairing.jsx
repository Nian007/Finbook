import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, CheckCircle, XCircle, ShoppingCart, Package } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function DesktopScannerPairing({ onScan }) {
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('PENDING'); // PENDING, PAIRED
  const [scannedItems, setScannedItems] = useState([]);
  
  const generateSession = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return toast.error("Not logged in");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/scan-sessions`, 
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setToken(res.data.token);
      setStatus('PENDING');
      connectSse(res.data.token);
    } catch (err) {
      toast.error('Failed to generate scan session');
    }
  };

  const connectSse = (sessionToken) => {
    const sse = new EventSource(`${import.meta.env.VITE_API_URL}/api/scan-sessions/${sessionToken}/stream`);

    sse.addEventListener('INIT', (e) => {
      console.log('SSE Connected', e.data);
    });

    sse.addEventListener('PAIRED', (e) => {
      const data = JSON.parse(e.data);
      toast.success(`Phone connected successfully!`);
      setStatus('PAIRED');
    });

    sse.addEventListener('ADD_SALE', (e) => {
      const data = JSON.parse(e.data);
      toast.success(`Added ${data.productName} to active sale via mobile!`);
      setScannedItems(prev => [...prev, { ...data, type: 'Sale', time: new Date() }]);
      if (onScan) onScan(data, 'Sale');
    });

    sse.addEventListener('ADD_INVENTORY', (e) => {
      const data = JSON.parse(e.data);
      toast.success(`Updated inventory for ${data.productName} via mobile!`);
      setScannedItems(prev => [...prev, { ...data, type: 'Inventory', time: new Date() }]);
      if (onScan) onScan(data, 'Inventory');
    });

    sse.onerror = () => {
      console.error('SSE Error');
      sse.close();
      setStatus('DISCONNECTED');
    };

    return () => sse.close();
  };

  const pairingUrl = `${window.location.origin}/mobile-scan?token=${token}`;

  return (
    <div className="card" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Smartphone /> Mobile Camera Scanner
      </h2>
      <p className="text-secondary">
        Use your smartphone camera to quickly scan and add items to a sale or update inventory. No app installation required!
      </p>

      {!token && (
        <button className="btn btn-primary" onClick={generateSession} style={{ marginTop: '15px' }}>
          Generate Pairing QR Code
        </button>
      )}

      {token && status === 'PENDING' && (
        <div style={{ textAlign: 'center', marginTop: '20px', padding: '20px', background: 'var(--bg-primary)', borderRadius: '12px' }}>
          <QRCodeSVG value={pairingUrl} size={200} style={{ padding: '10px', background: 'white', borderRadius: '8px' }} />
          <h4 style={{ marginTop: '15px', color: 'var(--text-primary)' }}>Scan this with your phone's camera</h4>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
            A secure connection will be established directly between your phone and this desktop.
          </p>
        </div>
      )}

      {status === 'PAIRED' && (
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px' }}>
          <h4 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle /> Phone Connected
          </h4>
          <p className="text-secondary" style={{ marginBottom: 0 }}>
            Your phone is now acting as a scanner. Point it at a product to add it!
          </p>
        </div>
      )}

      {status === 'DISCONNECTED' && (
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px' }}>
          <h4 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <XCircle /> Connection Lost
          </h4>
          <button className="btn btn-primary btn-sm" onClick={generateSession} style={{ marginTop: '10px' }}>
            Generate New Code
          </button>
        </div>
      )}

      {scannedItems.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h4>Recent Scans (Live)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {scannedItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', borderLeft: item.type === 'Sale' ? '4px solid #3b82f6' : '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.type === 'Sale' ? <ShoppingCart size={18} color="#3b82f6" /> : <Package size={18} color="#f59e0b" />}
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.productName}</div>
                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>Added {item.quantity} units to {item.type}</div>
                  </div>
                </div>
                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {item.time.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DesktopScannerPairing;
