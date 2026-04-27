import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../lib/firebase';
import { CreditCard, ArrowRight, Building2, UserCircle, Landmark, ShieldCheck, Upload, FileText } from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [idFile, setIdFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    registrationNumber: '',
    taxNumber: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchCode: '',
  });

  const validateStep = (currentStep: number) => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (currentStep >= 1) {
      if (!formData.email) errors.email = 'Email is required';
      else if (!emailRegex.test(formData.email)) errors.email = 'Invalid email format';
      if (!formData.password) errors.password = 'Password is required';
      else if (formData.password.length < 8) errors.password = 'Minimum 8 characters required';
    }
    
    if (currentStep >= 2) {
      if (!formData.businessName) errors.businessName = 'Business name is required';
      if (!formData.registrationNumber) errors.registrationNumber = 'Registration number is required';
      if (!formData.taxNumber) errors.taxNumber = 'Tax number is required';
      if (!idFile) errors.idFile = 'Verification document is required';
    }

    if (currentStep >= 3) {
      if (!formData.bankName) errors.bankName = 'Bank name is required';
      if (!formData.accountNumber) errors.accountNumber = 'Account number is required';
      else if (!/^\d+$/.test(formData.accountNumber)) errors.accountNumber = 'Must be digits only';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdFile(e.target.files[0]);
      if (validationErrors.idFile) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.idFile;
          return newErrors;
        });
      }
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    
    setLoading(true);
    setError('');

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      let idDocumentUrl = '';
      
      // 2. Upload ID File if provided
      if (idFile) {
        const fileRef = ref(storage, `merchants/${user.uid}/id_document_${Date.now()}`);
        const uploadResult = await uploadBytes(fileRef, idFile);
        idDocumentUrl = await getDownloadURL(uploadResult.ref);
      }

      // 3. Call our API to create merchant record in Firestore
      const response = await fetch('/api/merchants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.uid,
          businessName: formData.businessName,
          registrationNumber: formData.registrationNumber,
          taxNumber: formData.taxNumber,
          idDocumentUrl,
          bankAccount: {
            accountName: formData.accountName,
            accountNumber: formData.accountNumber,
            bankName: formData.bankName,
            branchCode: formData.branchCode,
          },
        }),
      });

      if (!response.ok) throw new Error('Registration failed on server');

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">P</div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 border-b-2 border-emerald-500 pb-0.5">PayOneAfrica</span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Create your merchant account</h2>
        <p className="mt-1 text-slate-500 text-sm">Start accepting payments across the continent</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-10 px-8 rounded-xl border border-slate-200 shadow-sm shadow-slate-100">
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-12 px-2">
            {[
              { num: 1, label: 'Access' },
              { num: 2, label: 'KYC' },
              { num: 3, label: 'Banking' }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all border-2 ${step >= s.num ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                    {s.num}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.num ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</span>
                </div>
                {idx < 2 && (
                  <div className="flex-1 px-4 mb-6">
                    <div className={`h-1 rounded-full transition-all duration-500 ${step > idx + 1 ? 'bg-emerald-600' : 'bg-slate-100'}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {error}
              </div>
            )}

            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                    <UserCircle size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Account Credentials</h4>
                    <p className="text-[10px] opacity-70">Create your login credentials</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.email ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-emerald-50'} focus:ring-4 outline-none text-sm transition-all`}
                    placeholder="name@company.com"
                  />
                  {validationErrors.email && <p className="mt-1.5 ml-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider">{validationErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.password ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-emerald-50'} focus:ring-4 outline-none text-sm transition-all`}
                    placeholder="••••••••"
                  />
                  {validationErrors.password && <p className="mt-1.5 ml-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider">{validationErrors.password}</p>}
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] mt-8 shadow-xl shadow-slate-200"
                >
                  Continue to KYC <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                 <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                    <Building2 size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Business KYC</h4>
                    <p className="text-[10px] opacity-70">Regulatory compliance details</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.businessName ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-emerald-50'} focus:ring-4 outline-none text-sm transition-all`}
                    placeholder="Africa Tech Solutions Ltd"
                  />
                  {validationErrors.businessName && <p className="mt-1.5 ml-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider">{validationErrors.businessName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 text-xs">Reg. Number</label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border ${validationErrors.registrationNumber ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-emerald-50'} focus:ring-4 outline-none text-sm transition-all`}
                      placeholder="2021/100/45"
                    />
                    {validationErrors.registrationNumber && <p className="mt-1.5 ml-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider">{validationErrors.registrationNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 text-xs">Tax Number</label>
                    <input
                      type="text"
                      name="taxNumber"
                      value={formData.taxNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border ${validationErrors.taxNumber ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-emerald-50'} focus:ring-4 outline-none text-sm transition-all`}
                      placeholder="9876543210"
                    />
                    {validationErrors.taxNumber && <p className="mt-1.5 ml-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider">{validationErrors.taxNumber}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">ID / Passport Document</label>
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${validationErrors.idFile ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 hover:bg-slate-50'} rounded-xl cursor-pointer transition-colors shadow-sm`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      {idFile ? (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                          <FileText size={20} />
                          <span className="text-[11px] font-black uppercase tracking-wider">{idFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 mb-2 text-slate-400" />
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Click to upload document</p>
                          <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-tight">PDF, PNG, JPG (max. 10MB)</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                  </label>
                  {validationErrors.idFile && <p className="mt-1.5 ml-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider">{validationErrors.idFile}</p>}
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-[2] py-4 bg-slate-900 text-white rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
                  >
                    Banking Setup <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                 <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                    <Landmark size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Settlement Account</h4>
                    <p className="text-[10px] opacity-70">Receive your daily payouts</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.bankName ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-emerald-50'} focus:ring-4 outline-none text-sm transition-all`}
                    placeholder="Access Bank"
                  />
                  {validationErrors.bankName && <p className="mt-1.5 ml-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider">{validationErrors.bankName}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.accountNumber ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-emerald-50'} focus:ring-4 outline-none text-sm transition-all`}
                    placeholder="0123456789"
                  />
                  {validationErrors.accountNumber && <p className="mt-1.5 ml-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider">{validationErrors.accountNumber}</p>}
                </div>
                <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl mb-6 border border-emerald-100 shadow-sm shadow-emerald-50">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
                    <ShieldCheck className="text-emerald-600" size={18} />
                  </div>
                  <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-tight leading-normal">
                    Secure verification. Your data is encrypted according to <span className="text-emerald-600 underline">ISO 27001</span> and regional data sovereignty laws.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : 'Join PayOneAfrica'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed">
            By clicking "Join PayOneAfrica", you agree to our <Link to="/terms" className="text-slate-900 underline font-black">Terms</Link> and <Link to="/privacy" className="text-slate-900 underline font-black">Privacy Policy</Link>
          </div>

          <div className="mt-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
            Already have an account? <Link to="/login" className="text-emerald-600 font-bold hover:underline ml-1">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
