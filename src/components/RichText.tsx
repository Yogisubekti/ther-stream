import { Link } from "@tanstack/react-router";

const TAG = /(\$[A-Za-z][A-Za-z0-9]{1,14}\b|@[A-Za-z0-9_]{2,30})/g;

export function RichText({ text }: { text: string }) {
  const parts = text.split(TAG);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          part.startsWith("@") ? (
            <Link key={i} to="/profile" search={{ u: part.slice(1) }} className="font-semibold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
              {part}
            </Link>
          ) : (
            <Link key={i} to="/cashtag" search={{ s: part.slice(1).toUpperCase() }} className="font-semibold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
              {part}
            </Link>
          )
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
