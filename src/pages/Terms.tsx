import React from 'react';
import { Gavel, Scale, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-6">
            <Gavel size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4">Terms & Conditions</h1>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Effective Date: April 27, 2026</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-slate-100 shadow-sm space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Scale className="text-amber-500" size={24} /> 1. Acceptance of Terms
            </h2>
            <p className="text-slate-600 leading-relaxed">
              By accessing or using the PayOneAfrica platform, you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, do not use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <CheckCircle className="text-amber-500" size={24} /> 2. KYC & Merchant Verification
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4">
              <p>
                All merchants must undergo a mandatory Know Your Customer (KYC) and Know Your Business (KYB) verification process. PayOneAfrica reserves the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 font-medium">
                <li>Reject any application without providing specific reasons.</li>
                <li>Request additional documentation at any time.</li>
                <li>Suspend accounts found providing false or misleading information.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <AlertTriangle className="text-amber-500" size={24} /> 3. Prohibited Activities
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Merchants are strictly prohibited from using PayOneAfrica to process payments for illegal substances, unlicensed gambling, adult content, or any activities flagged by international anti-money laundering (AML) organizations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Scale className="text-amber-500" size={24} /> 4. Fees and Settlements
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Processing fees are deducted at the point of transaction. Settlements are processed according to the merchant's tier and standing. PayOneAfrica reserves the right to hold funds for up to 90 days in the event of suspected fraud or high chargeback rates.
            </p>
          </section>

          <div className="pt-12 border-t border-slate-100 italic text-slate-400 text-sm">
            These terms are governed by the laws of the jurisdictions in which PayOneAfrica operates. Disputes shall be resolved through binding arbitration.
          </div>
        </div>
      </div>
    </div>
  );
}
