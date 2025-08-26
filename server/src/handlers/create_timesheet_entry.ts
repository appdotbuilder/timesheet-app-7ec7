import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { type CreateTimesheetEntryInput, type TimesheetEntry } from '../schema';

export const createTimesheetEntry = async (input: CreateTimesheetEntryInput): Promise<TimesheetEntry> => {
  try {
    // Insert timesheet entry record
    const result = await db.insert(timesheetEntriesTable)
      .values({
        user_name: input.user_name,
        project_name: input.project_name,
        task_description: input.task_description,
        hours_worked: input.hours_worked.toString(), // Convert number to string for numeric column
        entry_date: input.entry_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string for date column
      })
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const entry = result[0];
    return {
      ...entry,
      hours_worked: parseFloat(entry.hours_worked), // Convert string back to number
      entry_date: new Date(entry.entry_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Timesheet entry creation failed:', error);
    throw error;
  }
};