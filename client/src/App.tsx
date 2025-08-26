import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, FileText, BarChart3, Plus } from 'lucide-react';
import { TimesheetForm } from '@/components/TimesheetForm';
import { TimesheetList } from '@/components/TimesheetList';
import { Dashboard } from '@/components/Dashboard';
import { ReportGenerator } from '@/components/ReportGenerator';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Clock className="h-10 w-10 text-blue-600" />
            TimeTracker Pro
          </h1>
          <p className="text-gray-600 text-lg">
            Track your work hours efficiently and generate insightful reports 📊
          </p>
        </header>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg rounded-lg p-1">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="add-entry" 
              className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Entry
            </TabsTrigger>
            <TabsTrigger 
              value="entries" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all"
            >
              <Clock className="h-4 w-4" />
              All Entries
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
            >
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="add-entry" className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="h-6 w-6 text-green-500" />
                Log Work Hours
              </h2>
              <TimesheetForm />
            </div>
          </TabsContent>

          <TabsContent value="entries" className="space-y-6">
            <TimesheetList />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;