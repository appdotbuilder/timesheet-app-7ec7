import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { type TimesheetEntry, type TimesheetFilter } from '../schema';
import { eq, gte, lte, desc, and, type SQL } from 'drizzle-orm';

export const getTimesheetEntries = async (filter?: TimesheetFilter): Promise<TimesheetEntry[]> => {
  try {
    // Start with base query
    let query = db.select().from(timesheetEntriesTable);

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter?.user_name) {
      conditions.push(eq(timesheetEntriesTable.user_name, filter.user_name));
    }

    if (filter?.project_name) {
      conditions.push(eq(timesheetEntriesTable.project_name, filter.project_name));
    }

    if (filter?.start_date) {
      conditions.push(gte(timesheetEntriesTable.entry_date, filter.start_date.toISOString().split('T')[0]));
    }

    if (filter?.end_date) {
      conditions.push(lte(timesheetEntriesTable.entry_date, filter.end_date.toISOString().split('T')[0]));
    }

    // Build final query with conditions and ordering
    const finalQuery = conditions.length > 0
      ? query.where(conditions.length === 1 ? conditions[0] : and(...conditions)).orderBy(desc(timesheetEntriesTable.entry_date))
      : query.orderBy(desc(timesheetEntriesTable.entry_date));

    const results = await finalQuery.execute();

    // Convert numeric fields back to numbers for proper typing
    return results.map(entry => ({
      ...entry,
      hours_worked: parseFloat(entry.hours_worked),
      entry_date: new Date(entry.entry_date + 'T00:00:00.000Z'), // Convert date string to Date object
      created_at: entry.created_at,
      updated_at: entry.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch timesheet entries:', error);
    throw error;
  }
};