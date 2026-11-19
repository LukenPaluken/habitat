import type { ChangeEvent, FocusEvent, ReactNode } from "react";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Fields";
import { CURRENCIES, OPERATIONS, PROPERTY_TYPES } from "@/lib/property-options";
import { isLand, type PropertyFormValues } from "./property-form-model";

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** What every section needs from the form: the values, the messages and the handlers. */
export interface SectionProps {
  v: PropertyFormValues;
  errorOf: (field: keyof PropertyFormValues) => string | undefined;
  field: {
    onChange: (event: ChangeEvent<Control>) => void;
    onBlur: (event: FocusEvent<Control> | ChangeEvent<Control>) => void;
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export function BasicsSection({ v, errorOf, field }: SectionProps) {
  return (
    <Section title="Datos de la publicación">
      <TextField
        label="Título"
        name="title"
        value={v.title}
        error={errorOf("title")}
        {...field}
      />
      <TextAreaField
        label="Descripción"
        name="description"
        rows={4}
        value={v.description}
        error={errorOf("description")}
        {...field}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Tipo"
          name="propertyType"
          value={v.propertyType}
          {...field}
        >
          {PROPERTY_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </SelectField>
        <SelectField
          label="Operación"
          name="operationType"
          value={v.operationType}
          {...field}
        >
          {OPERATIONS.map((operation) => (
            <option key={operation}>{operation}</option>
          ))}
        </SelectField>
      </div>
      <div className="grid grid-cols-[6rem_1fr] items-start gap-4 sm:max-w-sm">
        <SelectField
          label="Moneda"
          name="currency"
          value={v.currency}
          {...field}
        >
          {CURRENCIES.map((currency) => (
            <option key={currency}>{currency}</option>
          ))}
        </SelectField>
        <TextField
          label="Precio"
          name="price"
          inputMode="decimal"
          value={v.price}
          error={errorOf("price")}
          {...field}
        />
      </div>
    </Section>
  );
}

export function LocationSection({ v, errorOf, field }: SectionProps) {
  return (
    <Section title="Ubicación">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Dirección (calle y altura)"
          name="address"
          value={v.address}
          error={errorOf("address")}
          {...field}
        />
        <TextField
          label="Zona o barrio"
          name="neighborhood"
          value={v.neighborhood}
          error={errorOf("neighborhood")}
          {...field}
        />
      </div>
    </Section>
  );
}

/** Surfaces and rooms. A Terreno has no building, so its fields are not even shown. */
export function SizeSection({
  v,
  errorOf,
  field,
  children,
}: SectionProps & { children?: ReactNode }) {
  const land = isLand(v);

  return (
    <Section title="Superficie y ambientes">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField
          label={land ? "Superficie del terreno (m²)" : "Superficie total (m²)"}
          name="totalArea"
          inputMode="numeric"
          value={v.totalArea}
          error={errorOf("totalArea")}
          {...field}
        />
        {!land && (
          <>
            <TextField
              label="Superficie cubierta (m²)"
              name="coveredArea"
              inputMode="numeric"
              value={v.coveredArea}
              error={errorOf("coveredArea")}
              {...field}
            />
            <TextField
              label="Ambientes"
              name="rooms"
              inputMode="numeric"
              value={v.rooms}
              error={errorOf("rooms")}
              {...field}
            />
            <TextField
              label="Dormitorios"
              name="bedrooms"
              inputMode="numeric"
              value={v.bedrooms}
              error={errorOf("bedrooms")}
              {...field}
            />
            <TextField
              label="Baños"
              name="bathrooms"
              inputMode="numeric"
              value={v.bathrooms}
              error={errorOf("bathrooms")}
              {...field}
            />
          </>
        )}
        <TextField
          label="Antigüedad (años)"
          name="age"
          inputMode="numeric"
          value={v.age}
          error={errorOf("age")}
          {...field}
        />
      </div>
      {children}
    </Section>
  );
}
