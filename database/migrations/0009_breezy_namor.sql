CREATE TYPE "public"."cocktail_method" AS ENUM('SHAKE', 'STIR', 'BUILD', 'BLEND');--> statement-breakpoint
CREATE TYPE "public"."cocktail_tier" AS ENUM('CORE', 'EXTRA', 'FREE');--> statement-breakpoint
CREATE TYPE "public"."ingredient_category" AS ENUM('SPIRIT', 'LIQUEUR', 'WINE_BEER', 'MIXER', 'SYRUP', 'BITTER', 'FRESH', 'PANTRY');--> statement-breakpoint
CREATE TABLE "cocktail_bar_items" (
	"userId" text NOT NULL,
	"ingredientId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "cocktail_bar_items_userId_ingredientId_pkey" PRIMARY KEY("userId","ingredientId")
);
--> statement-breakpoint
CREATE TABLE "cocktail_ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" "ingredient_category" NOT NULL,
	"defaultTier" "cocktail_tier" NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cocktail_recipe_items" (
	"cocktailId" text NOT NULL,
	"ingredientId" text NOT NULL,
	"amount" text NOT NULL,
	"tier" "cocktail_tier",
	"position" integer NOT NULL,
	CONSTRAINT "cocktail_recipe_items_cocktailId_ingredientId_pkey" PRIMARY KEY("cocktailId","ingredientId")
);
--> statement-breakpoint
CREATE TABLE "cocktails" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"method" "cocktail_method" NOT NULL,
	"glass" text NOT NULL,
	"garnish" text,
	"note" text,
	"iba" boolean DEFAULT false NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"sourceName" text NOT NULL,
	"sourceUrl" text
);
--> statement-breakpoint
ALTER TABLE "cocktail_bar_items" ADD CONSTRAINT "cocktail_bar_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cocktail_bar_items" ADD CONSTRAINT "cocktail_bar_items_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "public"."cocktail_ingredients"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cocktail_recipe_items" ADD CONSTRAINT "cocktail_recipe_items_cocktailId_fkey" FOREIGN KEY ("cocktailId") REFERENCES "public"."cocktails"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cocktail_recipe_items" ADD CONSTRAINT "cocktail_recipe_items_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "public"."cocktail_ingredients"("id") ON DELETE restrict ON UPDATE cascade;