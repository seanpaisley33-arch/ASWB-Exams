'use client'

import { useState } from 'react'
import { submitScheduleRequest } from '@/app/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, User, Mail, BookOpen, Calendar, Phone, MapPin, Clock, Target, AlertCircle, Sparkles } from 'lucide-react'

export function IntakeForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [examType, setExamType] = useState('LCSW')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await submitScheduleRequest(formData)
    
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else if (result?.id) {
      const existing = JSON.parse(localStorage.getItem('recent_sessions') || '[]')
      const updated = [result.id, ...existing.filter((id: string) => id !== result.id)].slice(0, 3)
      localStorage.setItem('recent_sessions', JSON.stringify(updated))
      
      window.location.href = `/chat/${result.id}`
    }
  }

  const inputStyles = "h-12 bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 transition-all duration-300 shadow-sm rounded-xl"
  const labelStyles = "text-slate-700 font-semibold text-sm flex items-center gap-2 mb-1.5"
  const selectItemStyles = "py-2.5 px-4 cursor-pointer focus:bg-blue-50 focus:text-blue-700 transition-colors rounded-lg font-medium text-slate-700 my-0.5"

  return (
    <Card className="w-full max-w-xl mx-auto shadow-2xl shadow-blue-900/10 border-0 bg-white/70 backdrop-blur-2xl rounded-3xl overflow-hidden relative group">
      {/* Dynamic Top Gradient Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
      
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none group-hover:bg-purple-500/10 transition-all duration-700"></div>

      <CardHeader className="bg-white/40 border-b border-slate-100/50 pb-8 pt-10 text-center relative z-10">
        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-white">
          <Sparkles className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">Pass Your ASWB Exam with Expert Coaching</CardTitle>
        <CardDescription className="text-slate-500 text-base max-w-md mx-auto mt-3 font-medium">
          Don't let the ASWB exam hold you back. Tell us your biggest roadblocks, and our expert coaches will build a custom roadmap to help you finally pass.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-8 px-6 sm:px-10 pb-10 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label htmlFor="full_name" className={labelStyles}>
                <User className="w-4 h-4 text-blue-500" /> Full Name
              </Label>
              <Input id="full_name" name="full_name" placeholder="Jane Doe" required className={inputStyles} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className={labelStyles}>
                <Mail className="w-4 h-4 text-blue-500" /> Email Address
              </Label>
              <Input id="email" name="email" type="email" placeholder="jane@example.com" required className={inputStyles} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label htmlFor="exam_type" className={labelStyles}>
                <BookOpen className="w-4 h-4 text-indigo-500" /> Target Exam
              </Label>
              <Select name="exam_type" required value={examType} onValueChange={(val) => val && setExamType(val)}>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl p-2 bg-white/95 backdrop-blur-xl">
                  <SelectItem value="Associate" className={selectItemStyles}>Associate</SelectItem>
                  <SelectItem value="BSW" className={selectItemStyles}>BSW (Bachelors)</SelectItem>
                  <SelectItem value="MSW" className={selectItemStyles}>MSW (Masters)</SelectItem>
                  <SelectItem value="Advanced Generalist" className={selectItemStyles}>Advanced Generalist</SelectItem>
                  <SelectItem value="LCSW" className={selectItemStyles}>LCSW (Clinical)</SelectItem>
                  <SelectItem value="Other" className={selectItemStyles}>Other (Specify manually)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {examType === 'Other' ? (
              <div className="space-y-1 animate-in fade-in zoom-in duration-300">
                <Label htmlFor="other_exam_type" className={labelStyles}>
                  <Target className="w-4 h-4 text-indigo-500" /> Specify Exam Name
                </Label>
                <Input id="other_exam_type" name="other_exam_type" required className={inputStyles} placeholder="e.g. LSW, LMSW..." />
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="target_exam_date" className={labelStyles}>
                  <Calendar className="w-4 h-4 text-indigo-500" /> Target Exam Date
                </Label>
                <Input id="target_exam_date" name="target_exam_date" type="date" required className={inputStyles} />
              </div>
            )}
          </div>

          {examType === 'Other' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="target_exam_date" className={labelStyles}>
                <Calendar className="w-4 h-4 text-indigo-500" /> Target Exam Date
              </Label>
              <Input id="target_exam_date" name="target_exam_date" type="date" required className={inputStyles} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label htmlFor="phone_number" className={labelStyles}>
                <Phone className="w-4 h-4 text-purple-500" /> Phone Number
              </Label>
              <Input id="phone_number" name="phone_number" type="tel" placeholder="(555) 123-4567" className={inputStyles} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="location" className={labelStyles}>
                <MapPin className="w-4 h-4 text-purple-500" /> Location
              </Label>
              <Input id="location" name="location" placeholder="e.g. New York, USA" className={inputStyles} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
            <div className="space-y-1">
              <Label htmlFor="study_frequency" className={labelStyles}>
                <Clock className="w-4 h-4 text-blue-500" /> Study Frequency
              </Label>
              <Select name="study_frequency" required defaultValue="Daily">
                <SelectTrigger className={`bg-white ${inputStyles}`}>
                  <SelectValue placeholder="Select Frequency" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl p-2 bg-white/95 backdrop-blur-xl">
                  <SelectItem value="Daily" className={selectItemStyles}>Daily</SelectItem>
                  <SelectItem value="Weekly" className={selectItemStyles}>Weekly</SelectItem>
                  <SelectItem value="Bi-weekly" className={selectItemStyles}>Bi-weekly (Every 2 weeks)</SelectItem>
                  <SelectItem value="Monthly" className={selectItemStyles}>Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="study_hours" className={labelStyles}>
                <Target className="w-4 h-4 text-blue-500" /> Hours per Frequency
              </Label>
              <Input id="study_hours" name="study_hours" type="number" min="1" max="100" placeholder="e.g. 2" required className={`bg-white ${inputStyles}`} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="preferred_coach" className={labelStyles}>
              <User className="w-4 h-4 text-slate-500" /> Preferred Coach (Optional)
            </Label>
            <Input id="preferred_coach" name="preferred_coach" placeholder="e.g. Dr. Smith" className={inputStyles} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="roadblock_notes" className={labelStyles}>
              <AlertCircle className="w-4 h-4 text-orange-500" /> What is your biggest roadblock?
            </Label>
            <Textarea 
              id="roadblock_notes" 
              name="roadblock_notes" 
              placeholder="e.g., I struggle with recall on Human Development models, or I have severe test anxiety." 
              rows={4} 
              required 
              className="bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 transition-all duration-300 shadow-sm rounded-xl resize-none py-3"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-bold mt-4 transition-all duration-300 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 rounded-xl hover:-translate-y-0.5 border-0" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={22} /> Analyzing Profile & Generating Portal...
              </span>
            ) : (
              'Get My Custom Action Plan'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
