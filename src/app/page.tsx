'use client'

import { IntakeForm } from '@/components/IntakeForm'
import { FindSessionModal } from '@/components/FindSessionModal'
import { ReviewsSection } from '@/components/ReviewsSection'
import { InteractiveBackground } from '@/components/InteractiveBackground'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Shield, Zap, Target, BrainCircuit, Users, CheckCircle2, ArrowRight, TrendingUp, Clock, BookOpen } from 'lucide-react'
import { motion, Variants } from 'framer-motion'

export default function Home() {
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  }

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "ASWB Mastery",
    "url": "https://aswbcoaching.com",
    "description": "Premium coaching and preparation for the ASWB exams, including LCSW, LMSW, LSW, and BSW. Master the new format with proven strategies.",
    "offers": {
      "@type": "Offer",
      "category": "Educational service"
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-200 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InteractiveBackground />
      
      {/* Navbar */}
      <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-white/20 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-extrabold tracking-tighter text-slate-900 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-black leading-none tracking-tighter text-xl">A</span>
            </div>
            ASWB<span className="text-blue-600">Mastery</span>
          </motion.h1>
          <motion.nav 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex gap-8 text-sm font-bold text-slate-600 items-center"
          >
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
            <a href="#domains" className="hover:text-blue-600 transition-colors">Exam Domains</a>
            <a href="#reviews" className="hover:text-blue-600 transition-colors">Reviews</a>
            <div className="w-px h-6 bg-slate-200"></div>
            <FindSessionModal />
          </motion.nav>
          {/* Mobile Menu Backup */}
          <div className="md:hidden">
            <FindSessionModal />
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <main className="relative bg-white/40 backdrop-blur-3xl border-b border-slate-200 overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            <motion.div 
              initial="hidden"
              animate="show"
              variants={staggerContainer}
              className="space-y-10"
            >
              <div className="space-y-6">
                <motion.h2 variants={fadeUp} className="text-6xl lg:text-[5rem] font-black tracking-tight text-slate-900 leading-[1.05]">
                  Pass the ASWB Exam with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-shift">Personal Coach</span>
                </motion.h2>
                <motion.p variants={fadeUp} className="text-2xl text-slate-600 leading-relaxed max-w-xl font-medium">
                  Stop struggling with generic question banks. Get a custom roadmap tailored to your specific roadblocks, target date, and tier.
                </motion.p>
              </div>

              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-6">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`w-12 h-12 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center overflow-hidden z-[${10-i}] shadow-sm`}>
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i + 10}&backgroundColor=e2e8f0`} alt="Avatar" />
                    </div>
                  ))}
                </div>
                <div className="text-base font-medium text-slate-600">
                  <span className="text-slate-900 font-extrabold block text-lg">1,000+ Social Workers</span>
                  coached to licensure this year
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 50 }}
              className="lg:pl-8 relative"
            >
              <div className="absolute -inset-8 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-[3rem] transform rotate-3 -z-10 animate-pulse opacity-50"></div>
              <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-blue-900/10 border border-white p-2">
                <IntakeForm />
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900 border-b border-slate-800 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-50px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { label: "Pass Rate", value: "98%", icon: TrendingUp },
              { label: "Active Coaches", value: "25+", icon: Users },
              { label: "Avg. Response Time", value: "< 2h", icon: Clock },
              { label: "Practice Scenarios", value: "5,000+", icon: BookOpen },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="space-y-2">
                <stat.icon className="w-6 h-6 text-blue-500 mx-auto mb-3 opacity-80" />
                <div className="text-4xl font-black text-white tracking-tight">{stat.value}</div>
                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section (Trustpilot style) */}
      <ReviewsSection />

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 bg-white relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            className="text-center mb-24 space-y-6"
          >
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">How ASWBMastery Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">A frictionless, 3-step process designed to get you studying effectively within minutes.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 relative"
          >
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gradient-to-r from-blue-100 via-indigo-100 to-green-100 -translate-y-1/2 z-0 rounded-full"></div>

            {[
              { step: "1", title: "Tell Us Your Goals", desc: "Fill out our quick intake form. Tell us your exam tier, target date, and what you're struggling with the most.", icon: Target, color: "blue" },
              { step: "2", title: "Get Your Private Link", desc: "Instantly receive a secure, private workspace link. Bookmark it to resume your session anytime, anywhere.", icon: Zap, color: "indigo" },
              { step: "3", title: "Master The Material", desc: "Connect directly with an expert coach. Receive custom study plans, strategies, and roadblock busting advice.", icon: BrainCircuit, color: "green" }
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="relative z-10 flex flex-col items-center text-center group">
                <div className={`w-24 h-24 rounded-[2rem] bg-white flex items-center justify-center shadow-xl shadow-${item.color}-900/5 border-2 border-${item.color}-100 mb-8 group-hover:-translate-y-4 group-hover:scale-110 transition-all duration-500`}>
                  <item.icon className={`w-10 h-10 text-${item.color}-600`} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-4">{item.step}. {item.title}</h3>
                <p className="text-slate-600 text-lg leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Interactive Exam Domains */}
      <section id="domains" className="py-32 bg-slate-950 text-white relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: false }}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 font-bold text-sm tracking-widest uppercase">
                <Shield className="w-4 h-4" /> Comprehensive Coverage
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">We Cover Every ASWB Exam Domain</motion.h2>
              <motion.p variants={fadeUp} className="text-xl text-slate-400 leading-relaxed font-medium">
                Whether you are taking the BSW, MSW, Advanced Generalist, or LCSW exam, our coaches map your study plan directly to the official ASWB content outlines.
              </motion.p>
              
              <div className="space-y-4 pt-8">
                {[
                  { title: "Human Development & Behavior", icon: Users, desc: "Master the theories of development, diversity, and the effects of environment on human behavior." },
                  { title: "Assessment & Diagnosis", icon: BrainCircuit, desc: "Learn to apply the DSM-5 accurately and formulate biopsychosocial assessments." },
                  { title: "Psychotherapy & Interventions", icon: Zap, desc: "Understand evidence-based treatments and exactly when to apply specific clinical interventions." },
                  { title: "Professional Values & Ethics", icon: Shield, desc: "Navigate tricky ethical dilemmas, confidentiality bounds, and professional boundaries." }
                ].map((domain, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex gap-6 p-6 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:bg-slate-800 transition-colors group">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300">
                      <domain.icon className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xl text-slate-100 mb-2">{domain.title}</h4>
                      <p className="text-base text-slate-400 leading-relaxed">{domain.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative"
            >
              <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-[3rem] p-12 shadow-2xl relative z-10 animate-float">
                <h3 className="text-3xl font-black mb-6 text-white">Not sure which exam?</h3>
                <p className="text-lg text-slate-300 mb-10 leading-relaxed font-medium">
                  Every state has different licensure requirements. When you submit your intake form, simply select "Other" and type in your state's specific acronym. Your coach will handle the rest!
                </p>
                <ul className="space-y-6 mb-8">
                  {[
                    'Custom study schedules tailored to your tier', 
                    'State-specific licensure advice', 
                    'Strategies for alternative test formats'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-slate-200 text-lg font-medium">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-green-400" /> 
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Decorative Element */}
              <div className="absolute -inset-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[4rem] transform -rotate-3 opacity-20 -z-10 animate-pulse"></div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section id="faq" className="py-32 bg-white relative z-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-600 mt-6 font-medium">Everything you need to know about the coaching platform.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
          >
            <Accordion className="w-full bg-slate-50 rounded-[2rem] border border-slate-200 shadow-sm p-8">
              <AccordionItem value="item-1" className="border-b-slate-200 py-4">
                <AccordionTrigger className="text-left font-bold text-lg text-slate-900 hover:text-blue-600 hover:no-underline">How do I access my coaching session?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed pt-4 pb-2">
                  When you submit your intake form, we immediately generate a unique, secure workspace link just for you. We save this session locally on your device so you can instantly resume it by clicking "Recent Chats". If you switch devices, you just paste your unique link into the "Resume Session" modal.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-b-slate-200 py-4">
                <AccordionTrigger className="text-left font-bold text-lg text-slate-900 hover:text-blue-600 hover:no-underline">How fast will a coach respond?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed pt-4 pb-2">
                  Coaches monitor the pipeline throughout the day. Typical response times are within a few hours during normal business hours. You'll see their response the next time you open your private link.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-b-slate-200 py-4">
                <AccordionTrigger className="text-left font-bold text-lg text-slate-900 hover:text-blue-600 hover:no-underline">Do you provide practice questions?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed pt-4 pb-2">
                  Yes! While our primary focus is on teaching you the *strategy* needed to break down complex ASWB questions, coaches will frequently use real-world practice scenarios and questions tailored to your weakest domains.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border-b-0 py-4">
                <AccordionTrigger className="text-left font-bold text-lg text-slate-900 hover:text-blue-600 hover:no-underline">Can I update my target exam date later?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed pt-4 pb-2">
                  Absolutely. Inside your private Coaching Workspace, there is an "Edit Details" button. You can update your exam date, your study hours, or your current roadblocks at any time, and your coach will be notified instantly.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 bg-blue-600 text-center relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 relative z-10"
        >
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8">Ready to finally pass?</h2>
          <p className="text-2xl text-blue-100 mb-12 max-w-2xl mx-auto font-medium">Join thousands of social workers who beat the ASWB exam with our tailored coaching strategies.</p>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-50 h-16 px-10 rounded-full font-extrabold text-xl shadow-2xl shadow-blue-900/30 hover:scale-105 transition-all">
              Start Your Strategy Session <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-16">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-black text-white tracking-tighter mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold leading-none tracking-tighter text-lg">A</span>
                </div>
                ASWB<span className="text-blue-600">Mastery</span>
              </h2>
              <p className="max-w-md leading-relaxed text-base font-medium">
                Empowering social workers to pass their BSW, MSW, and LCSW exams with confidence through personalized coaching and adaptive strategy roadmaps.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Platform</h3>
              <ul className="space-y-4 text-base font-medium">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#domains" className="hover:text-white transition-colors">Exam Domains</a></li>
                <li><a href="#reviews" className="hover:text-white transition-colors">Success Stories</a></li>
                <li><a href="/admin/dashboard" className="text-blue-400 hover:text-blue-300 transition-colors">Coach Login (Admin)</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Legal</h3>
              <ul className="space-y-4 text-base font-medium">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-slate-800 text-sm flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 font-medium">
            <p>&copy; {new Date().getFullYear()} ASWBMastery Platform. All rights reserved.</p>
            <p>Not affiliated with the Association of Social Work Boards (ASWB).</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
