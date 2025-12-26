# Database Specialist Agent

**Domain**: Prisma ORM, PostgreSQL, Migrations, Schema Design

## Tech Stack

```
RDBMS:          PostgreSQL
ORM:            Prisma 5.6
Migrations:     Prisma Migrate
```

## Schema Location

```
backend/prisma/schema.prisma
```

## Schema Patterns

### Model Structure

```prisma
model Negotiation {
  id                 String            @id @default(cuid())
  productId          String
  buyerId            String
  sellerId           String

  // Business fields
  buyerOffer         Float
  sellerCounterOffer Float?
  status             NegotiationStatus @default(PENDING)
  buyerMessage       String?
  sellerMessage      String?
  expiresAt          DateTime?

  // Timestamps
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  // Relations
  product   Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  buyer     User       @relation("NegotiationBuyer", fields: [buyerId], references: [id])
  seller    User       @relation("NegotiationSeller", fields: [sellerId], references: [id])
  cartItems CartItem[]

  // Constraints
  @@unique([productId, buyerId])
  @@map("negotiations")
}

enum NegotiationStatus {
  PENDING
  COUNTERED
  ACCEPTED
  DECLINED
  EXPIRED
  CANCELLED
}
```

### Conventions

1. **ID**: Use `@id @default(cuid())` for primary keys
2. **Timestamps**: Include `createdAt` and `updatedAt`
3. **Table names**: Use `@@map("snake_case")` for PostgreSQL
4. **Relations**: Define both sides of relationships
5. **Cascade**: Use `onDelete: Cascade` for child records
6. **Unique constraints**: Use `@@unique([field1, field2])`

### Relation Patterns

```prisma
// One-to-One
model User {
  id             String          @id @default(cuid())
  companyProfile CompanyProfile?
}

model CompanyProfile {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// One-to-Many
model Product {
  id       String         @id @default(cuid())
  sellerId String
  seller   User           @relation(fields: [sellerId], references: [id])
  images   ProductImage[]
}

// Many-to-Many (implicit)
// Use explicit join table for additional fields

// Self-referential
model Category {
  id       String     @id @default(cuid())
  parentId String?
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
}
```

### Enum Definitions

```prisma
enum UserRole {
  BUYER
  SELLER
  ADMIN
}

enum ProductStatus {
  ACTIVE
  INACTIVE
  SOLD
  EXPIRED
}

enum ListingType {
  FIXED_PRICE
  AUCTION
  NEGOTIABLE
}
```

## Migration Workflow

### Create Migration

```bash
# Create migration (development)
npx prisma migrate dev --name add_negotiation_model

# This will:
# 1. Generate SQL migration file
# 2. Apply migration to database
# 3. Regenerate Prisma Client
```

### Migration File Naming

```
migrations/
└── 20231226120000_add_negotiation_model/
    └── migration.sql
```

### Example Migration SQL

```sql
-- migrations/20231226120000_add_negotiation_model/migration.sql

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('PENDING', 'COUNTERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "negotiations" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerOffer" DOUBLE PRECISION NOT NULL,
    "sellerCounterOffer" DOUBLE PRECISION,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'PENDING',
    "buyerMessage" TEXT,
    "sellerMessage" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "negotiations_productId_buyerId_key" ON "negotiations"("productId", "buyerId");

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

## Query Optimization

### Select Only Needed Fields

```javascript
// ✅ Good
const products = await prisma.product.findMany({
  select: {
    id: true,
    title: true,
    basePrice: true,
    seller: {
      select: { id: true, companyName: true },
    },
  },
});

// ❌ Bad - fetches everything
const products = await prisma.product.findMany({
  include: { seller: true },
});
```

### Avoid N+1 Queries

```javascript
// ❌ N+1 Problem
const products = await prisma.product.findMany();
for (const product of products) {
  product.seller = await prisma.user.findUnique({ where: { id: product.sellerId } });
}

// ✅ Eager loading
const products = await prisma.product.findMany({
  include: {
    seller: { select: { id: true, companyName: true } },
  },
});
```

### Pagination

```javascript
const getProducts = async (page = 1, limit = 20) => {
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count(),
  ]);

  return { products, total, pages: Math.ceil(total / limit) };
};
```

### Transactions

```javascript
const acceptNegotiation = async (negotiationId) => {
  return prisma.$transaction(async (tx) => {
    const negotiation = await tx.negotiation.update({
      where: { id: negotiationId },
      data: { status: 'ACCEPTED' },
    });

    await tx.cartItem.create({
      data: {
        userId: negotiation.buyerId,
        productId: negotiation.productId,
        priceAtAddition: negotiation.sellerCounterOffer,
        sourceType: 'NEGOTIATION',
        negotiationId,
      },
    });

    return negotiation;
  });
};
```

## Index Guidelines

```prisma
model Product {
  id         String @id @default(cuid())
  sellerId   String
  categoryId String
  status     ProductStatus
  createdAt  DateTime @default(now())

  // Indexes for common queries
  @@index([sellerId])
  @@index([categoryId])
  @@index([status, createdAt])
}
```

## Critical Rules

1. **Always run migrations** - Never edit database directly
2. **Use transactions** - For multi-table operations
3. **Select explicitly** - Don't include unnecessary fields
4. **Add indexes** - For frequently queried fields
5. **Cascade carefully** - Consider data dependencies
6. **Map table names** - Use `@@map()` for PostgreSQL conventions

## Commands Reference

```bash
# Generate client after schema changes
npx prisma generate

# Create migration (development)
npx prisma migrate dev --name description

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Format schema
npx prisma format
```

---

**Last Updated**: 2025-12-26
