import { useState, type ChangeEvent, type FormEvent } from "react";

type Errors<T> = Partial<Record<keyof T, string>>;
type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * A controlled form: ONE state object and ONE `handleChange` for every input
 * (each input's `name` is its key). The errors are never stored: `validate`
 * runs on every render, so they can't be out of date. A message is only shown
 * once the user left the field or tried to submit, never while they type the
 * first character.
 */
export function useForm<T extends Record<string, string>>(
  initialValues: T,
  validate: (values: T) => Errors<T>
) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(values);

  function handleChange(event: ChangeEvent<Control>) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleBlur(event: ChangeEvent<Control>) {
    const { name } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
  }

  /** The message to show under a field, if any. */
  function errorOf(field: keyof T): string | undefined {
    return touched[field] || submitted ? errors[field] : undefined;
  }

  /** Wraps the real submit: blocks it (and focuses the first mistake) while invalid. */
  function handleSubmit(onValid: (values: T) => void | Promise<void>) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitted(true);

      const firstInvalid = Object.keys(errors).find((name) => errors[name]);
      if (firstInvalid) {
        const control = event.currentTarget.elements.namedItem(firstInvalid);
        // A group of radio buttons comes back as a list: focus its first one.
        const target = control instanceof RadioNodeList ? control[0] : control;
        if (target instanceof HTMLElement) target.focus();
        return;
      }
      void onValid(values);
    };
  }

  /** Back to the start, keeping `keep` (e.g. the name, when sending a second question). */
  function reset(keep: Partial<T> = {}) {
    setValues({ ...initialValues, ...keep });
    setTouched({});
    setSubmitted(false);
  }

  return { values, handleChange, handleBlur, errorOf, handleSubmit, reset };
}
