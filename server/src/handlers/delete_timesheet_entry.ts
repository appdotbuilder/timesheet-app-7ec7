import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTimesheetEntry = async (id: number): Promise<boolean> => {
  try {
    // Check if the entry exists first
    const existingEntries = await db.select()
      .from(timesheetEntriesTable)
      .where(eq(timesheetEntriesTable.id, id))
      .execute();

    // Return false if entry doesn't exist
    if (existingEntries.length === 0) {
      return false;
    }

    // Delete the entry
    const result = await db.delete(timesheetEntriesTable)
      .where(eq(timesheetEntriesTable.id, id))
      .execute();

    // Return true if deletion was successful
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Timesheet entry deletion failed:', error);
    throw error;
  }
};