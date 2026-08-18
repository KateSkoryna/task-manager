import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import Dropdown from './Dropdown';

const options = [
  { value: 'low' as const, label: 'Low' },
  { value: 'high' as const, label: 'High' },
];

function Harness({ onSubmit = jest.fn(), fixedPosition = false }) {
  const [value, setValue] = useState<'low' | 'high' | null>(null);
  return (
    <form onSubmit={onSubmit}>
      <Dropdown
        ariaLabel="Priority"
        value={value}
        onChange={setValue}
        options={options}
        nullOption={{ label: 'None' }}
        placeholder="Choose priority"
        fixedPosition={fixedPosition}
      />
    </form>
  );
}

describe('Dropdown', () => {
  test('uses native disclosure and button semantics with a stable name', async () => {
    render(<Harness />);
    const summary = screen.getByLabelText('Priority');
    const details = summary.closest('details');

    expect(summary.tagName).toBe('SUMMARY');
    expect(details?.firstElementChild).toBe(summary);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await userEvent.click(summary);
    const buttons = await screen.findAllByRole('button');
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) =>
      expect(button).toHaveAttribute('type', 'button')
    );
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  test('selects by mouse without submitting and restores summary focus', async () => {
    const onSubmit = jest.fn((event) => event.preventDefault());
    render(<Harness onSubmit={onSubmit} />);
    const summary = screen.getByLabelText('Priority');
    await userEvent.click(summary);
    await userEvent.click(screen.getByRole('button', { name: 'High' }));

    expect(summary).toHaveTextContent('High');
    expect(summary.closest('details')).not.toHaveAttribute('open');
    expect(summary).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('supports native Enter and Space activation on option buttons', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const summary = screen.getByLabelText('Priority');
    await user.click(summary);
    screen.getByRole('button', { name: 'Low' }).focus();
    await user.keyboard('{Enter}');
    expect(summary).toHaveTextContent('Low');

    await user.click(summary);
    screen.getByRole('button', { name: 'High' }).focus();
    await user.keyboard(' ');
    expect(summary).toHaveTextContent('High');
    await user.click(summary);
    expect(screen.getByRole('button', { name: 'High' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('selects the null option and safely handles empty options', async () => {
    render(<Harness />);
    const summary = screen.getByLabelText('Priority');
    await userEvent.click(summary);
    await userEvent.click(screen.getByRole('button', { name: 'Low' }));
    await userEvent.click(summary);
    await userEvent.click(screen.getByRole('button', { name: 'None' }));
    expect(summary).toHaveTextContent('None');

    render(
      <Dropdown
        ariaLabel="Empty"
        value={null}
        onChange={jest.fn()}
        options={[]}
        placeholder="Nothing available"
      />
    );
    await userEvent.click(screen.getByLabelText('Empty'));
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  test('dismisses with Escape or outside pointer without changing value', async () => {
    render(<Harness />);
    const summary = screen.getByLabelText('Priority');
    await userEvent.click(summary);
    fireEvent.keyDown(summary.closest('details') as HTMLElement, {
      key: 'Escape',
    });
    expect(summary.closest('details')).not.toHaveAttribute('open');
    expect(summary).toHaveFocus();

    await userEvent.click(summary);
    await screen.findByRole('button', { name: 'None' });
    fireEvent.pointerDown(document.body);
    await waitFor(() =>
      expect(summary.closest('details')).not.toHaveAttribute('open')
    );
    expect(summary).toHaveTextContent('None');
  });

  test('positions a fixed menu from the summary rectangle', async () => {
    render(<Harness fixedPosition />);
    const summary = screen.getByLabelText('Priority');
    jest.spyOn(summary, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      bottom: 40,
      left: 20,
      right: 140,
      width: 120,
      height: 30,
      x: 20,
      y: 10,
      toJSON: () => ({}),
    });
    await userEvent.click(summary);
    await waitFor(() =>
      expect(screen.getByRole('list')).toHaveStyle({
        position: 'fixed',
        top: '44px',
        left: '20px',
        minWidth: '120px',
      })
    );
  });
});
