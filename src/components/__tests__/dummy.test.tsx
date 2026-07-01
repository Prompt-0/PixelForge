import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Dummy Test Suite', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should render a component and use jest-dom matchers', () => {
    render(<div>Hello Vitest</div>);
    const element = screen.getByText('Hello Vitest');
    expect(element).toBeInTheDocument();
  });
});
