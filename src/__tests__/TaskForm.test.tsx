import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
	it('renders create mode by default', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
	});

	it('renders edit mode with cancel button', () => {
		const onCancel = vi.fn();
		render(
			<TaskForm
				onSubmit={vi.fn()}
				mode="edit"
				initialValues={{ title: 'Existant', description: 'Desc' }}
				onCancel={onCancel}
			/>
		);
		expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Existant')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Desc')).toBeInTheDocument();
	});

	it('shows a validation error when title is empty', async () => {
		const onSubmit = vi.fn();
		const user = userEvent.setup();
		render(<TaskForm onSubmit={onSubmit} />);

		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('clears validation error when typing in the title', async () => {
		const user = userEvent.setup();
		render(<TaskForm onSubmit={vi.fn()} />);

		await user.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(screen.getByRole('alert')).toBeInTheDocument();

		await user.type(screen.getByLabelText('Titre'), 'A');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('submits trimmed title and description and resets in create mode', async () => {
		const onSubmit = vi.fn();
		const user = userEvent.setup();
		render(<TaskForm onSubmit={onSubmit} />);

		const titleInput = screen.getByLabelText('Titre') as HTMLInputElement;
		const descInput = screen.getByLabelText('Description') as HTMLTextAreaElement;

		await user.type(titleInput, '  Ma tâche  ');
		await user.type(descInput, '  Ma description  ');
		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(onSubmit).toHaveBeenCalledWith({
			title: 'Ma tâche',
			description: 'Ma description',
		});
		expect(titleInput.value).toBe('');
		expect(descInput.value).toBe('');
	});

	it('submits with undefined description when empty', async () => {
		const onSubmit = vi.fn();
		const user = userEvent.setup();
		render(<TaskForm onSubmit={onSubmit} />);

		await user.type(screen.getByLabelText('Titre'), 'Titre seul');
		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(onSubmit).toHaveBeenCalledWith({
			title: 'Titre seul',
			description: undefined,
		});
	});

	it('does not reset fields in edit mode', async () => {
		const onSubmit = vi.fn();
		const user = userEvent.setup();
		render(
			<TaskForm onSubmit={onSubmit} mode="edit" initialValues={{ title: 'Edit' }} />
		);

		const titleInput = screen.getByLabelText('Titre') as HTMLInputElement;
		await user.click(screen.getByRole('button', { name: 'Modifier' }));

		expect(onSubmit).toHaveBeenCalled();
		expect(titleInput.value).toBe('Edit');
	});

	it('calls onCancel when cancel button is clicked', async () => {
		const onCancel = vi.fn();
		const user = userEvent.setup();
		render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} />);

		await user.click(screen.getByRole('button', { name: 'Annuler' }));
		expect(onCancel).toHaveBeenCalled();
	});
});
