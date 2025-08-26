import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { type UpdateTimesheetEntryInput, type CreateTimesheetEntryInput } from '../schema';
import { updateTimesheetEntry } from '../handlers/update_timesheet_entry';
import { eq } from 'drizzle-orm';

// Helper function to create a test timesheet entry
const createTestEntry = async (overrides?: Partial<CreateTimesheetEntryInput>) => {
  const defaultEntry = {
    user_name: 'John Doe',
    project_name: 'Test Project',
    task_description: 'Initial task',
    hours_worked: 8.0,
    entry_date: new Date('2024-01-15')
  };

  const entry = { ...defaultEntry, ...overrides };

  const result = await db.insert(timesheetEntriesTable)
    .values({
      user_name: entry.user_name,
      project_name: entry.project_name,
      task_description: entry.task_description,
      hours_worked: entry.hours_worked.toString(),
      entry_date: entry.entry_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
    })
    .returning()
    .execute();

  return {
    ...result[0],
    hours_worked: parseFloat(result[0].hours_worked),
    entry_date: new Date(result[0].entry_date + 'T00:00:00.000Z') // Convert date string back to Date
  };
};

describe('updateTimesheetEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a timesheet entry', async () => {
    // Create initial entry
    const initialEntry = await createTestEntry();

    const updateInput: UpdateTimesheetEntryInput = {
      id: initialEntry.id,
      user_name: 'Jane Smith',
      project_name: 'Updated Project',
      task_description: 'Updated task description',
      hours_worked: 6.5,
      entry_date: new Date('2024-01-16')
    };

    const result = await updateTimesheetEntry(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(initialEntry.id);
    expect(result.user_name).toEqual('Jane Smith');
    expect(result.project_name).toEqual('Updated Project');
    expect(result.task_description).toEqual('Updated task description');
    expect(result.hours_worked).toEqual(6.5);
    expect(result.entry_date).toEqual(new Date('2024-01-16'));
    expect(result.created_at).toEqual(initialEntry.created_at); // Should not change
    expect(result.updated_at).not.toEqual(initialEntry.updated_at); // Should be updated
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.hours_worked).toBe('number');
  });

  it('should update only provided fields', async () => {
    // Create initial entry
    const initialEntry = await createTestEntry();

    const partialUpdateInput: UpdateTimesheetEntryInput = {
      id: initialEntry.id,
      user_name: 'Jane Smith',
      hours_worked: 7.25
    };

    const result = await updateTimesheetEntry(partialUpdateInput);

    // Verify only specified fields were updated
    expect(result.user_name).toEqual('Jane Smith');
    expect(result.hours_worked).toEqual(7.25);
    // Other fields should remain unchanged
    expect(result.project_name).toEqual(initialEntry.project_name);
    expect(result.task_description).toEqual(initialEntry.task_description);
    expect(result.entry_date).toEqual(initialEntry.entry_date);
    expect(result.created_at).toEqual(initialEntry.created_at);
    expect(result.updated_at).not.toEqual(initialEntry.updated_at);
  });

  it('should save updated entry to database', async () => {
    // Create initial entry
    const initialEntry = await createTestEntry();

    const updateInput: UpdateTimesheetEntryInput = {
      id: initialEntry.id,
      task_description: 'Database test task',
      hours_worked: 9.75
    };

    await updateTimesheetEntry(updateInput);

    // Query database directly to verify update
    const entries = await db.select()
      .from(timesheetEntriesTable)
      .where(eq(timesheetEntriesTable.id, initialEntry.id))
      .execute();

    expect(entries).toHaveLength(1);
    const dbEntry = entries[0];
    expect(dbEntry.task_description).toEqual('Database test task');
    expect(parseFloat(dbEntry.hours_worked)).toEqual(9.75);
    expect(dbEntry.updated_at).toBeInstanceOf(Date);
    expect(dbEntry.updated_at).not.toEqual(initialEntry.updated_at);
  });

  it('should update timestamp even when no other fields change', async () => {
    // Create initial entry
    const initialEntry = await createTestEntry();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const timestampOnlyUpdate: UpdateTimesheetEntryInput = {
      id: initialEntry.id
    };

    const result = await updateTimesheetEntry(timestampOnlyUpdate);

    // All fields should remain the same except updated_at
    expect(result.user_name).toEqual(initialEntry.user_name);
    expect(result.project_name).toEqual(initialEntry.project_name);
    expect(result.task_description).toEqual(initialEntry.task_description);
    expect(result.hours_worked).toEqual(initialEntry.hours_worked);
    expect(result.entry_date).toEqual(initialEntry.entry_date);
    expect(result.created_at).toEqual(initialEntry.created_at);
    expect(result.updated_at).not.toEqual(initialEntry.updated_at);
    expect(result.updated_at > initialEntry.updated_at).toBe(true);
  });

  it('should throw error when entry does not exist', async () => {
    const nonExistentUpdateInput: UpdateTimesheetEntryInput = {
      id: 999999,
      user_name: 'Does Not Exist'
    };

    await expect(updateTimesheetEntry(nonExistentUpdateInput))
      .rejects
      .toThrow(/timesheet entry with id 999999 not found/i);
  });

  it('should handle decimal hours correctly', async () => {
    // Create initial entry
    const initialEntry = await createTestEntry();

    const decimalUpdateInput: UpdateTimesheetEntryInput = {
      id: initialEntry.id,
      hours_worked: 3.75 // 3 hours and 45 minutes
    };

    const result = await updateTimesheetEntry(decimalUpdateInput);

    expect(result.hours_worked).toEqual(3.75);
    expect(typeof result.hours_worked).toBe('number');

    // Verify in database
    const dbEntries = await db.select()
      .from(timesheetEntriesTable)
      .where(eq(timesheetEntriesTable.id, initialEntry.id))
      .execute();

    expect(parseFloat(dbEntries[0].hours_worked)).toEqual(3.75);
  });
});