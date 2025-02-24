
# Project Documentation

## Table of Contents
1. [File Structure](#file-structure)
2. [Code Guidelines](#code-guidelines)
3. [Color Palette](#color-palette)
4. [Database Structure](#database-structure)
5. [File Conventions](#file-conventions)
6. [Component Guidelines](#component-guidelines)

## File Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── profile/         # Profile-related components
│   ├── home/           # Home page components
│   ├── auth/           # Authentication components
│   └── messages/       # Messaging components
├── pages/             # Page components
├── hooks/             # Custom React hooks
├── lib/              # Utility functions
├── types/            # TypeScript type definitions
├── integrations/     # Third-party integrations
└── styles/          # Global styles
```

## Code Guidelines

1. **Maximum File Length**: 
   - Components should not exceed 200 lines
   - If a component grows larger, split it into smaller components
   - Current example of large file that needs refactoring: ProfileHeader.tsx (263 lines)

2. **Component Structure**:
   ```typescript
   // 1. Imports
   import { ... } from '...';

   // 2. Types/Interfaces
   interface ComponentProps {
     // Props definition
   }

   // 3. Component Definition
   export const Component = ({ prop1, prop2 }: ComponentProps) => {
     // State/Hooks
     // Helper functions
     // Return JSX
   };
   ```

3. **Naming Conventions**:
   - Components: PascalCase (e.g., ProfileHeader)
   - Files: PascalCase for components, camelCase for utilities
   - Hooks: camelCase prefixed with 'use'
   - Types/Interfaces: PascalCase

## Color Palette

Primary Colors:
- Primary Purple: `#E5DEFF`
- Secondary: `#FDE1D3`
- Accent: `#F7F7F9`
- Muted: `#F1F0FB`

Text Colors:
- Primary Text: `#2D3748`
- Secondary Text: `#6B7280`

Background Colors:
- Background: `#FFFFFF`
- Muted Background: `#F1F0FB`

## Database Structure

### Tables

1. **profiles**
   - Primary user information
   - Columns: id, username, full_name, avatar_url, bio, etc.
   - Related to auth.users

2. **thoughts**
   - User posts/thoughts
   - Columns: id, title, content, author_id, created_at, etc.
   - References profiles.id

3. **user_genres**
   - User interests/genres
   - Columns: user_id, genre_id
   - References profiles.id and genres.id

4. **genres**
   - Available interest categories
   - Columns: id, name, created_at

5. **likes**
   - Post likes
   - Columns: thought_id, user_id, created_at

6. **bookmarks**
   - Saved posts
   - Columns: thought_id, user_id, created_at

### Database Relationships
- profiles -> thoughts (one-to-many)
- profiles -> user_genres (one-to-many)
- thoughts -> likes (one-to-many)
- thoughts -> bookmarks (one-to-many)

## Component Guidelines

1. **State Management**:
   - Use local state for UI-only state
   - Use React Query for server state
   - Consider moving complex state to custom hooks

2. **Props**:
   - Keep props minimal and focused
   - Use TypeScript interfaces for prop definitions
   - Document complex prop structures

3. **Error Handling**:
   - Use try/catch blocks for async operations
   - Display user-friendly error messages using toast
   - Log errors to console in development

4. **Performance**:
   - Memoize expensive calculations
   - Use proper React hooks dependencies
   - Implement pagination for large lists

## File Interlinks Example

```typescript
// pages/Profile.tsx
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfilePoems } from '@/components/profile/ProfilePoems';

// components/profile/ProfileHeader.tsx
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import type { Profile } from '@/types';

// hooks/use-profile.ts
import { supabase } from '@/integrations/supabase/client';
```

## Best Practices

1. **Component Size**:
   - Keep components focused on a single responsibility
   - Extract reusable logic into custom hooks
   - Split large components into smaller ones

2. **Database Queries**:
   - Use appropriate indexes for frequently queried columns
   - Implement proper RLS policies
   - Cache frequently accessed data

3. **Styling**:
   - Use Tailwind CSS classes
   - Follow mobile-first responsive design
   - Maintain consistent spacing and typography

## Development Guidelines

1. **Code Quality**:
   - Write self-documenting code
   - Add comments for complex logic
   - Use TypeScript strictly

2. **Testing**:
   - Write unit tests for utilities
   - Test components in isolation
   - Cover edge cases and error states

3. **Performance**:
   - Optimize images and assets
   - Implement proper loading states
   - Use proper caching strategies

