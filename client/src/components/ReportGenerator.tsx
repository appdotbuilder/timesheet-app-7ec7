import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  FolderOpen,
  AlertCircle,
  CheckCircle2 
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { GenerateReportInput, Report } from '../../../server/src/schema';

export function ReportGenerator() {
  const [reportParams, setReportParams] = useState<GenerateReportInput>({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)), // 30 days ago
    end_date: new Date(),
    user_name: undefined,
    project_name: undefined
  });

  const [report, setReport] = useState<Report | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Clean up optional filters
      const cleanParams: GenerateReportInput = {
        start_date: reportParams.start_date,
        end_date: reportParams.end_date
      };
      if (reportParams.user_name?.trim()) {
        cleanParams.user_name = reportParams.user_name.trim();
      }
      if (reportParams.project_name?.trim()) {
        cleanParams.project_name = reportParams.project_name.trim();
      }

      const reportData = await trpc.generateReport.query(cleanParams);
      setReport(reportData);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = () => {
    if (!report) return;

    const csvContent = [
      // Header
      ['User', 'Project', 'Task', 'Hours', 'Date'].join(','),
      // Data rows
      ...report.entries.map(entry => [
        `"${entry.user_name}"`,
        `"${entry.project_name}"`,
        `"${entry.task_description}"`,
        entry.hours_worked,
        entry.entry_date.toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-report-${report.period.start_date.toISOString().split('T')[0]}-to-${report.period.end_date.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Report Parameters */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <FileText className="h-5 w-5 text-blue-500" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium text-gray-700">
                📅 Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={reportParams.start_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReportParams((prev: GenerateReportInput) => ({ 
                    ...prev, 
                    start_date: new Date(e.target.value) 
                  }))
                }
                className="border-gray-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium text-gray-700">
                📅 End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={reportParams.end_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReportParams((prev: GenerateReportInput) => ({ 
                    ...prev, 
                    end_date: new Date(e.target.value) 
                  }))
                }
                className="border-gray-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-filter" className="text-sm font-medium text-gray-700">
                👤 User Name (optional)
              </Label>
              <Input
                id="user-filter"
                placeholder="Filter by user..."
                value={reportParams.user_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReportParams((prev: GenerateReportInput) => ({ 
                    ...prev, 
                    user_name: e.target.value || undefined 
                  }))
                }
                className="border-gray-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-filter" className="text-sm font-medium text-gray-700">
                📁 Project Name (optional)
              </Label>
              <Input
                id="project-filter"
                placeholder="Filter by project..."
                value={reportParams.project_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReportParams((prev: GenerateReportInput) => ({ 
                    ...prev, 
                    project_name: e.target.value || undefined 
                  }))
                }
                className="border-gray-200 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 animate-pulse" />
                  Generating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Generate Report
                </div>
              )}
            </Button>

            {report && (
              <Button 
                variant="outline"
                onClick={exportReport}
                className="border-green-300 text-green-600 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {report && (
        <div className="space-y-6">
          {/* Report Header */}
          <Card className="shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  Report Generated Successfully
                </h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                  {report.period.start_date.toLocaleDateString()} - {report.period.end_date.toLocaleDateString()}
                </Badge>
              </div>

              {(reportParams.user_name || reportParams.project_name) && (
                <div className="flex gap-2 mb-4">
                  {reportParams.user_name && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      👤 {reportParams.user_name}
                    </Badge>
                  )}
                  {reportParams.project_name && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      📁 {reportParams.project_name}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-10 w-10 opacity-80" />
                  <div>
                    <p className="text-sm opacity-90">Total Hours</p>
                    <p className="text-3xl font-bold">{report.summary.total_hours}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-10 w-10 opacity-80" />
                  <div>
                    <p className="text-sm opacity-90">Total Entries</p>
                    <p className="text-3xl font-bold">{report.summary.total_entries}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-10 w-10 opacity-80" />
                  <div>
                    <p className="text-sm opacity-90">Daily Average</p>
                    <p className="text-3xl font-bold">{report.summary.average_hours_per_day.toFixed(1)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Breakdown */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <FolderOpen className="h-5 w-5 text-green-500" />
                  Hours by Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.breakdown_by_project.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No project data available</p>
                ) : (
                  <div className="space-y-3">
                    {report.breakdown_by_project.map((project) => (
                      <div key={project.project_name} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-800">{project.project_name}</p>
                          <p className="text-sm text-gray-600">{project.entry_count} entries</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          {project.total_hours}h
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Breakdown */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Users className="h-5 w-5 text-blue-500" />
                  Hours by User
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.breakdown_by_user.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No user data available</p>
                ) : (
                  <div className="space-y-3">
                    {report.breakdown_by_user.map((user) => (
                      <div key={user.user_name} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-800">👤 {user.user_name}</p>
                          <p className="text-sm text-gray-600">{user.entry_count} entries</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                          {user.total_hours}h
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Entries */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Calendar className="h-5 w-5 text-purple-500" />
                Detailed Entries ({report.entries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.entries.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg text-gray-600">No entries found for the selected period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Project</TableHead>
                        <TableHead className="font-semibold">Task</TableHead>
                        <TableHead className="font-semibold">Hours</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.entries.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {entry.user_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {entry.project_name}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={entry.task_description}>
                              {entry.task_description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-purple-600">
                              {entry.hours_worked}h
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {entry.entry_date.toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}