import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Last Updated: April 27, 2026</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-slate-100 shadow-sm space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Lock className="text-emerald-500" size={24} /> 1. Information We Collect
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4">
              <p>
                At PayOneAfrica, we collect information that is necessary to provide our fintech services, comply with regulatory requirements, and ensure the security of your transactions.
              </p>
              <ul className="list-disc pl-6 space-y-2 font-medium">
                <li>Personal identifiers (Name, Email, Phone Number)</li>
                <li>Business information (Registration numbers, Tax IDs)</li>
                <li>Financial details (Bank account numbers, transaction history)</li>
                <li>Identification documents for KYC (Passport, Driver's License)</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Eye className="text-emerald-500" size={24} /> 2. How We Use Your Data
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Your data is primarily used to facilitate cross-border payments, verify your business identity, and prevent fraudulent activities on our platform. We also use aggregated, non-identifying data to improve our processing algorithms and user experience.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Shield className="text-emerald-500" size={24} /> 3. Data Protection
            </h2>
            <p className="text-slate-600 leading-relaxed">
              We employ industry-standard encryption (AES-256) for data at rest and TLS 1.3 for all data in transit. Our servers are hosted in highly secure Tier-IV data centers with 24/7 monitoring and strict access controls.
            </p>
          </section>

          <section className="space-y-4">
             <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <FileText className="text-emerald-500" size={24} /> 4. Third-Party Sharing
            </h2>
            <p className="text-slate-600 leading-relaxed">
              We do not sell your data to advertisers. We only share data with licensed financial institutions, payment processors, and regulatory bodies as required to execute your transactions and comply with Anti-Money Laundering (AML) laws.
            </p>
          </section>

          <div className="pt-12 border-t border-slate-100 italic text-slate-400 text-sm">
            For any questions regarding our privacy practices, please contact our Data Protection Officer at privacy@payoneafrica.com.
          </div>
        </div>
      </div>
    </div>
  );
}
