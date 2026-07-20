import Link from 'next/link';
import Image from 'next/image';
import { FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>

       <nav className="relative z-50 p-6 flex justify-between items-center max-w-7xl mx-auto">
         <Link href="/" className="flex items-center gap-3">
            <Image
              src="/tradetaperLogo.png"
              alt="TradeTaper"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
              TradeTaper
            </span>
         </Link>
         <Link href="/" className="text-slate-400 hover:text-white transition-colors">Back to Home</Link>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-start">
            
            {/* Contact Info */}
            <div className="space-y-8">
                <div>
                   <h1 className="text-5xl font-bold mb-6">Let&apos;s <span className="text-gradient-emerald">Connect</span></h1>
                   <p className="text-slate-400 text-lg leading-relaxed">
                       Have a question about our enterprise solutions or need support? Our team is ready to help you optimize your trading infrastructure.
                   </p>
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-xl flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <FaEnvelope className="text-emerald-400 text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Email Us</h3>
                            <p className="text-slate-400">support@tradetaper.com</p>
                            <p className="text-slate-400">sales@tradetaper.com</p>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-xl flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                            <FaMapMarkerAlt className="text-teal-400 text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">HQ</h3>
                            <p className="text-slate-400">Rayasandra, Bengaluru 560099, India</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Channels */}
            <div className="glass-card p-8 rounded-2xl relative">
                {/* Glow effect specific to form */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-2xl"></div>
                
                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Send us a message</h3>
                <p className="relative z-10 text-slate-300 mb-6 leading-relaxed">
                  For the fastest response, email us directly with your account email, plan tier, and issue details.
                </p>

                <div className="relative z-10 space-y-4">
                  <a
                    href="mailto:support@tradetaper.com?subject=TradeTaper%20Support%20Request"
                    className="btn-3d btn-primary-3d block w-full text-center"
                  >
                    Email Support
                  </a>
                  <a
                    href="mailto:sales@tradetaper.com?subject=TradeTaper%20Sales%20Inquiry"
                    className="btn-3d btn-secondary-3d block w-full text-center"
                  >
                    Contact Sales
                  </a>
                  <p className="text-xs text-slate-400">
                    Support requests are prioritized by impact and account risk level.
                  </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
