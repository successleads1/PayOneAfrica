import { motion } from 'motion/react';
import { Book, Code, Terminal, Zap, Puzzle, Bell } from 'lucide-react';

export default function Docs() {
  const sections = [
    {
      title: "Authentication",
      icon: <Terminal className="text-emerald-500" />,
      content: "All requests must include your Live API Key in the X-API-Key header. Keys can be found in your dashboard under Developer settings."
    },
    {
      title: "Creating Payments",
      icon: <Zap className="text-amber-500" />,
      content: "Perform a POST request to /api/payments/create with details like amount, currency (NGN, ZAR, KES), and customer data."
    },
    {
      title: "Webhooks",
      icon: <Bell className="text-blue-500" />,
      content: "Listen for real-time events. We'll send a POST request with JSON payload for payment.success and payment.failed events."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32">
      <div className="max-w-3xl mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold mb-6">
          <Book size={16} /> API Reference v1.0
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
          Let's build the future of <span className="text-emerald-600">African Fintech</span> together.
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed font-medium">
          Whether you're building a marketplace, a SaaS platform, or local delivery service, PayOneAfrica provides the robust infrastructure you need.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-20">
        {sections.map((sec, i) => (
          <div key={i} className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-8">
              {sec.icon}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{sec.title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              {sec.content}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative">
        <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Code size={20} />
              </div>
              <h2 className="text-3xl font-black">Interactive Integration</h2>
            </div>
            <p className="text-slate-400 text-lg font-medium mb-10 leading-relaxed">
              Our SDKs are available in Node.js, Python, PHP and Go. Integrate with just a few lines of code and start accepting payments in minutes.
            </p>
            <div className="flex items-center gap-6">
              <button className="px-8 py-4 bg-emerald-600 rounded-2xl font-bold hover:bg-emerald-700 transition-all">
                Download SDK
              </button>
              <button className="text-sm font-bold border-b-2 border-emerald-500 pb-1">
                View GitHub Repos
              </button>
            </div>
          </div>

          <div className="bg-black/30 p-8 rounded-3xl border border-white/5 font-mono text-sm leading-relaxed text-emerald-400 overflow-x-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <p><span className="text-purple-400">const</span> poa = <span className="text-yellow-400">require</span>(<span className="text-emerald-200">'payoneafrica-node'</span>);</p>
            <p><span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> poa.<span className="text-blue-300">Client</span>(<span className="text-emerald-200">'YOUR_API_KEY'</span>);</p>
            <br />
            <p><span className="text-slate-500">// Initialize a payment</span></p>
            <p><span className="text-purple-400">const</span> payment = <span className="text-slate-300">await</span> client.payments.<span className="text-blue-300">create</span>({`{`}</p>
            <p className="pl-4">amount: <span className="text-amber-400">1500</span>,</p>
            <p className="pl-4">currency: <span className="text-emerald-200">'ZAR'</span>,</p>
            <p className="pl-2">{`}`});</p>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}
