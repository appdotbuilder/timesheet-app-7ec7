import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { type GenerateReportInput, type Report } from '../schema';
import { and, gte, lte, eq, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const generateReport = async (input: GenerateReportInput): Promise<Report> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by date range
    conditions.push(
      gte(timesheetEntriesTable.entry_date, input.start_date.toISOString().split('T')[0])
    );
    conditions.push(
      lte(timesheetEntriesTable.entry_date, input.end_date.toISOString().split('T')[0])
    );
    
    // Optional user filter
    if (input.user_name) {
      conditions.push(eq(timesheetEntriesTable.user_name, input.user_name));
    }
    
    // Optional project filter
    if (input.project_name) {
      conditions.push(eq(timesheetEntriesTable.project_name, input.project_name));
    }
    
    // Execute query with conditions
    const entries = await db.select()
      .from(timesheetEntriesTable)
      .where(and(...conditions))
      .execute();
    
    // Convert numeric fields to numbers and dates for entries
    const processedEntries = entries.map(entry => ({
      ...entry,
      hours_worked: parseFloat(entry.hours_worked),
      entry_date: new Date(entry.entry_date + 'T00:00:00.000Z') // Convert date string to Date object
    }));
    
    // Calculate summary statistics
    const totalHours = processedEntries.reduce((sum, entry) => sum + entry.hours_worked, 0);
    const totalEntries = processedEntries.length;
    
    // Calculate days in period (inclusive)
    const daysDifference = Math.ceil((input.end_date.getTime() - input.start_date.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const averageHoursPerDay = daysDifference > 0 ? totalHours / daysDifference : 0;
    
    // Group by project for breakdown
    const projectBreakdown = processedEntries.reduce((acc, entry) => {
      const existing = acc.find(p => p.project_name === entry.project_name);
      if (existing) {
        existing.total_hours += entry.hours_worked;
        existing.entry_count += 1;
      } else {
        acc.push({
          project_name: entry.project_name,
          total_hours: entry.hours_worked,
          entry_count: 1
        });
      }
      return acc;
    }, [] as Array<{ project_name: string; total_hours: number; entry_count: number }>);
    
    // Group by user for breakdown
    const userBreakdown = processedEntries.reduce((acc, entry) => {
      const existing = acc.find(u => u.user_name === entry.user_name);
      if (existing) {
        existing.total_hours += entry.hours_worked;
        existing.entry_count += 1;
      } else {
        acc.push({
          user_name: entry.user_name,
          total_hours: entry.hours_worked,
          entry_count: 1
        });
      }
      return acc;
    }, [] as Array<{ user_name: string; total_hours: number; entry_count: number }>);
    
    // Sort breakdowns by total hours (descending)
    projectBreakdown.sort((a, b) => b.total_hours - a.total_hours);
    userBreakdown.sort((a, b) => b.total_hours - a.total_hours);
    
    return {
      period: {
        start_date: input.start_date,
        end_date: input.end_date
      },
      summary: {
        total_hours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
        total_entries: totalEntries,
        average_hours_per_day: Math.round(averageHoursPerDay * 100) / 100 // Round to 2 decimal places
      },
      breakdown_by_project: projectBreakdown,
      breakdown_by_user: userBreakdown,
      entries: processedEntries
    };
  } catch (error) {
    console.error('Report generation failed:', error);
    throw error;
  }
};