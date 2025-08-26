import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, Filter, Search, Trash2, Edit, Calendar, User, FolderOpen } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { TimesheetEntry, TimesheetFilter } from '../../../server/src/schema';

export function TimesheetList() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState<TimesheetFilter>({
    user_name: '',
    project_name: '',
    start_date: undefined,
    end_date: undefined
  });

  const loadEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      // Clean up filters - remove empty strings
      const cleanFilters: TimesheetFilter = {};
      if (filters.user_name?.trim()) cleanFilters.user_name = filters.user_name.trim();
      if (filters.project_name?.trim()) cleanFilters.project_name = filters.project_name.trim();
      if (filters.start_date) cleanFilters.start_date = filters.start_date;
      if (filters.end_date) cleanFilters.end_date = filters.end_date;

      const data = await trpc.getTimesheetEntries.query(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load timesheet entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDelete = async () => {
    if (!entryToDelete) return;
    
    try {
      setIsDeleting(true);
      await trpc.deleteTimesheetEntry.mutate(entryToDelete);
      setEntries((prev: TimesheetEntry[]) => prev.filter(entry => entry.id !== entryToDelete));
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      user_name: '',
      project_name: '',
      start_date: undefined,
      end_date: undefined
    });
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours_worked, 0);
  const hasActiveFilters = filters.user_name || filters.project_name || filters.start_date || filters.end_date;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Filter className="h-5 w-5 text-blue-500" />
            Filter Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-user" className="text-sm font-medium text-gray-700">
                👤 User Name
              </Label>
              <Input
                id="filter-user"
                placeholder="Filter by user..."
                value={filters.user_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: TimesheetFilter) => ({ ...prev, user_name: e.target.value }))
                }
                className="border-gray-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-project" className="text-sm font-medium text-gray-700">
                📁 Project Name
              </Label>
              <Input
                id="filter-project"
                placeholder="Filter by project..."
                value={filters.project_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: TimesheetFilter) => ({ ...prev, project_name: e.target.value }))
                }
                className="border-gray-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-start" className="text-sm font-medium text-gray-700">
                📅 Start Date
              </Label>
              <Input
                id="filter-start"
                type="date"
                value={filters.start_date ? filters.start_date.toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: TimesheetFilter) => ({ 
                    ...prev, 
                    start_date: e.target.value ? new Date(e.target.value) : undefined 
                  }))
                }
                className="border-gray-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-end" className="text-sm font-medium text-gray-700">
                📅 End Date
              </Label>
              <Input
                id="filter-end"
                type="date"
                value={filters.end_date ? filters.end_date.toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: TimesheetFilter) => ({ 
                    ...prev, 
                    end_date: e.target.value ? new Date(e.target.value) : undefined 
                  }))
                }
                className="border-gray-200 focus:border-blue-500"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">Active filters applied</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-sm opacity-80">Total Hours</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(2)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-sm opacity-80">Total Entries</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-sm opacity-80">Unique Projects</p>
                <p className="text-2xl font-bold">
                  {new Set(entries.map(e => e.project_name)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries Table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Clock className="h-5 w-5 text-purple-500" />
            Timesheet Entries ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading timesheet entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-medium text-gray-600 mb-2">
                {hasActiveFilters ? 'No entries match your filters' : 'No timesheet entries yet! ⏰'}
              </p>
              <p className="text-gray-500">
                {hasActiveFilters ? 'Try adjusting your filter criteria.' : 'Start by adding your first time entry.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        User
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <FolderOpen className="h-4 w-4" />
                        Project
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Task</TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Hours
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Date
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry: TimesheetEntry) => (
                    <TableRow key={entry.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {entry.user_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setEntryToDelete(entry.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Timesheet Entry
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this timesheet entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Entry'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}