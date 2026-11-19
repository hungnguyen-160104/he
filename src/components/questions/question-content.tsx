/* eslint-disable @next/next/no-img-element -- Cloudinary URLs are pre-sized; next/image remotePatterns allow them but plain img keeps CSP/SSR simple. */
import { RichText } from "@/components/content/rich-text";
import { cn } from "@/lib/utils";
import type { StudentQuestionView } from "@/modules/questions/dto";

export function QuestionMedia({ media }: { media: StudentQuestionView["media"] }) {
  if (!media.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {media.map((m) => (
        <figure key={m.secureUrl} className="max-w-full">
          <img
            src={m.secureUrl}
            alt={m.alt}
            width={m.width}
            height={m.height}
            loading="lazy"
            className="h-auto max-h-80 w-auto max-w-full rounded-md border bg-white object-contain"
          />
        </figure>
      ))}
    </div>
  );
}

/** Read-only rendering of a question (stem, media, options/statements). No answers. */
export function QuestionContent({ view, className, highlight }: { view: StudentQuestionView; className?: string; highlight?: { correctOptionId?: string } }) {
  return (
    <div className={cn("grid gap-3", className)}>
      <RichText text={view.stem} className="text-base leading-relaxed" />
      <QuestionMedia media={view.media} />
      {view.type === "SINGLE_CHOICE" ? (
        <ul className="grid grid-cols-1 gap-2">
          {view.options.map((o) => (
            <li
              key={o.id}
              className={cn("flex gap-2 rounded-md border px-3 py-2", highlight?.correctOptionId === o.id && "border-success bg-success/10")}
            >
              <span className="font-semibold">{o.id}.</span>
              <RichText as="span" text={o.text} />
            </li>
          ))}
        </ul>
      ) : null}
      {view.type === "TRUE_FALSE" ? (
        <ul className="grid grid-cols-1 gap-2">
          {view.statements.map((s) => (
            <li key={s.id} className="flex gap-2 rounded-md border px-3 py-2">
              <span className="font-semibold">{s.id})</span>
              <RichText as="span" text={s.text} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
