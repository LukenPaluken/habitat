import {
  Bath,
  BedDouble,
  CalendarClock,
  DoorOpen,
  Home,
  Ruler,
  type LucideIcon,
} from "lucide-react";
import { formatArea } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PropertyCore } from "@/types/api";

interface Fact {
  key: string;
  icon: LucideIcon;
  /** Compact text for cards. */
  short: string;
  /** Spelled out, for the detail page. */
  long: string;
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

// Every attribute is optional (a Terreno has no rooms, for instance): only the
// ones the property really has become a fact.
function factsOf(p: PropertyCore): Fact[] {
  const facts: (Fact | false)[] = [
    p.totalArea != null && {
      key: "total",
      icon: Ruler,
      short: formatArea(p.totalArea),
      long: `${formatArea(p.totalArea)} totales`,
    },
    p.coveredArea != null && {
      key: "covered",
      icon: Home,
      short: formatArea(p.coveredArea),
      long: `${formatArea(p.coveredArea)} cubiertos`,
    },
    p.rooms != null && {
      key: "rooms",
      icon: DoorOpen,
      short: `${p.rooms} amb.`,
      long: plural(p.rooms, "ambiente", "ambientes"),
    },
    p.bedrooms != null && {
      key: "bedrooms",
      icon: BedDouble,
      short: `${p.bedrooms} dorm.`,
      long: plural(p.bedrooms, "dormitorio", "dormitorios"),
    },
    p.bathrooms != null && {
      key: "bathrooms",
      icon: Bath,
      short: plural(p.bathrooms, "baño", "baños"),
      long: plural(p.bathrooms, "baño", "baños"),
    },
    p.age != null && {
      key: "age",
      icon: CalendarClock,
      short: p.age === 0 ? "A estrenar" : plural(p.age, "año", "años"),
      long:
        p.age === 0
          ? "A estrenar"
          : `${plural(p.age, "año", "años")} de antigüedad`,
    },
  ];
  return facts.filter((fact): fact is Fact => fact !== false);
}

export function PropertyFacts({
  property,
  variant = "compact",
  className,
}: {
  property: PropertyCore;
  variant?: "compact" | "full";
  className?: string;
}) {
  const facts = factsOf(property);
  if (facts.length === 0) return null;

  const isFull = variant === "full";
  return (
    <ul
      className={cn(
        isFull
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
          : "flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600",
        className
      )}
    >
      {facts.map(({ key, icon: Icon, short, long }) => (
        <li
          key={key}
          className={cn(
            "flex items-center gap-1.5",
            isFull &&
              "rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
          )}
        >
          <Icon
            aria-hidden
            className={cn(
              "shrink-0 text-brand-600",
              isFull ? "size-5" : "size-4"
            )}
          />
          {isFull ? long : short}
        </li>
      ))}
    </ul>
  );
}
