import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle, FileText, CheckCircle, HelpCircle } from 'lucide-react';
import { itrApi } from '../api/featureApi';
import toast from 'react-hot-toast';

function Itr4FilingTool() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [financialYear, setFinancialYear] = useState('2025');

  const [otherIncome, setOtherIncome] = useState({
    interestIncome: 0,
    salaryIncome: 0
  });

  const [taxDetails, setTaxDetails] = useState({
    pan: '',
    aadhaar: '',
    dob: '',
    businessStatus: 'Individual',
    address: '',
    pinCode: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfsc: ''
  });

  const [taxesPaid, setTaxesPaid] = useState({
    tds: 0,
    advanceTax: 0,
    selfAssessment: 0
  });

  const [verification, setVerification] = useState({
    name: '',
    capacity: 'Self',
    place: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [financialYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await itrApi.getData(financialYear);
      setData(response.data);
      if (response.data.business) {
        setVerification(prev => ({ ...prev, name: response.data.business.ownerName }));
        setTaxDetails({
          pan: response.data.business.pan || '',
          aadhaar: response.data.business.aadhaar || '',
          dob: response.data.business.dob || '',
          businessStatus: response.data.business.businessStatus || 'Individual',
          address: response.data.business.address || '',
          pinCode: response.data.business.pinCode || '',
          bankName: response.data.business.bankName || '',
          bankAccountNumber: response.data.business.bankAccountNumber || '',
          bankIfsc: response.data.business.bankIfsc || ''
        });
      }
    } catch (err) {
      toast.error('Failed to load ITR data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePresumptive = () => {
    if (!data) return 0;
    const digitalInc = (data.digitalTurnover * 0.06);
    const cashInc = (data.cashTurnover * 0.08);
    return digitalInc + cashInc;
  };

  const handleGenerateJSON = () => {
    if (!data) return;

    const itrJson = {
      FormName: "ITR-4",
      AssessmentYear: "2026-27",
      FinancialYear: `${financialYear}-${parseInt(financialYear)+1}`,
      PersonalInfo: {
        AssesseeName: data.business.ownerName,
        BusinessName: data.business.businessName,
        PAN: taxDetails.pan,
        Aadhaar: taxDetails.aadhaar,
        DOB: taxDetails.dob,
        Status: taxDetails.businessStatus,
        Address: taxDetails.address,
        PinCode: taxDetails.pinCode,
        Mobile: data.business.phone
      },
      FilingStatus: {
        FilingSection: "139(1)",
        TaxRegime: "New Regime"
      },
      BusinessDetails: {
        NatureOfBusiness: data.business.natureOfBusiness,
        GSTIN: data.business.gstin || "Not Applicable"
      },
      ScheduleBP_PresumptiveIncome: {
        GrossTurnover: {
          DigitalReceipts: data.digitalTurnover,
          CashReceipts: data.cashTurnover,
          TotalReceipts: data.digitalTurnover + data.cashTurnover
        },
        PresumptiveProfit: {
          DigitalProfit_6Percent: data.digitalTurnover * 0.06,
          CashProfit_8Percent: data.cashTurnover * 0.08,
          TotalBusinessIncome: calculatePresumptive()
        }
      },
      OtherIncome: otherIncome,
      TaxesPaid: taxesPaid,
      BankDetails: {
        BankName: taxDetails.bankName,
        AccountNumber: taxDetails.bankAccountNumber,
        IFSC: taxDetails.bankIfsc
      },
      Verification: verification
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(itrJson, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ITR4_${taxDetails.pan || 'DRAFT'}_AY2026-27.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast.success('JSON Reference generated!');
  };

  if (loading) return <div className="page-container">Loading...</div>;
  if (!data) return <div className="page-container">Error loading data.</div>;

  const totalReceipts = data.digitalTurnover + data.cashTurnover;
  const marginWarning = calculatePresumptive() > 0 && (calculatePresumptive() / totalReceipts) < 0.06;

  return (
    <div className="page-container animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">ITR-4 Reference Generator</h1>
          <p className="text-secondary" style={{ marginTop: '5px' }}>Sugam (Presumptive Taxation u/s 44AD)</p>
        </div>
        <select 
          className="form-control" 
          value={financialYear} 
          onChange={(e) => setFinancialYear(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="2025">FY 2025-26 (AY 2026-27)</option>
          <option value="2024">FY 2024-25 (AY 2025-26)</option>
        </select>
      </div>

      <div className="card" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', marginBottom: '20px' }}>
        <div style={{ padding: '15px' }}>
          <h4 style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
            <HelpCircle size={18} /> How this works
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li>This tool generates a <strong>reference JSON</strong>. It does NOT submit directly to the government.</li>
            <li>Your team must open the official Income Tax ITR-4 offline utility, key in these values, validate, and upload.</li>
            <li>GSTIN is optional for filing ITR-4 unless explicitly mandated.</li>
          </ul>
        </div>
      </div>

      {marginWarning && (
        <div className="card" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', marginBottom: '20px' }}>
          <div style={{ padding: '15px' }}>
            <h4 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
              <AlertTriangle size={18} /> Margin Warning
            </h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              If the business's real profit margin is under 6-8% of turnover (common in thin-margin kirana trade), presumptive taxation may overstate their tax liability. <strong>Flag this business for review with a tax advisor before filing.</strong>
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Left Column: Data Review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card">
            <h3 className="form-section-title">A. Assessee Identity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
              <div><strong>Name:</strong> {data.business.ownerName}</div>
              <div><strong>Business:</strong> {data.business.businessName}</div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">PAN</label>
                <input type="text" value={taxDetails.pan} onChange={e => setTaxDetails({...taxDetails, pan: e.target.value.toUpperCase()})} placeholder="ABCDE1234F" style={{ padding: '6px', width: '100%' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Aadhaar</label>
                <input type="text" value={taxDetails.aadhaar} onChange={e => setTaxDetails({...taxDetails, aadhaar: e.target.value})} placeholder="12 digits" style={{ padding: '6px', width: '100%' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Status</label>
                <select value={taxDetails.businessStatus} onChange={e => setTaxDetails({...taxDetails, businessStatus: e.target.value})} style={{ padding: '6px', width: '100%' }}>
                  <option value="Individual">Individual</option>
                  <option value="HUF">HUF</option>
                  <option value="Firm">Firm</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">DOB / Incorporation</label>
                <input type="date" value={taxDetails.dob} onChange={e => setTaxDetails({...taxDetails, dob: e.target.value})} style={{ padding: '6px', width: '100%' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '0', gridColumn: 'span 2' }}>
                <label className="form-label">Full Address</label>
                <input type="text" value={taxDetails.address} onChange={e => setTaxDetails({...taxDetails, address: e.target.value})} style={{ padding: '6px', width: '100%' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">PIN Code</label>
                <input type="text" value={taxDetails.pinCode} onChange={e => setTaxDetails({...taxDetails, pinCode: e.target.value})} style={{ padding: '6px', width: '100%' }} />
              </div>
            </div>
            <p className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '10px' }}>
              Make sure PAN format is valid (5 letters, 4 numbers, 1 letter) and Aadhaar is 12 digits.
            </p>
          </div>

          <div className="card">
            <h3 className="form-section-title">D. Turnover (Section 44AD)</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Digital Receipts (UPI/Card)</span>
              <strong>₹{data.digitalTurnover.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Cash Receipts</span>
              <strong>₹{data.cashTurnover.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <span>Total Gross Turnover</span>
              <strong>₹{totalReceipts.toFixed(2)}</strong>
            </div>
            <p className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '10px' }}>
              Digital receipts are presumed to have a 6% profit margin, while cash receipts have an 8% profit margin. The system has automatically calculated this split from the sales data.
            </p>
          </div>

          <div className="card">
            <h3 className="form-section-title">Presumptive Income Calculation</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>6% of Digital (₹{data.digitalTurnover.toFixed(2)})</span>
              <strong>₹{(data.digitalTurnover * 0.06).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>8% of Cash (₹{data.cashTurnover.toFixed(2)})</span>
              <strong>₹{(data.cashTurnover * 0.08).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', color: '#10b981', fontSize: '1.1rem' }}>
              <span><strong>Total Business Income (BP)</strong></span>
              <strong>₹{calculatePresumptive().toFixed(2)}</strong>
            </div>
          </div>

        </div>

        {/* Right Column: Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card">
            <h3 className="form-section-title">E. Other Income (Optional)</h3>
            <div className="form-group">
              <label className="form-label">Interest Income (Savings/FD)</label>
              <input type="number" value={otherIncome.interestIncome} onChange={e => setOtherIncome({...otherIncome, interestIncome: Number(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label">Salary Income (If Any)</label>
              <input type="number" value={otherIncome.salaryIncome} onChange={e => setOtherIncome({...otherIncome, salaryIncome: Number(e.target.value)})} />
            </div>
            <p className="text-secondary" style={{ fontSize: '0.8rem' }}>ITR-4 allows this if total income stays under ₹50 lakh and only 1 house property.</p>
          </div>

          <div className="card">
            <h3 className="form-section-title">F. Tax Already Paid</h3>
            <div className="form-group">
              <label className="form-label">TDS Deducted</label>
              <input type="number" value={taxesPaid.tds} onChange={e => setTaxesPaid({...taxesPaid, tds: Number(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label">Advance Tax Paid</label>
              <input type="number" value={taxesPaid.advanceTax} onChange={e => setTaxesPaid({...taxesPaid, advanceTax: Number(e.target.value)})} />
            </div>
          </div>

          <div className="card">
            <h3 className="form-section-title">G. Bank Details (For Refund)</h3>
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input type="text" value={taxDetails.bankName} onChange={e => setTaxDetails({...taxDetails, bankName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input type="text" value={taxDetails.bankAccountNumber} onChange={e => setTaxDetails({...taxDetails, bankAccountNumber: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">IFSC Code</label>
              <input type="text" value={taxDetails.bankIfsc} onChange={e => setTaxDetails({...taxDetails, bankIfsc: e.target.value.toUpperCase()})} />
            </div>
          </div>

          <div className="card">
            <h3 className="form-section-title">H. Verification</h3>
            <div className="form-group">
              <label className="form-label">Place of Filing</label>
              <input type="text" value={verification.place} onChange={e => setVerification({...verification, place: e.target.value})} placeholder="e.g. Mumbai" />
            </div>
          </div>

        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
        <button className="btn btn-primary btn-lg" onClick={handleGenerateJSON} style={{ width: '300px' }}>
          <FileText size={20} /> Generate ITR-4 Reference JSON
        </button>
      </div>

      <div className="card" style={{ marginTop: '30px', textAlign: 'center' }}>
        <h3 className="form-section-title" style={{ justifyContent: 'center' }}>Next Steps Checklist</h3>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle size={18} color="#10b981"/> Download the JSON file above</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle size={18} color="#10b981"/> Open the official ITR-4 Offline Utility</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle size={18} color="#10b981"/> Manually enter or copy-paste these values</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle size={18} color="#10b981"/> Validate all schedules in the utility</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle size={18} color="#10b981"/> Upload to Income Tax Portal & e-verify</div>
        </div>
      </div>

    </div>
  );
}

export default Itr4FilingTool;
