'use client'

import { useState } from 'react'
import { updateScheduleRequest } from '@/app/actions'
import { ScheduleRequest } from '@/lib/supabase'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Edit3 } from 'lucide-react'

export function EditRequestModal({ request }: { request: ScheduleRequest }) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  // Try to match standard exams, if not, it's 'Other'
  const standardExams = ['Associate', 'BSW', 'MSW', 'Advanced Generalist', 'LCSW']
  const initialIsOther = !standardExams.includes(request.exam_type) && request.exam_type !== ''
  const [examType, setExamType] = useState(initialIsOther ? 'Other' : request.exam_type)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('id', request.id)
    
    const result = await updateScheduleRequest(formData)
    
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsOpen(false)
      setIsLoading(false)
      // The page will automatically be revalidated by Next.js if we triggered it via a Server Action, 
      // but since we are in a client component we can just do a hard refresh or rely on the parent components.
      window.location.reload()
    }
  }

  const selectItemStyles = "py-2.5 px-4 cursor-pointer focus:bg-blue-50 focus:text-blue-700 transition-colors rounded-lg font-medium text-slate-700 my-0.5"

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl mt-4 shadow-md transition-all group">
          <Edit3 className="w-4 h-4 mr-2 text-slate-300 group-hover:text-white transition-colors" /> Edit Details
        </Button>
      } />
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-900">Update Your Details</DialogTitle>
          <DialogDescription>
            Make changes to your coaching request below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-zinc-700 font-medium">Full Name</Label>
              <Input id="full_name" name="full_name" defaultValue={request.full_name} required className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-700 font-medium">Email Address</Label>
              <Input id="email" name="email" type="email" defaultValue={request.email} required className="h-10" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="exam_type" className="text-zinc-700 font-medium">Target Exam</Label>
              <Select name="exam_type" required value={examType} onValueChange={(val) => val && setExamType(val)}>
                <SelectTrigger className="h-10">
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
              <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                <Label htmlFor="other_exam_type" className="text-zinc-700 font-medium">Specify Exam Name</Label>
                <Input id="other_exam_type" name="other_exam_type" defaultValue={initialIsOther ? request.exam_type : ''} required className="h-10" placeholder="e.g. LSW, LMSW..." />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="target_exam_date" className="text-zinc-700 font-medium">Target Exam Date</Label>
                <Input id="target_exam_date" name="target_exam_date" type="date" defaultValue={request.target_exam_date || ''} required className="h-10" />
              </div>
            )}
          </div>

          {examType === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="target_exam_date" className="text-zinc-700 font-medium">Target Exam Date</Label>
              <Input id="target_exam_date" name="target_exam_date" type="date" defaultValue={request.target_exam_date || ''} required className="h-10" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-zinc-700 font-medium">Phone Number</Label>
              <Input id="phone_number" name="phone_number" type="tel" defaultValue={request.phone_number || ''} className="h-10" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-zinc-700 font-medium">Location (State/Country)</Label>
              <Input id="location" name="location" defaultValue={request.location || ''} className="h-10" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="study_frequency" className="text-zinc-700 font-medium">Study Frequency</Label>
              <Select name="study_frequency" required defaultValue={request.study_frequency || 'Daily'}>
                <SelectTrigger className="h-10">
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
            <div className="space-y-2">
              <Label htmlFor="study_hours" className="text-zinc-700 font-medium">Hours per Frequency</Label>
              <Input id="study_hours" name="study_hours" type="number" min="1" max="100" defaultValue={request.study_hours || ''} required className="h-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_coach" className="text-zinc-700 font-medium">Preferred Coach Name (Optional)</Label>
            <Input id="preferred_coach" name="preferred_coach" defaultValue={request.preferred_coach || ''} className="h-10" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roadblock_notes" className="text-zinc-700 font-medium">What is your biggest roadblock?</Label>
            <Textarea 
              id="roadblock_notes" 
              name="roadblock_notes" 
              defaultValue={request.roadblock_notes || ''}
              rows={3} 
              required 
              className="resize-none"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
          
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
            {isLoading ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Updating...</span> : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
