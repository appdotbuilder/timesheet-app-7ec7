import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { type CreateTimesheetEntryInput } from '../schema';
import { createTimesheetEntry } from '../handlers/create_timesheet_entry';
import { eq, gte, lte, and } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateTimesheetEntryInput = {
  user_name: 'John Doe',
  project_name: 'Test Project',
  task_description: 'Implementing unit tests',
  hours_worked: 8.5,
  entry_date: new Date('2024-01-15')
};

describe('createTimesheetEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a timesheet entry with all fields', async () => {
    const result = await createTimesheetEntry(testInput);

    // Validate all fields are properly set
    expect(result.user_name).toEqual('John Doe');
    expect(result.project_name).toEqual('Test Project');
    expect(result.task_description).toEqual('Implementing unit tests');
    expect(result.hours_worked).toEqual(8.5);
    expect(result.entry_date).toBeInstanceOf(Date);
    expect(result.entry_date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save timesheet entry to database', async () => {
    const result = await createTimesheetEntry(testInput);

    // Query the database to verify the entry was saved
    const entries = await db.select()
      .from(timesheetEntriesTable)
      .where(eq(timesheetEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    const savedEntry = entries[0];
    expect(savedEntry.user_name).toEqual('John Doe');
    expect(savedEntry.project_name).toEqual('Test Project');
    expect(savedEntry.task_description).toEqual('Implementing unit tests');
    expect(parseFloat(savedEntry.hours_worked)).toEqual(8.5);
    expect(savedEntry.entry_date).toBe('2024-01-15'); // Database stores dates as strings
    expect(savedEntry.created_at).toBeInstanceOf(Date);
    expect(savedEntry.updated_at).toBeInstanceOf(Date);
  });

  it('should handle decimal hours correctly', async () => {
    const inputWithDecimals: CreateTimesheetEntryInput = {
      ...testInput,
      hours_worked: 7.25
    };

    const result = await createTimesheetEntry(inputWithDecimals);

    // Verify decimal precision is maintained
    expect(result.hours_worked).toEqual(7.25);
    expect(typeof result.hours_worked).toBe('number');

    // Verify in database
    const entries = await db.select()
      .from(timesheetEntriesTable)
      .where(eq(timesheetEntriesTable.id, result.id))
      .execute();

    expect(parseFloat(entries[0].hours_worked)).toEqual(7.25);
  });

  it('should handle different date formats correctly', async () => {
    const inputWithStringDate: CreateTimesheetEntryInput = {
      ...testInput,
      entry_date: new Date('2024-03-20')
    };

    const result = await createTimesheetEntry(inputWithStringDate);

    expect(result.entry_date).toBeInstanceOf(Date);
    expect(result.entry_date.toISOString().split('T')[0]).toEqual('2024-03-20');

    // Verify date filtering works correctly
    const startDate = '2024-03-01';
    const endDate = '2024-03-31';

    const entriesInRange = await db.select()
      .from(timesheetEntriesTable)
      .where(
        and(
          gte(timesheetEntriesTable.entry_date, startDate),
          lte(timesheetEntriesTable.entry_date, endDate)
        )
      )
      .execute();

    expect(entriesInRange).toHaveLength(1);
    expect(entriesInRange[0].id).toEqual(result.id);
  });

  it('should create multiple entries with different users and projects', async () => {
    const input1: CreateTimesheetEntryInput = {
      user_name: 'Alice Smith',
      project_name: 'Project Alpha',
      task_description: 'Frontend development',
      hours_worked: 6.0,
      entry_date: new Date('2024-01-16')
    };

    const input2: CreateTimesheetEntryInput = {
      user_name: 'Bob Johnson',
      project_name: 'Project Beta',
      task_description: 'Database design',
      hours_worked: 4.5,
      entry_date: new Date('2024-01-16')
    };

    const result1 = await createTimesheetEntry(input1);
    const result2 = await createTimesheetEntry(input2);

    // Verify both entries were created with unique IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.user_name).toEqual('Alice Smith');
    expect(result2.user_name).toEqual('Bob Johnson');
    expect(result1.project_name).toEqual('Project Alpha');
    expect(result2.project_name).toEqual('Project Beta');

    // Verify both are in the database
    const allEntries = await db.select()
      .from(timesheetEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(2);
  });

  it('should handle edge case with minimum positive hours', async () => {
    const inputMinHours: CreateTimesheetEntryInput = {
      ...testInput,
      hours_worked: 0.01 // Minimum positive value
    };

    const result = await createTimesheetEntry(inputMinHours);

    expect(result.hours_worked).toEqual(0.01);
    expect(typeof result.hours_worked).toBe('number');
  });
});