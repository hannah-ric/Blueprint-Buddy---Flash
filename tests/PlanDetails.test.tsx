import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanDetails } from '../src/components/PlanDetails';

const mockPlan = {
  id: "test-id",
  userId: "test-user",
  name: "Test Plan",
  title: "Test Plan",
  description: "A test plan",
  dimensions: "10x10x10",
  estimatedTime: "1 hour",
  difficulty: "Beginner",
  material: "Pine",
  joinery: "Screws",
  designStyle: "Modern",
  units: "inches" as const,
  materials: ["Wood"],
  tools: ["Saw"],
  cutList: [{ part: "Leg", quantity: 4, thickness: "1", width: "2", length: "10", material: "Pine" }],
  modelParts: [{ name: "Leg 1", width: 2, height: 10, depth: 1, x: 0, y: 5, z: 0 }],
  bom: [{ item: "Screws", quantity: 10, unit: "box", estimatedCost: 5 }],
  instructions: [{ text: "Attach leg", activeParts: ["Leg 1"], imageUrl: "test.jpg" }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('PlanDetails', () => {
  it('renders plan details correctly', () => {
    render(<PlanDetails plan={mockPlan} onSendMessage={() => {}} isLoading={false} />);
    
    // The title and description are rendered in the parent component (App.tsx), not PlanDetails
    // PlanDetails renders the specifications, cut list, BOM, and instructions
    expect(screen.getByText('Specifications')).toBeDefined();
    expect(screen.getByText('10x10x10')).toBeDefined();
  });

  it('renders cut list correctly', () => {
    render(<PlanDetails plan={mockPlan} onSendMessage={() => {}} isLoading={false} />);
    
    expect(screen.getByText('Leg')).toBeDefined();
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pine').length).toBeGreaterThan(0);
  });

  it('renders BOM correctly', () => {
    render(<PlanDetails plan={mockPlan} onSendMessage={() => {}} isLoading={false} />);
    
    expect(screen.getAllByText('Screws').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getByText('$5.00')).toBeDefined();
  });

  it('renders instructions correctly', () => {
    render(<PlanDetails plan={mockPlan} onSendMessage={() => {}} isLoading={false} />);
    
    expect(screen.getByText('Attach leg')).toBeDefined();
    expect(screen.getByText('Leg 1')).toBeDefined();
    const img = screen.getByAltText('Step 1 illustration');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('test.jpg');
  });

  it('handles message submission', () => {
    const onSendMessage = vi.fn();
    render(<PlanDetails plan={mockPlan} onSendMessage={onSendMessage} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Request changes to this design...');
    const button = screen.getAllByRole('button').find(b => b.getAttribute('type') === 'submit');
    
    fireEvent.change(input, { target: { value: 'Make it bigger' } });
    if (button) fireEvent.click(button);
    
    expect(onSendMessage).toHaveBeenCalledWith('Make it bigger');
  });

  it('disables input and button when loading', () => {
    render(<PlanDetails plan={mockPlan} onSendMessage={() => {}} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Request changes to this design...');
    const button = screen.getAllByRole('button').find(b => b.getAttribute('type') === 'submit');
    
    expect(input.hasAttribute('disabled')).toBe(true);
    expect(button?.hasAttribute('disabled')).toBe(true);
  });
});
