CREATE TYPE "public"."activity_type" AS ENUM('new_comment', 'new_visit', 'property_state_change', 'new_review');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('ARS', 'USD');--> statement-breakpoint
CREATE TYPE "public"."operation_type" AS ENUM('Venta', 'Alquiler');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('BORRADOR', 'PUBLICADA', 'RESERVADA', 'VENDIDA', 'ALQUILADA', 'PAUSADA', 'CANCELADA');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('Casa', 'Departamento', 'Terreno', 'Local');--> statement-breakpoint
CREATE TYPE "public"."visit_request_status" AS ENUM('Pendiente', 'Confirmada', 'Realizada', 'Cancelada', 'Rechazada');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"type" "activity_type" NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"fantasy_name" text NOT NULL,
	"description" text NOT NULL,
	"logo_url" text,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agencies_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "agencies_fantasy_name_unique" UNIQUE("fantasy_name")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"seller_reply" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"property_type" "property_type" NOT NULL,
	"operation_type" "operation_type" NOT NULL,
	"status" "property_status" DEFAULT 'BORRADOR' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" "currency" DEFAULT 'USD' NOT NULL,
	"total_area" integer,
	"covered_area" integer,
	"rooms" integer,
	"bedrooms" integer,
	"bathrooms" integer,
	"age" integer,
	"address" text NOT NULL,
	"neighborhood" text NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "price_positive" CHECK ("properties"."price" > 0),
	CONSTRAINT "total_area_positive" CHECK ("properties"."total_area" IS NULL OR "properties"."total_area" > 0),
	CONSTRAINT "covered_area_positive" CHECK ("properties"."covered_area" IS NULL OR "properties"."covered_area" > 0)
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_state_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"previous_state" "property_status",
	"new_state" "property_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "state_actually_changes" CHECK ("property_state_history"."previous_state" IS NULL OR "property_state_history"."previous_state" != "property_state_history"."new_state")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rating_range" CHECK ("reviews"."rating" >= 1 AND "reviews"."rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "visit_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"requester_name" text NOT NULL,
	"requester_phone" text NOT NULL,
	"proposed_date" timestamp NOT NULL,
	"message" text,
	"status" "visit_request_status" DEFAULT 'Pendiente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_state_history" ADD CONSTRAINT "property_state_history_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activities_agency_id" ON "activities" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_comments_property_id" ON "comments" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_properties_operation_type" ON "properties" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX "idx_properties_status" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_properties_price" ON "properties" USING btree ("price");--> statement-breakpoint
CREATE INDEX "idx_properties_search" ON "properties" USING btree ("property_type","operation_type","neighborhood");--> statement-breakpoint
CREATE INDEX "idx_property_images_property_id" ON "property_images" USING btree ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_one_cover_per_property" ON "property_images" USING btree ("property_id") WHERE "property_images"."is_cover" = true;--> statement-breakpoint
CREATE INDEX "idx_property_state_history_property_id" ON "property_state_history" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_agency_id" ON "reviews" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_visit_requests_property_id" ON "visit_requests" USING btree ("property_id");