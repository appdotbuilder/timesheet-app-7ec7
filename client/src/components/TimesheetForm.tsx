import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateTimesheetEntryInput } from '../../../server/src/schema';

export function TimesheetForm() {
  const [formData, setFormData] = useState<CreateTimesheetEntryInput>({
    user_name: '',
    project_name: '',
    task_description: '',
    hours_worked: 0,
    entry_date: new Date()
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await trpc.createTimesheetEntry.mutate(formData);
      setMessage({ type: 'success', text: '✅ Timesheet entry created successfully!' });
      
      // Reset form
      setFormData({
        user_name: '',
        project_name: '',
        task_description: '',
        hours_worked: 0,
        entry_date: new Date()
      });
    } catch (error) {
      console.error('Failed to create timesheet entry:', error);
      setMessage({ type: 'error', text: 'Failed to create timesheet entry. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="space-y-6">
        {message && (
          <Alert className={`border-l-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-700' 
              : 'bg-red-50 border-red-500 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className="font-medium">
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="user_name" className="text-sm font-medium text-gray-700">
              👤 User Name
            </Label>
            <Input
              id="user_name"
              value={formData.user_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateTimesheetEntryInput) => ({ ...prev, user_name: e.target.value }))
              }
              placeholder="Enter your name"
              required
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_name" className="text-sm font-medium text-gray-700">
              📁 Project Name
            </Label>
            <Input
              id="project_name"
              value={formData.project_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateTimesheetEntryInput) => ({ ...prev, project_name: e.target.value }))
              }
              placeholder="Enter project name"
              required
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="task_description" className="text-sm font-medium text-gray-700">
              📝 Task Description
            </Label>
            <Textarea
              id="task_description"
              value={formData.task_description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateTimesheetEntryInput) => ({ ...prev, task_description: e.target.value }))
              }
              placeholder="Describe what you worked on..."
              required
              rows={3}
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours_worked" className="text-sm font-medium text-gray-700">
              ⏱️ Hours Worked
            </Label>
            <Input
              id="hours_worked"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={formData.hours_worked || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateTimesheetEntryInput) => ({ 
                  ...prev, 
                  hours_worked: parseFloat(e.target.value) || 0 
                }))
              }
              placeholder="e.g., 8.5"
              required
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry_date" className="text-sm font-medium text-gray-700">
              📅 Entry Date
            </Label>
            <Input
              id="entry_date"
              type="date"
              value={formData.entry_date.toISOString().split('T')[0]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateTimesheetEntryInput) => ({ 
                  ...prev, 
                  entry_date: new Date(e.target.value) 
                }))
              }
              required
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Creating Entry...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Log Work Hours
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}