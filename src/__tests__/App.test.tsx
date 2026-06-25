import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import * as taskApi from '../api/taskApi';
import type { Task } from '../types/task';

vi.mock('../api/taskApi');

const mockedApi = vi.mocked(taskApi);

const tasks: Task[] = [
	{
		id: 1,
		title: 'Tâche en cours',
		description: null,
		completed: false,
		createdAt: '2026-01-15T10:00:00Z',
		updatedAt: '2026-01-15T10:00:00Z',
	},
	{
		id: 2,
		title: 'Tâche finie',
		description: null,
		completed: true,
		createdAt: '2026-01-16T10:00:00Z',
		updatedAt: '2026-01-16T10:00:00Z',
	},
];

beforeEach(() => {
	vi.clearAllMocks();
});

describe('App', () => {
	it('renders header and tasks with stats', async () => {
		mockedApi.getTasks.mockResolvedValue(tasks);

		render(<App />);

		expect(screen.getByText('Mes Tâches')).toBeInTheDocument();
		await waitFor(() => expect(screen.getByTestId('task-list')).toBeInTheDocument());

		expect(screen.getByText('Tâche en cours')).toBeInTheDocument();
		expect(screen.getByText('Tâche finie')).toBeInTheDocument();
		expect(screen.getByText('Total')).toBeInTheDocument();
		expect(screen.getByText('Terminées')).toBeInTheDocument();
	});

	it('does not show stats when there are no tasks', async () => {
		mockedApi.getTasks.mockResolvedValue([]);

		render(<App />);

		await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());
		expect(screen.queryByText('Total')).not.toBeInTheDocument();
	});

	it('adds a new task through the form', async () => {
		mockedApi.getTasks.mockResolvedValue([]);
		mockedApi.createTask.mockResolvedValue({
			id: 3,
			title: 'Nouvelle',
			description: null,
			completed: false,
			createdAt: '2026-01-17T10:00:00Z',
			updatedAt: '2026-01-17T10:00:00Z',
		});
		const user = userEvent.setup();

		render(<App />);
		await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());

		await user.type(screen.getByLabelText('Titre'), 'Nouvelle');
		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		await waitFor(() =>
			expect(mockedApi.createTask).toHaveBeenCalledWith({
				title: 'Nouvelle',
				description: undefined,
			})
		);
		expect(await screen.findByText('Nouvelle')).toBeInTheDocument();
	});

	it('handles add task error gracefully', async () => {
		mockedApi.getTasks.mockResolvedValue([]);
		mockedApi.createTask.mockRejectedValue(new Error('fail'));
		const user = userEvent.setup();

		render(<App />);
		await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());

		await user.type(screen.getByLabelText('Titre'), 'Erreur');
		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		await waitFor(() => expect(mockedApi.createTask).toHaveBeenCalled());
		// Application should not crash; form remains visible
		expect(screen.getByTestId('task-form')).toBeInTheDocument();
	});
});
