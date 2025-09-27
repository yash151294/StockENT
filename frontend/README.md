# StockENT Frontend

A modern B2B textile marketplace built with Next.js, shadcn/ui, Lucide icons, and Framer Motion.

## 🚀 Technology Stack

- **Next.js 15** - React framework with App Router
- **shadcn/ui** - Beautiful, accessible UI components
- **Lucide React** - Beautiful & consistent icon toolkit
- **Framer Motion** - Production-ready motion library
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript

## 📦 Installed Dependencies

### Core Framework
- `next@^15.5.4` - Next.js framework
- `react@^19.1.1` - React library
- `react-dom@^19.1.1` - React DOM

### UI Components & Styling
- `@radix-ui/react-slot@^1.2.3` - Radix UI primitives
- `@radix-ui/react-label@^2.1.7` - Label component
- `@radix-ui/react-select@^2.2.6` - Select component
- `@radix-ui/react-dropdown-menu@^2.1.16` - Dropdown menu
- `@radix-ui/react-dialog@^1.1.15` - Dialog component
- `@radix-ui/react-avatar@^1.1.10` - Avatar component
- `class-variance-authority@^0.7.1` - Component variants
- `clsx@^2.1.1` - Conditional className utility
- `tailwind-merge@^3.3.1` - Merge Tailwind classes
- `tailwindcss-animate@^1.0.7` - Animation utilities

### Icons & Animations
- `lucide-react@^0.544.0` - Beautiful icons
- `framer-motion@^12.23.22` - Animation library

### Development Tools
- `tailwindcss@^4.1.13` - CSS framework
- `postcss@^8.5.6` - CSS processor
- `autoprefixer@^10.4.21` - CSS vendor prefixes

## 🛠️ Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Start production server:**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── src/
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── badge.tsx
│   │   └── ExampleComponent.tsx
│   └── lib/
│       └── utils.ts        # Utility functions
├── components.json         # shadcn/ui configuration
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── next.config.js          # Next.js configuration
└── tsconfig.json           # TypeScript configuration
```

## 🎨 Available Components

### shadcn/ui Components
- **Button** - Versatile button component with variants
- **Card** - Content container with header, content, footer
- **Input** - Form input component
- **Label** - Form label component
- **Badge** - Status and category indicators

### Icons (Lucide React)
- `Search`, `ShoppingCart`, `Users`, `TrendingUp`
- `Heart`, `Star`, and many more...

### Animations (Framer Motion)
- Page transitions
- Hover effects
- Click animations
- Scroll-triggered animations

## 🚀 Usage Examples

### Using shadcn/ui Components
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

### Using Lucide Icons
```tsx
import { Search, Heart, Star } from 'lucide-react'

export default function IconExample() {
  return (
    <div>
      <Search className="h-4 w-4" />
      <Heart className="h-4 w-4 text-red-500" />
      <Star className="h-4 w-4 text-yellow-500" />
    </div>
  )
}
```

### Using Framer Motion
```tsx
import { motion } from 'framer-motion'

export default function AnimatedComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      Animated content
    </motion.div>
  )
}
```

## 🎯 Features

- ✅ **Next.js 15** with App Router
- ✅ **shadcn/ui** component library
- ✅ **Lucide React** icons
- ✅ **Framer Motion** animations
- ✅ **Tailwind CSS** styling
- ✅ **TypeScript** support
- ✅ **Responsive design**
- ✅ **Dark mode ready**
- ✅ **Accessibility** features

## 🔧 Development

The project is configured with:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking
- **Tailwind CSS** for styling
- **PostCSS** for CSS processing

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 🌟 Next Steps

1. Add more shadcn/ui components as needed
2. Create custom components using the established patterns
3. Implement routing with Next.js App Router
4. Add state management (Zustand, Redux Toolkit, etc.)
5. Integrate with your backend API
6. Add authentication and authorization
7. Implement data fetching with React Query or SWR

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
