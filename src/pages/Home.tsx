import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Globe, ArrowRight, CheckCircle2, ChevronRight, BarChart3, Database } from 'lucide-react';

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48">
        <div className="absolute top-0 right-0 -z-10 opacity-30 pointer-events-none">
          <div className="w-[1000px] h-[1000px] bg-gradient-to-br from-emerald-100 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live across 54 African countries
              </div>
              <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 mb-6 leading-[1.1]">
                Payment infrastructure <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">
                  for African scale.
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed">
                PayOneAfrica provides the APIs and tools merchants need to accept payments, manage subscriptions, and send payouts across the continent with localized support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  Start Integration <ArrowRight size={20} />
                </Link>
                <Link
                  to="/docs"
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold text-lg hover:border-emerald-600 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  View Documentation
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 glass rounded-3xl border border-slate-200 shadow-2xl p-4 bg-white/50">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200"
                  alt="Dashboard Preview"
                  className="rounded-2xl shadow-sm border border-slate-100"
                />
                
                {/* Floating elements */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden md:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Payment Received</div>
                      <div className="text-lg font-extrabold text-slate-900">+₦250,000.00</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-100/50 rounded-full blur-[100px] -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats/Logos */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-12">Trusted by 10,000+ businesses across Africa</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
            {['GTBank', 'M-Pesa', 'Flutterwave', 'Interswitch', 'Absa', 'Nedbank'].map((name) => (
              <span key={name} className="text-3xl font-black text-slate-300 italic">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-slate-950 mb-6">Designed for the unique African market</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We've built all the primitives you need to accept any payment method, in any currency, with full compliance.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="text-amber-500" />,
              title: "Instant Verification",
              desc: "Real-time payment confirmation for mobile money, cards, and bank transfers."
            },
            {
              icon: <Globe className="text-emerald-500" />,
              title: "Cross-Border Payouts",
              desc: "Settle in local or international currencies with automated currency conversion."
            },
            {
              icon: <ShieldCheck className="text-blue-500" />,
              title: "Fraud Prevention",
              desc: "Advanced machine learning detects suspicious activity specific to regional patterns."
            },
            {
              icon: <Database className="text-purple-500" />,
              title: "Compliance Ready",
              desc: "Built-in KYC and AML tools designed for African regulatory environments."
            },
            {
              icon: <BarChart3 className="text-rose-500" />,
              title: "Deep Analytics",
              desc: "Understand your customer behavior with detailed transaction level reporting."
            },
            {
              icon: <Database className="text-indigo-500" />,
              title: "Single API",
              desc: "Integrate once and get access to all current and future regional payment methods."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto rounded-[3rem] bg-emerald-600 p-12 md:p-24 relative overflow-hidden text-center text-white">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              Ready to scale your business <br /> in Africa?
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link to="/register" className="px-10 py-5 bg-white text-emerald-600 rounded-2xl font-black text-xl hover:bg-slate-100 shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all">
                Create Free Account
              </Link>
              <Link to="/contact" className="px-10 py-5 bg-emerald-700 text-white border border-emerald-500 rounded-2xl font-black text-xl hover:bg-emerald-800 transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
      </section>
    </div>
  );
}
