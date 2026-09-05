import type { Place } from "@/lib/types";

type Props = {
  places: Place[];
  currentPath: string | null;
  onOpen: (path: string) => void;
};

export function Places({ places, currentPath, onOpen }: Props) {
  return (
    <aside className="places" aria-label="Places">
      <h2>Places</h2>
      {places.length === 0 ? (
        <p className="places-empty">Open a folder to start.</p>
      ) : (
        <ul>
          {places.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                className={currentPath === place.path ? "active" : ""}
                onClick={() => onOpen(place.path)}
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
