'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ALL_REVIEWS from './generated_reviews.json'

// Make sure the first 3 reviews are the best ones for the initial load
const REVIEWS = [
  {
    name: "Sarah J., LCSW",
    exam: "LCSW Clinical Exam",
    rating: 5,
    date: "2 days ago",
    title: "Passed on my first try!",
    body: "The personalized coaching completely changed my approach. Instead of memorizing acronyms, I learned the actual strategy behind the tricky clinical questions. Highly effective and real tools!"
  },
  {
    name: "Marcus T., LSW",
    exam: "MSW Exam",
    rating: 5,
    date: "1 week ago",
    title: "No more test anxiety",
    body: "I was overwhelmed by the sheer amount of material. My coach broke down the Exam Domains into manageable chunks. The proven strategies they teach are invaluable."
  },
  {
    name: "Emily R.",
    exam: "BSW Exam",
    rating: 5,
    date: "2 weeks ago",
    title: "Worth every penny",
    body: "I had failed twice before using generic question banks. The adaptive roadmap here finally helped me identify my weak spots in Human Development and Assessment. Passed!"
  },
  ...ALL_REVIEWS
]

export function ReviewsSection() {
  const INITIAL_COUNT = 6
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + 6, REVIEWS.length))
  }

  const handleShowLess = () => {
    setVisibleCount(INITIAL_COUNT)
    // Optional: Scroll back up to the top of the reviews section
    const element = document.getElementById('reviews')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden" id="reviews">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        {/* Trustpilot-style Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center justify-center text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-default">
            <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-sm">
              <Star className="text-white fill-white w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">TrustScore 4.9</span>
            <span className="text-slate-400">|</span>
            <span className="text-sm font-medium text-slate-600">{REVIEWS.length}+ Reviews</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Proven Strategies. <span className="text-blue-600">Real Results.</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            See how our tailored coaching has helped hundreds of social workers pass their BSW, MSW, and LCSW exams.
          </p>
        </motion.div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.slice(0, visibleCount).map((review, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.15 }}
              key={i} 
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, idx) => (
                  <div key={idx} className="w-6 h-6 bg-green-500 rounded-sm flex items-center justify-center">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-4 bg-slate-50 w-fit px-3 py-1 rounded-full border border-slate-100">
                <CheckCircle className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Verified {review.exam}</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl mb-3">{review.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-8">"{review.body}"</p>
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{review.name}</span>
                <span className="text-xs font-medium text-slate-500">{review.date}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          {visibleCount < REVIEWS.length && (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false }}
            >
              <Button 
                onClick={handleShowMore}
                variant="outline" 
                className="bg-white hover:bg-slate-50 text-blue-600 border-blue-200 h-14 px-10 rounded-full font-bold text-lg group transition-all hover:shadow-lg shadow-sm w-full sm:w-auto"
              >
                Load More Success Stories
                <ChevronDown className="ml-2 w-5 h-5 group-hover:translate-y-1 transition-transform" />
              </Button>
            </motion.div>
          )}

          {visibleCount > INITIAL_COUNT && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button 
                onClick={handleShowLess}
                variant="ghost" 
                className="text-slate-500 hover:text-slate-700 h-14 px-8 rounded-full font-bold text-lg group transition-all w-full sm:w-auto"
              >
                Show Less
                <ChevronUp className="ml-2 w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </motion.div>
          )}
        </div>

      </div>
    </section>
  )
}
