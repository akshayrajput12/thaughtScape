 # ThaughtScape

A modern social platform for sharing thoughts and connecting with creative minds, built with React, TypeScript, and Supabase.

## Features

- User authentication and profiles
- Real-time thought sharing
- Interactive user connections
- Responsive design with modern UI
- Supabase backend integration

## Tech Stack

- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.1
- **Language**: TypeScript 5.5.3
- **UI Components**: shadcn-ui
- **Styling**: Tailwind CSS 3.4.11
- **State Management**: React Query 5.56.2
- **Backend & Auth**: Supabase
- **Animations**: Framer Motion 11.18.2

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm or bun package manager
- Git

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd thaughtscape
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   bun dev
   ```

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── ui/         # shadcn-ui components
│   ├── profile/    # Profile components
│   ├── auth/       # Authentication components
│   └── messages/   # Messaging components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── types/          # TypeScript definitions
├── integrations/   # Third-party integrations
└── styles/         # Global styles
```

## Development Guidelines

1. **Code Style**
   - Follow TypeScript best practices
   - Use functional components
   - Implement proper error handling
   - Follow the component size limit (max 200 lines)

2. **State Management**
   - Use React Query for server state
   - Implement local state with useState/useReducer
   - Extract complex state logic into custom hooks

3. **Styling**
   - Use Tailwind CSS classes
   - Follow the project's color palette
   - Maintain responsive design principles

## Building for Production

1. Create a production build:
   ```bash
   npm run build
   # or
   bun run build
   ```

2. Preview the production build:
   ```bash
   npm run preview
   # or
   bun run preview
   ```

## Deployment

### Vercel Deployment

1. Push your code to a Git repository
2. Import your project in Vercel
3. Configure the following build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Add environment variables in Vercel project settings

### Build Error Prevention

1. Ensure all dependencies are properly listed in `package.json`
2. Verify environment variables are set in Vercel
3. Check for any TypeScript errors before deployment
4. Ensure proper Vite configuration in `vite.config.ts`
5. Verify the build output directory is set to `dist`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
