'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LiquidGlassCard from './LiquidGlassCard'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, Heart, Star, ShoppingCart } from 'lucide-react'

export default function ExampleComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold mb-4">Next.js + shadcn/ui + Lucide + Framer Motion</h1>
        <p className="text-gray-600 mb-8">
          A modern stack for building beautiful, interactive web applications
        </p>
      </motion.div>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <LiquidGlassCard variant="default" hoverEffect={false} glassIntensity="medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Products
            </CardTitle>
            <CardDescription>
              Find the perfect textile products for your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search">Search term</Label>
                <Input
                  id="search"
                  placeholder="Enter product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button>Search</Button>
              </div>
            </div>
            {searchTerm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex gap-2"
              >
                <Badge variant="secondary">Results for: {searchTerm}</Badge>
                <Badge variant="outline">12 products found</Badge>
              </motion.div>
            )}
          </CardContent>
        </LiquidGlassCard>
      </motion.div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * item }}
            whileHover={{ scale: 1.05 }}
            className="group"
          >
            <LiquidGlassCard variant="default" hoverEffect={true} glassIntensity="medium" className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <ShoppingCart className="h-12 w-12 text-blue-600" />
                </motion.div>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Product {item}</CardTitle>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsLiked(!isLiked)}
                    className="p-1"
                  >
                    <Heart 
                      className={`h-5 w-5 ${
                        isLiked ? 'text-red-500 fill-current' : 'text-gray-400'
                      }`} 
                    />
                  </motion.button>
                </div>
                <CardDescription>
                  High-quality textile product for your business needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">(4.8)</span>
                  </div>
                  <Badge variant="secondary">$99.99</Badge>
                </div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="mt-4"
                >
                  <Button className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </motion.div>
              </CardContent>
            </LiquidGlassCard>
          </motion.div>
        ))}
      </div>

      {/* Interactive Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <LiquidGlassCard variant="default" hoverEffect={false} glassIntensity="medium">
          <CardHeader>
            <CardTitle>Interactive Demo</CardTitle>
            <CardDescription>
              Hover and click to see Framer Motion animations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 bg-blue-100 rounded-lg cursor-pointer"
              >
                <p className="font-medium">Hover me!</p>
              </motion.div>
              
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="p-4 bg-green-100 rounded-lg"
              >
                <p className="font-medium">Auto animate!</p>
              </motion.div>
              
              <motion.div
                whileHover={{ 
                  scale: 1.1,
                  backgroundColor: "#fbbf24"
                }}
                className="p-4 bg-yellow-100 rounded-lg cursor-pointer"
              >
                <p className="font-medium">Color change!</p>
              </motion.div>
            </div>
          </CardContent>
        </LiquidGlassCard>
      </motion.div>
    </div>
  )
}
