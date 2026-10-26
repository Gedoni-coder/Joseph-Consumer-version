import { useState } from "react";
import { nigeriaDate } from "../../backend/src/consumer/engine";

export function CommitmentDate({
  name,
  original = "",
}: {
  name: string;
  original?: string;
}) {
  const [value, setValue] = useState(original);
  const today = nigeriaDate(new Date());
  // An existing overdue bill must remain editable without changing its due date.
  const min =
    value === original && original && original < today ? original : today;
  return (
    <input
      name={name}
      type="date"
      required
      min={min}
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

// SR
