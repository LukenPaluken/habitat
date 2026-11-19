import {
  CalendarCheck,
  MessageCircleQuestion,
  Repeat,
  Star,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Activity, ActivityType } from "@/types/api";

const ICONS: Record<ActivityType, LucideIcon> = {
  new_comment: MessageCircleQuestion,
  new_visit: CalendarCheck,
  property_state_change: Repeat,
  new_review: Star,
};

/**
 * Where the news came from: the question or the visit (in the panel screen
 * where the seller answers it, narrowed to its property), the property itself
 * or the review on the agency's site.
 */
export function activityHref(activity: Activity, agencyId: string): string {
  const { propertyId, referenceId } = activity;
  const onProperty = propertyId ? `?propiedad=${propertyId}` : "";
  const anchor = (prefix: string) =>
    referenceId ? `#${prefix}-${referenceId}` : "";

  switch (activity.type) {
    case "new_comment":
      return `/panel/consultas${onProperty}${anchor("consulta")}`;
    case "new_visit":
      return `/panel/visitas${onProperty}${anchor("visita")}`;
    case "property_state_change":
      return propertyId ? `/propiedades/${propertyId}` : "/panel/propiedades";
    case "new_review":
      return `/inmobiliarias/${agencyId}${anchor("resena")}`;
  }
}

interface ActivityItemProps {
  activity: Activity;
  agencyId: string;
  /** Marks it as read (the click on the link and the small button both call it). */
  onRead: (activity: Activity) => void;
}

/** One piece of news. Unread ones stand out; clicking opens where it came from. */
export function ActivityItem({
  activity,
  agencyId,
  onRead,
}: ActivityItemProps) {
  const Icon = ICONS[activity.type];

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-xl border p-3 sm:p-4",
        activity.isRead
          ? "border-slate-200 bg-white"
          : "border-brand-200 bg-brand-50"
      )}
    >
      <Link
        href={activityHref(activity, agencyId)}
        onClick={() => !activity.isRead && onRead(activity)}
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        <span
          aria-label={activity.isRead ? "Leída" : "Sin leer"}
          className={cn(
            "mt-1 size-2.5 shrink-0 rounded-full",
            activity.isRead ? "border border-slate-400" : "bg-brand-600"
          )}
        />
        <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <span className="min-w-0">
          <span
            className={cn(
              "block break-words text-slate-800",
              !activity.isRead && "font-medium"
            )}
          >
            {activity.content}
          </span>
          <time
            dateTime={activity.createdAt}
            className="text-sm text-slate-500"
          >
            {formatRelativeDate(activity.createdAt)}
          </time>
        </span>
      </Link>
      {!activity.isRead && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => onRead(activity)}
        >
          Marcar leída
        </Button>
      )}
    </li>
  );
}
