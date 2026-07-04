'use client'

import { useState } from 'react'
import { submitScheduleRequest } from '@/app/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

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
      // Save ID to local storage for the Find Session modal to suggest
      const existing = JSON.parse(localStorage.getItem('recent_sessions') || '[]')
      const updated = [result.id, ...existing.filter((id: string) => id !== result.id)].slice(0, 3)
      localStorage.setItem('recent_sessions', JSON.stringify(updated))
      
      window.location.href = `/chat/${result.id}`
    }
  }

  return (
    <Card className="w-full max-w-xl mx-auto shadow-xl border-zinc-200">
      <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-6">
        <CardTitle className="text-3xl font-bold tracking-tight text-zinc-900">Start Your ASWB Journey</CardTitle>
        <CardDescription className="text-zinc-600 text-lg">
          Tell us about your goals and roadblocks, and we'll craft a custom roadmap for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-zinc-700 font-medium">Full Name</Label>
              <Input id="full_name" name="full_name" placeholder="Jane Doe" required className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-700 font-medium">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="jane@example.com" required className="h-12" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="exam_type" className="text-zinc-700 font-medium">Target Exam</Label>
              <Select name="exam_type" required value={examType} onValueChange={setExamType}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Associate">Associate</SelectItem>
                  <SelectItem value="BSW">BSW (Bachelors)</SelectItem>
                  <SelectItem value="MSW">MSW (Masters)</SelectItem>
                  <SelectItem value="Advanced Generalist">Advanced Generalist</SelectItem>
                  <SelectItem value="LCSW">LCSW (Clinical)</SelectItem>
                  <SelectItem value="Other">Other (Specify manually)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {examType === 'Other' ? (
              <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                <Label htmlFor="other_exam_type" className="text-zinc-700 font-medium">Specify Exam Name</Label>
                <Input id="other_exam_type" name="other_exam_type" required className="h-12" placeholder="e.g. LSW, LMSW..." />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="target_exam_date" className="text-zinc-700 font-medium">Target Exam Date</Label>
                <Input id="target_exam_date" name="target_exam_date" type="date" required className="h-12" />
              </div>
            )}
          </div>

          {examType === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="target_exam_date" className="text-zinc-700 font-medium">Target Exam Date</Label>
              <Input id="target_exam_date" name="target_exam_date" type="date" required className="h-12" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-zinc-700 font-medium">Phone Number</Label>
              <Input id="phone_number" name="phone_number" type="tel" placeholder="(555) 123-4567" className="h-12" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-zinc-700 font-medium">Location (State/Country)</Label>
              <Input id="location" name="location" placeholder="e.g. New York, USA" className="h-12" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="study_frequency" className="text-zinc-700 font-medium">Study Frequency</Label>
              <Select name="study_frequency" required defaultValue="Daily">
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Bi-weekly">Bi-weekly (Every 2 weeks)</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="study_hours" className="text-zinc-700 font-medium">Hours per Frequency</Label>
              <Input id="study_hours" name="study_hours" type="number" min="1" max="100" placeholder="e.g. 2" required className="h-12" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_coach" className="text-zinc-700 font-medium">Preferred Coach Name (Optional)</Label>
            <Input id="preferred_coach" name="preferred_coach" placeholder="e.g. Dr. Smith" className="h-12" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roadblock_notes" className="text-zinc-700 font-medium">What is your biggest roadblock?</Label>
            <Textarea 
              id="roadblock_notes" 
              name="roadblock_notes" 
              placeholder="e.g., I struggle with recall on Human Development models, or I have severe test anxiety." 
              rows={4} 
              required 
              className="resize-none"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
          
          <Button type="submit" className="w-full h-14 text-lg font-semibold mt-4 transition-all hover:scale-[1.02]" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={20} /> Generating Custom Portal...
              </span>
            ) : (
              'Submit Request & Get Action Plan'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
