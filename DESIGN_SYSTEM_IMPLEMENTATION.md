# ChitChat UI Design System - Anthropic Theme

## Overview

This document outlines the UI revamp following the Anthropic Claude design system. The theme features a warm cream canvas, coral accents, and a refined typographic hierarchy.

## Color Palette

### Primary Colors

- **Canvas** (`bg-canvas`): #faf9f5 - Main background, warm cream
- **Ink** (`text-ink`): #141413 - Primary text color
- **Primary** (`bg-primary`): #cc785c - Coral, primary CTA
- **Primary Active** (`bg-primary-active`): #a9583e - Pressed state
- **Primary Disabled** (`bg-primary-disabled`): #e6dfd8 - Disabled state

### Surface Colors

- **Surface Card** (`bg-surface-card`): #efe9de - Card backgrounds
- **Surface Soft** (`bg-surface-soft`): #f5f0e8 - Soft backgrounds
- **Surface Dark** (`bg-surface-dark`): #181715 - Dark UI surfaces
- **Surface Dark Elevated** (`bg-surface-dark-elevated`): #252320 - Elevated dark surfaces

### Text Colors

- **Body** (`text-body`): #3d3d3a - Body text
- **Body Strong** (`text-body-strong`): #252523 - Emphasized text
- **Muted** (`text-muted`): #6c6a64 - Muted/secondary text
- **Muted Soft** (`text-muted-soft`): #8e8b82 - Very subtle text
- **On Dark** (`text-on-dark`): #faf9f5 - Text on dark surfaces

### Borders

- **Hairline** (`border-hairline`): #e6dfd8 - Primary borders
- **Hairline Soft** (`border-hairline-soft`): #ebe6df - Subtle borders

### Semantic Colors

- **Success** (`bg-success`): #5db872
- **Warning** (`bg-warning`): #d4a017
- **Error** (`bg-error`): #c64545
- **Accent Teal** (`bg-accent-teal`): #5db8a6
- **Accent Amber** (`bg-accent-amber`): #e8a55a

## Typography

### Font Families

- **Display** (Headlines): Cormorant Garamond / Tiempos Headline (serif)
- **Body** (Text): Inter (humanist sans-serif)
- **Mono** (Code): JetBrains Mono

### Font Sizes & Hierarchy

- **Display XL**: 64px, line-height 1.05, letter-spacing -1.5px
- **Display LG**: 48px, line-height 1.1, letter-spacing -1px
- **Display MD**: 36px, line-height 1.15, letter-spacing -0.5px
- **Display SM**: 28px, line-height 1.2, letter-spacing -0.3px
- **Title LG**: 22px, weight 500
- **Title MD**: 18px, weight 500
- **Title SM**: 16px, weight 500
- **Body MD**: 16px, weight 400
- **Body SM**: 14px, weight 400
- **Caption**: 13px, weight 500
- **Caption Uppercase**: 12px, weight 500, letter-spacing 1.5px

## Spacing System

- **xxs**: 4px
- **xs**: 8px
- **sm**: 12px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px
- **section**: 96px

## Border Radius

- **xs**: 4px
- **sm**: 6px
- **md**: 8px
- **lg**: 12px
- **xl**: 16px
- **pill/full**: 9999px

## Component Specifications

### Buttons

- **Primary Button**: bg-primary, text-on-primary, py-3 px-4, rounded-md
- **Primary Hover**: bg-primary-active
- **Primary Disabled**: bg-primary-disabled, text-muted
- **Secondary Button**: bg-canvas, text-ink, border-hairline
- **Text Link**: text-primary, no background, underline on hover

### Cards

- **Surface Card**: bg-surface-card, border-hairline, rounded-lg, p-8
- **Dark Surface**: bg-surface-dark, border-hairline, rounded-lg

### Forms

- **Text Input**: bg-canvas, text-ink, border-hairline, rounded-md
- **Input Focus**: border-primary, ring-primary/10
- **Label**: text-caption-uppercase, text-muted

### Navigation

- **Active Tab**: bg-surface-card, text-ink
- **Inactive Tab**: text-muted, hover:bg-surface-soft
- **Icon Button**: p-2.5, rounded-md, text-muted, hover:text-ink

## Updated Components

### Completed ✅

- [x] CSS Variables (index.css)
- [x] Tailwind Configuration
- [x] Login Page
- [x] Signup Page
- [x] Landing Page

### In Progress 🔄

- [ ] Layout/Sidebar Component
- [ ] Chat Components
- [ ] Call Components
- [ ] Settings Components
- [ ] Notification Components

### Pending ⏳

- [ ] Mobile Responsive Updates
- [ ] Dark Mode Refinements
- [ ] Animation & Transitions
- [ ] Accessibility Audit

## Migration Guide

### Old → New Color Classes

```
bg-background → bg-canvas
text-foreground → text-ink
bg-muted → bg-surface-soft
border-border → border-hairline
text-muted-foreground → text-muted
rounded-xl → rounded-lg or rounded-md (context-dependent)
rounded-2xl → rounded-lg
rounded-3xl → rounded-lg
```

### Old → New Typography Classes

```
text-xs font-semibold → text-caption-uppercase
text-sm font-medium → text-body-sm
text-base font-medium → text-title-sm
text-lg font-bold → text-display-sm
text-2xl font-bold → text-display-md
text-3xl font-bold → text-display-lg
```

## Next Steps

1. Update Sidebar and navigation components
2. Refactor chat message components
3. Update call interface
4. Test mobile responsiveness
5. Implement dark mode toggle refinements
6. Accessibility review
