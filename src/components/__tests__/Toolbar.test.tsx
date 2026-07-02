import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Toolbar from '../Toolbar/Toolbar';

describe('Toolbar Component', () => {
  it('renders brand name and modes correctly', () => {
    render(
      <Toolbar
        activeTab="resize"
        onTabChange={vi.fn()}
        mode="single"
        onModeChange={vi.fn()}
        hasImage={false}
        onClear={vi.fn()}
      />
    );

    expect(screen.getByText('PixelForge')).toBeInTheDocument();
    expect(screen.getByText('Single Image')).toHaveClass('active');
    expect(screen.getByText('Batch Processing')).toBeInTheDocument();
  });

  it('disables tabs when hasImage is false or mode is batch', () => {
    const { rerender } = render(
      <Toolbar
        activeTab="resize"
        onTabChange={vi.fn()}
        mode="single"
        onModeChange={vi.fn()}
        hasImage={false}
        onClear={vi.fn()}
      />
    );

    // All tabs should be disabled since hasImage is false
    const tabBtns = screen.getAllByRole('button').filter(
      (btn) => ['Resize', 'Compress', 'Convert', 'Adjust', 'Metadata', 'OCR'].includes(btn.textContent || '')
    );
    expect(tabBtns).toHaveLength(6);
    tabBtns.forEach((btn) => expect(btn).toBeDisabled());

    // Rerender with mode = batch, tabs should still be disabled
    rerender(
      <Toolbar
        activeTab="resize"
        onTabChange={vi.fn()}
        mode="batch"
        onModeChange={vi.fn()}
        hasImage={true}
        onClear={vi.fn()}
      />
    );
    tabBtns.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('enables tabs and triggers onTabChange when clicked in single mode with image', () => {
    const onTabChange = vi.fn();
    render(
      <Toolbar
        activeTab="resize"
        onTabChange={onTabChange}
        mode="single"
        hasImage={true}
        onModeChange={vi.fn()}
        onClear={vi.fn()}
      />
    );

    const compressTab = screen.getByText('Compress').closest('button');
    expect(compressTab).not.toBeDisabled();

    fireEvent.click(compressTab!);
    expect(onTabChange).toHaveBeenCalledWith('compress');
  });

  it('triggers onModeChange when switching mode', () => {
    const onModeChange = vi.fn();
    render(
      <Toolbar
        activeTab="resize"
        onTabChange={vi.fn()}
        mode="single"
        onModeChange={onModeChange}
        hasImage={true}
        onClear={vi.fn()}
      />
    );

    const batchBtn = screen.getByText('Batch Processing');
    fireEvent.click(batchBtn);

    expect(onModeChange).toHaveBeenCalledWith('batch');
  });

  it('shows clear button and triggers onClear when clicked', () => {
    const onClear = vi.fn();
    const { rerender } = render(
      <Toolbar
        activeTab="resize"
        onTabChange={vi.fn()}
        mode="single"
        onModeChange={vi.fn()}
        hasImage={false}
        onClear={onClear}
      />
    );

    expect(screen.queryByTitle('Clear Workspace')).toBeDisabled();

    rerender(
      <Toolbar
        activeTab="resize"
        onTabChange={vi.fn()}
        mode="single"
        onModeChange={vi.fn()}
        hasImage={true}
        onClear={onClear}
      />
    );

    const clearBtn = screen.getByTitle('Clear Workspace');
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
