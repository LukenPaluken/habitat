ALTER TABLE "activities" ADD COLUMN "property_id" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "reference_id" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;