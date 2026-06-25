import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';
import type { Task } from '../types/task';

vi.mock('../api/taskApi');

const mockedApi = vi.mocked(taskApi);

const taskA: Task = {
	id: 1,
	title: 'Tâche A',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

const taskB: Task = {
	id: 2,
	title: 'Tâche B',
	description: 'Desc',
	completed: false,
	createdAt: '2026-01-16T10:00:00Z',
	updatedAt: '2026-01-16T10:00:00Z',
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe('useTasks', () => {
	it('loads tasks on mount', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA, taskB]);

		const { result } = renderHook(() => useTasks());

		expect(result.current.loading).toBe(true);
		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.tasks).toEqual([taskA, taskB]);
		expect(result.current.error).toBeNull();
	});

	it('sets error when loading fails', async () => {
		mockedApi.getTasks.mockRejectedValue(new Error('Échec réseau'));

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Échec réseau');
	});

	it('sets generic error message for non-Error rejection', async () => {
		mockedApi.getTasks.mockRejectedValue('boom');

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Une erreur est survenue');
	});

	it('adds a task at the top of the list', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA]);
		mockedApi.createTask.mockResolvedValue(taskB);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addTask({ title: 'Tâche B' });
		});

		expect(result.current.tasks).toEqual([taskB, taskA]);
	});

	it('edits an existing task', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA, taskB]);
		mockedApi.updateTask.mockResolvedValue({ ...taskA, title: 'Modifiée' });

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.editTask(1, { title: 'Modifiée' });
		});

		expect(result.current.tasks[0].title).toBe('Modifiée');
		expect(result.current.tasks[1]).toEqual(taskB);
	});

	it('removes a task', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA, taskB]);
		mockedApi.deleteTask.mockResolvedValue();

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.removeTask(1);
		});

		expect(result.current.tasks).toEqual([taskB]);
	});

	it('toggles completion of a task', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA]);
		mockedApi.updateTask.mockResolvedValue({ ...taskA, completed: true });

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(1);
		});

		expect(mockedApi.updateTask).toHaveBeenCalledWith(1, { completed: true });
		expect(result.current.tasks[0].completed).toBe(true);
	});

	it('does nothing when toggling an unknown task', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA]);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(999);
		});

		expect(mockedApi.updateTask).not.toHaveBeenCalled();
	});
});
