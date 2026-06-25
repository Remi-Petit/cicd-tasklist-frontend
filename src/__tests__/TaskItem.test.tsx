import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const baseTask: Task = {
	id: 1,
	title: 'Ma tâche',
	description: 'Une description',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

describe('TaskItem', () => {
	it('renders task title, description and date', () => {
		render(
			<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
		);
		expect(screen.getByText('Ma tâche')).toBeInTheDocument();
		expect(screen.getByText('Une description')).toBeInTheDocument();
		expect(screen.getByTestId('task-item')).toBeInTheDocument();
	});

	it('does not render description when absent', () => {
		render(
			<TaskItem
				task={{ ...baseTask, description: null }}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.queryByText('Une description')).not.toBeInTheDocument();
	});

	it('calls onToggle when checkbox is clicked', async () => {
		const onToggle = vi.fn();
		const user = userEvent.setup();
		render(
			<TaskItem task={baseTask} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} />
		);
		await user.click(screen.getByRole('checkbox'));
		expect(onToggle).toHaveBeenCalledWith(1);
	});

	it('applies completed class when task is completed', () => {
		render(
			<TaskItem
				task={{ ...baseTask, completed: true }}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.getByTestId('task-item')).toHaveClass('task-completed');
	});

	it('enters edit mode and saves changes', async () => {
		const onEdit = vi.fn();
		const user = userEvent.setup();
		render(
			<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />
		);

		await user.click(screen.getByRole('button', { name: 'Modifier' }));

		const titleInput = screen.getByLabelText('Modifier le titre');
		await user.clear(titleInput);
		await user.type(titleInput, 'Nouveau titre');
		await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onEdit).toHaveBeenCalledWith(1, {
			title: 'Nouveau titre',
			description: 'Une description',
		});
	});

	it('saves with undefined description when cleared', async () => {
		const onEdit = vi.fn();
		const user = userEvent.setup();
		render(
			<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />
		);

		await user.click(screen.getByRole('button', { name: 'Modifier' }));
		await user.clear(screen.getByLabelText('Modifier la description'));
		await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onEdit).toHaveBeenCalledWith(1, {
			title: 'Ma tâche',
			description: undefined,
		});
	});

	it('does not save when edit title is empty', async () => {
		const onEdit = vi.fn();
		const user = userEvent.setup();
		render(
			<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />
		);

		await user.click(screen.getByRole('button', { name: 'Modifier' }));
		await user.clear(screen.getByLabelText('Modifier le titre'));
		await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onEdit).not.toHaveBeenCalled();
	});

	it('cancels edit and restores original values', async () => {
		const user = userEvent.setup();
		render(
			<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
		);

		await user.click(screen.getByRole('button', { name: 'Modifier' }));
		const titleInput = screen.getByLabelText('Modifier le titre');
		await user.clear(titleInput);
		await user.type(titleInput, 'Changement annulé');
		await user.click(screen.getByRole('button', { name: 'Annuler' }));

		expect(screen.getByText('Ma tâche')).toBeInTheDocument();
		expect(screen.queryByLabelText('Modifier le titre')).not.toBeInTheDocument();
	});

	describe('delete confirmation', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.runOnlyPendingTimers();
			vi.useRealTimers();
		});

		it('requires confirmation before deleting', () => {
			const onDelete = vi.fn();
			render(
				<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />
			);

			const deleteBtn = screen.getByRole('button', { name: 'Supprimer' });
			fireEvent.click(deleteBtn);
			expect(onDelete).not.toHaveBeenCalled();

			fireEvent.click(deleteBtn);
			expect(onDelete).toHaveBeenCalledWith(1);
		});

		it('resets confirmation after timeout', () => {
			const onDelete = vi.fn();
			render(
				<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />
			);

			const deleteBtn = screen.getByRole('button', { name: 'Supprimer' });
			fireEvent.click(deleteBtn);

			act(() => {
				vi.advanceTimersByTime(3000);
			});

			fireEvent.click(deleteBtn);
			expect(onDelete).not.toHaveBeenCalled();
		});
	});
});
