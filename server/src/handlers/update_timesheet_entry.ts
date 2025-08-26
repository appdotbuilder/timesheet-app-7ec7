import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { type UpdateTimesheetEntryInput, type TimesheetEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTimesheetEntry = async (input: UpdateTimesheetEntryInput): Promise<TimesheetEntry> => {
  try {
    // Check if the entry exists first
    const existingEntry = await db.select()
      .from(timesheetEntriesTable)
      .where(eq(timesheetEntriesTable.id, input.id))
      .execute();

    if (existingEntry.length === 0) {
      throw new Error(`Timesheet entry with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.user_name !== undefined) {
      updateData.user_name = input.user_name;
    }
    if (input.project_name !== undefined) {
      updateData.project_name = input.project_name;
    }
    if (input.task_description !== undefined) {
      updateData.task_description = input.task_description;
    }
    if (input.hours_worked !== undefined) {
      updateData.hours_worked = input.hours_worked.toString(); // Convert number to string for numeric column
    }
    if (input.entry_date !== undefined) {
      updateData.entry_date = input.entry_date.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
    }

    // Update the entry
    const result = await db.update(timesheetEntriesTable)
      .set(updateData)
      .where(eq(timesheetEntriesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric and date fields back to proper types before returning
    const updatedEntry = result[0];
    return {
      ...updatedEntry,
      hours_worked: parseFloat(updatedEntry.hours_worked), // Convert string back to number
      entry_date: new Date(updatedEntry.entry_date + 'T00:00:00.000Z') // Convert date string back to Date
    };
  } catch (error) {
    console.error('Timesheet entry update failed:', error);
    throw error;
  }
};