#!/bin/bash
# Script to run tests with coverage and generate report

echo "Running tests with coverage..."
echo "================================"
echo ""

# Run tests with coverage
pnpm test --coverage

echo ""
echo "================================"
echo "Coverage report generated!"
echo ""
echo "Summary files:"
echo "  - coverage/lcov-report/index.html (open in browser)"
echo "  - coverage/coverage-summary.json (machine-readable)"
echo ""
echo "To view detailed HTML report, run:"
echo "  open coverage/lcov-report/index.html  # macOS"
echo "  xdg-open coverage/lcov-report/index.html  # Linux"
echo "  start coverage/lcov-report/index.html  # Windows"
