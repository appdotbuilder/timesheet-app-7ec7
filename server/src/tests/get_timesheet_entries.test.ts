import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { type TimesheetFilter } from '../schema';
import { getTimesheetEntries } from '../handlers/get_timesheet_entries';

// Test data setup
const testEntries = [
  {
    user_name: 'John Doe',
    project_name: 'Project Alpha',
    task_description: 'Frontend development',
    hours_worked: '8.5',
    entry_date: '2024-01-15',
  },
  {
    user_name: 'Jane Smith',
    project_name: 'Project Beta',
    task_description: 'Backend API development',
    hours_worked: '6.0',
    entry_date: '2024-01-16',
  },
  {
    user_name: 'John Doe',
    project_name: 'Project Alpha',
    task_description: 'Testing and debugging',
    hours_worked: '4.25',
    entry_date: '2024-01-17',
  },
  {
    user_name: 'Jane Smith',
    project_name: 'Project Alpha',
    task_description: 'Code review',
    hours_worked: '2.0',
    entry_date: '2024-01-18',
  }
];

describe('getTimesheetEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all timesheet entries when no filter is provided', async () => {
    // Insert test data
    await db.insert(timesheetEntriesTable).values(testEntries).execute();

    const results = await getTimesheetEntries();

    expect(results).toHaveLength(4);
    expect(results[0].user_name).toEqual('Jane Smith');
    expect(results[0].entry_date).toEqual(new Date('2024-01-18T00:00:00.000Z'));
    expect(typeof results[0].hours_worked).toBe('number');
    expect(results[0].hours_worked).toEqual(2.0);
  });

  it('should return entries ordered by entry_date DESC', async () => {
    // Insert test data
    await db.insert(timesheetEntriesTable).values(testEntries).execute();

    const results = await getTimesheetEntries();

    expect(results).toHaveLength(4);
    // Verify descending order by date
    expect(results[0].entry_date).toEqual(new Date('2024-01-18T00:00:00.000Z'));
    expect(results[1].entry_date).toEqual(new Date('2024-01-17T00:00:00.000Z'));
    expect(results[2].entry_date).toEqual(new Date('2024-01-16T00:00:00.000Z'));
    expect(results[3].entry_date).toEqual(new Date('2024-01-15T00:00:00.000Z'));
  });

  it('should filter entries by user_name', async () => {
    // Insert test data
    await db.insert(timesheetEntriesTable).values(testEntries).execute();

    const filter: TimesheetFilter = {
      user_name: 'John Doe'
    };

    const results = await getTimesheetEntries(filter);

    expect(results).toHaveLength(2);
    results.forEach(entry => {
      expect(entry.user_name).toEqual('John Doe');
    });
    expect(results[0].entry_date).toEqual(new Date('2024-01-17T00:00:00.000Z'));
    expect(results[1].entry_date).toEqual(new Date('2024-01-15T00:00:00.000Z'));
  });

  it('should filter entries by project_name', async () => {
    // Insert test data
    await db.insert(timesheetEntriesTable).values(testEntries).execute();

    const filter: TimesheetFilter = {
      project_name: 'Project Alpha'
    };

    const results = await getTimesheetEntries(filter);

    expect(results).toHaveLength(3);
    results.forEach(entry => {
      expect(entry.project_name).toEqual('Project Alpha');
    });
  });

  it('should filter entries by date range', async () => {
    // Insert test data
    await db.insert(timesheetEntriesTable).values(testEntries).execute();

    const filter: TimesheetFilter = {
      start_date: new Date('2024-01-16'),
      end_date: new Date('2024-01-17')
    };

    const results = await getTimesheetEntries(filter);

    expect(results).toHaveLength(2);
    expect(results[0].entry_date).toEqual(new Date('2024-01-17T00:00:00.000Z'));
    expect(results[1].entry_date).toEqual(new Date('2024-01-16T00:00:00.000Z'));
  });

  it('should filter entries by start_date only', async () => {
    // Insert test data
    await db.insert(timesheetEntriesTable).values(testEntries).execute();

    const filter: TimesheetFilter = {
      start_date: new Date('2024-01-17')
    };

    const results = await getTimesheetEntries(filter);

    expect(results).toHaveLength(2);
    results.forEach(entry => {
      expect(entry.entry_date.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-17T00:00:00.000Z').getTime());
    });
  });

  it('should filter entries by end_date only', async () => {
    // Insert test data
    await db.insert(timesheetEntriesTable).values(testEntries).execute();

    const filter: TimesheetFilter = {
      end_date: new Date('2024-01-16')
    };

    const results = await getTimesheetEntries(filter);

    expect(results).toHaveLength(2);
    results.forEach(entry => {
      expect(entry.entry_date.getTime()).toBeLessThanOrEqual(new Date('2024-01-16T00:00:00.000Z').getTime());
    });
  });

  it('should combine multiple filters correctly', async () => {
    // Insert test data
    await db.insert(timesheetEntriesTable).values(testEntries).execute();

    const filter: TimesheetFilter = {
      user_name: 'John Doe',
      project_name: 'Project Alpha',
      start_date: new Date('2024-01-16'),
      end_date: new Date('2024-01-18')
    };

    const results = await getTimesheetEntries(filter);

    expect(results).toHaveLength(1);
    expect(results[0].user_name).toEqual('John Doe');
    expect(results[0].project_name).toEqual('Project Alpha');
    expect(results[0].entry_date).toEqual(new Date('2024-01-17T00:00:00.000Z'));
  });

  it('should return empty array when no entries match filter', async () => {
    // Insert test data
    await db.insert(timesheetEntriesTable).values(testEntries).execute();

    const filter: TimesheetFilter = {
      user_name: 'Nonexistent User'
    };

    const results = await getTimesheetEntries(filter);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when no entries exist', async () => {
    const results = await getTimesheetEntries();

    expect(results).toHaveLength(0);
  });

  it('should properly convert numeric fields', async () => {
    // Insert one test entry
    await db.insert(timesheetEntriesTable).values([testEntries[0]]).execute();

    const results = await getTimesheetEntries();

    expect(results).toHaveLength(1);
    expect(typeof results[0].hours_worked).toBe('number');
    expect(results[0].hours_worked).toEqual(8.5);
    expect(results[0].id).toBeDefined();
    expect(typeof results[0].id).toBe('number');
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle edge case date filtering correctly', async () => {
    // Insert test data
    await db.insert(timesheetEntriesTable).values(testEntries).execute();

    // Test exact date match
    const filter: TimesheetFilter = {
      start_date: new Date('2024-01-17'),
      end_date: new Date('2024-01-17')
    };

    const results = await getTimesheetEntries(filter);

    expect(results).toHaveLength(1);
    expect(results[0].entry_date).toEqual(new Date('2024-01-17T00:00:00.000Z'));
    expect(results[0].user_name).toEqual('John Doe');
  });
});