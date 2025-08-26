import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { type CreateTimesheetEntryInput } from '../schema';
import { deleteTimesheetEntry } from '../handlers/delete_timesheet_entry';
import { eq } from 'drizzle-orm';

// Test data for creating timesheet entries
const testEntryInput: CreateTimesheetEntryInput = {
  user_name: 'John Doe',
  project_name: 'Test Project',
  task_description: 'Testing delete functionality',
  hours_worked: 8.5,
  entry_date: new Date('2024-01-15')
};

const secondTestEntryInput: CreateTimesheetEntryInput = {
  user_name: 'Jane Smith',
  project_name: 'Another Project',
  task_description: 'Another test task',
  hours_worked: 4.0,
  entry_date: new Date('2024-01-16')
};

describe('deleteTimesheetEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return true when deleting an existing entry', async () => {
    // Create a test entry first
    const insertResult = await db.insert(timesheetEntriesTable)
      .values({
        user_name: testEntryInput.user_name,
        project_name: testEntryInput.project_name,
        task_description: testEntryInput.task_description,
        hours_worked: testEntryInput.hours_worked.toString(), // Convert number to string for numeric column
        entry_date: testEntryInput.entry_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
      })
      .returning()
      .execute();

    const createdEntry = insertResult[0];
    expect(createdEntry.id).toBeDefined();

    // Delete the entry
    const result = await deleteTimesheetEntry(createdEntry.id);

    expect(result).toBe(true);
  });

  it('should return false when trying to delete a non-existent entry', async () => {
    // Try to delete an entry that doesn't exist
    const result = await deleteTimesheetEntry(999);

    expect(result).toBe(false);
  });

  it('should actually remove the entry from the database', async () => {
    // Create a test entry
    const insertResult = await db.insert(timesheetEntriesTable)
      .values({
        user_name: testEntryInput.user_name,
        project_name: testEntryInput.project_name,
        task_description: testEntryInput.task_description,
        hours_worked: testEntryInput.hours_worked.toString(),
        entry_date: testEntryInput.entry_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
      })
      .returning()
      .execute();

    const createdEntry = insertResult[0];

    // Verify entry exists before deletion
    const entriesBeforeDeletion = await db.select()
      .from(timesheetEntriesTable)
      .where(eq(timesheetEntriesTable.id, createdEntry.id))
      .execute();

    expect(entriesBeforeDeletion).toHaveLength(1);

    // Delete the entry
    const deleteResult = await deleteTimesheetEntry(createdEntry.id);
    expect(deleteResult).toBe(true);

    // Verify entry no longer exists
    const entriesAfterDeletion = await db.select()
      .from(timesheetEntriesTable)
      .where(eq(timesheetEntriesTable.id, createdEntry.id))
      .execute();

    expect(entriesAfterDeletion).toHaveLength(0);
  });

  it('should only delete the specified entry and leave others intact', async () => {
    // Create two test entries
    const firstEntryResult = await db.insert(timesheetEntriesTable)
      .values({
        user_name: testEntryInput.user_name,
        project_name: testEntryInput.project_name,
        task_description: testEntryInput.task_description,
        hours_worked: testEntryInput.hours_worked.toString(),
        entry_date: testEntryInput.entry_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
      })
      .returning()
      .execute();

    const secondEntryResult = await db.insert(timesheetEntriesTable)
      .values({
        user_name: secondTestEntryInput.user_name,
        project_name: secondTestEntryInput.project_name,
        task_description: secondTestEntryInput.task_description,
        hours_worked: secondTestEntryInput.hours_worked.toString(),
        entry_date: secondTestEntryInput.entry_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
      })
      .returning()
      .execute();

    const firstEntry = firstEntryResult[0];
    const secondEntry = secondEntryResult[0];

    // Verify both entries exist
    const allEntriesBeforeDeletion = await db.select()
      .from(timesheetEntriesTable)
      .execute();

    expect(allEntriesBeforeDeletion).toHaveLength(2);

    // Delete only the first entry
    const deleteResult = await deleteTimesheetEntry(firstEntry.id);
    expect(deleteResult).toBe(true);

    // Verify first entry is gone but second entry remains
    const firstEntryAfterDeletion = await db.select()
      .from(timesheetEntriesTable)
      .where(eq(timesheetEntriesTable.id, firstEntry.id))
      .execute();

    const secondEntryAfterDeletion = await db.select()
      .from(timesheetEntriesTable)
      .where(eq(timesheetEntriesTable.id, secondEntry.id))
      .execute();

    expect(firstEntryAfterDeletion).toHaveLength(0);
    expect(secondEntryAfterDeletion).toHaveLength(1);
    expect(secondEntryAfterDeletion[0].user_name).toBe(secondTestEntryInput.user_name);
  });

  it('should handle multiple deletion attempts on the same entry', async () => {
    // Create a test entry
    const insertResult = await db.insert(timesheetEntriesTable)
      .values({
        user_name: testEntryInput.user_name,
        project_name: testEntryInput.project_name,
        task_description: testEntryInput.task_description,
        hours_worked: testEntryInput.hours_worked.toString(),
        entry_date: testEntryInput.entry_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
      })
      .returning()
      .execute();

    const createdEntry = insertResult[0];

    // First deletion should succeed
    const firstDeletion = await deleteTimesheetEntry(createdEntry.id);
    expect(firstDeletion).toBe(true);

    // Second deletion attempt should return false (entry no longer exists)
    const secondDeletion = await deleteTimesheetEntry(createdEntry.id);
    expect(secondDeletion).toBe(false);
  });
});