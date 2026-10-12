/** A CSS Module exports its class names; a name that is not declared is undefined. */
declare module '*.module.css' {
  const classNames: Readonly<Record<string, string>>;
  export default classNames;
}

declare module '*.css';
