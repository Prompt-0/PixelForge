import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import MetadataEditor from '../MetadataEditor/MetadataEditor';
import { type MetadataResult } from '../../utils/metadataHandler';

vi.mock('../../utils/metadataHandler', () => ({
  getMetadataFields: () => [
    {
      category: 'Camera',
      fields: [
        { key: 'Make', label: 'Camera Make', editable: true },
        { key: 'Model', label: 'Camera Model', editable: true },
      ],
    },
    {
      category: 'Date & Time',
      fields: [
        { key: 'DateTimeOriginal', label: 'Date Taken', editable: true },
      ],
    },
  ],
}));

describe('MetadataEditor Component', () => {
  const dummyMetadata: MetadataResult = {
    exif: {
      Make: 'Canon',
      Model: 'EOS R5',
      DateTimeOriginal: '2023:10:01 12:00:00',
      UnknownField: 'Some Value',
    },
    iptc: {},
    xmp: {},
    icc: {},
    gps: null,
  };

  it('renders empty state when no metadata is provided', () => {
    render(
      <MetadataEditor
        metadata={null}
        onStripFields={vi.fn()}
        onUpdateFields={vi.fn()}
        onExportJson={vi.fn()}
      />
    );

    expect(screen.getByText('No metadata available')).toBeInTheDocument();
  });

  it('renders metadata correctly when provided', () => {
    render(
      <MetadataEditor
        metadata={dummyMetadata}
        onStripFields={vi.fn()}
        onUpdateFields={vi.fn()}
        onExportJson={vi.fn()}
      />
    );

    // Categories headers
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Date & Time')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument(); // For unknown field

    // Check specific fields are rendered
    expect(screen.getByText('Make')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('DateTimeOriginal')).toBeInTheDocument();
    expect(screen.getByText('UnknownField')).toBeInTheDocument();

    // Check value exists (either as input or text)
    expect(screen.getByDisplayValue('Canon')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EOS R5')).toBeInTheDocument();
    expect(screen.getByText('Some Value')).toBeInTheDocument(); // Unknown is editable=false, so it's a span
  });

  it('filters metadata fields based on search query', async () => {
    const user = userEvent.setup();
    render(
      <MetadataEditor
        metadata={dummyMetadata}
        onStripFields={vi.fn()}
        onUpdateFields={vi.fn()}
        onExportJson={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText('Filter metadata fields...');
    await user.type(searchInput, 'Model');

    expect(screen.queryByText('Make')).not.toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
  });

  it('manages checkbox selections, select all, deselect all, and strip', () => {
    const onStripFields = vi.fn();
    render(
      <MetadataEditor
        metadata={dummyMetadata}
        onStripFields={onStripFields}
        onUpdateFields={vi.fn()}
        onExportJson={vi.fn()}
      />
    );

    // Strip button should be disabled initially
    const stripBtn = screen.getByRole('button', { name: /Strip Selected/i });
    expect(stripBtn).toBeDisabled();

    // Click Select All
    const selectAllBtn = screen.getByRole('button', { name: 'Select All' });
    fireEvent.click(selectAllBtn);
    expect(stripBtn).toBeEnabled();

    // Click Strip Selected
    fireEvent.click(stripBtn);
    expect(onStripFields).toHaveBeenCalledWith(['Make', 'Model', 'DateTimeOriginal', 'UnknownField']);

    // Click Deselect All
    const deselectAllBtn = screen.getByRole('button', { name: 'Deselect All' });
    fireEvent.click(deselectAllBtn);
    expect(stripBtn).toBeDisabled();
  });

  it('triggers onUpdateFields when editing an editable field', () => {
    const onUpdateFields = vi.fn();
    render(
      <MetadataEditor
        metadata={dummyMetadata}
        onStripFields={vi.fn()}
        onUpdateFields={onUpdateFields}
        onExportJson={vi.fn()}
      />
    );

    const makeInput = screen.getByDisplayValue('Canon');

    // Simulate typing and blurring
    fireEvent.change(makeInput, { target: { value: 'Sony' } });
    fireEvent.blur(makeInput);

    expect(onUpdateFields).toHaveBeenCalledWith({ Make: 'Sony' });
  });

  it('triggers onExportJson when export button clicked', () => {
    const onExportJson = vi.fn();
    render(
      <MetadataEditor
        metadata={dummyMetadata}
        onStripFields={vi.fn()}
        onUpdateFields={vi.fn()}
        onExportJson={onExportJson}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /Export as JSON/i });
    fireEvent.click(exportBtn);

    expect(onExportJson).toHaveBeenCalledTimes(1);
  });
});
