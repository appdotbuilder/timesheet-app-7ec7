import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, FileText, TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { DashboardSummary } from '../../../server/src/schema';

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getDashboardSummary.query();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Unable to load dashboard data. The backend handlers are using placeholder implementations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxProjectHours = Math.max(...summary.hours_by_project.map(p => p.total_hours), 1);
  const maxUserHours = Math.max(...summary.hours_by_user.map(u => u.total_hours), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Hours</CardTitle>
            <Clock className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_hours}h</div>
            <p className="text-xs opacity-80">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Entries</CardTitle>
            <FileText className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_entries}</div>
            <p className="text-xs opacity-80">
              Time entries logged
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Projects</CardTitle>
            <TrendingUp className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.hours_by_project.length}</div>
            <p className="text-xs opacity-80">
              Active projects
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Team Members</CardTitle>
            <Users className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.hours_by_user.length}</div>
            <p className="text-xs opacity-80">
              Active users
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours by Project */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Hours by Project
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.hours_by_project.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No project data available</p>
              </div>
            ) : (
              summary.hours_by_project.map((project) => (
                <div key={project.project_name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      {project.project_name}
                    </span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {project.total_hours}h
                    </Badge>
                  </div>
                  <Progress 
                    value={(project.total_hours / maxProjectHours) * 100} 
                    className="h-2 bg-gray-200"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Hours by User */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Users className="h-5 w-5 text-green-500" />
              Hours by User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.hours_by_user.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No user data available</p>
              </div>
            ) : (
              summary.hours_by_user.map((user) => (
                <div key={user.user_name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      👤 {user.user_name}
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {user.total_hours}h
                    </Badge>
                  </div>
                  <Progress 
                    value={(user.total_hours / maxUserHours) * 100} 
                    className="h-2 bg-gray-200"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Calendar className="h-5 w-5 text-purple-500" />
            Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.recent_entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No entries yet! 📝</p>
              <p>Start by adding your first timesheet entry above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.recent_entries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{entry.project_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {entry.user_name}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate max-w-md">
                      {entry.task_description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-600">{entry.hours_worked}h</div>
                    <div className="text-xs text-gray-500">
                      {entry.entry_date.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}