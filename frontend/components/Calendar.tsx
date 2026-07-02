"use client";

import { useState } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  DateLocalizer,
  EventPropGetter,
  View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fi } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Kaynti } from "@/lib/types";
import { Role } from "@/lib/auth";

const locales = { fi };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  resource: Kaynti;
}

function toEvent(kaynti: Kaynti, viewerRole: Role): CalendarEvent {
  const [y, m, d] = kaynti.date.split("-").map(Number);
  const [sh, sm] = kaynti.start_time.split(":").map(Number);
  const [eh, em] = kaynti.end_time.split(":").map(Number);
  const start = new Date(y, m - 1, d, sh, sm);
  const end = new Date(y, m - 1, d, eh, em);

  const who = viewerRole === "omainen" ? kaynti.tyontekija?.full_name : kaynti.asiakas.full_name;
  const title = `${kaynti.start_time.slice(0, 5)} ${who ?? "Ei vielä nimetty"}`;
  return { title, start, end, resource: kaynti };
}

const messages = {
  today: "Tänään",
  previous: "Edellinen",
  next: "Seuraava",
  month: "Kuukausi",
  week: "Viikko",
  day: "Päivä",
  agenda: "Agenda",
  date: "Päivämäärä",
  time: "Aika",
  event: "Käynti",
  noEventsInRange: "Ei käyntejä tällä aikavälillä",
  showMore: (total: number) => `+ ${total} lisää`,
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// date-fns's fi locale lowercases month names (correct Finnish grammar mid-sentence),
// but the calendar toolbar shows them standalone, where a capital letter reads better.
const formats = {
  monthHeaderFormat: (date: Date, culture?: string, localizer?: DateLocalizer) =>
    capitalize(localizer!.format(date, "MMMM yyyy", culture)),
  dayHeaderFormat: (date: Date, culture?: string, localizer?: DateLocalizer) =>
    capitalize(localizer!.format(date, "cccc MMMM dd", culture)),
  dayRangeHeaderFormat: (
    { start, end }: { start: Date; end: Date },
    culture?: string,
    localizer?: DateLocalizer
  ) => {
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    return `${capitalize(localizer!.format(start, "MMMM dd", culture))} – ${localizer!.format(
      end,
      sameMonth ? "dd" : "MMMM dd",
      culture
    )}`;
  },
};

const statusColors: Record<string, string> = {
  suunniteltu: "#6f8a58",
  peruttu: "#b5603c",
  toteutunut: "#b5a179",
};

export default function Calendar({
  kaynnit,
  viewerRole,
  onSelectKaynti,
}: {
  kaynnit: Kaynti[];
  viewerRole: Role;
  onSelectKaynti: (kaynti: Kaynti) => void;
}) {
  const events = kaynnit.map((k) => toEvent(k, viewerRole));
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  const eventPropGetter: EventPropGetter<CalendarEvent> = (event) => {
    const status = event.resource.status;
    return {
      style: {
        backgroundColor: statusColors[status] ?? "#2563eb",
        textDecoration: status === "peruttu" ? "line-through" : "none",
        opacity: status === "toteutunut" ? 0.7 : 1,
        borderRadius: 8,
        border: "none",
      },
    };
  };

  return (
    <div className="bg-cream-50 rounded-3xl border border-cream-200 shadow-soft p-5" style={{ height: 720 }}>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        culture="fi"
        messages={messages}
        formats={formats}
        eventPropGetter={eventPropGetter}
        onSelectEvent={(event) => onSelectKaynti(event.resource)}
        views={["month", "week", "day"]}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        popup
      />
    </div>
  );
}
