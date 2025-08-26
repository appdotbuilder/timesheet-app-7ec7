import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { getDashboardSummary } from '../handlers/get_dashboard_summary';

describe('getDashboardSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary for no data', async () => {
    const result = await getDashboardSummary();

    expect(result.total_hours).toEqual(0);
    expect(result.total_entries).toEqual(0);
    expect(result.hours_by_project).toHaveLength(0);
    expect(result.hours_by_user).toHaveLength(0);
    expect(result.recent_entries).toHaveLength(0);
  });

  it('should calculate correct totals with single entry', async () => {
    // Create test entry
    await db.insert(timesheetEntriesTable).values({
      user_name: 'John Doe',
      project_name: 'Project Alpha',
      task_description: 'Development work',
      hours_worked: '8.50',
      entry_date: '2024-01-15'
    }).execute();

    const result = await getDashboardSummary();

    expect(result.total_hours).toEqual(8.5);
    expect(result.total_entries).toEqual(1);
    expect(typeof result.total_hours).toBe('number');
    expect(typeof result.total_entries).toBe('number');
  });

  it('should aggregate multiple entries correctly', async () => {
    // Create multiple test entries
    const entries = [
      {
        user_name: 'John Doe',
        project_name: 'Project Alpha',
        task_description: 'Development work',
        hours_worked: '8.50',
        entry_date: '2024-01-15'
      },
      {
        user_name: 'Jane Smith',
        project_name: 'Project Alpha',
        task_description: 'Testing',
        hours_worked: '6.25',
        entry_date: '2024-01-15'
      },
      {
        user_name: 'John Doe',
        project_name: 'Project Beta',
        task_description: 'Design work',
        hours_worked: '4.75',
        entry_date: '2024-01-16'
      }
    ];

    for (const entry of entries) {
      await db.insert(timesheetEntriesTable).values(entry).execute();
    }

    const result = await getDashboardSummary();

    expect(result.total_hours).toEqual(19.5); // 8.5 + 6.25 + 4.75
    expect(result.total_entries).toEqual(3);
  });

  it('should group hours by project correctly', async () => {
    const entries = [
      {
        user_name: 'John Doe',
        project_name: 'Project Alpha',
        task_description: 'Development',
        hours_worked: '8.00',
        entry_date: '2024-01-15'
      },
      {
        user_name: 'Jane Smith',
        project_name: 'Project Alpha',
        task_description: 'Testing',
        hours_worked: '6.00',
        entry_date: '2024-01-15'
      },
      {
        user_name: 'John Doe',
        project_name: 'Project Beta',
        task_description: 'Design',
        hours_worked: '4.00',
        entry_date: '2024-01-16'
      }
    ];

    for (const entry of entries) {
      await db.insert(timesheetEntriesTable).values(entry).execute();
    }

    const result = await getDashboardSummary();

    expect(result.hours_by_project).toHaveLength(2);
    
    // Should be ordered by total hours descending
    expect(result.hours_by_project[0].project_name).toEqual('Project Alpha');
    expect(result.hours_by_project[0].total_hours).toEqual(14.0); // 8 + 6
    expect(result.hours_by_project[1].project_name).toEqual('Project Beta');
    expect(result.hours_by_project[1].total_hours).toEqual(4.0);

    // Verify numeric types
    result.hours_by_project.forEach(project => {
      expect(typeof project.total_hours).toBe('number');
    });
  });

  it('should group hours by user correctly', async () => {
    const entries = [
      {
        user_name: 'John Doe',
        project_name: 'Project Alpha',
        task_description: 'Development',
        hours_worked: '8.00',
        entry_date: '2024-01-15'
      },
      {
        user_name: 'John Doe',
        project_name: 'Project Beta',
        task_description: 'Design',
        hours_worked: '4.00',
        entry_date: '2024-01-16'
      },
      {
        user_name: 'Jane Smith',
        project_name: 'Project Alpha',
        task_description: 'Testing',
        hours_worked: '6.00',
        entry_date: '2024-01-15'
      }
    ];

    for (const entry of entries) {
      await db.insert(timesheetEntriesTable).values(entry).execute();
    }

    const result = await getDashboardSummary();

    expect(result.hours_by_user).toHaveLength(2);
    
    // Should be ordered by total hours descending
    expect(result.hours_by_user[0].user_name).toEqual('John Doe');
    expect(result.hours_by_user[0].total_hours).toEqual(12.0); // 8 + 4
    expect(result.hours_by_user[1].user_name).toEqual('Jane Smith');
    expect(result.hours_by_user[1].total_hours).toEqual(6.0);

    // Verify numeric types
    result.hours_by_user.forEach(user => {
      expect(typeof user.total_hours).toBe('number');
    });
  });

  it('should return recent entries in correct order', async () => {
    // Create entries with different timestamps by adding delay
    const baseTime = new Date('2024-01-15T10:00:00Z');
    
    const entries = [
      {
        user_name: 'John Doe',
        project_name: 'Project Alpha',
        task_description: 'First task',
        hours_worked: '2.00',
        entry_date: '2024-01-15'
      },
      {
        user_name: 'Jane Smith',
        project_name: 'Project Beta',
        task_description: 'Second task',
        hours_worked: '3.00',
        entry_date: '2024-01-16'
      },
      {
        user_name: 'Bob Wilson',
        project_name: 'Project Gamma',
        task_description: 'Third task',
        hours_worked: '4.00',
        entry_date: '2024-01-17'
      }
    ];

    // Insert entries sequentially to ensure different created_at timestamps
    for (let i = 0; i < entries.length; i++) {
      await db.insert(timesheetEntriesTable).values(entries[i]).execute();
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const result = await getDashboardSummary();

    expect(result.recent_entries).toHaveLength(3);
    
    // Should be ordered by created_at descending (most recent first)
    expect(result.recent_entries[0].task_description).toEqual('Third task');
    expect(result.recent_entries[1].task_description).toEqual('Second task');
    expect(result.recent_entries[2].task_description).toEqual('First task');

    // Verify numeric conversion for hours_worked
    result.recent_entries.forEach(entry => {
      expect(typeof entry.hours_worked).toBe('number');
      expect(entry.created_at).toBeInstanceOf(Date);
      expect(entry.updated_at).toBeInstanceOf(Date);
      expect(entry.entry_date).toBeInstanceOf(Date);
    });
  });

  it('should limit recent entries to 10', async () => {
    // Create 15 entries
    for (let i = 1; i <= 15; i++) {
      await db.insert(timesheetEntriesTable).values({
        user_name: `User ${i}`,
        project_name: `Project ${i}`,
        task_description: `Task ${i}`,
        hours_worked: '1.00',
        entry_date: '2024-01-15'
      }).execute();
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    const result = await getDashboardSummary();

    expect(result.recent_entries).toHaveLength(10);
    expect(result.total_entries).toEqual(15);
    expect(result.total_hours).toEqual(15.0);
  });

  it('should handle decimal hours correctly', async () => {
    const entries = [
      {
        user_name: 'John Doe',
        project_name: 'Project Alpha',
        task_description: 'Development',
        hours_worked: '7.75', // 7 hours 45 minutes
        entry_date: '2024-01-15'
      },
      {
        user_name: 'Jane Smith',
        project_name: 'Project Alpha',
        task_description: 'Testing',
        hours_worked: '2.25', // 2 hours 15 minutes
        entry_date: '2024-01-15'
      }
    ];

    for (const entry of entries) {
      await db.insert(timesheetEntriesTable).values(entry).execute();
    }

    const result = await getDashboardSummary();

    expect(result.total_hours).toEqual(10.0); // 7.75 + 2.25
    expect(result.hours_by_project[0].total_hours).toEqual(10.0);
    expect(result.recent_entries[0].hours_worked).toEqual(2.25);
    expect(result.recent_entries[1].hours_worked).toEqual(7.75);
  });
});