import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { TextField } from "./Fields";

/** A password input with the button that shows or hides what was typed. */
export function PasswordField(
  props: Omit<ComponentProps<typeof TextField>, "type" | "trailing" | "icon">
) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          {visible ? (
            <EyeOff aria-hidden className="size-5" />
          ) : (
            <Eye aria-hidden className="size-5" />
          )}
        </button>
      }
    />
  );
}
